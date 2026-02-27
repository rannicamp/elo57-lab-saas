// components/FeedbackList.js

"use client";

import { createClient } from '../utils/supabase/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function FeedbackList() {
    const supabase = createClient();
    const queryClient = useQueryClient();
    const { userData } = useAuth();

    const statusOptions = ['Aberto', 'Em Análise', 'Resolvido', 'Ignorado'];
    const statusColors = {
        'Aberto': 'bg-blue-100 text-blue-800',
        'Em Análise': 'bg-yellow-100 text-yellow-800',
        'Resolvido': 'bg-green-100 text-green-800',
        'Ignorado': 'bg-gray-100 text-gray-800'
    };

    const { data: feedbacks = [], isLoading, isError } = useQuery({
        queryKey: ['feedbacks', userData?.organizacao_id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('feedback')
                .select('*, usuario:usuarios(nome)')
                .eq('organizacao_id', userData.organizacao_id)
                .order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!userData?.organizacao_id,
    });

    const { mutate: updateStatus, isPending: isUpdating, variables: updateVariables } = useMutation({
        mutationFn: async ({ id, newStatus }) => {
            const { error } = await supabase
                .from('feedback')
                .update({ status: newStatus })
                .eq('id', id);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            toast.success('Status atualizado!');
            queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
        },
        onError: (error) => {
            toast.error(`Erro: ${error.message}`);
        }
    });

    const handleStatusChange = (id, newStatus) => {
        updateStatus({ id, newStatus });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center p-16 min-h-[40vh] animate-in fade-in duration-300">
                <FontAwesomeIcon icon={faSpinner} spin size="4x" className="text-blue-500 mb-4" />
                <span className="text-lg font-medium text-gray-600">Buscando feedbacks...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[40vh] bg-red-50/50 border border-red-100 rounded-2xl">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500 shadow-sm">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl opacity-80" />
                </div>
                <h3 className="text-lg font-bold text-red-800 mb-1">Erro de Conexão</h3>
                <span className="text-sm text-red-600">Não foi possível carregar a lista de feedbacks no momento.</span>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm bg-white animate-in fade-in zoom-in-95 duration-300">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/80">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Página</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">Descrição</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {feedbacks.map(item => (
                        <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">{formatDate(item.created_at)}</td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-gray-800">{item.usuario?.nome || 'N/A'}</td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                                <span className="bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 text-xs font-medium">{item.pagina || 'Sem definição'}</span>
                            </td>
                            <td className="px-6 py-5 text-sm text-gray-700 leading-relaxed" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.descricao}</td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm">
                                {isUpdating && updateVariables?.id === item.id ? (
                                    <div className="flex items-center gap-2 text-blue-500">
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        <span className="text-xs font-medium">Salvando...</span>
                                    </div>
                                ) : (
                                    <select
                                        value={item.status}
                                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                        className={`px-3 py-1.5 border-0 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer outline-none transition-colors ${statusColors[item.status] || ''}`}
                                    >
                                        {statusOptions.map(opt => (
                                            <option key={opt} value={opt} className="bg-white text-gray-800">{opt}</option>
                                        ))}
                                    </select>
                                )}
                            </td>
                        </tr>
                    ))}
                    {feedbacks.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-16 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 max-w-sm w-full mx-auto shadow-sm flex flex-col items-center">
                                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl opacity-80" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-1">Nenhum Feedback</h3>
                                        <p className="text-sm text-gray-500 px-4">Esta organização ainda não recebeu nenhum feedback ou sugestão.</p>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// --------------------------------------------------------------------------------
// RESUMO DO ARQUIVO
// --------------------------------------------------------------------------------
// Este componente exibe uma lista de feedbacks enviados pelos usuários da
// organização. Ele foi refatorado para buscar os dados dinamicamente com `useQuery`,
// garantindo que a lista esteja sempre atualizada. A funcionalidade de alterar
// o status de um feedback agora utiliza `useMutation`, o que simplifica o código,
// melhora a experiência do usuário com feedback visual e atualiza a UI
// automaticamente após a alteração ser concluída no banco de dados.
// --------------------------------------------------------------------------------