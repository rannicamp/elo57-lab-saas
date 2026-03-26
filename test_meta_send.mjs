import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
    // 1. Adicionar constraint única composta (phone_number + organizacao_id)
    console.log("📌 Adicionando constraint UNIQUE(phone_number, organizacao_id)...");
    const { error: constraintError } = await supabase.rpc('exec_sql', { 
        sql: `
            ALTER TABLE whatsapp_conversations DROP CONSTRAINT IF EXISTS whatsapp_conversations_phone_number_key;
            ALTER TABLE whatsapp_conversations ADD CONSTRAINT IF NOT EXISTS whatsapp_conversations_phone_org_key UNIQUE (phone_number, organizacao_id);
        `
    });
    if (constraintError) {
        console.log("RPC exec_sql não disponível, tentando via SQL direto:", constraintError.message);
    } else {
        console.log("✅ Constraint aplicada!");
    }

    // 2. Corrigir mensagens recebidas que foram parar na Org 12 mas deveriam ir para Org 2
    // (eram do Phone ID 690198827516149 que agora pertence à Org 2)
    const { data: wrongMsgs, error: e1 } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('organizacao_id', 12)
        .eq('receiver_id', '690198827516149'); // Mensagens inbound onde receiver é nosso Phone ID
    
    if (wrongMsgs?.length > 0) {
        console.log(`\n🔧 Migrando ${wrongMsgs.length} mensagens da Org 12 → Org 2...`);
        const { error: updateError } = await supabase
            .from('whatsapp_messages')
            .update({ organizacao_id: 2 })
            .eq('organizacao_id', 12)
            .eq('receiver_id', '690198827516149');
        if (updateError) console.error("Erro migração mensagens:", updateError.message);
        else console.log("✅ Mensagens migradas para Org 2!");
    } else {
        console.log("\n📋 Sem mensagens para migrar (receiver_id = 690198827516149 na Org 12).");
    }

    // 3. Corrigir conversas da Org 12 que pertencem ao Phone ID da Org 2
    const { data: wrongConvs } = await supabase
        .from('whatsapp_conversations')
        .select('id, phone_number')
        .eq('organizacao_id', 12);
    console.log(`\n📋 Conversas na Org 12: ${wrongConvs?.length || 0}`);
    
    // Checar estado final
    const { count: msgCount } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('organizacao_id', 2);
    console.log(`\n📊 Total de mensagens na Org 2 agora: ${msgCount}`);
}
migrate();
