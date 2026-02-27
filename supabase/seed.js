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
    console.log("=== INICIANDO VERIFICAÇÃO ORG SISTEMA ===");

    // Tenta achar pelo nome primeiro
    let orgSistema;
    let { data: org, error } = await supabase.from('organizacoes').select('*').eq('nome', 'Studio 57 Sistema').maybeSingle();

    if (!org) {
        console.log("Org Sistema não encontrada! Criando...");
        const { data: novaOrg, error: errCria } = await supabase.from('organizacoes').insert({
            nome: "Studio 57 Sistema"
        }).select().single();
        if (errCria) console.error("Erro criar Org:", errCria);
        orgSistema = novaOrg;
        console.log("Org criada:", orgSistema);
    } else {
        orgSistema = org;
        console.log("Org Sistema encontrada:", orgSistema);
    }

    if (!orgSistema) return;
    const sysId = orgSistema.id;

    console.log(`\n=== VERIFICANDO FUNIL DA ORG ${sysId} ===`);
    let funilId;
    let { data: funil, error: errF } = await supabase.from('funis').select('*').eq('organizacao_id', sysId).eq('nome', 'Funil do Sistema').maybeSingle();

    if (!funil) {
        console.log("Funil não encontrado. Criando...");
        const { data: novoF, error: errCriarF } = await supabase.from('funis').insert({
            nome: "Funil do Sistema",
            organizacao_id: sysId
        }).select().single();
        if (errCriarF) console.error("Erro criar Funil:", errCriarF);
        funilId = novoF.id;
        console.log("Funil criado:", novoF);
    } else {
        funilId = funil.id;
        console.log("Funil encontrado:", funil);
    }

    console.log(`\n=== VERIFICANDO COLUNA 'ENTRADA' DA ORG ${sysId} ===`);
    let { data: col, error: errC } = await supabase
        .from('colunas_funil')
        .select('*')
        .eq('organizacao_id', sysId)
        .eq('nome', 'ENTRADA')
        .maybeSingle();

    if (!col) {
        console.log("Coluna ENTRADA não encontrada. Criando...");
        const { data: novaC, error: errCriarC } = await supabase.from('colunas_funil').insert({
            nome: "ENTRADA",
            funil_id: funilId,
            organizacao_id: sysId,
            ordem: 0,
            cor: "bg-gray-100"
        }).select().single();
        if (errCriarC) console.error("Erro criar Coluna:", errCriarC);
        console.log("Coluna ENTRADA criada:", novaC);
    } else {
        console.log("Coluna ENTRADA encontrada:", col);
    }
}

main().catch(console.error);
