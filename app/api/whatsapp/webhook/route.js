// app/api/whatsapp/webhook/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// IMPORTANTE: Importando os serviços novos
import { logWebhook } from './services/helpers';
import { findOrCreateContactAndConversation } from './services/crm';
import { handleMessageInsert, handleReaction } from './services/message';

// Configuração do Supabase Admin
const getSupabaseAdmin = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

// --- ROTA GET (Verificação do Token no cadastro da Meta) ---
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const supabaseAdmin = getSupabaseAdmin();

    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // DICA: No cenário Multi-tenant, todos os seus clientes usarão o mesmo Verify Token 
    // que você definir no App Principal da Meta (META_VERIFY_TOKEN).
    if (mode === 'subscribe') {
        if (token === process.env.META_VERIFY_TOKEN || token === process.env.WHATSAPP_VERIFY_TOKEN) {
            try { await logWebhook(supabaseAdmin, 'INFO', 'Webhook Verificado com Sucesso pelo Painel Meta!', { token_usado: token }); } catch (e) { }
            return new NextResponse(challenge, { status: 200 });
        } else {
            try { await logWebhook(supabaseAdmin, 'ERROR', 'Falha de Verificação de Webhook (Token Incorreto)', { token_enviado: token, token_esperado: process.env.META_VERIFY_TOKEN }); } catch (e) { }
            return new NextResponse('Token Incorreto', { status: 403 });
        }
    }

    // Alguém bateu no GET mas não enviou hub.mode 
    try { await logWebhook(supabaseAdmin, 'WARNING', 'Batida GET no Webhook sem hub.mode', { url: request.url }); } catch (e) { }
    return new NextResponse('Bad Request', { status: 400 });
}

// --- ROTA POST (O Coração do Webhook) ---
export async function POST(request) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const body = await request.json();

        // Log bruto para pegar provas de que a Meta está pingando o servidor
        try { await logWebhook(supabaseAdmin, 'INFO', 'Webhook Bateu na Porta', { body }); } catch (e) { }

        const change = body.entry?.[0]?.changes?.[0]?.value;
        if (!change) return NextResponse.json({ status: 'ignored_empty' });

        // 🔥 A MÁGICA MULTI-TENANT ACONTECE AQUI!
        // A Meta nos informa qual é o ID do número que está RECENBENDO a mensagem
        const phoneNumberId = change.metadata?.phone_number_id;

        if (!phoneNumberId) {
            console.warn('[Webhook] Recebeu payload sem phone_number_id');
            return NextResponse.json({ status: 'ignored_no_phone_id' });
        }

        // 1. Validar Configuração (AGORA BLINDADA POR NÚMERO)
        const { data: config } = await supabaseAdmin
            .from('configuracoes_whatsapp')
            .select('*')
            .eq('whatsapp_phone_number_id', phoneNumberId) // <--- O CADEADO ESTÁ AQUI!
            .single();

        if (!config) {
            console.error(`[Webhook] ERRO: Configuração não encontrada para o número receptor: ${phoneNumberId}`);
            return NextResponse.json({ error: 'Configuração não encontrada para este número' }, { status: 404 });
        }

        // 2. Rota de Status (Enviado, Entregue, Lido...)
        if (change.statuses) {
            const statusUpdate = change.statuses[0];
            await supabaseAdmin.from('whatsapp_messages')
                .update({ status: statusUpdate.status })
                .eq('message_id', statusUpdate.id);
            // Nota: Atualizar por message_id é seguro pois a Meta garante que ele é único globalmente.
            return NextResponse.json({ status: 'status_updated' });
        }

        // 3. Rota de Mensagens e Reações
        const message = change.messages?.[0];
        if (message) {
            console.log(`[Webhook] Recebido tipo: ${message.type} para Org ${config.organizacao_id}`);

            // >>> AQUI ESTÁ A MÁGICA: SE FOR REAÇÃO, PARA TUDO E ATUALIZA <<<
            if (message.type === 'reaction') {
                // Passamos o config para garantir que ele salve atrelado à organização correta
                await handleReaction(supabaseAdmin, message.reaction, message.from, config);
                return NextResponse.json({ status: 'reaction_processed' });
            }

            // Se chegou aqui, é mensagem normal (texto, imagem, audio)

            // A. Garante que contato e conversa existem (passando a config blindada)
            const { contatoId, conversationRecordId } = await findOrCreateContactAndConversation(supabaseAdmin, message, config);

            // B. Verifica duplicidade
            const { data: existing } = await supabaseAdmin.from('whatsapp_messages').select('id').eq('message_id', message.id).maybeSingle();
            if (existing) return NextResponse.json({ status: 'ignored_duplicate' });

            // C. Insere a mensagem (já amarrada à config da organização)
            await handleMessageInsert(supabaseAdmin, message, config, contatoId, conversationRecordId);

            await logWebhook(supabaseAdmin, 'INFO', `Msg recebida: ${message.type}`, { from: message.from, org_id: config.organizacao_id });
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('[Webhook] Erro Fatal:', error);
        // Tenta logar o erro, se possível
        try { await logWebhook(supabaseAdmin, 'FATAL', 'Crash no Webhook', { error: error.message }); } catch (e) { }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}