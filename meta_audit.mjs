import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function metaFullAudit() {
    const { data: configs } = await supabase.from('configuracoes_whatsapp').select('*');
    if (!configs || configs.length === 0) return;
    const TOKEN = configs[0].whatsapp_permanent_token;
    const WABA_ID = configs[0].whatsapp_business_account_id;
    const headers = { "Authorization": `Bearer ${TOKEN}` };
    
    const report = {
        businesses: [],
        errors: []
    };

    try {
        console.log("Buscando owner_business_info da WABA", WABA_ID);
        const wabaRes = await fetch(`https://graph.facebook.com/v19.0/${WABA_ID}?fields=owner_business_info`, { headers });
        const wabaData = await wabaRes.json();
        
        if (wabaData.owner_business_info && wabaData.owner_business_info.id) {
            const bmId = wabaData.owner_business_info.id;
            const business = { id: bmId, name: wabaData.owner_business_info.name, owned_wabas: [], client_wabas: [] };
            
            // Buscar WABAs Próprias (Owned)
            try {
                const ownedRes = await fetch(`https://graph.facebook.com/v19.0/${bmId}/owned_whatsapp_business_accounts?fields=id,name,message_template_namespace`, { headers });
                const ownedData = await ownedRes.json();
                if (ownedData.data) {
                    for (const waba of ownedData.data) {
                        const phonesRes = await fetch(`https://graph.facebook.com/v19.0/${waba.id}/phone_numbers`, { headers });
                        const phonesData = await phonesRes.json();
                        business.owned_wabas.push({ ...waba, phones: phonesData.data || [] });
                    }
                }
            } catch(e) { report.errors.push(`Erro Owned WABAs: ${e.message}`) }
            
            // Buscar WABAs Client
            try {
                const clientRes = await fetch(`https://graph.facebook.com/v19.0/${bmId}/client_whatsapp_business_accounts?fields=id,name`, { headers });
                const clientData = await clientRes.json();
                if (clientData.data) {
                    for (const waba of clientData.data) {
                        const phonesRes = await fetch(`https://graph.facebook.com/v19.0/${waba.id}/phone_numbers`, { headers });
                        const phonesData = await phonesRes.json();
                        business.client_wabas.push({ ...waba, phones: phonesData.data || [] });
                    }
                }
            } catch(e) { report.errors.push(`Erro Client WABAs: ${e.message}`) }
            
            report.businesses.push(business);
        } else {
            report.errors.push("WABA não retornou owner_business_info: " + JSON.stringify(wabaData));
        }
    } catch(e) { report.errors.push("Erro Global: " + e.message) }
    
    fs.writeFileSync('meta_full_audit.json', JSON.stringify(report, null, 2));
    console.log("Full Audit 2 Done");
}

metaFullAudit();
