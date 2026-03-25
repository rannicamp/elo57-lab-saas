import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Usamos o Service Role para driblar o RLS já que esta rota roda na segurança do Servidor Node.js
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(req) {
    try {
        const { accessToken, organizacaoId } = await req.json();

        if (!accessToken || !organizacaoId) {
            return NextResponse.json({ error: 'Chaves ou Identificador da Org faltantes. Payload corrompido.' }, { status: 400 });
        }

        const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID_WA;
        const appSecret = process.env.FACEBOOK_APP_SECRET_WA;

        // 1. O Token que o SDK do Frontend pega morre rápido (1-2h). 
        // Aqui usamos nosso App Secret para pedir à Meta um Long-Lived Token (60 dias ou Infinito).
        const exchangeUrl = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${accessToken}`;
        
        const exchangeRes = await fetch(exchangeUrl);
        const exchangeData = await exchangeRes.json();

        if (exchangeData.error) {
            console.error("[Graph API Error] Troca de Tokens:", exchangeData.error);
            return NextResponse.json({ error: 'A Meta rejeitou o Handshake de App Secret.' }, { status: 400 });
        }

        const longLivedToken = exchangeData.access_token;
        console.log("✅ Long-Lived Token Gerado com Sucesso!");

        // 2. Extraímos no Debug da Meta o ID do WABA atrelado a essa permissão (no array de granular_scopes).
        const debugTokenUrl = `https://graph.facebook.com/v22.0/debug_token?input_token=${longLivedToken}&access_token=${appId}|${appSecret}`;
        const debugRes = await fetch(debugTokenUrl);
        const debugData = await debugRes.json();
        
        // Procura os IDs dos WABAs que o usuário acabou de nos dar permissão
        const granularScopes = debugData?.data?.granular_scopes || [];
        const wabaScope = granularScopes.find(s => s.scope === 'whatsapp_business_management');
        const wabaIds = wabaScope?.target_ids || [];
        
        if (wabaIds.length === 0) {
            console.error("DEBUG Data:", JSON.stringify(debugData.data));
            return NextResponse.json({ error: 'Nenhum WhatsApp Business Account vinculado. Você selecionou um número na tela da Meta?' }, { status: 400 });
        }

        // Pega o primeiro WABA que o cliente autorizou
        const wabaId = wabaIds[0];
        console.log(`✅ WABA Capturado: ${wabaId}`);

        // 3. Pegar os Phone Numbers dentro dessa WABA usando o Token Long-Lived
        const phonesUrl = `https://graph.facebook.com/v22.0/${wabaId}/phone_numbers?access_token=${longLivedToken}`;
        const phonesRes = await fetch(phonesUrl);
        const phonesData = await phonesRes.json();

        const phoneRecord = phonesData?.data?.[0]; // Pega o primeiro número disponível
        const phoneNumberId = phoneRecord?.id;

        if (!phoneNumberId) {
            console.error("Phones Data:", JSON.stringify(phonesData));
            return NextResponse.json({ error: 'Não foi possível encontrar um Número de Telefone válido nesta WABA.' }, { status: 400 });
        }

        console.log(`✅ Phone Number ID Capturado: ${phoneNumberId} (${phoneRecord?.display_phone_number})`);

        // 4. PERSISTÊNCIA: Salvamento do Consentimento
        const { error: metaError } = await supabase
            .from('integracoes_meta')
            .upsert({
                organizacao_id: organizacaoId,
                access_token: longLivedToken,
                whatsapp_business_account_id: wabaId,
                status: 'ativo'
            }, { onConflict: 'organizacao_id' });

        if (metaError) {
            console.error("Erro no Banco (Integracoes Meta):", metaError);
            throw new Error("Falha ao injetar Token na Tabela de Integrações.");
        }

        // 5. PERSISTÊNCIA: Motor de Envios e Webhook
        const { error: configError } = await supabase
            .from('configuracoes_whatsapp')
            .upsert({
                organizacao_id: organizacaoId,
                whatsapp_permanent_token: longLivedToken,
                whatsapp_phone_number_id: phoneNumberId, // AGORA SIM! Webhook vai encontrar!
                whatsapp_business_account_id: wabaId,
            }, { onConflict: 'organizacao_id' });

        if (configError) {
            console.log("Atenção, o Config Error falhou, mas a integração Meta ocorreu", configError);
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Integração OAuth Meta concluída e selada na Nuvem.',
            phone_number: phoneRecord?.display_phone_number
        });
        
    } catch (e) {
        console.error("Erro Interno /api/meta/waba-oauth:", e);
        return NextResponse.json({ error: 'A Edge Network rompeu a conexão inesperadamente.' }, { status: 500 });
    }
}
