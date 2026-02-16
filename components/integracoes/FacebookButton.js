'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Facebook, RefreshCw, CheckCircle } from 'lucide-react';

// NOTA: Esta função NÃO é async. Isso é crucial.
export default function FacebookButton({ isConnected, accountName }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // 1. Inicializa o SDK assim que o script carregar
    const initSDK = () => {
        if (window.FB) return;
        window.fbAsyncInit = function() {
            window.FB.init({
                appId      : process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
                cookie     : true,
                xfbml      : true,
                version    : 'v20.0'
            });
            console.log("SDK Facebook Pronto");
        };
    };

    // 2. Ação do Botão
    const handleLogin = () => {
        setLoading(true);

        if (!window.FB) {
            alert('Facebook SDK não carregou. Desative o AdBlock e recarregue a página.');
            setLoading(false);
            return;
        }

        // 3. Abre o Popup
        window.FB.login((response) => {
            if (response.authResponse) {
                console.log('Login feito. Salvando token...');
                salvarToken(response.authResponse.accessToken);
            } else {
                console.log('Cancelado pelo usuário');
                setLoading(false);
            }
        }, {
            scope: 'public_profile,email,ads_read,ads_management,pages_show_list,pages_read_engagement,pages_manage_metadata,leads_retrieval'
        });
    };

    // 4. Envia para o Backend (Separado para ficar limpo)
    async function salvarToken(token) {
        try {
            const res = await fetch('/api/meta/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shortToken: token })
            });

            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Erro ao salvar');

            alert('Conectado com sucesso!');
            router.refresh(); // Recarrega os dados da página
            
        } catch (error) {
            console.error(error);
            alert('Erro: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    // 5. Renderização (Visual Limpo)
    return (
        <>
            <Script 
                src="https://connect.facebook.net/pt_BR/sdk.js" 
                strategy="lazyOnload" 
                onLoad={initSDK}
            />

            <div className={`border rounded-xl p-6 shadow-sm ${isConnected ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center text-white">
                        <Facebook size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Meta Ads</h3>
                        <p className="text-xs text-gray-500">Facebook & Instagram</p>
                    </div>
                </div>

                {isConnected ? (
                    <div className="bg-white p-3 rounded border text-center">
                        <span className="text-xs text-gray-500 block">Conectado como:</span>
                        <span className="font-medium text-blue-800 block mb-2">{accountName}</span>
                        <button disabled className="w-full py-2 bg-green-100 text-green-700 rounded text-sm flex justify-center items-center gap-2">
                            <CheckCircle size={16} /> Ativo
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleLogin} 
                        disabled={loading}
                        className="w-full py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-medium flex justify-center items-center gap-2 transition-all"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={18}/> : 'Conectar Agora'}
                    </button>
                )}
            </div>
        </>
    );
}