import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Admin para operações de banco (pode ler tudo)
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY; // Use a SERVICE_ROLE_KEY aqui, não a Anon
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
             // Provavel EUA, mantém
        } else {
             clean = '55' + clean;
        }
    }
    return clean;
}

// Busca nomes de objetos usando o token DO CLIENTE
async function getMetaObjectName(objectId, accessToken) {
    if (!objectId || !accessToken) return null;
    try {
        const url = `https://graph.facebook.com/v20.0/${objectId}?fields=name&access_token=${accessToken}`;
        const response = await fetch(url);
        const data = await response.json();
        return response.ok ? data.name : null;
    } catch (error) {
        return null;
    }
}

async function ensureFunilAndFirstColumn(supabase, organizacaoId) {
    let { data: funil } = await supabase.from('funis').select('id').eq('nome', 'Funil de Vendas').eq('organizacao_id', organizacaoId).single();
    if (!funil) {
        const { data: newFunil } = await supabase.from('funis').insert({ nome: 'Funil de Vendas', organizacao_id: organizacaoId }).select('id').single();
        funil = newFunil;
    }
    let { data: primeiraColuna } = await supabase.from('colunas_funil').select('id').eq('funil_id', funil.id).order('ordem', { ascending: true }).limit(1).single();
    if (!primeiraColuna) {
        const { data: newColuna } = await supabase.from('colunas_funil').insert({ funil_id: funil.id, nome: 'Novos Leads', ordem: 0, organizacao_id: organizacaoId }).select('id').single();
        primeiraColuna = newColuna;
    }
    return primeiraColuna.id;
}

// --- ROTAS ---

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    // META_VERIFY_TOKEN continua fixo no .env (é a senha do app, não do cliente)
    if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === process.env.META_VERIFY_TOKEN) {
        return new NextResponse(searchParams.get('hub.challenge'), { status: 200 });
    }
    return new NextResponse(null, { status: 403 });
}

