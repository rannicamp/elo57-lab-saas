const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'], {
    auth: { persistSession: false }
});

async function forceId1() {
    console.log("Tentando atualizar ID da Organização 8 para 1...");
    // Update da Organização
    const { data: orgData, error: orgErr } = await supabase.from('organizacoes').update({ id: 1 }).eq('id', 8).select();
    console.log("Update Org:", orgData, orgErr ? orgErr : "Sucesso!");

    // Se houve erro de foreign key constraint, precisamos atualizar primeiro nas tabelas filhas?
    // O Postgres com ON UPDATE CASCADE faz isso automático. Vamos ver.
}

forceId1().catch(console.error);
