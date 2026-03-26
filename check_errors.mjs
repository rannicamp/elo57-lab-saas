import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkErrors() {
    const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('id, sent_at, status, content, error_message, raw_payload')
        .eq('status', 'failed')
        .order('sent_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching messages:", error);
    } else {
        fs.writeFileSync('errors.json', JSON.stringify(data, null, 2));
    }
}

checkErrors();
