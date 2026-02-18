'use client';
import { useState, useEffect } from 'react';

export default function MetaTestePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    fetch('/api/meta/ad-accounts')
      .then(res => res.json())
      .then(res => {
        if(res.error) alert(res.error);
        else setData(res);
      })
      .finally(() => setLoading(false));
  };

  const salvarConta = async (id_formatado) => {
    if(!confirm('Usar esta conta para gerenciar Leads e Anúncios?')) return;
    
    const res = await fetch('/api/meta/ad-accounts', {
        method: 'POST', 
        body: JSON.stringify({ ad_account_id: id_formatado })
    });
    
    if (res.ok) {
        setMsg('✅ Conta de Anúncios Salva! Recarregando campanhas...');
        setTimeout(() => {
            setMsg('');
            carregarDados(); // Recarrega para tentar buscar as campanhas
        }, 1500);
    } else {
        alert('Erro ao salvar');
    }
  };

  if (loading) return <div className="p-10 text-xl font-bold text-blue-600 animate-pulse">💰 Buscando Contas de Anúncios...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">🎯 Configuração de Anúncios e Leads</h1>
      
      {msg && <div className="bg-green-100 p-4 rounded text-green-800 font-bold border border-green-400">{msg}</div>}

      {/* 1. LISTA DE CONTAS DE ANÚNCIO */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🏦 Selecione a Conta de Anúncios
            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">Obrigatório para Leads</span>
        </h2>
        
        <div className="grid gap-3">
            {data?.ad_accounts?.map(conta => (
                <div key={conta.id} className={`flex justify-between items-center p-4 border rounded hover:bg-gray-50 ${data.conta_atual === conta.id_formatado ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : ''}`}>
                    <div>
                        <div className="font-bold text-lg">{conta.name}</div>
                        <div className="text-sm text-gray-500 font-mono">ID: {conta.id_formatado}</div>
                        <div className="text-xs text-gray-400">Moeda: {conta.currency} • Status: {conta.status}</div>
                    </div>
                    
                    {data.conta_atual === conta.id_formatado ? (
                        <span className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm">✅ SELECIONADA</span>
                    ) : (
                        <button 
                            onClick={() => salvarConta(conta.id_formatado)}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-bold"
                        >
                            USAR ESTA
                        </button>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* 2. CAMPANHAS (PROVA DE FOGO) */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
        <h2 className="text-xl font-bold mb-4 text-gray-800">📊 Campanhas Recentes (Teste de Acesso)</h2>
        
        {!data?.conta_atual ? (
            <div className="text-gray-500 italic">Selecione uma conta acima para ver as campanhas.</div>
        ) : data?.campanhas_teste?.length > 0 ? (
            <div className="space-y-3">
                {data.campanhas_teste.map((c, i) => (
                    <div key={i} className="bg-white p-3 rounded border flex justify-between">
                        <span className="font-medium">{c.name}</span>
                        <div className="flex gap-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{c.objective}</span>
                            <span className={`text-xs px-2 py-1 rounded ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                                {c.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-yellow-600 bg-yellow-50 p-3 rounded">
                Nenhuma campanha encontrada ou erro de permissão. (Verifique se a conta tem campanhas ativas).
            </div>
        )}
      </div>
    </div>
  );
}