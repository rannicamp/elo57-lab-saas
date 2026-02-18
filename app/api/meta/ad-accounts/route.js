import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js'; // Para salvar
import { FacebookAdsApi, User, AdAccount } from 'facebook-nodejs-business-sdk';

export async function GET(request) {
  try {
    const supabase = await createClient();
    
    // 1. Autenticação e Busca da Org
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Login necessário' }, { status: 401 });

    const { data: userData } = await supabase
      .from('usuarios')
      .select('organizacao_id')
      .eq('id', user.id)
      .single();

    if (!userData?.organizacao_id) return NextResponse.json({ error: 'Org não encontrada' }, { status: 400 });

    // 2. Pegar Token
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
    
    // Lista as contas de anúncio disponíveis (para o dropdown)
    const accounts = await me.getAdAccounts(['name', 'account_id', 'currency', 'account_status']);

    // 4. SE JÁ TIVER CONTA SELECIONADA, BUSCA TUDO! 📦
    let structure = {
        campaigns: [],
        adsets: [],
        ads: []
    };

    if (integracao.ad_account_id) {
        try {
            const adAccountId = integracao.ad_account_id.startsWith('act_') 
                ? integracao.ad_account_id 
                : `act_${integracao.ad_account_id}`;
            
            const account = new AdAccount(adAccountId);

            // A. Busca Campanhas (Top 5)
            const campaignsData = await account.getCampaigns(
                ['name', 'status', 'objective', 'buying_type'], 
                { limit: 5 }
            );

            // B. Busca Conjuntos de Anúncios (Top 5)
            const adSetsData = await account.getAdSets(
                ['name', 'status', 'daily_budget', 'billing_event', 'campaign_id'], 
                { limit: 5 }
            );

            // C. Busca Anúncios e Criativos (Top 5) - Onde fica a imagem
            const adsData = await account.getAds(
                ['name', 'status', 'creative{thumbnail_url,title,body}', 'adset_id'], 
                { limit: 5 }
            );

            // Formata os dados para o Front
            structure.campaigns = campaignsData.map(c => ({
                id: c.id,
                name: c.name,
                status: c.status,
                objective: c.objective
            }));

            structure.adsets = adSetsData.map(a => ({
                id: a.id,
                name: a.name,
                status: a.status,
                budget: a.daily_budget ? `R$ ${(a.daily_budget / 100).toFixed(2)}` : 'N/A'
            }));

            structure.ads = adsData.map(ad => ({
                id: ad.id,
                name: ad.name,
                status: ad.status,
                title: ad.creative?.title || 'Sem título',
                thumbnail: ad.creative?.thumbnail_url || null
            }));

        } catch (e) {
            console.error("Erro ao buscar estrutura:", e);
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
        data: structure // Aqui vão os dados detalhados
    });

  } catch (error) {
    console.error('Erro Geral:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Salvar Conta (Mantido igual, mas adicionei aqui para garantir o arquivo completo)
export async function POST(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    try {
        const body = await request.json();
        const { ad_account_id } = body; 

        const { data: userData } = await supabase.from('usuarios').select('organizacao_id').eq('id', user.id).single();

        // MODO DEUS (Admin)
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