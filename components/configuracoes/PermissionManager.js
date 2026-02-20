"use client";

import { useState, Fragment, useEffect, useRef } from 'react';
import { createClient } from '../../utils/supabase/client';
import { toast } from 'sonner';
// --------------------------------------------------------
// NOVAS IMPORTAÇÕES DO DEVONILDO 🧙‍♂️
// --------------------------------------------------------
import { useAuth } from '@/contexts/AuthContext'; // Para pegar o organizacao_id
import { useMutation } from '@tanstack/react-query'; // Para salvar no banco
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner, faTimes, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

export default function PermissionManager({ initialFuncoes }) {
  const supabase = createClient();
  const { user } = useAuth(); // Pegando o usuário logado
  
  const [funcoes, setFuncoes] = useState(initialFuncoes);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTargetState, setDragTargetState] = useState(false);
  const pendingChanges = useRef([]);

  // Estados para o Modal de Criar Função
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFuncaoNome, setNewFuncaoNome] = useState('');
  const [newFuncaoDesc, setNewFuncaoDesc] = useState('');

  // =================================================================================
  // MUTAÇÃO PARA CRIAR NOVA FUNÇÃO (CUD usa useMutation) 🚀
  // =================================================================================
  const createFuncaoMutation = useMutation({
    mutationFn: async () => {
      if (!user?.organizacao_id) throw new Error("Organização não identificada. Recarregue a página.");
      if (!newFuncaoNome.trim()) throw new Error("O nome da função é obrigatório, seu lindo!");

      const novaFuncao = {
        nome_funcao: newFuncaoNome.trim(),
        descricao: newFuncaoDesc.trim(),
        organizacao_id: user.organizacao_id,
        // created_at é gerado automaticamente pelo banco (default now())
      };

      const { data, error } = await supabase
        .from('funcoes')
        .insert([novaFuncao])
        .select()
        .single();

      if (error) {
        // Tratando o seu índice único (idx_funcoes_organizacao_nome)
        if (error.code === '23505') { 
            throw new Error("Já existe uma função com este nome na sua organização.");
        }
        throw error;
      }
      return data;
    },
    onSuccess: (novaFuncaoCriada) => {
      // Adicionamos a nova função na lista local, com as permissões zeradas
      setFuncoes([...funcoes, { ...novaFuncaoCriada, permissoes: [] }]);
      
      // Limpamos a casa
      setNewFuncaoNome('');
      setNewFuncaoDesc('');
      setShowAddModal(false);
      
      toast.success(`Função "${novaFuncaoCriada.nome_funcao}" criada com sucesso!`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        savePendingChanges();
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // =================================================================================
  // LISTA DE RECURSOS ATUALIZADA (BLINDADA PELO DEVONILDO) 🛡️
  // =================================================================================
  const resourceGroups = [
    {
      title: 'Administrativo',
      resources: [
        { key: 'painel', name: 'Painel (Dashboard)' },
        { key: 'financeiro', name: 'Financeiro' },
        { key: 'recursos_humanos', name: 'Menu Recursos Humanos' },
        { key: 'funcionarios', name: 'Funcionários' },
        { key: 'funcionarios_salario_debug', name: 'Diagnóstico Salarial' },
        { key: 'ponto', name: 'Controle de Ponto' },
        { key: 'empresas', name: 'Empresas' },
        { key: 'empreendimentos', name: 'Empreendimentos' },
        { key: 'contratos', name: 'Contratos' },
      ]
    },
    {
      title: 'Comercial',
      resources: [
        { key: 'caixa_de_entrada', name: 'Caixa de Entrada' },
        { key: 'crm', name: 'Funil de Vendas (CRM)' },
        { key: 'tabela_vendas', name: 'Tabela de Vendas' },
        { key: 'anuncios', name: 'Anúncios (Marketing)' },
        { key: 'contatos', name: 'Contatos' },
        { key: 'simulador', name: 'Simulador' },
      ]
    },
    {
      title: 'Obra & Engenharia',
      resources: [
        { key: 'orcamento', name: 'Orçamentação' },
        { key: 'pedidos', name: 'Pedidos de Compra' },
        { key: 'almoxarifado', name: 'Almoxarifado' },
        { key: 'rdo', name: 'Diário de Obra (RDO)' },
        { key: 'atividades', name: 'Gestão de Atividades' },
      ]
    },
    {
      title: 'Coordenação BIM', 
      resources: [
        { key: 'bim', name: 'BIM Manager (3D)' },
      ]
    },
    {
      title: 'Sistema',
      resources: [
        { key: 'usuarios', name: 'Usuários' },
        { key: 'permissoes', name: 'Permissões' },
      ]
    },
    {
      title: 'Configurações',
      resources: [
        { key: 'config_usuarios', name: 'Gestão de Usuários' },
        { key: 'config_permissoes', name: 'Permissões de Acesso' },
        { key: 'config_jornadas', name: 'Jornadas de Trabalho' },
        { key: 'config_tipos_documento', name: 'Tipos de Documento' },
        { key: 'config_integracoes', name: 'Integrações' },
        { key: 'config_materiais', name: 'Base de Materiais' },
        { key: 'config_treinamento_ia', name: 'Treinamento da IA' },
        { key: 'config_kpi_builder', name: 'Construtor de KPIs' },
        { key: 'config_financeiro_importar', name: 'Importação Financeira' },
        { key: 'config_menu', name: 'Personalização do Menu' },
      ]
    }
  ];

  const updateLocalPermission = (funcaoId, recursoKey, tipoPermissao, valor) => {
    setFuncoes(currentFuncoes =>
      currentFuncoes.map(funcao => {
        if (funcao.id === funcaoId) {
          const newPermissoes = [...funcao.permissoes];
          const permissaoIndex = newPermissoes.findIndex(p => p.recurso === recursoKey);

          if (permissaoIndex > -1) {
            newPermissoes[permissaoIndex] = { ...newPermissoes[permissaoIndex], [tipoPermissao]: valor };
          } else {
            newPermissoes.push({ funcao_id: funcaoId, recurso: recursoKey, [tipoPermissao]: valor });
          }
          return { ...funcao, permissoes: newPermissoes };
        }
        return funcao;
      })
    );
    
    const change = { funcao_id: funcaoId, recurso: recursoKey, [tipoPermissao]: valor };
    const existingChangeIndex = pendingChanges.current.findIndex(c => c.funcao_id === funcaoId && c.recurso === recursoKey);
    if(existingChangeIndex > -1) {
        pendingChanges.current[existingChangeIndex] = { ...pendingChanges.current[existingChangeIndex], ...change };
    } else {
        pendingChanges.current.push(change);
    }
  };

  const handleMouseDown = (funcaoId, recursoKey, tipoPermissao, currentValue) => {
    const funcao = funcoes.find(f => f.id === funcaoId);
    if (funcao?.nome_funcao === 'Proprietário') return;

    setIsDragging(true);
    const targetValue = !currentValue;
    setDragTargetState(targetValue);
    updateLocalPermission(funcaoId, recursoKey, tipoPermissao, targetValue);
  };

  const handleMouseEnter = (funcaoId, recursoKey, tipoPermissao) => {
    const funcao = funcoes.find(f => f.id === funcaoId);
    if (funcao?.nome_funcao === 'Proprietário') return;
    
    if (isDragging) {
      updateLocalPermission(funcaoId, recursoKey, tipoPermissao, dragTargetState);
    }
  };

  const savePendingChanges = () => {
    if (pendingChanges.current.length === 0) return;

    const promise = async () => {
      const { error } = await supabase
        .from('permissoes')
        .upsert(pendingChanges.current, { onConflict: 'funcao_id, recurso' });
      
      pendingChanges.current = [];
      
      if (error) {
        throw error;
      }
    };

    toast.promise(promise(), {
      loading: `Salvando ${pendingChanges.current.length} permissões...`,
      success: 'Permissões atualizadas com sucesso!',
      error: (err) => `Erro ao salvar: ${err.message}`,
    });
  };

  const getPermissao = (funcao, recursoKey, tipo) => {
    if (funcao.nome_funcao === 'Proprietário') {
      return true;
    }
    const permissao = funcao.permissoes.find(p => p.recurso === recursoKey);
    return permissao ? !!permissao[tipo] : false;
  };

  return (
    <div className="space-y-4 select-none relative">
      
      {/* CABEÇALHO COM O BOTÃO DE ADICIONAR */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Funções do Sistema</h2>
          <p className="text-sm text-gray-500">Gerencie o que cada nível de acesso pode fazer no Studio 57.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} /> Nova Função
        </button>
      </div>

      {/* MODAL PARA ADICIONAR NOVA FUNÇÃO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldAlt} className="text-blue-600"/> 
                Criar Nova Função
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome da Função</label>
                <input 
                  type="text" 
                  placeholder="Ex: Corretor Sênior" 
                  value={newFuncaoNome}
                  onChange={(e) => setNewFuncaoNome(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição (Opcional)</label>
                <textarea 
                  placeholder="Ex: Acesso apenas à visualização de vendas." 
                  value={newFuncaoDesc}
                  onChange={(e) => setNewFuncaoDesc(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-20"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button 
                onClick={() => createFuncaoMutation.mutate()}
                disabled={createFuncaoMutation.isPending}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createFuncaoMutation.isPending ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Salvar Função'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABELA DE PERMISSÕES */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg custom-scrollbar pb-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Função</th>
              {resourceGroups.map(group => (
                <th key={group.title} colSpan={group.resources.length * 4} className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider border-l-2 border-gray-300">{group.title}</th>
              ))}
            </tr>
            <tr>
              <th className="px-6 py-3 sticky left-0 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></th>
              {resourceGroups.flatMap(group =>
                group.resources.map(recurso => (
                  <th key={recurso.key} colSpan="4" className="px-6 py-3 text-center text-[10px] font-bold text-blue-600 uppercase tracking-wider border-l-2 border-gray-300 bg-blue-50/30">
                    {recurso.name}
                  </th>
                ))
              )}
            </tr>
            <tr>
              <th className="px-6 py-3 sticky left-0 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></th>
              {resourceGroups.flatMap(group =>
                group.resources.map(recurso => (
                  <Fragment key={recurso.key}>
                    <th className="px-1 py-2 text-center text-[9px] font-medium text-gray-400 border-l-2 border-gray-300" title="Ver">Ver</th>
                    <th className="px-1 py-2 text-center text-[9px] font-medium text-gray-400 border-l" title="Criar">Criar</th>
                    <th className="px-1 py-2 text-center text-[9px] font-medium text-gray-400 border-l" title="Editar">Edit</th>
                    <th className="px-1 py-2 text-center text-[9px] font-medium text-gray-400 border-l" title="Excluir">Del</th>
                  </Fragment>
                ))
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {funcoes.map(funcao => (
              <tr key={funcao.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-bold text-xs text-gray-700 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  {funcao.nome_funcao}
                </td>
                {resourceGroups.flatMap(group =>
                  group.resources.map(recurso => (
                    <Fragment key={recurso.key}>
                      {['pode_ver', 'pode_criar', 'pode_editar', 'pode_excluir'].map((tipo, tipoIndex) => {
                        const isChecked = getPermissao(funcao, recurso.key, tipo);
                        const borderClass = tipoIndex === 0 ? 'border-l-2 border-gray-300' : 'border-l border-gray-100';
                        return (
                          <td
                            key={tipo}
                            className={`px-1 py-3 text-center ${funcao.nome_funcao !== 'Proprietário' ? 'cursor-pointer hover:bg-blue-50' : 'opacity-50 cursor-not-allowed'} ${borderClass}`}
                            onMouseDown={() => handleMouseDown(funcao.id, recurso.key, tipo, isChecked)}
                            onMouseEnter={() => handleMouseEnter(funcao.id, recurso.key, tipo)}
                          >
                            <input
                              type="checkbox"
                              className={`h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none transition-all ${isChecked ? 'scale-110' : ''}`}
                              readOnly
                              checked={isChecked}
                              disabled={funcao.nome_funcao === 'Proprietário'}
                            />
                          </td>
                        );
                      })}
                    </Fragment>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-500 mt-2 px-2">
        <p>💡 Dica: Clique e arraste para marcar/desmarcar várias opções rapidamente.</p>
        <p>🔒 O cargo 'Proprietário' possui acesso total irrestrito.</p>
      </div>
    </div>
  );
}