const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function main() {
    console.log("=== LISTANDO ORGANIZACOES ===");
    let { data: orgs, error: eOrg } = await supabase.from('organizacoes').select('*');
    if (eOrg) console.error("Erro Listando Orgs:", eOrg);
    console.log("Orgs:", JSON.stringify(orgs, null, 2));

    console.log("\n=== LISTANDO FUNIS ===");
    let { data: funis } = await supabase.from('funis').select('id, nome, organizacao_id');
    console.log("Funis:", funis);

    console.log("\n=== LISTANDO COLUNAS ===");
    let { data: colunas } = await supabase.from('colunas_funil').select('id, nome, organizacao_id, funil_id').ilike('nome', '%entrada%');
    console.log("Colunas Entrada:", colunas);
}

main().catch(console.error);
