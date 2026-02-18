import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // Cliente normal (para ler o cookie)
import { createClient as createAdminClient } from '@supabase/supabase-js'; // Cliente Admin (para gravar a força)
import { FacebookAdsApi, User } from 'facebook-nodejs-business-sdk';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  // 1. Logs de Início
  console.log('🔵 [CALLBACK FB] Iniciando...');

  if (error || !code) {
    console.error('🔴 [CALLBACK FB] Erro ou Cancelamento:', error);
    return NextResponse.redirect(`${baseUrl}/configuracoes/integracoes?error=access_denied`);
  }

  try {
    // 2. Cliente Supabase Normal (Para saber quem está logado no navegador)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('🔴 [CALLBACK FB] Usuário não identificado (Cookie perdido?).');
      return NextResponse.redirect(`${baseUrl}/login?error=unauthorized`);
    }

    // 3. Busca a Organização do Usuário
    const { data: userData } = await supabase
      .from('usuarios')
      .select('organizacao_id')
      .eq('id', user.id)
      .single();

    if (!userData?.organizacao_id) {
        console.error('🔴 [CALLBACK FB] Usuário sem organização.');
        return NextResponse.redirect(`${baseUrl}/configuracoes/integracoes?error=no_org`);
    }

    console.log(`🟢 [CALLBACK FB] Org Identificada: ${userData.organizacao_id}`);

    // 4. Troca o "CODE" pelo "TOKEN" no Facebook
    const tokenUrl = `https://graph.facebook.com/${process.env.FACEBOOK_API_VERSION}/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&redirect_uri=${process.env.FACEBOOK_CALLBACK_URL}&code=${code}`;
    
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) throw new Error(tokenData.error.message);

    let accessToken = tokenData.access_token;

    // 5. Upgrade para Token de Longa Duração (60 dias)
    const longLivedUrl = `https://graph.facebook.com/${process.env.FACEBOOK_API_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${accessToken}`;
    
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();

    if (longLivedData.access_token) accessToken = longLivedData.access_token;

    // 6. COLETAR DADOS DO CLIENTE (O que você pediu!) 🕵️‍♂️
    // Vamos usar o SDK para pegar o nome e id do usuário do Facebook
    const api = FacebookAdsApi.init(accessToken);
    const me = new User('me');
    const userProfile = await me.get(['name', 'email', 'id']); // Pega Nome e ID do Facebook

    console.log(`🟢 [CALLBACK FB] Dados do Facebook coletados: ${userProfile.name}`);

    // 7. MODO DEUS: Gravar no Banco usando Service Role Key 🛡️
    // Isso garante que o banco aceite os dados mesmo se o RLS estiver reclamando.
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY, // <--- A Chave Mestra do .env.local
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    const { error: dbError } = await supabaseAdmin
      .from('integracoes_meta')
      .upsert({
        organizacao_id: userData.organizacao_id,
        access_token: accessToken,
        nome_conta: userProfile.name, // <--- Salvando o nome do cliente!
        ad_account_id: userProfile.id, // Salvamos o ID do usuário como referência provisória
        status: 'pendente_pagina',
        updated_at: new Date()
      }, { onConflict: 'organizacao_id' });

    if (dbError) {
        console.error('🚨 [CALLBACK FB] ERRO CRÍTICO NO BANCO:', dbError);
        throw new Error(dbError.message);
    }

    console.log('✅ [CALLBACK FB] Sucesso Absoluto! Dados salvos.');

    return NextResponse.redirect(`${baseUrl}/configuracoes/integracoes?step=select_page&success=true`);

  } catch (err) {
    console.error('💥 [CALLBACK FB] Exceção:', err);
    return NextResponse.redirect(`${baseUrl}/configuracoes/integracoes?error=server_error`);
  }
}