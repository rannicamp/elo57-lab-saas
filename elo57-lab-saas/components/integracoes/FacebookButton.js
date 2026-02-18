'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Facebook, RefreshCw, CheckCircle, Bug, LogOut } from 'lucide-react'; // Adicionei LogOut

export default function FacebookButton({ isConnected, accountName }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false); // Novo estado para loading do desconectar
    const [logs, setLogs] = useState([]); 
    const [showDebug, setShowDebug] = useState(false); 

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        const entry = `[${time}] ${msg}`;
        console.log("DEBUG FB:", msg);
        setLogs(prev => [...prev, entry]);
    };

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
            runFbInit();
        } else {
            window.fbAsyncInit = function() {
                runFbInit();
            };
        }
    };

    useEffect(() => {
        if (window.FB) {
            runFbInit();
        }
    }, []);

    const handleLogin = () => {
        addLog("Botão Conectar Clicado.");
        setLoading(true);

        if (!window.FB) {
            alert('Erro: Facebook SDK não está pronto. Veja o log de debug.');
            setLoading(false);
            return;
        }

        try {
            window.FB.login((response) => {
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

    // --- NOVA FUNÇÃO: DESCONECTAR ---
    const handleDisconnect = async () => {
        if (!confirm("Tem certeza que deseja desconectar? Os leads pararão de chegar neste sistema.")) return;

        addLog("Botão Desconectar Clicado.");
        setDisconnecting(true);

        try {
            const res = await fetch('/api/meta/conectar', {
                method: 'DELETE'
            });

            addLog(`Status API Desconectar: ${res.status}`);

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erro ao desconectar");
            }

            addLog("Desconectado com sucesso!");
            alert("Desconectado com sucesso!");
            
            // Recarrega a página para atualizar o estado do servidor
            router.refresh(); 
            // Opcional: window.location.reload() se o router.refresh() não for suficiente visualmente
            
        } catch (error) {
            addLog(`ERRO ao desconectar: ${error.message}`);
            alert(`Erro ao desconectar: ${error.message}`);
        } finally {
            setDisconnecting(false);
        }
    };

    async function salvarToken(token) {
        try {
            addLog("Enviando token para API...");
            const res = await fetch('/api/meta/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shortToken: token })
            });

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

            <div className={`border rounded-xl p-6 shadow-sm transition-colors ${isConnected ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
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
                    <button onClick={() => setShowDebug(!showDebug)} className="text-gray-400 hover:text-gray-600" title="Ver logs">
                        <Bug size={16} />
                    </button>
                </div>

                {isConnected ? (
                    <div className="bg-white p-4 rounded-lg border border-green-100 text-center shadow-sm">
                        <span className="text-xs text-gray-500 block mb-1">Conectado como:</span>
                        <span className="font-bold text-gray-800 block mb-3 text-lg">{accountName || 'Conta Facebook'}</span>
                        
                        <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium mb-4">
                            <CheckCircle size={16} /> Integração Ativa
                        </div>

                        <button 
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                            className="w-full py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium flex justify-center items-center gap-2 transition-colors"
                        >
                            {disconnecting ? <RefreshCw className="animate-spin" size={16} /> : <><LogOut size={16} /> Desconectar</>}
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleLogin} 
                        disabled={loading}
                        className="w-full py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-medium flex justify-center items-center gap-2 transition-all shadow-sm"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={18}/> : 'Conectar Agora'}
                    </button>
                )}

                {showDebug && (
                    <div className="mt-4 p-2 bg-gray-900 text-green-400 text-xs font-mono rounded overflow-auto max-h-48 scrollbar-thin">
                        <p className="border-b border-gray-700 pb-1 mb-1 font-bold text-white">LOGS DE DEBUG:</p>
                        {logs.length === 0 ? <p className="text-gray-500">Aguardando ações...</p> : logs.map((log, i) => (
                            <div key={i} className="mb-0.5 border-b border-gray-800 pb-0.5">{log}</div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}