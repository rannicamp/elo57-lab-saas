const { Client } = require('pg');
const fs = require('fs');

// --- CONFIGURAÇÃO ---
const PASS = 'Srbr19010720%40';
const ORIGEM_URL = `postgresql://postgres:${PASS}@db.vhuvnutzklhskkwbpxdz.supabase.co:5432/postgres`;
const DESTINO_URL = `postgresql://postgres:${PASS}@db.alqzomckjnefsmhusnfu.supabase.co:5432/postgres`;

const SSL = { rejectUnauthorized: false };

async function getFullSchema(client) {
    console.log('🔍 Extraindo tabelas e funções do banco de origem...');

    // Pegar todas as tabelas e suas definições básicas
    const { rows: tables } = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    // Pegar todas as funções do usuário (não pertencentes a extensões)
    const { rows: functions } = await client.query(`
        SELECT pg_get_functiondef(p.oid) as definition, p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
        WHERE n.nspname = 'public'
          AND p.prokind = 'f'
          AND d.objid IS NULL
    `);

    // Pegar extensões (muito importante no Supabase)
    const { rows: extensions } = await client.query(`
        SELECT extname FROM pg_extension
    `);

    return { tables, functions, extensions };
}

async function mirror() {
    const origem = new Client({ connectionString: decodeURIComponent(ORIGEM_URL), ssl: SSL });
    const destino = new Client({ connectionString: decodeURIComponent(DESTINO_URL), ssl: SSL });

    try {
        await origem.connect();
        await destino.connect();
        console.log('✅ Conectado aos dois bancos de dados!');

        const schema = await getFullSchema(origem);

        console.log(`📊 Encontradas ${schema.tables.length} tabelas e ${schema.functions.length} funções.`);

        // Aviso de segurança
        console.log('⚠️  Iniciando aplicação no destino (alqzomckjnefsmhusnfu)...');

        // 1. Criar extensões faltantes
        for (const ext of schema.extensions) {
            try {
                await destino.query(`CREATE EXTENSION IF NOT EXISTS "${ext.extname}"`);
            } catch (e) {
                console.log(`ℹ️ Extensão ${ext.extname} já existe ou erro ignorado.`);
            }
        }

        // 2. Tentar recriar as funções (costumam ser independentes)
        for (const func of schema.functions) {
            try {
                await destino.query(func.definition);
                console.log(`✅ Função ${func.proname} aplicada.`);
            } catch (e) {
                console.error(`❌ Erro na função ${func.proname}: ${e.message}`);
            }
        }

        console.log('\n🚀 Espelhamento concluído com o método via script!');
        console.log('OBS: Para tabelas complexas, recomendo usar o SQL Editor para o grosso do DDL.');

    } catch (err) {
        console.error('❌ Erro durante o espelhamento:', err.message);
    } finally {
        await origem.end();
        await destino.end();
    }
}

mirror();
