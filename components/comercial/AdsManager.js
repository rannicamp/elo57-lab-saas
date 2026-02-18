// components/comercial/AdsManager.js
"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle, Layers, Target, Megaphone } from 'lucide-react';

import KpiAnuncios from './KpiAnuncios';
import FiltroAnuncios from './FiltroAnuncios';
import TabelaAnuncios from './TabelaAnuncios';

// Função auxiliar de Fetch
const fetchData = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Falha na requisição");
    return res.json();
};

export default function AdsManager() {
    const { user } = useAuth(); // Assume que temos user.organizacao_id aqui
    const [filters, setFilters] = useState({ status: [], startDate: '', endDate: '' });

    // 1. Busca Dados da Meta (API Unificada de Performance)
    const { data: adsData, isLoading, isError, refetch } = useQuery({
        queryKey: ['meta-ads-performance', user?.organizacao_id, filters],
        queryFn: () => fetchData(`/api/meta/dados?orgId=${user?.organizacao_id}&start=${filters.startDate}&end=${filters.endDate}`),
        enabled: !!user?.organizacao_id,
        staleTime: 1000 * 60 * 5, // Cache de 5 minutos
    });

    if (isError) {
        return (
            <div className="p-8 border border-red-200 bg-red-50 rounded-2xl flex flex-col items-center justify-center text-red-600">
                <AlertTriangle size={32} className="mb-2" />
                <h3 className="font-bold">Erro ao carregar dados</h3>
                <p className="text-sm mb-4">Verifique a conexão com a Meta nas configurações.</p>
                <button onClick={() => refetch()} className="px-4 py-2 bg-white border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                    Tentar Novamente
                </button>
            </div>
        );
    }

    // Filtra os dados localmente se necessário (caso a API traga tudo)
    // Se a API já filtrar, isso é redundante, mas seguro.
    const filteredAds = adsData?.data || []; 

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header da Seção */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Megaphone className="text-blue-600" /> 
                        Gestão de Tráfego
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Acompanhe o desempenho das suas campanhas em tempo real.
                    </p>
                </div>
                
                {/* Status da Conexão (Opcional - Visual) */}
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    API Meta Conectada
                </div>
            </div>

            {/* KPIs Principais */}
            <KpiAnuncios data={filteredAds} isLoading={isLoading} />

            {/* Filtros e Controles */}
            <FiltroAnuncios filters={filters} setFilters={setFilters} refetch={refetch} />

            {/* Tabela de Dados */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
            ) : (
                <TabelaAnuncios ads={filteredAds} />
            )}
        </div>
    );
}