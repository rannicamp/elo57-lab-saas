'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Facebook, RefreshCw, CheckCircle, LogOut, ArrowRight } from 'lucide-react';

export default function FacebookButton({ isConnected, accountName }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Conectar: Pede a URL ao servidor e redireciona o usuário
    const handleConnect = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/meta/conectar');
            const data = await res.json();
            
            if (data.url) {
                // Redireciona o navegador para o Facebook
                window.location.href = data.url;
            } else {
                alert('Erro ao iniciar conexão.');
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão com o servidor.');
            setLoading(false);
        }
    };

    // Desconectar: Chama a API para limpar o banco
    const handleDisconnect = async () => {
        if (!confirm("Tem certeza? Os leads pararão de ser sincronizados.")) return;
        
        setLoading(true);
        try {
            const res = await fetch('/api/meta/conectar', { method: 'DELETE' });
            if (res.ok) {
                router.refresh(); // Atualiza a tela
            } else {
                throw new Error('Falha ao desconectar');
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`border rounded-xl p-6 shadow-sm transition-all ${isConnected ? 'bg-green-50 border-green-200' : 'bg-white hover:shadow-md'}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center text-white shadow-sm">
                        <Facebook size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Meta Ads</h3>
                        <p className="text-sm text-gray-500">Facebook & Instagram</p>
                    </div>
                </div>
                {isConnected && (
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle size={12} /> ATIVO
                    </div>
                )}
            </div>

            {isConnected ? (
                <div className="space-y-4">
                    <div className="bg-white/60 p-3 rounded-lg border border-green-100 text-center">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Conta Conectada</span>
                        <div className="font-semibold text-gray-800 text-lg mt-1">
                            {accountName || 'Gerenciador de Negócios'}
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleDisconnect}
                        disabled={loading}
                        className="w-full py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg text-sm font-medium flex justify-center items-center gap-2 transition-colors"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={16} /> : <><LogOut size={16} /> Desconectar Conta</>}
                    </button>
                </div>
            ) : (
                <div>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                        Conecte sua conta para importar Leads automaticamente e gerenciar suas campanhas diretamente pelo Elo 57.
                    </p>
                    <button 
                        onClick={handleConnect} 
                        disabled={loading}
                        className="w-full py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-semibold flex justify-center items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={18}/> : <>Conectar Facebook <ArrowRight size={18} /></>}
                    </button>
                </div>
            )}
        </div>
    );
}