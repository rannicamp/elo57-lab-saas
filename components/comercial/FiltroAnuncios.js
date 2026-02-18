// components/comercial/FiltroAnuncios.js
"use client";

import { useState } from 'react';
import { Filter, X, Calendar, RefreshCw, ChevronDown } from 'lucide-react';

export default function FiltroAnuncios({ filters, setFilters, refetch }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleClear = () => {
        setFilters({ status: [], startDate: '', endDate: '' });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Lado Esquerdo: Título ou Busca Rápida */}
                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                    <Filter size={18} className="text-blue-600" />
                    <span>Filtros & Período</span>
                </div>

                {/* Lado Direito: Inputs */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    
                    {/* Seletor de Data Rápida (Exemplo Visual) */}
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        <div className="px-3 py-2 border-r border-gray-300 text-gray-500">
                            <Calendar size={16} />
                        </div>
                        <input 
                            type="date" 
                            className="bg-transparent text-sm p-2 outline-none text-gray-700"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                        <span className="text-gray-400">-</span>
                        <input 
                            type="date" 
                            className="bg-transparent text-sm p-2 outline-none text-gray-700"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>

                    {/* Botão de Limpar */}
                    {(filters.startDate || filters.endDate) && (
                        <button 
                            onClick={handleClear}
                            className="text-xs font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <X size={14} /> Limpar
                        </button>
                    )}

                    {/* Botão de Atualizar Dados */}
                    <button 
                        onClick={() => refetch()}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Atualizar Dados"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}