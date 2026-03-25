import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://alqzomckjnefsmhusnfu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscXpvbWNram5lZnNtaHVzbmZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA5NzQyNCwiZXhwIjoyMDg2NjczNDI0fQ.kLoNb-BFw_THVJJKJY09vH5EO-VfzLVpl2h599RbyxQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { error: err1 } = await supabase.from('configuracoes_whatsapp').insert({ organizacao_id: 1 });
    const { error: err2 } = await supabase.from('integracoes_meta').insert({ organizacao_id: 1 });
    fs.writeFileSync('out.json', JSON.stringify({ err1, err2 }, null, 2));
}

check();
