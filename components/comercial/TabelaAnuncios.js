"use client";

import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faEye, faMousePointer } from '@fortawesome/free-solid-svg-icons';

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
const formatNumber = (val) => new Intl.NumberFormat('pt-BR').format(val || 0);

const StatusBadge = ({ status }) => {
    const config = {
        ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ativo', dot: 'bg-green-500' },
        PAUSED: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pausado', dot: 'bg-yellow-500' },
        ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Arquivado', dot: 'bg-gray-400' },
    };
    const style = config[status] || { bg: 'bg-gray-50', text: 'text-gray-500', label: status || 'Desconhecido', dot: 'bg-gray-400' };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
            {style.label}
        </span>
    );
};

export default function TabelaAnuncios({ ads, filters }) {
    
    // AQUI ESTÁ A MÁGICA QUE VAI REVIVER PARTE DOS SEUS FILTROS
    const filteredAds = useMemo(() => {
        if (!ads) return [];
        return ads.filter(ad => {
            // Filtro de Busca (Search Term)
            if (filters?.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                const matchName = ad.name?.toLowerCase().includes(term);
                const matchCampaign = ad.campaign_name?.toLowerCase().includes(term);
                if (!matchName && !matchCampaign) return false;
            }
            // Filtro de Status
            if (filters?.status && filters.status.length > 0) {
                if (!filters.status.includes(ad.status)) return false;
            }
            // Filtro de Campanhas
            if (filters?.campaignIds && filters.campaignIds.length > 0) {
                if (!filters.campaignIds.includes(ad.campaign_id)) return false;
            }
            // Filtro de Conjuntos
            if (filters?.adsetIds && filters.adsetIds.length > 0) {
                if (!filters.adsetIds.includes(ad.adset_id)) return false;
            }
            return true;
        });
    }, [ads, filters]);

    if (!filteredAds || filteredAds.length === 0) {
        return <div className="p-10 text-center text-gray-500">Nenhum anúncio encontrado com os filtros atuais.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Criativo / Anúncio</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Gasto</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Métricas</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Leads</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">CPL</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAds.map((ad) => (
                        <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gray-100 border overflow-hidden flex items-center justify-center">
                                        {ad.thumbnail_url ? (
                                            <img src={ad.thumbnail_url} alt="Thumbnail" className="h-full w-full object-cover" />
                                        ) : (
                                            <FontAwesomeIcon icon={faImage} className="text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-800 line-clamp-1" title={ad.name}>{ad.name}</span>
                                        <span className="text-xs text-gray-500 line-clamp-1" title={ad.campaign_name}>{ad.campaign_name}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={ad.status} /></td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-700">{formatCurrency(ad.spend)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-1" title="Impressões"><FontAwesomeIcon icon={faEye} /> {formatNumber(ad.impressions)}</div>
                                    <div className="flex items-center gap-1" title="Cliques"><FontAwesomeIcon icon={faMousePointer} /> {formatNumber(ad.clicks)}</div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm border border-blue-100">
                                    {ad.leads}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-700">
                                {formatCurrency(ad.cost_per_lead)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}