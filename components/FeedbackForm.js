// components/FeedbackForm.js

"use client";

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function FeedbackForm() {
    const { userData } = useAuth(); // Usando userData para ter acesso à organização
    const [pagina, setPagina] = useState('');
    const [descricao, setDescricao] = useState('');

    const { mutate: sendFeedback, isPending } = useMutation({
        mutationFn: async (feedbackData) => {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackData)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Ocorreu um erro ao enviar o feedback.');
            }
            return result;
        },
        onSuccess: () => {
            toast.success('Feedback enviado com sucesso! Obrigado por ajudar a melhorar o sistema.');
            setPagina('');
            setDescricao('');
        },
        onError: (error) => {
            toast.error(`Erro: ${error.message}`);
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userData) {
            toast.error('Você precisa estar logado para enviar feedback.');
            return;
        }

        const feedbackData = {
            usuario_id: userData.id,
            organizacao_id: userData.organizacao_id, // Adicionando o carimbo da organização
            pagina,
            descricao
        };

        sendFeedback(feedbackData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div>
                    <label htmlFor="pagina" className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Página ou Funcionalidade</label>
                    <input
                        type="text"
                        id="pagina"
                        value={pagina}
                        onChange={(e) => setPagina(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                        placeholder="Ex: Tela de Funcionários, Cadastro de Contato"
                    />
                </div>
                <div>
                    <label htmlFor="descricao" className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Descrição do Problema ou Sugestão <span className="text-red-500">*</span></label>
                    <textarea
                        id="descricao"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        required
                        rows="6"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm resize-y custom-scrollbar"
                        placeholder="Por favor, descreva detalhadamente o que aconteceu ou qual é a sua sugestão de melhoria."
                    />
                </div>
            </div>
            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={isPending || !descricao}
                    className="px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
                    {isPending ? 'Enviando Feedback...' : 'Enviar Feedback'}
                </button>
            </div>
        </form>
    );
}

// --------------------------------------------------------------------------------
// RESUMO DO ARQUIVO
// --------------------------------------------------------------------------------
// Este componente renderiza um formulário para que os usuários possam enviar
// feedbacks, sugestões ou relatar problemas. Ele captura a página, a descrição
// e, usando o hook `useAuth`, associa o feedback ao usuário e à sua organização.
// A lógica de envio foi refatorada para usar `useMutation` e `toast` para uma
// experiência de usuário mais moderna e reativa.
// --------------------------------------------------------------------------------