export async function POST(request) {
    const supabase = getSupabaseAdmin();
    if (!supabase) return new NextResponse(JSON.stringify({ status: 'error', message: 'Configuração incompleta.' }), { status: 500 });
    
    let contatoIdParaLimpeza = null;

    try {
        const body = await request.json();
        const change = body.entry?.[0]?.changes?.[0];

        if (change?.field !== 'leadgen') return new NextResponse(JSON.stringify({ status: 'ignored' }), { status: 200 });
        
        // Extração dos dados básicos
        const { leadgen_id: leadId, page_id: pageId, campaign_id: campaignId, ad_id: adId, adgroup_id: adsetId, form_id: formId } = change.value;
        
        // --- MUDANÇA CRUCIAL PARA SAAS ---
        // 1. Descobrir de qual cliente é essa página e pegar o token DELE
        const { data: integracao } = await supabase
            .from('integracoes_meta')
            .select('organizacao_id, access_token')
            .eq('page_id', pageId) // Procura pela página que gerou o lead
            .single();

        if (!integracao) {
            console.error(`ERRO: Página ${pageId} não encontrada em nenhuma integração.`);
            return new NextResponse(JSON.stringify({ status: 'ignored_unknown_page' }), { status: 200 });
        }

        const { organizacao_id: organizacaoId, access_token: pageAccessToken } = integracao;
        // ---------------------------------

        // Verifica duplicidade
        const { data: existingLead } = await supabase.from('contatos').select('id').eq('meta_lead_id', leadId).single();
        if (existingLead) return new NextResponse(JSON.stringify({ status: 'lead_exists' }), { status: 200 });
        
        // 2. Sincroniza metadados e busca nomes (Usando o token dinâmico)
        let campaignName = null, adsetName = null, adName = null, formName = null;
        
        if (campaignId) {
            campaignName = await getMetaObjectName(campaignId, pageAccessToken);
            await supabase.from('meta_campaigns').upsert({ id: campaignId, name: campaignName, organizacao_id: organizacaoId });
        }
        if (adsetId) {
            adsetName = await getMetaObjectName(adsetId, pageAccessToken);
            await supabase.from('meta_adsets').upsert({ id: adsetId, name: adsetName, campaign_id: campaignId, organizacao_id: organizacaoId });
        }
        if (adId) {
            adName = await getMetaObjectName(adId, pageAccessToken);
            await supabase.from('meta_ads').upsert({ id: adId, name: adName, campaign_id: campaignId, adset_id: adsetId, organizacao_id: organizacaoId });
        }
        
        // 2.1 AUTO-SYNC DO CATÁLOGO DE FORMULÁRIOS
        if (formId) {
            formName = await getMetaObjectName(formId, pageAccessToken);
            if (formName) {
                await supabase.from('meta_forms_catalog').upsert({
                    organizacao_id: organizacaoId,
                    form_id: formId,
                    name: formName,
                    status: 'ACTIVE',
                    last_synced: new Date().toISOString()
                }, { onConflict: 'organizacao_id,form_id' });
            }
        }

        // 3. Busca dados do Lead (Usando o Token do Cliente)
        const leadRes = await fetch(`https://graph.facebook.com/v20.0/${leadId}?access_token=${pageAccessToken}`);
        const leadDetails = await leadRes.json();
        
        if (!leadRes.ok) throw new Error(leadDetails.error?.message || "Erro ao buscar lead na Meta");

        // Monta mapa de respostas
        const formMap = {};
        leadDetails.field_data?.forEach(f => { formMap[f.name] = f.values[0]; });
        
        if (formName) formMap['form_name'] = formName;
        
        const nomeLead = formMap.full_name || formMap.nome || formMap.name || `Lead Meta (${new Date().toLocaleDateString()})`;

        // 4. APLICAÇÃO DO MAPEAMENTO "DE-PARA"
        const extraFields = {};
        if (formId) {
            const { data: mappings } = await supabase
                .from('meta_form_config')
                .select('meta_field_name, campo_destino')
                .eq('organizacao_id', organizacaoId)
                .eq('meta_form_id', formId);

            if (mappings && mappings.length > 0) {
                mappings.forEach(map => {
                    const metaValue = formMap[map.meta_field_name];
                    const destinationColumn = map.campo_destino;

                    if (metaValue !== undefined && destinationColumn) {
                        let finalValue = metaValue;
                        
                        // Limpeza básica
                        if (['renda', 'valor', 'preco', 'salario', 'custo'].some(k => destinationColumn.includes(k))) {
                            finalValue = parseFloat(String(metaValue).replace(/[^0-9.,]/g, '').replace(',', '.'));
                        }
                        
                        if (['true', 'verdadeiro', 'sim', 'yes'].includes(String(metaValue).toLowerCase())) finalValue = true;
                        if (['false', 'falso', 'nao', 'não', 'no'].includes(String(metaValue).toLowerCase())) finalValue = false;

                        extraFields[destinationColumn] = finalValue;
                    }
                });
            }
        }

        // 5. Insert Final
        const { data: newContact, error: contactError } = await supabase.from('contatos').insert({
            nome: nomeLead,
            origem: 'Meta Lead Ad',
            tipo_contato: 'Lead',
            personalidade_juridica: 'Pessoa Física',
            organizacao_id: organizacaoId,
            meta_lead_id: leadId,
            meta_ad_id: adId,
            meta_campaign_id: campaignId,
            meta_adgroup_id: adsetId,
            meta_page_id: pageId,
            meta_form_id: formId, 
            meta_created_time: new Date(change.value.created_time * 1000).toISOString(),
            meta_form_data: formMap, 
            meta_ad_name: adName,
            meta_campaign_name: campaignName,
            meta_adset_name: adsetName,
            ...extraFields
        }).select('id').single();

        if (contactError) throw new Error(contactError.message);
        contatoIdParaLimpeza = newContact.id;

        // Salvar Email
        const emailLead = formMap.email || formMap.email_address;
        if (emailLead) await supabase.from('emails').insert({ contato_id: newContact.id, email: emailLead, tipo: 'Principal', organizacao_id: organizacaoId });
        
        // Salvar Telefone
        const phoneLead = formMap.phone_number || formMap.telefone || formMap.celular;
        if (phoneLead) {
            const finalPhone = sanitizePhone(phoneLead);
            if (finalPhone) {
                await supabase.from('telefones').insert({ contato_id: newContact.id, telefone: finalPhone, tipo: 'Celular', organizacao_id: organizacaoId });
            }
        }
        
        // Colocar no Funil
        const colunaId = await ensureFunilAndFirstColumn(supabase, organizacaoId);
        await supabase.from('contatos_no_funil').insert({ contato_id: newContact.id, coluna_id: colunaId, organizacao_id: organizacaoId });
        
        console.log(`LOG: Novo Lead processado via Webhook. ID: ${newContact.id}. Cliente: ${organizacaoId}`);

        return new NextResponse(JSON.stringify({ status: 'success' }), { status: 200 });

    } catch (e) {
        console.error('LOG: [ERRO WEBHOOK]', e.message);
        // Se criou o contato mas falhou no resto, tenta limpar pra não ficar lead fantasma
        if (contatoIdParaLimpeza) await supabase.from('contatos').delete().eq('id', contatoIdParaLimpeza);
        return new NextResponse(JSON.stringify({ status: 'error', message: e.message }), { status: 500 }); 
    }
}