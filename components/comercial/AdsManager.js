"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faLayerGroup, faBullhorn, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { faMeta } from '@fortawesome/free-brands-svg-icons';
import { toast } from 'sonner';

// Componentes do seu Layout
import FiltroAnuncios from './FiltroAnuncios';
import KpiAnuncios from './KpiAnuncios';
import TabelaAnuncios from './TabelaAnuncios';

// --- API FETCHERS ---
const fetchAdAccounts = async () => {
    const res = await fetch('/api/meta/ad-accounts');
    if (!res.ok) throw new Error('Erro contas');
    return res.json();
};

const fetchCampaignsAndSets = async () => {
    const res = await fetch('/api/meta/campaigns');
    // Agora a API retorna array vazio em vez de erro, então podemos confiar
    if (!res.ok) return { campaigns: [], adsets: [] };
    return res.json();
};

const fetchAdsData = async (filters) => {
    const params = new URLSearchParams();
    // Filtros básicos
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.campaignIds?.length) params.append('campaignIds', filters.campaignIds.join(','));
    if (filters.status?.length) params.append('status', filters.status.join(','));
    
    const res = await fetch(`/api/meta/ads?${params.toString()}`);
    if (!res.ok) throw new Error('Erro ao buscar dados');
    return res.json();
};

const saveSelectedAccount = async (adAccountId) => {
    await fetch('/api/meta/ad-accounts', {
        method: 'POST',
        body: JSON.stringify({ ad_account_id: adAccountId })
    });
};

export default function AdsManager() {
    const queryClient = useQueryClient();

    // Filtros Iniciais
    const [filters, setFilters] = useState({
        status: [], 
        startDate: '',
        endDate: '',
        campaignIds: [],
        adsetIds: [],
        searchTerm: '' 
    });

    // 1. Busca Contas (Para o Dropdown)
    const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
        queryKey: ['meta-accounts'],
        queryFn: fetchAdAccounts,
        refetchOnWindowFocus: false
    });

    // 2. Busca Filtros (Para popular o componente FiltroAnuncios)
    const { data: filterData } = useQuery({
        queryKey: ['meta-filters', accountsData?.selected_account_id],
        queryFn: fetchCampaignsAndSets,
        enabled: !!accountsData?.selected_account_id,
    });

    // 3. Busca Anúncios (Dados da Tabela)
    const { 
        data: adsResponse, 
        isLoading: isLoadingAds, 
        isError,
        refetch 
    } = useQuery({
        queryKey: ['meta-ads', accountsData?.selected_account_id, filters],
        queryFn: () => fetchAdsData(filters),
        enabled: !!accountsData?.selected_account_id,
        keepPreviousData: true
    });

    // Mutação para trocar conta
    const mutationChangeAccount = useMutation({
        mutationFn: saveSelectedAccount,
        onSuccess: () => {
            toast.success('Conta alterada!');
            queryClient.invalidateQueries(['meta-accounts']);
            queryClient.invalidateQueries(['meta-filters']);
            queryClient.invalidateQueries(['meta-ads']);
            setFilters(prev => ({ ...prev, campaignIds: [], adsetIds: [] }));
        }
    });

    // Loading Inicial
    if (isLoadingAccounts) return (
        <div className="flex justify-center items-center h-64 text-gray-500">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mr-3"/> Carregando conexões...
        </div>
    );

    // Sem contas conectadas
    if (!accountsData?.accounts || accountsData.accounts.length === 0) {
        return (
            <div className="p-8 border border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-3xl mb-3" />
                <h3 className="font-bold text-gray-700">Nenhuma conta encontrada.</h3>
                <a href="/configuracoes/integracoes" className="text-blue-600 hover:underline">Ir para Configurações</a>
            </div>
        );
    }

    const ads = adsResponse?.data || [];

    return (
        <div className="space-y-6">
            {/* --- CABEÇALHO E SELEÇÃO DE CONTA --- */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FontAwesomeIcon icon={faMeta} className="text-blue-600" /> 
                        Gestão de Tráfego
                    </h2>
                </div>
                
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Conta:</label>
                    <select 
                        className="bg-gray-50 border border-gray-300 text-sm rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={accountsData.selected_account_id || ''}
                        onChange={(e) => mutationChangeAccount.mutate(e.target.value)}
                        disabled={mutationChangeAccount.isLoading}
                    >
                        <option value="" disabled>Selecione...</option>
                        {accountsData.accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* --- ÁREA DE FILTROS --- */}
            {/* Mantivemos seu componente original, só passando os dados novos */}
            <FiltroAnuncios 
                filters={filters} 
                setFilters={setFilters} 
                campaigns={filterData?.campaigns || []} 
                adsets={filterData?.adsets || []}
                refetch={refetch} 
            />

            {/* --- CONTEÚDO (KPIS E TABELA) --- */}
            {!accountsData.selected_account_id ? (
                <div className="text-center py-10 bg-yellow-50 text-yellow-800 rounded">
                    Selecione uma conta de anúncios acima para visualizar os dados.
                </div>
            ) : (
                <>
                    {/* Componente KPI Original */}
                    <KpiAnuncios data={ads} isLoading={isLoadingAds} />

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {/* Header da Tabela */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <FontAwesomeIcon icon={faLayerGroup} className="text-gray-400" />
                                Lista de Anúncios
                            </h3>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {ads.length} criativos
                            </span>
                        </div>
                        
                        {/* Estados de Loading/Erro/Vazio */}
                        {isLoadingAds ? (
                            <div className="p-20 text-center text-gray-400">
                                <FontAwesomeIcon icon={faSpinner} spin className="text-3xl mb-2" />
                                <p>Carregando dados do Facebook...</p>
                            </div>
                        ) : isError ? (
                            <div className="p-10 text-center text-red-500">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="mb-2" />
                                <p>Erro ao carregar anúncios. Verifique sua conexão.</p>
                                <button onClick={() => refetch()} className="text-sm underline mt-2">Tentar novamente</button>
                            </div>
                        ) : ads.length === 0 ? (
                            <div className="p-10 text-center text-gray-500">
                                <FontAwesomeIcon icon={faBullhorn} className="text-3xl mb-2 text-gray-300" />
                                <p>Nenhum anúncio encontrado com os filtros atuais.</p>
                            </div>
                        ) : (
                            /* Tabela Original - Passamos 'initialAds' ou 'data' conforme seu componente espera */
                            <TabelaAnuncios initialAds={ads} /> 
                        )}
                    </div>
                </>
            )}
        </div>
    );
}