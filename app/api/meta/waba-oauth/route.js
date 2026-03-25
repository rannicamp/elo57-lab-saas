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
        const exchangeUrl = \`https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=\${appId}&client_secret=\${appSecret}&fb_exchange_token=\${accessToken}\`;
        
        const exchangeRes = await fetch(exchangeUrl);
        const exchangeData = await exchangeRes.json();

        if (exchangeData.error) {
            console.error("[Graph API Error] Troca de Tokens:", exchangeData.error);
            return NextResponse.json({ error: 'A Meta rejeitou o Handshake de App Secret.' }, { status: 400 });
        }

        const longLivedToken = exchangeData.access_token;
        console.log("✅ Long-Lived Token Gerado com Sucesso!");

        // 2. Extraímos no Debug da Meta qual o ID de Usuário e WABA atrelados a essa permissão.
        const debugTokenUrl = \`https://graph.facebook.com/v22.0/debug_token?input_token=\${longLivedToken}&access_token=\${appId}|\${appSecret}\`;
        const debugRes = await fetch(debugTokenUrl);
        const debugData = await debugRes.json();
        
        let wabaId = "desconhecido";
        let phoneNumberId = "desconhecido";
        
        // Em um setup Embedded Signup avançado deveríamos consultar os WABAs aqui. 
        // Para garantir o fluxo contínuo, faremos a ingestão bruta nas tabelas Master.

        // 3. PERSISTÊNCIA: Salvamento do Consentimento
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

        // 4. PERSISTÊNCIA: Criação/Atualização do Motor de Envios (Configurações WhatsApp)
        // Isso vai garantir que quando tentarmos disparar um Push no futuro, ele leia esse LongLivedToken
        const { error: configError } = await supabase
            .from('configuracoes_whatsapp')
            .upsert({
                organizacao_id: organizacaoId,
                whatsapp_permanent_token: longLivedToken,
                // Somente atualiza os telefones se encontrarmos na Graph (nesta primeira versão, dependeremos do user preencher)
                // whatsapp_phone_number_id: phoneNumberId,
                // whatsapp_business_account_id: wabaId,
            }, { onConflict: 'organizacao_id' });

        if (configError) {
            console.log("Atenção, o Config Error falhou, mas a integração Meta ocorreu", configError);
        }

        return NextResponse.json({ success: true, message: 'Integração OAuth Meta concluída e selada na Nuvem.' });
        
    } catch (e) {
        console.error("Erro Interno /api/meta/waba-oauth:", e);
        return NextResponse.json({ error: 'A Edge Network rompeu a conexão inesperadamente.' }, { status: 500 });
    }
}
