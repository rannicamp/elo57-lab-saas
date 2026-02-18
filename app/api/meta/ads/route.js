import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { FacebookAdsApi, AdAccount } from 'facebook-nodejs-business-sdk';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');     
    const campaignIds = searchParams.get('campaignIds'); 
    const statusList = searchParams.get('status');

    // 1. Autenticação (Padrão)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase.from('usuarios').select('organizacao_id').eq('id', user.id).single();
    const { data: integracao } = await supabase
      .from('integracoes_meta')
      .select('access_token, ad_account_id')
      .eq('organizacao_id', userData.organizacao_id)
      .single();

    if (!integracao?.access_token || !integracao?.ad_account_id) {
        return NextResponse.json({ data: [] });
    }

    // 2. Inicializa SDK
    const api = FacebookAdsApi.init(integracao.access_token);
    const adAccountId = integracao.ad_account_id.startsWith('act_') ? integracao.ad_account_id : `act_${integracao.ad_account_id}`;
    const account = new AdAccount(adAccountId);

    // 3. Lógica de Data (Simplificada)
    const hasDates = startDate && endDate;
    const timeRange = hasDates 
        ? { 'since': startDate, 'until': endDate } 
        : { 'date_preset': 'maximum' };

    // 4. Lógica de Filtros (AQUI ESTAVA O ERRO)
    let filtering = [];

    // Só adiciona filtro de campanha se tiver IDs válidos
    if (campaignIds && campaignIds.length > 0 && campaignIds !== 'undefined') {
        filtering.push({
            field: 'campaign.id',
            operator: 'IN',
            value: campaignIds.split(',')
        });
    }

    // Só adiciona filtro de status se tiver algo selecionado
    if (statusList && statusList.length > 0 && statusList !== 'undefined') {
        filtering.push({
            field: 'effective_status',
            operator: 'IN',
            value: statusList.split(',')
        });
    }

    // Monta os parâmetros
    const params = {
        limit: 200, // Traz bastante coisa
        fields: ['name', 'status', 'effective_status', 'creative{thumbnail_url,image_url,title}', 'adset_id', 'campaign_id'],
    };

    // IMPORTANTE: Só anexa 'filtering' se o array não estiver vazio.
    // Se estiver vazio, não manda nada (comportamento da página de teste)
    if (filtering.length > 0) {
        params.filtering = filtering;
    }

    // 5. Busca Anúncios
    const adsData = await account.getAds(params.fields, params);

    // 6. Busca Insights (Números)
    const adsWithInsights = await Promise.all(adsData.map(async (ad) => {
        try {
            const insights = await ad.getInsights(
                ['spend', 'impressions', 'clicks', 'cpc', 'reach', 'actions', 'cost_per_action_type'],
                { time_range: timeRange }
            );
            const stats = insights[0] || {};
            
            // Tratamento de Leads e CPL
            const leadAction = stats.actions?.find(a => a.action_type === 'lead' || a.action_type === 'on_facebook_lead');
            const cplAction = stats.cost_per_action_type?.find(a => a.action_type === 'lead' || a.action_type === 'on_facebook_lead');

            return {
                id: ad.id,
                name: ad.name,
                status: ad.effective_status, // Status real
                thumbnail: ad.creative?.thumbnail_url || ad.creative?.image_url || null,
                spend: parseFloat(stats.spend || 0),
                impressions: parseInt(stats.impressions || 0),
                clicks: parseInt(stats.clicks || 0),
                reach: parseInt(stats.reach || 0),
                cpc: parseFloat(stats.cpc || 0),
                leads: leadAction ? parseInt(leadAction.value) : 0,
                cost_per_lead: cplAction ? parseFloat(cplAction.value) : 0,
                frequencia: stats.reach > 0 ? (stats.impressions / stats.reach).toFixed(2) : 0
            };
        } catch (e) {
            return null;
        }
    }));

    return NextResponse.json({ data: adsWithInsights.filter(a => a) });

  } catch (error) {
    console.error('Erro API Ads:', error);
    // Retorna array vazio em caso de erro para não quebrar a tela inteira
    return NextResponse.json({ data: [], error: error.message }); 
  }
}