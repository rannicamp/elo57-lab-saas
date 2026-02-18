import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const APP_SECRET = process.env.FACEBOOK_CLIENT_SECRET;

// --- ROTA DE CONEXÃO (POST) ---
export async function POST(request) {
    try {
        const supabase = await createClient();
        
        // 1. Segurança: Pega usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const body = await request.json();
        const { shortToken } = body;
        
        // 2. Troca Token Curto por Longo (Long-Lived Access Token)
        const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortToken}`;
        
        const tokenRes = await fetch(tokenUrl);
        const tokenData = await tokenRes.json();
        
        if (tokenData.error) throw new Error(`Erro ao gerar token longo: ${tokenData.error.message}`);
        
        const longToken = tokenData.access_token;

        // 3. Pega dados do Usuário do Facebook e suas Páginas
        const meRes = await fetch(`https://graph.facebook.com/v20.0/me?fields=id,name,accounts{access_token,id,name,category}&access_token=${longToken}`);
        const meData = await meRes.json();
        
        if (meData.error) throw new Error(meData.error.message);

        // ATENÇÃO: Pega a primeira página por padrão
        const page = meData.accounts?.data?.[0];

        if (!page) throw new Error("Nenhuma página do Facebook encontrada nesta conta.");

        // 4. Pega ID da Organização no Supabase
        const { data: usuarioData } = await supabase
            .from('usuarios')
            .select('organizacao_id')
            .eq('id', user.id)
            .single();
            
        if (!usuarioData?.organizacao_id) throw new Error('Usuário sem organização.');

        // 5. Salva Tudo no Banco (Upsert)
        const { error: dbError } = await supabase
            .from('integracoes_meta')
            .upsert({
                organizacao_id: usuarioData.organizacao_id,
                access_token: page.access_token, // Token da Página
                page_id: page.id,
                nome_conta: page.name,
                meta_user_id: meData.id,
                status: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'organizacao_id' });

        if (dbError) throw new Error(dbError.message);

        return NextResponse.json({ success: true, nome_conta: page.name, page_id: page.id });

    } catch (error) {
        console.error('Erro API Conectar:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- NOVA ROTA DE DESCONEXÃO (DELETE) ---
export async function DELETE(request) {
    try {
        const supabase = await createClient();

        // 1. Verifica Usuário
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // 2. Busca Organização do Usuário
        const { data: usuarioData } = await supabase
            .from('usuarios')
            .select('organizacao_id')
            .eq('id', user.id)
            .single();

        if (!usuarioData?.organizacao_id) {
            return NextResponse.json({ error: 'Organização não encontrada' }, { status: 400 });
        }

        // 3. Apaga a linha da tabela de integração
        const { error: deleteError } = await supabase
            .from('integracoes_meta')
            .delete()
            .eq('organizacao_id', usuarioData.organizacao_id);

        if (deleteError) {
            throw new Error(deleteError.message);
        }

        return NextResponse.json({ status: 'success', message: 'Desconectado com sucesso' });

    } catch (error) {
        console.error('Erro API Desconectar:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}