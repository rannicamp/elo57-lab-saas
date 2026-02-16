import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getOrganizationId } from '@/utils/getOrganizationId';
import MetaCard from '@/components/integracoes/cards/MetaCard';

export default async function IntegracoesPage() {
    // 👇 A CORREÇÃO ESTÁ AQUI: Adicionado 'await'
    const supabase = await createClient(); 

    // 1. Segurança
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // 2. Busca Organização
    const organizacaoId = await getOrganizationId(user.id);
    if (!organizacaoId) return <div className="p-8 text-red-500">Erro: Organização não identificada.</div>;

    // 3. Busca Dados da Integração Meta
    const { data: metaIntegration } = await supabase
        .from('integracoes_meta')
        .select('*')
        .eq('organizacao_id', organizacaoId)
        .single();

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Central de Integrações</h1>
            <p className="text-gray-500 mb-8">Gerencie as conexões externas do seu ambiente Elo 57.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card do Facebook (Passamos os dados vindos do banco) */}
                <MetaCard initialData={metaIntegration} />

                {/* Card do Google (Placeholder) */}
                <div className="border rounded-xl p-6 bg-gray-50 opacity-60">
                    <h3 className="font-semibold text-lg text-gray-400">Google Ads</h3>
                    <p className="text-sm text-gray-400 mt-2 mb-4">Em breve...</p>
                    <button disabled className="w-full py-2 bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed">Indisponível</button>
                </div>
            </div>
        </div>
    );
}