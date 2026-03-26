import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkSchema() {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, { headers: { 'apikey': supabaseKey } });
    const data = await res.json();
    
    const relations = data.paths['/sys_chat_mural_posts']?.get?.parameters;
    console.log("sys_chat_mural_posts relations mapping inside 'select' query param description:");
    const selectParam = relations?.find(p => p.name === 'select');
    console.log(selectParam?.description);
}

checkSchema();
