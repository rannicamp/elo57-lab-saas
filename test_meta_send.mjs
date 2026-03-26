import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function resetAll() {
    console.log("🗑️  Limpando configuracoes_whatsapp...");
    const { error: e1 } = await supabase.from('configuracoes_whatsapp').delete().gte('id', 0);
    if (e1) console.error("Erro:", e1.message);
    else console.log("✅ configuracoes_whatsapp zerada!");

    console.log("🗑️  Limpando integracoes_meta...");
    const { error: e2 } = await supabase.from('integracoes_meta').delete().gte('organizacao_id', 0);
    if (e2) console.error("Erro:", e2.message);
    else console.log("✅ integracoes_meta zerada!");

    // Confirmar que estão vazias
    const { count: c1 } = await supabase.from('configuracoes_whatsapp').select('*', { count: 'exact', head: true });
    const { count: c2 } = await supabase.from('integracoes_meta').select('*', { count: 'exact', head: true });
    console.log(`\n📊 Estado final: configuracoes_whatsapp=${c1} linhas | integracoes_meta=${c2} linhas`);
    console.log("🏁 Sistema zerado! Pronto para primeira conexão via Embedded Signup.");
}
resetAll();
