import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const APP_SECRET = process.env.FACEBOOK_CLIENT_SECRET;

export async function POST(request) {
    try {
        const supabase = await createClient();
        
        // 1. Segurança: Pega usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { shortToken } = await request.json();
        
        // 2. Troca Token Curto por Longo (Long-Lived Access Token)
        // Isso é crucial para não desconectar o cliente toda hora.
        const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortToken}`;
        
        const tokenRes = await fetch(tokenUrl);
        const tokenData = await tokenRes.json();
        
        if (tokenData.error) throw new Error(`Erro ao gerar token longo: ${tokenData.error.message}`);
        
        const longToken = tokenData.access_token;

        // 3. Pega dados do Usuário do Facebook e suas Páginas
        const meRes = await fetch(`https://graph.facebook.com/v20.0/me?fields=id,name,accounts{access_token,id,name,category}&access_token=${longToken}`);
        const meData = await meRes.json();
        
        if (meData.error) throw new Error(meData.error.message);

        // ATENÇÃO: Aqui pegamos a PRIMEIRA página por padrão para simplificar.
        // No futuro, você pode criar uma tela para ele escolher qual página conectar.
        const page = meData.accounts?.data?.[0];

        if (!page) throw new Error("Nenhuma página do Facebook encontrada nesta conta.");

        // 4. Pega ID da Organização no Supabase
        const { data: usuarioData } = await supabase
            .from('usuarios')
            .select('organizacao_id')
            .eq('id', user.id)
            .single();
            
        if (!usuarioData?.organizacao_id) throw new Error('Usuário sem organização.');

        // 5. Salva Tudo no Banco (Token da PÁGINA, não do usuário)
        // O token da página (page.access_token) é o que permite ler leads e rodar anúncios sem expirar.
        const { error: dbError } = await supabase
            .from('integracoes_meta')
            .upsert({
                organizacao_id: usuarioData.organizacao_id,
                access_token: page.access_token, // Token Específico da Página (Melhor Prática)
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