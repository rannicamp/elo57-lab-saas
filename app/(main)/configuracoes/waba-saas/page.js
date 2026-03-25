'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaWhatsapp, FaServer, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { toast } from 'sonner';

export default function WabaSaasConfigPage() {
    const { user } = useAuth();
    const [isSdkLoaded, setIsSdkLoaded] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Carrega o SDK do Facebook assim que a página renderizar
    useEffect(() => {
        if (window.FB) {
            setIsSdkLoaded(true);
            return;
        }

        window.fbAsyncInit = function () {
            window.FB.init({
                appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID_WA, // Usando o App Oficial
                cookie: true,
                xfbml: true,
                version: 'v22.0',
            });
            setIsSdkLoaded(true);
            console.log("✅ Facebook SDK Carregado e Pronto.");
        };

        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) { return; }
            js = d.createElement(s); js.id = id;
            js.src = "https://connect.facebook.net/pt_BR/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    }, []);

    const handleConnectWhatsApp = () => {
        if (!isSdkLoaded) {
            toast.error("O SDK do Facebook ainda está carregando...");
            return;
        }

        setIsConnecting(true);

        window.FB.login(
            async (response) => {
                if (response.authResponse) {
                    const accessToken = response.authResponse.accessToken;
                    console.log("🔵 Token OAUTH Temporário obtido com sucesso!");
                    
                    try {
                        toast.loading("Negociando acesso profundo com a Meta...");
                        
                        const res = await fetch('/api/meta/waba-oauth', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                accessToken,
                                // Envia qual organização está conectando isso
                                organizacaoId: user?.organizacao_id 
                            })
                        });

                        const data = await res.json();
                        toast.dismiss();

                        if (res.ok) {
                            toast.success("✅ WhatsApp Comercial conectado com sucesso!");
                            setIsConnecting(false);
                        } else {
                            toast.error(data.error || "Falha ao conectar WABA.");
                            setIsConnecting(false);
                        }

                    } catch (error) {
                        toast.dismiss();
                        toast.error("Erro na comunicação com o servidor.");
                        setIsConnecting(false);
                    }
                } else {
                    toast.error("Você cancelou a autenticação da Meta.");
                    setIsConnecting(false);
                }
            },
            {
                // Escopos exigidos pela Meta para o Embedded Signup funcionar 
                scope: 'whatsapp_business_management,whatsapp_business_messaging',
                extras: {
                    feature: 'whatsapp_embedded_signup'
                }
            }
        );
    };

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in pb-32">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                    <span className="bg-gradient-to-tr from-green-500 to-green-600 text-white p-2.5 rounded-xl shadow-lg shadow-green-500/20">
                        <FaWhatsapp size={22} className="drop-shadow-sm" />
                    </span>
                    Instalador WhatsApp Multi-Tenant
                </h1>
                <p className="mt-3 text-gray-500 text-lg leading-relaxed max-w-2xl">
                    Ambiente isolado para testes do <strong className="text-gray-700">Embedded Signup</strong>. 
                    Esta página conectará seu App Oficial e armazenará o Handshake definitivo de forma segmentada.
                </p>
            </div>

            {/* Painel de Status */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between relative z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Conectar Empresa</h3>
                        <p className="text-gray-500 text-sm max-w-md">
                            Ao clicar em conectar, uma janela da Meta se abrirá para que você selecione 
                            (ou crie) a WABA e o Número de Telefone desta Organização.
                        </p>
                        
                        <div className="mt-4 flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full inline-flex border border-gray-200">
                            <span className={`w-2 h-2 rounded-full ${isSdkLoaded ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            {isSdkLoaded ? "Facebook SDK Online (v22.0)" : "Carregando Meta Graph SDK..."}
                        </div>
                    </div>

                    <button
                        onClick={handleConnectWhatsApp}
                        disabled={!isSdkLoaded || isConnecting}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-green-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 whitespace-nowrap"
                    >
                        {isConnecting ? (
                            <>
                                <FaSpinner className="animate-spin" size={20} />
                                Autenticando...
                            </>
                        ) : (
                            <>
                                <FaWhatsapp size={20} className="group-hover:scale-110 transition-transform" />
                                Integrar WhatsApp Business
                            </>
                        )}
                    </button>
                </div>
            </div>

        </div>
    );
}
