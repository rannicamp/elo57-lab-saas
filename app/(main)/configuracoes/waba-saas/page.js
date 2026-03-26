'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { FaWhatsapp, FaCheckCircle, FaSpinner, FaTimesCircle, FaPhone } from 'react-icons/fa';
import { toast } from 'sonner';

export default function WabaSaasConfigPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const supabase = createClient();
    const organizacaoId = user?.organizacao_id;
    const [isSdkLoaded, setIsSdkLoaded] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Busca a configuração atual de WhatsApp da organização
    const { data: config, isLoading: isConfigLoading } = useQuery({
        queryKey: ['whatsapp-config', organizacaoId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('configuracoes_whatsapp')
                .select('*')
                .eq('organizacao_id', organizacaoId)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        enabled: !!organizacaoId,
    });

    const isConnected = !!(config?.whatsapp_phone_number_id && config?.whatsapp_permanent_token);

    // Carrega o SDK do Facebook
    useEffect(() => {
        if (window.FB) { setIsSdkLoaded(true); return; }

        window.fbAsyncInit = function () {
            window.FB.init({
                appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID_WA,
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
        if (!isSdkLoaded) { toast.error("O SDK do Facebook ainda está carregando..."); return; }

        setIsConnecting(true);

        window.FB.login(
            async (response) => {
                if (response.authResponse) {
                    const accessToken = response.authResponse.accessToken;
                    console.log("🔵 Token OAUTH Temporário obtido com sucesso!");

                    try {
                        toast.loading("Negociando acesso com a Meta...");

                        const res = await fetch('/api/meta/waba-oauth', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ accessToken, organizacaoId })
                        });

                        const data = await res.json();
                        toast.dismiss();

                        if (res.ok) {
                            toast.success(`✅ WhatsApp conectado: ${data.phone_number}`);
                            queryClient.invalidateQueries({ queryKey: ['whatsapp-config', organizacaoId] });
                        } else {
                            toast.error(data.error || "Falha ao conectar WABA.");
                        }
                    } catch (error) {
                        toast.dismiss();
                        toast.error("Erro na comunicação com o servidor.");
                    } finally {
                        setIsConnecting(false);
                    }
                } else {
                    toast.error("Você cancelou a autenticação da Meta.");
                    setIsConnecting(false);
                }
            },
            {
                // business_management é obrigatório para o Embedded Signup completo
                scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management',
                extras: { feature: 'whatsapp_embedded_signup' }
            }
        );
    };

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 pb-32">

            {/* Cabeçalho */}
            <div>
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <span className="bg-green-100 text-green-600 p-2 rounded-xl">
                        <FaWhatsapp size={22} />
                    </span>
                    WhatsApp Business
                </h2>
                <p className="text-gray-500 font-medium mt-1">
                    Conecte e gerencie o número de WhatsApp da sua organização.
                </p>
            </div>

            {/* Card de Status Atual */}
            <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Status da Conexão</h4>

                {isConfigLoading ? (
                    <div className="flex items-center gap-2 text-gray-500">
                        <FaSpinner className="animate-spin" /> Verificando conexão...
                    </div>
                ) : isConnected ? (
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <FaCheckCircle className="text-green-500 text-2xl flex-shrink-0" />
                            <div>
                                <p className="font-bold text-gray-800">Número Conectado</p>
                                <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                                    <FaPhone size={10} />
                                    Phone Number ID: <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{config.whatsapp_phone_number_id}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    WABA ID: <span className="font-mono">{config.whatsapp_business_account_id}</span>
                                </p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-50 text-green-700 border border-green-200 uppercase md:ml-auto">
                            Ativo
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 text-amber-600">
                        <FaTimesCircle className="text-amber-500 text-2xl flex-shrink-0" />
                        <div>
                            <p className="font-bold text-gray-800">Nenhum número conectado</p>
                            <p className="text-sm text-gray-500 font-medium">Clique em "Conectar" abaixo para começar.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Card de Ação */}
            <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-gray-800 mb-1">
                            {isConnected ? 'Reconectar / Trocar Número' : 'Conectar sua Empresa'}
                        </h3>
                        <p className="text-gray-500 text-sm max-w-md">
                            Ao clicar em conectar, uma janela da Meta se abrirá para que você selecione a sua
                            conta do WhatsApp Business e o número de telefone desta organização.
                        </p>

                        <div className="mt-3 flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full inline-flex border border-gray-200">
                            <span className={`w-2 h-2 rounded-full ${isSdkLoaded ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                            {isSdkLoaded ? "Meta SDK Pronto (v22.0)" : "Carregando SDK da Meta..."}
                        </div>
                    </div>

                    <button
                        onClick={handleConnectWhatsApp}
                        disabled={!isSdkLoaded || isConnecting}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap"
                    >
                        {isConnecting ? (
                            <><FaSpinner className="animate-spin" size={18} /> Autenticando...</>
                        ) : (
                            <><FaWhatsapp size={20} /> {isConnected ? 'Reconectar WhatsApp' : 'Conectar WhatsApp'}</>
                        )}
                    </button>
                </div>
            </div>

        </div>
    );
}
