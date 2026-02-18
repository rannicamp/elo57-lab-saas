// components/comercial/KpiAnuncios.js
"use client";

import { useMemo } from 'react';
import { TrendingUp, Users, DollarSign, Activity, HelpCircle } from 'lucide-react';
import { Tooltip } from '@/components/shared/Tooltip'; // Supondo que você tenha ou use um title nativo simples por enquanto

export default function KpiAnuncios({ data, isLoading }) {
    
    const kpis = useMemo(() => {
        if (!data || data.length === 0) return { totalGasto: 0, totalLeads: 0, cpl: 0, anunciosAtivos: 0 };

        const totalGasto = data.reduce((sum, ad) => sum + parseFloat(ad.insights?.spend || 0), 0);
        const totalLeads = data.reduce((sum, ad) => sum + parseInt(ad.leads || 0), 0);
        const ativos = data.filter(ad => ad.status === 'ACTIVE').length;

        return {
            totalGasto,
            totalLeads,
            cpl: totalLeads > 0 ? totalGasto / totalLeads : 0,
            anunciosAtivos: ativos
        };
    }, [data]);

    const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    const cards = [
        { 
            title: "Investimento Total", 
            value: formatBRL(kpis.totalGasto), 
            icon: DollarSign, 
            color: "text-blue-600", 
            bg: "bg-blue-50",
            desc: "Valor total investido no período" 
        },
        { 
            title: "Total de Leads", 
            value: kpis.totalLeads, 
            icon: Users, 
            color: "text-purple-600", 
            bg: "bg-purple-50",
            desc: "Conversões contabilizadas" 
        },
        { 
            title: "Custo por Lead", 
            value: formatBRL(kpis.cpl), 
            icon: TrendingUp, 
            color: "text-green-600", 
            bg: "bg-green-50",
            desc: "Custo médio de aquisição" 
        },
        { 
            title: "Anúncios Ativos", 
            value: kpis.anunciosAtivos, 
            icon: Activity, 
            color: "text-orange-600", 
            bg: "bg-orange-50",
            desc: "Criativos rodando agora" 
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card, idx) => (
                <div key={idx} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                            <card.icon size={20} />
                        </div>
                        {/* Se tiver tooltip componente use aqui, senão title nativo */}
                        <div className="text-gray-300 hover:text-gray-500 cursor-help" title={card.desc}>
                            <HelpCircle size={16} />
                        </div>
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-500">{card.title}</span>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{card.value}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
}