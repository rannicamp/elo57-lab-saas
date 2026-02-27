import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import imapSimple from 'imap-simple';

const checkCondition = (message, condition) => {
    const textToCheck = message[condition.campo]?.toLowerCase() || '';
    const valueToCheck = (condition.valor || '').toLowerCase();

    if (!valueToCheck) return true;
    if (!textToCheck) return false;

    switch (condition.operador) {
        case 'contains': return textToCheck.includes(valueToCheck);
        case 'not_contains': return !textToCheck.includes(valueToCheck);
        case 'equals': return textToCheck === valueToCheck;
        case 'starts_with': return textToCheck.startsWith(valueToCheck);
        case 'ends_with': return textToCheck.endsWith(valueToCheck);
        default: return false;
    }
};

export async function POST(request) {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        // 1. Busca configs do usuário
        const { data: configs } = await supabase.from('email_configuracoes').select('*').eq('user_id', user.id);
        if (!configs || configs.length === 0) return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 404 });

        // 2. Busca regras ativas do usuário
        const { data: regras } = await supabase
            .from('email_regras')
            .select('*')
            .eq('user_id', user.id)
            .eq('ativo', true)
            .order('ordem', { ascending: true });

        if (!regras || regras.length === 0) return NextResponse.json({ message: 'Sem regras ativas', processed: 0 });

        // 🔥 MUDANÇA ARQUITETURAL: Responde IMEDIATAMENTE e solta a tela do usuário.
        // A lógica pesada vai rodar solta no Event Loop do Node.js.
        (async () => {
            try {
                let totalProcessed = 0;
                let totalMoved = 0;

                // Itera sobre as configurações (contas) para processar regras separadamente caso tenham sido atribuídas a elas
                for (const config of configs) {
                    // Separa regras desta conta específica ou regras antigas ("órfãs")
                    const accountRules = regras.filter(r => !r.account_id || r.account_id === config.id);
                    if (accountRules.length === 0) continue;

                    // 3. Busca MENSAGENS NO BANCO LOCAL (Supabase) em vez de ir ao IMAP (Muito mais rápido)
                    // Lógica: pegar apenas as msgs recentes na INBOX
                    const { data: messages } = await supabase
                        .from('email_messages_cache')
                        .select('uid, folder_path, subject, from_text, to_text, account_id')
                        .eq('account_id', config.id)
                        .ilike('folder_path', '%INBOX%') // ou eq('folder_path', 'INBOX') se for exatamente isso
                        .order('uid', { ascending: false })
                        .limit(100);

                    if (!messages || messages.length === 0) continue;

                    const actionsToPerform = []; // Acumula ações necessárias: [{ uid, action, folder, message }]

                    // 4. Analisa as mensagens LOCALMENTE contra as regras
                    for (const message of messages) {
                        // Adapta o objeto pra matchar o campo esperado
                        const messageAdapter = {
                            subject: message.subject,
                            from: message.from_text,
                            to: message.to_text
                        };

                        let ruleApplied = false;
                        for (const regra of accountRules) {
                            if (ruleApplied) break;

                            try {
                                if (regra.condicoes.length > 0 && regra.condicoes.every(cond => checkCondition(messageAdapter, cond))) {
                                    for (const acao of regra.acoes) {
                                        actionsToPerform.push({
                                            uid: message.uid,
                                            action: acao.tipo, // 'move', 'markRead', 'delete'
                                            folder: acao.pasta,
                                            messageIdBase: message.id // ID interno para atualizar nosso cache dps
                                        });
                                    }
                                    ruleApplied = true;
                                }
                            } catch (err) {
                                console.error('Erro avaliando regra no backend local:', err);
                            }
                        }
                        totalProcessed++;
                    }

                    // 5. SE houver algo a fazer, ENTÃO abre a conexão IMAP
                    if (actionsToPerform.length > 0) {
                        const imapConfig = {
                            imap: {
                                user: config.imap_user || config.email,
                                password: config.senha_app,
                                host: config.imap_host,
                                port: config.imap_port || 993,
                                tls: true,
                                authTimeout: 15000,
                                tlsOptions: { rejectUnauthorized: false }
                            },
                        };

                        let connection = null;
                        try {
                            connection = await imapSimple.connect(imapConfig);
                            await connection.openBox('INBOX', { readOnly: false });

                            for (const task of actionsToPerform) {
                                try {
                                    if (task.action === 'move' && task.folder) {
                                        await connection.moveMessage(task.uid, task.folder);
                                        totalMoved++;
                                        // Atualiza cache
                                        await supabase.from('email_messages_cache').update({ folder_path: task.folder }).eq('account_id', config.id).eq('uid', task.uid);
                                    }
                                    else if (task.action === 'markRead') {
                                        await connection.addFlags(task.uid, '\\Seen');
                                        await supabase.from('email_messages_cache').update({ is_read: true }).eq('account_id', config.id).eq('uid', task.uid);
                                    }
                                    else if (task.action === 'delete') {
                                        try {
                                            await connection.moveMessage(task.uid, 'TRASH');
                                            await supabase.from('email_messages_cache').update({ folder_path: 'TRASH' }).eq('account_id', config.id).eq('uid', task.uid);
                                        }
                                        catch {
                                            await connection.addFlags(task.uid, '\\Deleted');
                                            const flags = ['\\Deleted'];
                                            await supabase.from('email_messages_cache').update({ flags }).eq('account_id', config.id).eq('uid', task.uid);
                                        }
                                        totalMoved++;
                                    }
                                } catch (actionError) {
                                    console.error(`Falha na ação da regra para msg uid ${task.uid}:`, actionError);
                                }
                            }
                        } catch (connectionError) {
                            console.error('Motor IMAP falhou durante a aplicação de regras:', connectionError);
                        } finally {
                            if (connection) {
                                try { connection.end(); } catch (e) { }
                            }
                        }
                    }
                }
                // Fim do Loop

                console.log(`🪄 [Regras Background]: Concluído. Processados: ${totalProcessed}. Movidos: ${totalMoved}.`);

            } catch (bgError) {
                console.error('🔥 [Regras Background] Erro fatal durante execução solta:', bgError);
            }
        })(); // Fim da execução assíncrona não blocante

        // O usuário já recebe essa resposta na mesma hora!
        return NextResponse.json({
            success: true,
            message: `Processamento em background iniciado.`
        });

    } catch (error) {
        console.error('Erro de autorização na chamada das regras:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}