//components/financeiro/AntecipacaoModal.js
"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faMoneyBillTransfer, faBuildingColumns, faTimes } from '@fortawesome/free-solid-svg-icons';
import { IMaskInput } from 'react-imask';

export default function AntecipacaoModal({ isOpen, onClose, onSave, lancamentoOrigem, contas }) {
    const [formData, setFormData] = useState({
        conta_passivo_id: '',
        conta_destino_id: '',
        data_transacao: new Date().toISOString().split('T')[0],
        valor_bruto: '',
        valor_taxas: '0',
    });

    const [loading, setLoading] = useState(false);

    // MÁGICA DE AUDITOR (Sua ideia aplicada!):
    // Se o lançamento estiver sem empresa preenchida, o sistema olha para a conta do lançamento e pega a empresa de lá.
    const empresaAlvoId = lancamentoOrigem?.empresa_id || lancamentoOrigem?.conta?.empresa_id;

    // Filtra as contas disponíveis de forma mais inteligente
    const contasPassivo = contas?.filter(c =>
        c.tipo === 'Passivos' &&
        (!c.empresa_id || !empresaAlvoId || c.empresa_id === empresaAlvoId)
    ) || [];

    const contasDestino = contas?.filter(c =>
        c.tipo !== 'Passivos' && c.tipo !== 'Ativos' &&
        (!c.empresa_id || !empresaAlvoId || c.empresa_id === empresaAlvoId)
    ) || [];

    useEffect(() => {
        if (isOpen && lancamentoOrigem) {
            const valorFormatado = Number(lancamentoOrigem.valor || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            setFormData(prev => ({
                ...prev,
                valor_bruto: valorFormatado,
                conta_passivo_id: contasPassivo[0]?.id || '',
                conta_destino_id: contasDestino[0]?.id || ''
            }));
        }
    }, [isOpen, lancamentoOrigem]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMaskedChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const parseCurrency = (val) => {
        if (!val) return 0;
        const strVal = String(val);
        if (strVal.includes(',')) {
            return Number(strVal.replace(/\./g, '').replace(',', '.')) || 0;
        }
        return Number(strVal) || 0;
    };

    const valorBrutoNum = parseCurrency(formData.valor_bruto);
    const valorTaxasNum = parseCurrency(formData.valor_taxas);
    const valorLiquido = Number((valorBrutoNum - valorTaxasNum).toFixed(2));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const antecipacaoGrupoId = crypto.randomUUID();

        const payload = {
            lancamentoOrigemId: lancamentoOrigem.id,
            descricaoOrigem: lancamentoOrigem.descricao,
            contaPassivoId: formData.conta_passivo_id,
            contaDestinoId: formData.conta_destino_id,
            dataTransacao: formData.data_transacao,
            valorBruto: valorBrutoNum,
            valorTaxas: valorTaxasNum,
            antecipacaoGrupoId: antecipacaoGrupoId,
            // Usa a empresa corrigida para salvar os novos lançamentos sem falhas!
            empresaId: empresaAlvoId,
            organizacaoId: lancamentoOrigem.organizacao_id
        };

        const success = await onSave(payload);
        setLoading(false);

        if (success) {
            onClose();
        }
    };

    if (!isOpen || !lancamentoOrigem) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-0 rounded-lg shadow-2xl w-full max-w-xl max-h-[95vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white rounded-t-lg z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                            <FontAwesomeIcon icon={faMoneyBillTransfer} className="text-xl" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">Antecipar Recebível</h3>
                            <p className="text-sm text-gray-500">Transforme este boleto em saldo imediato</p>
                        </div>
                    </div>
                    <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors"><FontAwesomeIcon icon={faTimes} size="lg" /></button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    <FontAwesomeIcon icon={faBuildingColumns} className="mr-2 text-red-500" />
                                    Conta de Passivo (Dívida) *
                                </label>
                                <select
                                    name="conta_passivo_id"
                                    value={formData.conta_passivo_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecione a conta de Passivo...</option>
                                    {contasPassivo.map(conta => (
                                        <option key={conta.id} value={conta.id}>{conta.nome}</option>
                                    ))}
                                </select>
                                {contasPassivo.length === 0 && (
                                    <p className="text-xs text-red-500 mt-1">Nenhuma conta do tipo "Passivos" encontrada. Certifique-se de cadastrar uma no painel de Contas.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    <FontAwesomeIcon icon={faBuildingColumns} className="mr-2 text-green-500" />
                                    Conta Destino (Onde o dinheiro vai entrar) *
                                </label>
                                <select
                                    name="conta_destino_id"
                                    value={formData.conta_destino_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecione a conta de destino...</option>
                                    {contasDestino.map(conta => (
                                        <option key={conta.id} value={conta.id}>{conta.nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data da Antecipação *</label>
                                <input
                                    type="date"
                                    name="data_transacao"
                                    value={formData.data_transacao}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Original do Boleto</label>
                                <input
                                    type="text"
                                    value={`R$ ${formData.valor_bruto}`}
                                    readOnly
                                    className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed font-semibold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Taxas e Juros do Banco *</label>
                                <IMaskInput
                                    mask="num"
                                    blocks={{ num: { mask: Number, thousandsSeparator: '.', scale: 2, padFractionalZeros: true, radix: ',' } }}
                                    name="valor_taxas"
                                    value={String(formData.valor_taxas)}
                                    onAccept={(value) => handleMaskedChange('valor_taxas', value)}
                                    required
                                    className="w-full p-2 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 text-red-600 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Líquido (Entrada no Caixa)</label>
                                <div className="w-full p-2 border border-green-300 rounded-md bg-green-50 text-green-700 font-bold flex items-center">
                                    {valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-800">
                            <strong>O que vai acontecer?</strong>
                            <ul className="list-disc ml-5 mt-1">
                                <li>O boleto original mudará para a conta Passivo.</li>
                                <li>Uma receita de {valorBrutoNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} entrará na Conta Destino.</li>
                                <li>Uma despesa de taxas será registrada na Conta Destino.</li>
                            </ul>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-100 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-200 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || contasPassivo.length === 0 || contasDestino.length === 0}
                                className="bg-emerald-600 text-white px-5 py-2 rounded-md hover:bg-emerald-700 transition disabled:bg-gray-400 flex items-center gap-2 font-semibold shadow-md"
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faMoneyBillTransfer} /> Efetivar Antecipação</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}