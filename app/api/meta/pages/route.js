import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { FacebookAdsApi, User } from 'facebook-nodejs-business-sdk';

// GET: Lista as páginas disponíveis (Lê do banco o token do usuário e busca no FB)
export async function GET(request) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: userData } = await supabase.from('usuarios').select('organizacao_id').eq('id', user.id).single();
    if (!userData?.organizacao_id) return NextResponse.json({ error: 'Org não encontrada' }, { status: 400 });

    // Busca o token do usuário salvo no passo anterior
    const { data: integracao } = await supabase
      .from('integracoes_meta')
      .select('access_token')
      .eq('organizacao_id', userData.organizacao_id)
      .single();

    if (!integracao?.access_token) {
      return NextResponse.json({ error: 'Token não encontrado. Faça login novamente.' }, { status: 404 });
    }

    // Inicializa SDK
    const api = FacebookAdsApi.init(integracao.access_token);
    const me = new User('me'); 
    
    // Busca contas/páginas e seus tokens específicos
    const accounts = await me.getAccounts(['name', 'access_token', 'id', 'picture', 'tasks']);
    
    const pages = accounts.map(page => ({
        id: page.id,
        name: page.name,
        picture_url: page.picture?.data?.url,
        access_token: page.access_token 
    }));

    return NextResponse.json({ pages });

  } catch (error) {
    console.error('Erro listar páginas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Salva a página escolhida (Atualiza o banco com o Token da Página)
export async function POST(request) {
    const supabase = await createClient();
    
    try {
        const { page_id, page_name, page_access_token } = await request.json();
        
        const { data: { user } } = await supabase.auth.getUser();
        const { data: userData } = await supabase.from('usuarios').select('organizacao_id').eq('id', user.id).single();

        console.log(`🔵 [Meta Pages] Salvando página ${page_name} para Org ${userData.organizacao_id}`);

        const { error } = await supabase
            .from('integracoes_meta')
            .update({
                page_id: page_id,
                nome_conta: page_name,
                page_access_token: page_access_token, // Guardamos o token VIP da página
                status: 'ativo',
                updated_at: new Date()
            })
            .eq('organizacao_id', userData.organizacao_id);

        if (error) {
            console.error('🚨 [Meta Pages] Erro ao salvar:', error);
            throw error;
        }

        console.log('✅ [Meta Pages] Página salva com sucesso!');
        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Erro ao salvar página.' }, { status: 500 });
    }
}