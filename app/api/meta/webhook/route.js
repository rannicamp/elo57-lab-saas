import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Admin (Service Role) para ler configurações de qualquer cliente
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY; 
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
    });
};

// Validação do Webhook (Setup Inicial)
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === process.env.META_VERIFY_TOKEN) {
        return new NextResponse(searchParams.get('hub.challenge'), { status: 200 });
    }
    return new NextResponse('Token Inválido', { status: 403 });
}

// Recebimento de Leads
export async function POST(request) {
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Erro Config Servidor' }, { status: 500 });

    try {
        const body = await request.json();
        const entry = body.entry?.[0];
        const change = entry?.changes?.[0];

        // Se não for Lead, ignora (ex: like, comentário)
        if (change?.field !== 'leadgen') {
            return NextResponse.json({ status: 'ignored' });
        }

        const value = change.value;
        const pageId = value.page_id;
        const leadgenId = value.leadgen_id;

        console.log(`LOG: Novo Lead recebido. Página: ${pageId}, LeadID: ${leadgenId}`);

        // 1. Busca quem é o dono desta página no nosso banco
        const { data: integracao } = await supabase
            .from('integracoes_meta')
            .select('organizacao_id, access_token') // Pega o token DO CLIENTE
            .eq('page_id', pageId)
            .single();

        if (!integracao) {
            console.error(`ERRO: Página ${pageId} não conectada ao SaaS.`);
            return NextResponse.json({ error: 'Página desconhecida' });
        }

        // 2. Baixa os dados do Lead usando o Token do Cliente
        const leadRes = await fetch(`https://graph.facebook.com/v20.0/${leadgenId}?access_token=${integracao.access_token}`);
        const leadData = await leadRes.json();

        if (leadData.error) throw new Error(leadData.error.message);

        // 3. Processa os campos (Nome, Email, Telefone)
        const formMap = {};
        leadData.field_data?.forEach(f => { formMap[f.name] = f.values[0]; });

        const nome = formMap.full_name || formMap.nome || 'Lead Facebook';
        const email = formMap.email || formMap.email_address;
        const telefone = formMap.phone_number || formMap.telefone || formMap.celular;

        // 4. Salva no Contatos (Upsert para evitar duplicidade)
        const { data: contato, error: contatoError } = await supabase
            .from('contatos')
            .upsert({
                organizacao_id: integracao.organizacao_id,
                nome: nome,
                origem: 'Meta Ads',
                meta_lead_id: leadgenId,
                meta_page_id: pageId,
                meta_form_data: formMap
            }, { onConflict: 'meta_lead_id' })
            .select()
            .single();

        if (contatoError) throw contatoError;

        // 5. Salva Email e Telefone
        if (email) {
            await supabase.from('emails').insert({ 
                contato_id: contato.id, 
                email, 
                organizacao_id: integracao.organizacao_id 
            });
        }
        if (telefone) {
            await supabase.from('telefones').insert({ 
                contato_id: contato.id, 
                telefone, 
                organizacao_id: integracao.organizacao_id 
            });
        }

        // 6. Insere no Funil (Primeira coluna)
        // (Lógica simplificada: insere no primeiro funil que achar)
        const { data: funil } = await supabase.from('funis').select('id').eq('organizacao_id', integracao.organizacao_id).limit(1).single();
        
        if (funil) {
            const { data: coluna } = await supabase.from('colunas_funil').select('id').eq('funil_id', funil.id).order('ordem').limit(1).single();
            if (coluna) {
                await supabase.from('contatos_no_funil').insert({
                    contato_id: contato.id,
                    coluna_id: coluna.id,
                    organizacao_id: integracao.organizacao_id
                });
            }
        }

        return NextResponse.json({ success: true, contatoId: contato.id });

    } catch (error) {
        console.error('Erro Webhook:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}