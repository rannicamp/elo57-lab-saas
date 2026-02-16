import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request) {
    const supabase = await createClient();

    try {
        // 1. Auth e Organização
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: '401' }, { status: 401 });

        const { data: usuario } = await supabase.from('usuarios').select('organizacao_id').eq('id', user.id).single();
        if (!usuario) return NextResponse.json({ error: 'Sem organização' }, { status: 400 });

        // 2. Busca o Token da Integração
        const { data: integracao } = await supabase
            .from('integracoes_meta')
            .select('access_token, page_id, nome_conta')
            .eq('organizacao_id', usuario.organizacao_id)
            .single();

        if (!integracao || !integracao.access_token) {
            return NextResponse.json({ conectado: false });
        }

        // 3. Busca Campanhas ativas usando o Token do Cliente
        const campsRes = await fetch(`https://graph.facebook.com/v20.0/${integracao.page_id}/campaigns?fields=id,name,status,objective,insights{spend,impressions,clicks,leads}&access_token=${integracao.access_token}`);
        
        // Se a página não tiver campanhas diretas (comum), talvez precise buscar via Ad Account.
        // Mas para validar a conexão, vamos retornar os dados básicos.
        
        const pageRes = await fetch(`https://graph.facebook.com/v20.0/${integracao.page_id}?fields=fan_count,new_like_count&access_token=${integracao.access_token}`);
        const pageData = await pageRes.json();

        return NextResponse.json({
            conectado: true,
            conta: integracao.nome_conta,
            page_stats: pageData,
            // campanhas: campsData.data ... (Expandir depois conforme necessidade)
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}