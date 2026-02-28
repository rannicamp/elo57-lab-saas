"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileShield, faSpinner, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown'; // Se tivermos markdown no conteudo das politicas 

export default function TermsUpdateEnforcer() {
    const supabase = createClient();
    const [isOpen, setIsOpen] = useState(false);
    const [politicaAtiva, setPoliticaAtiva] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [temSessao, setTemSessao] = useState(false);

    useEffect(() => {
        async function checkCompliance() {
            setLoading(true);
            try {
                // 1. Pegar usuário logado
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setTemSessao(false);
                    setLoading(false);
                    return; // Ignora se não tá logado, o Auth cuidará dele depois.
                }

                setTemSessao(true);

                // 2. Buscar a versão ativa dos termos de uso
                const { data: politicas, error: polErr } = await supabase
                    .from('politicas_plataforma')
                    .select('*')
                    .eq('tipo', 'termos_uso')
                    .eq('is_active', true)
                    .order('data_publicacao', { ascending: false })
                    .limit(1);

                if (polErr) throw polErr;

                const termosAtivos = politicas?.[0];

                // Se não existir política lançada no sistema ainda, deixa passar
                if (!termosAtivos) {
                    setIsOpen(false);
                    return;
                }

                setPoliticaAtiva(termosAtivos);

                // 3. Pegar no banco o status do usuário em tempo real
                const { data: usuario, error: userErr } = await supabase
                    .from('usuarios')
                    .select('id, aceitou_termos_versao')
                    .eq('id', session.user.id)
                    .single();

                if (userErr) throw userErr;

                // 4. A mágica da barreira: Comparando com a String da versão atual no banco
                if (usuario.aceitou_termos_versao !== termosAtivos.versao) {
                    setIsOpen(true); // OPA! Levanta a barreira
                } else {
                    setIsOpen(false); // Tudo em ordem
                }

            } catch (error) {
                console.error("Erro ao verificar compliance:", error);
            } finally {
                setLoading(false);
            }
        }

        checkCompliance();
    }, [supabase]);

    const handleAcceptTerms = async () => {
        if (!politicaAtiva) return;
        setProcessing(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Seta no perfil do usuário a versão exata que foi lida na tela dele e o timestamp
            const { error } = await supabase
                .from('usuarios')
                .update({
                    aceitou_termos_versao: politicaAtiva.versao,
                    data_aceite_termos: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            // Sucesso! Baixa as portas
            setIsOpen(false);

        } catch (error) {
            console.error("Erro ao assinar termos:", error);
            alert("Não foi possível salvar seu aceite. Tente novamente ou chame o suporte.");
        } finally {
            setProcessing(false);
        }
    };


    // Renderizações
    if (!temSessao || loading || !isOpen || !politicaAtiva) return null;

    // A Barreira Visual
    return (
        <div className="fixed inset-0 z-[99999] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">

                {/* Header do Documento */}
                <div className="bg-emerald-600 p-6 flex items-start gap-4 flex-shrink-0">
                    <div className="bg-white/20 p-3 rounded-xl">
                        <FontAwesomeIcon icon={faFileShield} className="text-3xl text-emerald-50" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-wide">Atualização Obrigatória</h2>
                        <p className="text-emerald-100 text-sm mt-1">
                            {politicaAtiva.titulo || 'Novos Termos de Uso'} - Nova Versão Disponível ({politicaAtiva.versao})
                        </p>
                    </div>
                </div>

                {/* Corpo (Scrollável) */}
                <div className="p-8 overflow-y-auto flex-1 bg-slate-50 text-slate-700">
                    <div className="prose prose-sm max-w-none prose-emerald">
                        <p className="font-semibold text-slate-900 mb-6">
                            Para continuar utilizando a plataforma Studio 57, precisamos que você leia e concorde com as regras atualizadas.
                        </p>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[300px] whitespace-pre-wrap">
                            {/* Renderiza o texto injetado pelo Admin */}
                            {politicaAtiva.conteudo || "Carregando o texto da política..."}
                        </div>
                    </div>
                </div>

                {/* Footer Fixado (Ação) */}
                <div className="p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
                    <p className="text-xs text-slate-500 max-w-sm">
                        Ao clicar em "Li e Aceito", um registro com o selo do seu aceite nesta versão ({politicaAtiva.versao}) será vinculado à sua conta legalmente.
                    </p>

                    <button
                        onClick={handleAcceptTerms}
                        disabled={processing}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3 px-8 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-emerald-500/20 shadow-lg"
                    >
                        {processing ? (
                            <><FontAwesomeIcon icon={faSpinner} spin /> Assinando Digitalmente...</>
                        ) : (
                            <><FontAwesomeIcon icon={faCheckCircle} /> Li e Aceito os Termos</>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
