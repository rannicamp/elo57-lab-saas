'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Facebook, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

// 🚨 ATENÇÃO: NÃO coloque 'async' nesta linha abaixo!
export default function MetaCard({ initialData }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(initialData?.status ? 'connected' : 'disconnected');
    const [accountName, setAccountName] = useState(initialData?.nome_conta || '');

    // Inicializa o SDK do Facebook assim que o script carregar
    const initFacebookSDK = () => {
        if (window.FB) return;
        
        window.fbAsyncInit = function() {
            window.FB.init({
                appId      : process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
                cookie     : true,
                xfbml      : true,
                version    : 'v20.0'
            });
            console.log("Facebook SDK Inicializado via Script");
        };
    };

    const handleLogin = () => {
        setLoading(true);

        // Verificação de segurança: Bloqueadores de anúncio
        if (!window.FB) {
            alert('ERRO: O Facebook SDK não carregou. Verifique se você tem bloqueadores de anúncio (AdBlock) e recarregue a página.');
            setLoading(false);
            return;
        }

        // Timer de segurança: Se o popup não abrir em 5s, libera o botão
        const safetyTimer = setTimeout(() => {
            if (loading) {
                console.warn("Timeout: O Popup demorou demais ou foi bloqueado.");
                // Opcional: setLoading(false) aqui se quiser forçar
            }
        }, 5000);

        // Chama o Login do Facebook
        window.FB.login(async (response) => {
            clearTimeout(safetyTimer); // Cancela o timer pois o usuário respondeu

            if (response.authResponse) {
                console.log('Login autorizado! Token recebido.');
                
                try {
                    // Envia o token para o backend (API Route)
                    const res = await fetch('/api/meta/conectar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ shortToken: response.authResponse.accessToken })
                    });

                    const data = await res.json();

                    if (!res.ok) throw new Error(data.error || 'Erro desconhecido na API');

                    // Sucesso: Atualiza a tela
                    setStatus('connected');
                    setAccountName(data.nome_conta);
                    alert(`Conectado com sucesso!`);
                    
                    // Atualiza os dados da página pai (Server Component)
                    router.refresh(); 

                } catch (error) {
                    console.error("Erro no Backend:", error);
                    alert('Erro ao salvar conexão: ' + error.message);
                }
            } else {
                console.log('Usuário fechou o popup ou cancelou.');
            }
            // Sempre desliga o loading no final
            setLoading(false); 
        }, {
            // Permissões necessárias para o SaaS
            scope: 'public_profile,email,ads_read,ads_management,pages_show_list,pages_read_engagement,pages_manage_metadata,leads_retrieval'
        });
    };

    return (
        <>
            {/* Carrega o Script do Facebook de forma Otimizada */}
            <Script 
                src="https://connect.facebook.net/pt_BR/sdk.js" 
                strategy="lazyOnload" 
                onLoad={initFacebookSDK}
                onError={(e) => console.error("Falha ao carregar script do Facebook", e)}
            />
            
            <div className={`border rounded-xl p-6 shadow-sm transition-all ${status === 'connected' ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center text-white">
                        <Facebook size={24} />
                    </div>
                    {status === 'connected' ? 
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded flex gap-1 items-center"><CheckCircle size={12}/> ATIVO</span> : 
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded flex gap-1 items-center"><XCircle size={12}/> OFF</span>
                    }
                </div>
                
                <h3 className="font-semibold text-lg text-gray-900">Meta Ads (Facebook)</h3>
                
                <p className="text-xs text-gray-300 mt-1">
                    App ID: {process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ? 'Carregado' : 'Não Configurado'}
                </p>

                <p className="text-sm text-gray-500 mt-2 mb-6 h-10">
                    Sincronização automática de Leads, Campanhas e Anúncios.
                </p>
                
                {status === 'connected' ? (
                    <div className="space-y-3">
                        <div className="bg-white p-2 rounded border text-sm text-center">
                            <span className="block text-gray-500 text-xs">Conectado como:</span>
                            <span className="font-medium text-blue-800 truncate block">{accountName}</span>
                        </div>
                        <button disabled className="w-full py-2 border border-blue-200 text-blue-600 rounded-lg text-sm flex justify-center items-center gap-2 cursor-not-allowed opacity-70">
                            <CheckCircle size={16} /> Configurado
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleLogin} 
                        disabled={loading}
                        className="w-full py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-medium flex justify-center items-center gap-2 transition-all shadow-sm hover:shadow"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={18}/> : 'Conectar Facebook'}
                    </button>
                )}
            </div>
        </>
    );
}