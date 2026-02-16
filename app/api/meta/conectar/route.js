import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request) {
    const supabase = createClient(cookies());
    
    try {
        // 1. Identificar Usuário e Organização
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { data: profile } = await supabase.from('usuarios').select('organizacao_id').eq('id', user.id).single();
        if (!profile) return NextResponse.json({ error: 'Perfil sem organização' }, { status: 400 });

        const { shortToken } = await request.json();
        
        // Credenciais do App Elo 57 (Globais)
        const APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
        const APP_SECRET = process.env.FACEBOOK_CLIENT_SECRET;

        // 2. Trocar Token Curto (1h) por Longo (60 dias)
        const exchangeUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortToken}`;
        const exchangeRes = await fetch(exchangeUrl);
        const exchangeData = await exchangeRes.json();

        if (exchangeData.error) throw new Error(`Erro Meta: ${exchangeData.error.message}`);
        const longToken = exchangeData.access_token;

        // 3. Buscar Páginas do Usuário
        const accountsUrl = `https://graph.facebook.com/v20.0/me/accounts?access_token=${longToken}`;
        const accountsRes = await fetch(accountsUrl);
        const accountsData = await accountsRes.json();
        
        let pageId = null;
        let pageName = null;
        let pageAccessToken = null;

        // LÓGICA: Pega a primeira página ativa encontrada
        if (accountsData.data && accountsData.data.length > 0) {
            const page = accountsData.data[0];
            pageId = page.id;
            pageName = page.name;
            pageAccessToken = page.access_token;

            // 🌟 O PULO DO GATO: Instalar o Webhook na Página (Subscribe) 🌟
            console.log(`🔌 Instalando App na página: ${pageName}...`);
            const subscribeUrl = `https://graph.facebook.com/v20.0/${pageId}/subscribed_apps?subscribed_fields=leadgen&access_token=${pageAccessToken}`;
            const subRes = await fetch(subscribeUrl, { method: 'POST' });
            const subData = await subRes.json();
            
            if (!subData.success) {
                console.warn('⚠️ Falha ao inscrever webhook automaticamente:', subData);
            } else {
                console.log('✅ Webhook inscrito com sucesso!');
            }
        } else {
            return NextResponse.json({ error: 'Nenhuma página do Facebook encontrada nesta conta.' }, { status: 400 });
        }

        // 4. Buscar Conta de Anúncios
        const adAccountsUrl = `https://graph.facebook.com/v20.0/me/adaccounts?access_token=${longToken}`;
        const adAccountsRes = await fetch(adAccountsUrl);
        const adAccountsData = await adAccountsRes.json();
        const adAccountId = adAccountsData.data?.[0]?.id || null;

        // 5. Salvar na Tabela do Cliente
        const { error } = await supabase.from('integracoes_meta').upsert({
            organizacao_id: profile.organizacao_id,
            access_token: longToken,
            page_id: pageId,
            nome_conta: pageName || 'Conta Conectada',
            ad_account_id: adAccountId,
            status: true,
            updated_at: new Date()
        }, { onConflict: 'organizacao_id' });

        if (error) throw error;

        return NextResponse.json({ success: true, nome_conta: pageName });

    } catch (error) {
        console.error('Erro na conexão Meta:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}