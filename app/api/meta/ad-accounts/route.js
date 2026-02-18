import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { FacebookAdsApi, User, AdAccount } from 'facebook-nodejs-business-sdk';

export async function GET(request) {
  try {
    const supabase = await createClient();
    
    // 1. Autenticação Básica
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Login necessário' }, { status: 401 });

    const { data: userData } = await supabase
      .from('usuarios')
      .select('organizacao_id')
      .eq('id', user.id)
      .single();

    // 2. Pegar o Token Salvo
    const { data: integracao } = await supabase
      .from('integracoes_meta')
      .select('access_token, ad_account_id')
      .eq('organizacao_id', userData.organizacao_id)
      .single();

    if (!integracao?.access_token) {
      return NextResponse.json({ error: 'Token não encontrado.' }, { status: 404 });
    }

    // 3. Inicializar SDK
    const api = FacebookAdsApi.init(integracao.access_token);
    const me = new User('me');
    
    // 4. Buscar Contas de Anúncios
    const accounts = await me.getAdAccounts(['name', 'account_id', 'currency', 'account_status', 'amount_spent']);

    // Se já tiver uma conta salva, vamos tentar buscar as campanhas dela como teste
    let campanhas = [];
    if (integracao.ad_account_id) {
        try {
            // O SDK exige que o ID comece com "act_"
            const adAccountId = integracao.ad_account_id.startsWith('act_') 
                ? integracao.ad_account_id 
                : `act_${integracao.ad_account_id}`;
            
            const account = new AdAccount(adAccountId);
            const campaignsData = await account.getCampaigns(['name', 'status', 'objective', 'daily_budget'], { limit: 5 });
            campanhas = campaignsData.map(c => ({ name: c.name, status: c.status, objective: c.objective }));
        } catch (e) {
            console.error("Erro ao buscar campanhas:", e);
        }
    }

    return NextResponse.json({ 
        ad_accounts: accounts.map(a => ({
            name: a.name,
            id: a.account_id,
            id_formatado: `act_${a.account_id}`,
            currency: a.currency,
            status: a.account_status === 1 ? 'Ativa' : 'Inativa/Outro'
        })),
        conta_atual: integracao.ad_account_id,
        campanhas_teste: campanhas
    });

  } catch (error) {
    console.error('Erro AdAccounts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Salvar a Conta de Anúncios Escolhida
export async function POST(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    try {
        const body = await request.json();
        const { ad_account_id } = body; // Deve vir como "act_123456"

        const { data: userData } = await supabase.from('usuarios').select('organizacao_id').eq('id', user.id).single();

        // MODO DEUS para garantir a gravação
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { persistSession: false } }
        );

        const { error } = await supabaseAdmin
            .from('integracoes_meta')
            .update({ 
                ad_account_id: ad_account_id,
                updated_at: new Date()
            })
            .eq('organizacao_id', userData.organizacao_id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}