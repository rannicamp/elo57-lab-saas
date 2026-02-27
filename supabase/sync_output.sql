-- ================================================
-- SYNC SCRIPT: LAB → PROD
-- Gerado em: 27/02/2026, 10:17:16
-- ⚠️  REVISE ANTES DE EXECUTAR NO PROD!
-- ================================================

-- 
📦 Comparando schema: public

-- 
🔍 Comparando colunas de 116 tabelas em comum...

-- ALTERAÇÕES NA TABELA: campos_sistema
-- ⚠️  COLUNA ALTERADA: organizacao_id
-- LAB:  bigint|null|YES|2|int8
-- PROD: bigint|null|YES|null|int8
ALTER TABLE public.campos_sistema ALTER COLUMN organizacao_id TYPE bigint USING organizacao_id::bigint;

-- ALTERAÇÕES NA TABELA: contratos_terceirizados_anexos
-- ⚠️  COLUNA ALTERADA: organizacao_id
-- LAB:  bigint|null|YES|2|int8
-- PROD: bigint|null|YES|null|int8
ALTER TABLE public.contratos_terceirizados_anexos ALTER COLUMN organizacao_id TYPE bigint USING organizacao_id::bigint;

-- ALTERAÇÕES NA TABELA: disciplinas_projetos
-- ⚠️  COLUNA ALTERADA: organizacao_id
-- LAB:  bigint|null|NO|2|int8
-- PROD: bigint|null|NO|null|int8
ALTER TABLE public.disciplinas_projetos ALTER COLUMN organizacao_id TYPE bigint USING organizacao_id::bigint;

-- ALTERAÇÕES NA TABELA: empreendimento_documento_embeddings
-- ⚠️  COLUNA ALTERADA: organizacao_id
-- LAB:  bigint|null|YES|2|int8
-- PROD: bigint|null|YES|null|int8
ALTER TABLE public.empreendimento_documento_embeddings ALTER COLUMN organizacao_id TYPE bigint USING organizacao_id::bigint;

-- ALTERAÇÕES NA TABELA: integracoes_meta
ALTER TABLE public.integracoes_meta ADD COLUMN IF NOT EXISTS nome_conta text;
ALTER TABLE public.integracoes_meta ADD COLUMN IF NOT EXISTS meta_user_id text;
ALTER TABLE public.integracoes_meta ADD COLUMN IF NOT EXISTS status text DEFAULT 'inativo'::text;
ALTER TABLE public.integracoes_meta ADD COLUMN IF NOT EXISTS page_access_token text;

-- ALTERAÇÕES NA TABELA: lancamentos
ALTER TABLE public.lancamentos ADD COLUMN IF NOT EXISTS antecipacao_grupo_id uuid;

-- ALTERAÇÕES NA TABELA: marcas_uploads
-- ⚠️  COLUNA ALTERADA: organizacao_id
-- LAB:  bigint|null|YES|2|int8
-- PROD: bigint|null|YES|null|int8
ALTER TABLE public.marcas_uploads ALTER COLUMN organizacao_id TYPE bigint USING organizacao_id::bigint;

-- ALTERAÇÕES NA TABELA: pedidos_compra_status_historico_legacy
-- ⚠️  COLUNA ALTERADA: organizacao_id
-- LAB:  bigint|null|YES|2|int8
-- PROD: bigint|null|YES|null|int8
ALTER TABLE public.pedidos_compra_status_historico_legacy ALTER COLUMN organizacao_id TYPE bigint USING organizacao_id::bigint;

-- ALTERAÇÕES NA TABELA: termos_aceite
-- ⚠️  COLUNA ALTERADA: organizacao_id
-- LAB:  bigint|null|NO|2|int8
-- PROD: bigint|null|NO|null|int8
ALTER TABLE public.termos_aceite ALTER COLUMN organizacao_id TYPE bigint USING organizacao_id::bigint;

-- ALTERAÇÕES NA TABELA: termos_uso
-- ⚠️  COLUNA ALTERADA: organizacao_id
-- LAB:  bigint|null|YES|2|int8
-- PROD: bigint|null|YES|null|int8
ALTER TABLE public.termos_uso ALTER COLUMN organizacao_id TYPE bigint USING organizacao_id::bigint;

-- ALTERAÇÕES NA TABELA: variaveis_virtuais
-- ⚠️  COLUNA ALTERADA: organizacao_id
-- LAB:  bigint|null|YES|2|int8
-- PROD: bigint|null|YES|null|int8
ALTER TABLE public.variaveis_virtuais ALTER COLUMN organizacao_id TYPE bigint USING organizacao_id::bigint;
-- 
⚡ Comparando funções/RPCs...

-- FUNÇÕES/RPCs NO LAB QUE NÃO EXISTEM NO PROD (2):
-- ⚠️  Copie as funções do SQL Editor do Supabase LAB e aplique no PROD
-- FUNÇÃO FALTANDO: auto_confirm_user
-- FUNÇÃO FALTANDO: registrar_retirada_estoque

-- ================================================
-- FIM DO SCRIPT | Total de diferenças: 12
-- ================================================