import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Admin (Service Role)
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY; 
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
    });
};

// --- FUNÇÕES AUXILIARES ---

function sanitizePhone(phone) {
    if (!phone) return null;
    let clean = phone.replace(/\D/g, ''); 
    if (clean.length === 10 || clean.length === 11) {
        if (clean.startsWith('1') && clean.length === 11 && clean[2] !== '9') {
             // Provavel EUA
        } else {
             clean = '55' + clean;
        }
    }
    return clean;
}

// 🔥 NOVA FUNÇÃO: Busca a coluna "ENTRADA" do SISTEMA (Org 1)
async function getSystemEntryColumn(supabase) {
    // Busca a coluna 'ENTRADA' que pertence à organização mestre (ID 1)
    // Se o ID da sua organização mestre for 2 (como no SQL enviado), mude para .eq('organizacao_id', 2)
    const { data: coluna } = await supabase
        .from('colunas_funil')
        .select('id')
        .eq('nome', 'ENTRADA') 
        .eq('organizacao_id', 1) // <--- ID DA ORGANIZAÇÃO DO SISTEMA
        .limit(1)
        .single();

    if (!coluna) {
        console.error("ERRO CRÍTICO: Coluna 'ENTRADA' do sistema não encontrada.");
        return null;
    }
    return coluna.id;
}

// --- ROTAS ---

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === process.env.META_VERIFY_TOKEN) {
        return new NextResponse(searchParams.get('hub.challenge'), { status: 200 });
    }
    return new NextResponse(null, { status: 403 });
}

export async function POST(request) {
    const supabase = getSupabaseAdmin();
    if (!supabase) return new NextResponse(JSON.stringify({ status: 'error' }), { status: 500 });
    
    let contatoIdParaLimpeza = null;

    try {
        const body = await request.json();
        const change = body.entry?.[0]?.changes?.[0];

        if (change?.field !== 'leadgen') return new NextResponse(JSON.stringify({ status: 'ignored' }), { status: 200 });
        
        const { leadgen_id: leadId, page_id: pageId } = change.value;
        
        // 🕵️‍♂️ INTELIGÊNCIA DO SISTEMA: Descobre o Dono da Página
        const { data: integracao } = await supabase
            .from('integracoes_meta')
            .select('organizacao_id, access_token')
            .eq('page_id', pageId)
            .single();

        if (!integracao) {
            console.error(`ERRO: Página ${pageId} desconhecida.`);
            return NextResponse.json({ status: 'ignored_unknown_page' });
        }

        const { organizacao_id: clienteOrgId, access_token: pageAccessToken } = integracao;

        // Verifica duplicidade
        const { data: existingLead } = await supabase.from('contatos').select('id').eq('meta_lead_id', leadId).single();
        if (existingLead) return NextResponse.json({ status: 'lead_exists' });

        // Busca dados na Meta
        const leadRes = await fetch(`https://graph.facebook.com/v20.0/${leadId}?access_token=${pageAccessToken}`);
        const leadDetails = await leadRes.json();
        
        if (leadDetails.error) throw new Error(leadDetails.error.message);

        // Mapeia campos
        const formMap = {};
        leadDetails.field_data?.forEach(f => { formMap[f.name] = f.values[0]; });
        
        const nomeLead = formMap.full_name || formMap.nome || 'Lead Meta';
        const emailLead = formMap.email || formMap.email_address;
        const phoneLead = formMap.phone_number || formMap.telefone;

        // 💾 SALVA O CONTATO (Pertence ao Cliente)
        const { data: newContact, error: contactError } = await supabase.from('contatos').insert({
            nome: nomeLead,
            origem: 'Meta Lead Ad',
            tipo_contato: 'Lead',
            personalidade_juridica: 'Pessoa Física',
            organizacao_id: clienteOrgId, // <--- ID DO CLIENTE
            meta_lead_id: leadId,
            meta_page_id: pageId,
            meta_form_data: formMap
        }).select('id').single();

        if (contactError) throw new Error(contactError.message);
        contatoIdParaLimpeza = newContact.id;

        // Salva Email/Telefone
        if (emailLead) await supabase.from('emails').insert({ contato_id: newContact.id, email: emailLead, organizacao_id: clienteOrgId });
        if (phoneLead) {
            const finalPhone = sanitizePhone(phoneLead);
            if (finalPhone) await supabase.from('telefones').insert({ contato_id: newContact.id, telefone: finalPhone, organizacao_id: clienteOrgId });
        }
        
        // 🎯 VINCULA AO FUNIL (Coluna do Sistema, Contato do Cliente)
        const systemColumnId = await getSystemEntryColumn(supabase);
        
        if (systemColumnId) {
            await supabase.from('contatos_no_funil').insert({ 
                contato_id: newContact.id, 
                coluna_id: systemColumnId, // <--- ID DA COLUNA DO SISTEMA (Org 1)
                organizacao_id: clienteOrgId // <--- ID DO CLIENTE (Para ele ver o lead)
            });
        }
        
        console.log(`SUCESSO: Lead ${newContact.id} criado para Cliente ${clienteOrgId} na Coluna Mestre.`);
        return NextResponse.json({ status: 'success' });

    } catch (e) {
        console.error('ERRO WEBHOOK:', e.message);
        if (contatoIdParaLimpeza) await supabase.from('contatos').delete().eq('id', contatoIdParaLimpeza);
        return NextResponse.json({ error: e.message }, { status: 500 }); 
    }
}