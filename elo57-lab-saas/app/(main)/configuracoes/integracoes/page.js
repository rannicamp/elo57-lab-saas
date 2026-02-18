import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import FacebookButton from '@/components/integracoes/FacebookButton'; // <--- Importando o NOVO

export default async function IntegracoesPage() {
    const supabase = await createClient();

    // 1. Verifica Usuário
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // 2. Pega ID da Organização
    const { data: usuario } = await supabase.from('usuarios').select('organizacao_id').eq('id', user.id).single();
    if (!usuario?.organizacao_id) return <div>Erro: Sem organização.</div>;

    // 3. Busca se já está conectado
    const { data: integracao } = await supabase
        .from('integracoes_meta')
        .select('status, nome_conta')
        .eq('organizacao_id', usuario.organizacao_id)
        .single();

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Integrações</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Botão Novo do Facebook */}
                <FacebookButton 
                    isConnected={!!integracao?.status} 
                    accountName={integracao?.nome_conta} 
                />
                
                {/* Placeholder Google */}
                <div className="border p-6 rounded-xl bg-gray-50 opacity-50">
                    <h3 className="font-semibold">Google Ads</h3>
                    <p className="text-sm">Em breve</p>
                </div>
            </div>
        </div>
    );
}