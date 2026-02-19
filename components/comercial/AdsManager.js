"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faLayerGroup, faBullhorn, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { faMeta } from '@fortawesome/free-brands-svg-icons';
import { toast } from 'sonner';

import FiltroAnuncios from './FiltroAnuncios';
import KpiAnuncios from './KpiAnuncios';
import TabelaAnuncios from './TabelaAnuncios';

const fetchAdAccounts = async () => {
    const res = await fetch('/api/meta/ad-accounts');
    if (!res.ok) throw new Error('Erro contas');
    return res.json();
};

const fetchCampaignsAndSets = async () => {
    const res = await fetch('/api/meta/campaigns');
    if (!res.ok) return { campaigns: [], adsets: [] };
    return res.json();
};

const fetchAdsData = async () => {
    const res = await fetch('/api/meta/ads');
    if (!res.ok) throw new Error('Erro anúncios');
    return res.json();
};

const saveSelectedAccount = async (adAccountId) => {
    await fetch('/api/meta/ad-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_account_id: adAccountId })
    });
};

export default function AdsManager() {
    const queryClient = useQueryClient();

    // Estado centralizado de filtros que será repassado para a Tabela e KPIs
    const [filters, setFilters] = useState({
        status: [], 
        startDate: '',
        endDate: '',
        campaignIds: [],
        adsetIds: [],
        searchTerm: '' 
    });

    const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
        queryKey: ['meta-accounts'],
        queryFn: fetchAdAccounts,
        refetchOnWindowFocus: false
    });

    const { data: filterData } = useQuery({
        queryKey: ['meta-filters', accountsData?.selected_account_id],
        queryFn: fetchCampaignsAndSets,
        enabled: !!accountsData?.selected_account_id,
    });

    const { data: adsResponse, isLoading: isLoadingAds, isError, refetch } = useQuery({
        queryKey: ['meta-ads', accountsData?.selected_account_id],
        queryFn: fetchAdsData,
        enabled: !!accountsData?.selected_account_id,
    });

    const mutationChangeAccount = useMutation({
        mutationFn: saveSelectedAccount,
        onSuccess: () => {
            toast.success('Conta alterada!');
            queryClient.invalidateQueries({ queryKey: ['meta-accounts'] });
            queryClient.invalidateQueries({ queryKey: ['meta-filters'] });
            queryClient.invalidateQueries({ queryKey: ['meta-ads'] });
            setFilters({ status: [], startDate: '', endDate: '', campaignIds: [], adsetIds: [], searchTerm: '' });
        }
    });

    if (isLoadingAccounts) return <div className="p-10 text-center"><FontAwesomeIcon icon={faSpinner} spin className="mr-2"/> Carregando contas...</div>;

    if (!accountsData?.accounts || accountsData.accounts.length === 0) {
        return (
            <div className="p-10 text-center bg-gray-50 border rounded-lg">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-3xl mb-3" />
                <h3 className="font-bold text-gray-700">Conta não conectada</h3>
            </div>
        );
    }

    // LISTA PURA DE ANÚNCIOS VINDOS DA API NOVA
    const ads = adsResponse?.data || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FontAwesomeIcon icon={faMeta} className="text-blue-600" /> Gestão de Tráfego
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">CONTA:</span>
                    <select 
                        className="bg-gray-50 border border-gray-300 text-sm rounded p-2"
                        value={accountsData.selected_account_id || ''}
                        onChange={(e) => mutationChangeAccount.mutate(e.target.value)}
                    >
                        <option value="" disabled>Selecione...</option>
                        {accountsData.accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <FiltroAnuncios 
                filters={filters} 
                setFilters={setFilters} 
                campaigns={filterData?.campaigns || []} 
                adsets={filterData?.adsets || []}
                refetch={refetch}
            />

            {!accountsData.selected_account_id ? (
                <div className="text-center p-10 bg-yellow-50">Selecione uma conta acima.</div>
            ) : (
                <>
                    {/* Passamos todos os dados, e o KPI e Tabela farão o trabalho sujo */}
                    <KpiAnuncios data={ads} isLoading={isLoadingAds} />
                    
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-700"><FontAwesomeIcon icon={faLayerGroup} className="mr-2 text-gray-400"/>Lista de Anúncios</h3>
                            <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{ads.length} criativos</span>
                        </div>

                        {isLoadingAds ? (
                            <div className="p-20 text-center"><FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-blue-500"/></div>
                        ) : isError ? (
                            <div className="p-10 text-center text-red-500">Erro ao carregar dados.</div>
                        ) : (
                            <TabelaAnuncios ads={ads} filters={filters} />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}