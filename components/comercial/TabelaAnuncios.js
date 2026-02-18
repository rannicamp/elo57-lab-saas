// components/comercial/TabelaAnuncios.js
"use client";

import Image from 'next/image';
import { Eye, MousePointer, Activity, AlertCircle, Image as ImageIcon } from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
const formatNumber = (val) => new Intl.NumberFormat('pt-BR').format(val || 0);

const StatusBadge = ({ status }) => {
    const config = {
        ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ativo', dot: 'bg-green-500' },
        PAUSED: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pausado', dot: 'bg-yellow-500' },
        ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Arquivado', dot: 'bg-gray-400' },
        DISAPPROVED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Reprovado', dot: 'bg-red-500' }
    };

    const style = config[status] || { bg: 'bg-gray-50', text: 'text-gray-500', label: status, dot: 'bg-gray-400' };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text} border-transparent bg-opacity-50`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {style.label}
        </span>
    );
};

export default function TabelaAnuncios({ ads }) {
    if (!ads || ads.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-300 mb-4">
                    <Activity size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Nenhum anúncio encontrado</h3>
                <p className="text-gray-500 mt-1">Tente ajustar os filtros ou selecionar outra conta.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Criativo</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome / ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Gasto</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Leads</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">CPL</th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Métricas</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {ads.map((ad) => (
                            <tr key={ad.id} className="hover:bg-blue-50/30 transition-colors group">
                                {/* Coluna Imagem */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="w-16 h-16 relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                                        {ad.image_url ? (
                                            <Image 
                                                src={ad.image_url} 
                                                alt="Ad Creative" 
                                                fill 
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <ImageIcon className="text-gray-300" size={24} />
                                        )}
                                    </div>
                                </td>

                                {/* Coluna Nome */}
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900 line-clamp-1" title={ad.name}>
                                            {ad.name}
                                        </span>
                                        <span className="text-xs text-gray-400 font-mono mt-0.5">ID: {ad.id}</span>
                                    </div>
                                </td>

                                {/* Coluna Status */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={ad.status} />
                                </td>

                                {/* Coluna Gasto */}
                                <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-700">
                                    {formatCurrency(ad.spend)}
                                </td>

                                {/* Coluna Leads */}
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-bold text-sm">
                                        {ad.leads}
                                    </span>
                                </td>

                                {/* Coluna CPL */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                                    {formatCurrency(ad.cost_per_lead)}
                                </td>

                                {/* Coluna Métricas Extras */}
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1" title="Impressões">
                                            <Eye size={14} /> {formatNumber(ad.impressions)}
                                        </div>
                                        <div className="flex items-center gap-1" title="Cliques">
                                            <MousePointer size={14} /> {formatNumber(ad.clicks)}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}