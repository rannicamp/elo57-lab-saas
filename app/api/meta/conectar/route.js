import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET: Gera a URL de Login para o Botão (O Porteiro)
export async function GET(request) {
  try {
    const permissions = [
      // 'email', <--- Mantido desligado para evitar erro de "Invalid Scope" no seu painel atual
      'public_profile',
      'ads_management',        // Criar/Editar Anúncios
      'ads_read',             // Ler relatórios de performance
      'business_management',   // Gerenciar Business Manager
      'pages_manage_ads',     // Postar anúncios na página
      'pages_read_engagement', // Ler comentários/posts
      'pages_show_list',      // Listar as páginas para selecionar
      'leads_retrieval',      // Baixar os leads (Vital!)
      'whatsapp_business_management', // [NOVO] Essencial pro Auto-Discover do Whats!
      'whatsapp_business_messaging'   // [NOVO] Essencial pra mandar mensagens depois
    ];
    // O App ID no .env.local foi definido como NEXT_PUBLIC_FACEBOOK_APP_ID ou FACEBOOK_APP_ID
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID;

    // Fallback dinâmico: Se não houver FACEBOOK_CALLBACK_URL no .env, montamos através da base
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const redirectUri = process.env.FACEBOOK_CALLBACK_URL || `${baseUrl}/api/meta/callback`;

    const state = 'elo57_auth_flow'; // Segurança contra CSRF

    // Garante que a versão da API está correta no .env ou usa v19.0 como fallback seguro
    const apiVersion = process.env.FACEBOOK_API_VERSION || 'v19.0';

    console.log('🔵 [Meta Connect] Iniciando geração de URL de login...');
    console.log('🔹 App ID:', appId ? 'OK (Carregado)' : 'ERRO (Faltando)');
    console.log('🔹 Callback URL:', redirectUri);

    if (!appId || !redirectUri) {
      throw new Error('Configurações de ambiente (App ID ou Callback) ausentes.');
    }

    // Monta a URL oficial do Facebook
    const loginUrl = `https://www.facebook.com/${apiVersion}/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${permissions.join(',')}`;

    return NextResponse.json({ url: loginUrl });

  } catch (error) {
    console.error('🔴 [Meta Connect] Erro ao gerar URL:', error);
    return NextResponse.json({ error: 'Erro interno ao iniciar conexão.' }, { status: 500 });
  }
}

// DELETE: Desconecta a conta (Remove do Banco de Dados)
export async function DELETE(request) {
  console.log('🔵 [Meta Connect] Solicitação de desconexão recebida.');

  try {
    const supabase = await createClient();

    // 1. Segurança: Quem é o usuário?
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('🟠 [Meta Connect] Tentativa de desconexão sem usuário logado.');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Busca a Organização do usuário
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('organizacao_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.organizacao_id) {
      console.error('🔴 [Meta Connect] Organização não encontrada para o usuário:', user.id);
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 400 });
    }

    console.log(`🟢 [Meta Connect] Removendo integração da Org ID: ${userData.organizacao_id}`);

    // 3. Remove a integração desta organização (Meta)
    const { error: deleteError } = await supabase
      .from('integracoes_meta')
      .delete()
      .eq('organizacao_id', userData.organizacao_id);

    if (deleteError) {
      console.error('🔴 [Meta Connect] Erro ao deletar do banco:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 4. Remove também a integração do WhatsApp Atrelada
    const { error: errorWs } = await supabase
      .from('configuracoes_whatsapp')
      .delete()
      .eq('organizacao_id', userData.organizacao_id);

    if (errorWs) {
      console.error('🔴 [Meta Connect] Erro ao deletar do banco (WS):', errorWs);
      // Não bloqueamos o fluxo principal se o WS falhar, mas logamos
    }

    console.log(`✅ [Meta Connect] Integração removida com sucesso!`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('💥 [Meta Connect] Erro fatal no DELETE:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}