import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://alqzomckjnefsmhusnfu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscXpvbWNram5lZnNtaHVzbmZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA5NzQyNCwiZXhwIjoyMDg2NjczNDI0fQ.kLoNb-BFw_THVJJKJY09vH5EO-VfzLVpl2h599RbyxQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data, error } = await supabase.rpc('get_configuracoes_whatsapp_constraints'); // just kidding, I can't do this
    // Let's just lookup the first row of schema
    const { data: rows } = await supabase.from('configuracoes_whatsapp').select('*').limit(1);
    console.log(rows);
}

check();
