'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Facebook, RefreshCw, CheckCircle, Bug } from 'lucide-react';

export default function FacebookButton({ isConnected, accountName }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]); // Estado para guardar os logs visuais
    const [showDebug, setShowDebug] = useState(false); // Toggle do painel de debug

    // Função auxiliar para logar na tela e no console
    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        const entry = `[${time}] ${msg}`;
        console.log("DEBUG FB:", msg);
        setLogs(prev => [...prev, entry]);
    };

    // Função que realmente inicializa
    const runFbInit = () => {
        try {
            if (!window.FB) {
                addLog("ERRO: window.FB ainda não existe.");
                return;
            }
            
            addLog(`Iniciando FB.init... AppID: ${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}`);
            
            window.FB.init({
                appId      : process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
                cookie     : true,
                xfbml      : true,
                version    : 'v20.0'
            });
            
            addLog("FB.init executado com sucesso.");
        } catch (e) {
            addLog(`ERRO no FB.init: ${e.message}`);
        }
    };

    const handleScriptLoad = () => {
        addLog("Script do Facebook carregou (onLoad).");
        
        if (window.FB) {
            addLog("window.FB detectado. Rodando init direto.");
            runFbInit();
        } else {
            addLog("window.FB não detectado. Definindo fbAsyncInit.");
            window.fbAsyncInit = function() {
                addLog("fbAsyncInit disparado pelo SDK.");
                runFbInit();
            };
        }
    };

    // Efeito para garantir inicialização se o script já estiver em cache
    useEffect(() => {
        if (window.FB) {
            addLog("useEffect: FB já existe na janela. Tentando init...");
            runFbInit();
        }
    }, []);

    const handleLogin = () => {
        addLog("Botão Clicado.");
        setLoading(true);

        if (!window.FB) {
            addLog("CRÍTICO: window.FB não existe na hora do clique.");
            alert('Erro: Facebook SDK não está pronto. Veja o log de debug.');
            setLoading(false);
            return;
        }

        addLog("Chamando FB.login...");

        try {
            window.FB.login((response) => {
                addLog(`Callback do Login recebido. Status: ${response.status}`);
                
                if (response.authResponse) {
                    addLog("Login Autorizado! Token recebido.");
                    salvarToken(response.authResponse.accessToken);
                } else {
                    addLog("Login cancelado ou falhou.");
                    setLoading(false);
                }
            }, {
                scope: 'public_profile,email,ads_read,ads_management,pages_show_list,pages_read_engagement,pages_manage_metadata,leads_retrieval'
            });
        } catch (e) {
            addLog(`EXCEÇÃO ao chamar FB.login: ${e.message}`);
            setLoading(false);
        }
    };

    async function salvarToken(token) {
        try {
            addLog("Enviando token para API /api/meta/conectar...");
            
            const res = await fetch('/api/meta/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shortToken: token })
            });

            addLog(`Resposta API Status: ${res.status}`);
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Erro na API');

            addLog(`Sucesso API! Conta: ${data.nome_conta}`);
            alert('Conectado com sucesso!');
            router.refresh();
            
        } catch (error) {
            addLog(`ERRO API: ${error.message}`);
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Script 
                src="https://connect.facebook.net/pt_BR/sdk.js" 
                strategy="lazyOnload" 
                onLoad={handleScriptLoad}
            />

            <div className={`border rounded-xl p-6 shadow-sm ${isConnected ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center text-white">
                            <Facebook size={24} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Meta Ads</h3>
                            <p className="text-xs text-gray-500">Facebook & Instagram</p>
                        </div>
                    </div>
                    {/* Botãozinho para mostrar/esconder o debug */}
                    <button onClick={() => setShowDebug(!showDebug)} className="text-gray-400 hover:text-gray-600">
                        <Bug size={16} />
                    </button>
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

                {/* PAINEL DE DEBUG VISUAL */}
                {showDebug && (
                    <div className="mt-4 p-2 bg-black text-green-400 text-xs font-mono rounded overflow-auto max-h-48">
                        <p className="border-b border-gray-700 pb-1 mb-1 font-bold text-white">LOGS DE DEBUG:</p>
                        {logs.length === 0 ? <p>Aguardando ações...</p> : logs.map((log, i) => (
                            <div key={i} className="mb-0.5 border-b border-gray-800 pb-0.5">{log}</div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}