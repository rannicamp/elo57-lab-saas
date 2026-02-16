import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
    try {
        const supabase = await createClient();
        
        // 1. Pega o usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        // 2. Recebe o token do Frontend
        const { shortToken } = await request.json();
        
        // 3. Pega a organização do usuário (Simplificado)
        const { data: usuarioData } = await supabase
            .from('usuarios')
            .select('organizacao_id')
            .eq('id', user.id)
            .single();
            
        if (!usuarioData?.organizacao_id) {
            return NextResponse.json({ error: 'Usuário sem organização.' }, { status: 400 });
        }

        // 4. (Opcional) Trocar Token Curto por Longo aqui... 
        // Para simplificar, vamos salvar o token direto e pegar o nome.
        
        const infoRes = await fetch(`https://graph.facebook.com/me?fields=id,name&access_token=${shortToken}`);
        const infoData = await infoRes.json();

        if (infoData.error) throw new Error(infoData.error.message);

        // 5. Salva no Banco (Upsert)
        const { error: dbError } = await supabase
            .from('integracoes_meta')
            .upsert({
                organizacao_id: usuarioData.organizacao_id,
                access_token: shortToken,
                page_id: infoData.id, // Salvando ID do User como Page ID provisório para validar conexão
                nome_conta: infoData.name,
                status: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'organizacao_id' });

        if (dbError) throw new Error(dbError.message);

        return NextResponse.json({ success: true, nome_conta: infoData.name });

    } catch (error) {
        console.error('Erro API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}