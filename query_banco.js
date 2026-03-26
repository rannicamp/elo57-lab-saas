require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function runSQL() {
  const password = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;
  if (!password) { 
      console.error('ERRO FATAL: Senha não encontrada na .env.local.'); 
      return; 
  }
  
  const baseHost = process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').split('/')[0];
  const projectId = baseHost.split('.')[0];
  const host = `db.${projectId}.supabase.co`;

  const connStr = `postgres://postgres:${password}@${host}:6543/postgres`;
  const client = new Client({ connectionString: connStr });
  
  try {
     console.log("Estabelecendo link P2P com Supabase...");
     await client.connect();
     
     // Checking if FK exists
     console.log("Adding FK to sys_chat_mural_posts...");
     await client.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sys_chat_mural_posts_author_id_fkey') THEN
                ALTER TABLE sys_chat_mural_posts 
                ADD CONSTRAINT sys_chat_mural_posts_author_id_fkey 
                FOREIGN KEY (author_id) REFERENCES usuarios(id) ON DELETE CASCADE;
            END IF;
        END $$;
     `);

     console.log("Adding FK to sys_chat_mural_comments...");
     await client.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sys_chat_mural_comments_author_id_fkey') THEN
                ALTER TABLE sys_chat_mural_comments 
                ADD CONSTRAINT sys_chat_mural_comments_author_id_fkey 
                FOREIGN KEY (author_id) REFERENCES usuarios(id) ON DELETE CASCADE;
            END IF;
        END $$;
     `);
     
     // Let's also reload the schema cache for PostgREST
     await client.query(`NOTIFY pgrst, 'reload schema'`);

     console.log("Operação SQL homologada com sucesso!");
  } catch(e) {
     console.error("FALHA NA INJEÇÃO SQL:", e.message);
  } finally {
     await client.end();
  }
}

runSQL();
