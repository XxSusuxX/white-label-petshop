-- ==============================================================================
-- MIGRAÇÃO: Novas tabelas para funcionalidades existentes (PDV, Prontuário, WhatsApp)
-- PetNexus White-Label Petshop
-- Data: 2026-08-06
-- ==============================================================================
-- INSTRUÇÕES: Copie e cole este script inteiro no Supabase SQL Editor e execute.
-- Ele NÃO altera tabelas existentes, apenas adiciona o que falta (idempotente).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABELAS: sales / sale_items (Checkout do PDV)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    client_id UUID,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'dinheiro',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_pet_shop ON public.sales(pet_shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_client ON public.sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sales: leitura por authenticated" ON public.sales;
CREATE POLICY "Sales: leitura por authenticated" ON public.sales FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Sales: inserção por authenticated" ON public.sales;
CREATE POLICY "Sales: inserção por authenticated" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "SaleItems: leitura por authenticated" ON public.sale_items;
CREATE POLICY "SaleItems: leitura por authenticated" ON public.sale_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "SaleItems: inserção por authenticated" ON public.sale_items;
CREATE POLICY "SaleItems: inserção por authenticated" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (true);

-- ==============================================================================
-- 2. TABELA: medical_records (Consultas do Prontuário Veterinário)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    pet_id UUID NOT NULL,
    vet_name VARCHAR(255) DEFAULT '',
    diagnosis TEXT DEFAULT '',
    treatment TEXT DEFAULT '',
    prescription TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_medical_records_pet ON public.medical_records(pet_id);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "MedicalRecords: leitura por authenticated" ON public.medical_records;
CREATE POLICY "MedicalRecords: leitura por authenticated" ON public.medical_records FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "MedicalRecords: inserção por authenticated" ON public.medical_records;
CREATE POLICY "MedicalRecords: inserção por authenticated" ON public.medical_records FOR INSERT TO authenticated WITH CHECK (true);

-- ==============================================================================
-- 3. TABELA: vaccine_records (Carteira de Vacinação)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vaccine_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    pet_id UUID NOT NULL,
    vaccine_name VARCHAR(255) NOT NULL,
    applied_at DATE,
    next_due_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vaccine_records_pet ON public.vaccine_records(pet_id);

ALTER TABLE public.vaccine_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "VaccineRecords: leitura por authenticated" ON public.vaccine_records;
CREATE POLICY "VaccineRecords: leitura por authenticated" ON public.vaccine_records FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "VaccineRecords: inserção por authenticated" ON public.vaccine_records;
CREATE POLICY "VaccineRecords: inserção por authenticated" ON public.vaccine_records FOR INSERT TO authenticated WITH CHECK (true);

-- ==============================================================================
-- 4. TABELA: weight_logs (Histórico de Peso)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.weight_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_pet ON public.weight_logs(pet_id);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "WeightLogs: leitura por authenticated" ON public.weight_logs;
CREATE POLICY "WeightLogs: leitura por authenticated" ON public.weight_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "WeightLogs: inserção por authenticated" ON public.weight_logs;
CREATE POLICY "WeightLogs: inserção por authenticated" ON public.weight_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ==============================================================================
-- 5. TABELA: automation_rules (Regras de Automação do WhatsApp)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    rule_key VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT '',
    enabled BOOLEAN DEFAULT true,
    message_template TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(pet_shop_id, rule_key)
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "AutomationRules: leitura por authenticated" ON public.automation_rules;
CREATE POLICY "AutomationRules: leitura por authenticated" ON public.automation_rules FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "AutomationRules: inserção por authenticated" ON public.automation_rules;
CREATE POLICY "AutomationRules: inserção por authenticated" ON public.automation_rules FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "AutomationRules: atualização por authenticated" ON public.automation_rules;
CREATE POLICY "AutomationRules: atualização por authenticated" ON public.automation_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- RESULTADO ESPERADO:
-- ✅ sales / sale_items (NOVO - persistência de vendas do PDV)
-- ✅ medical_records (NOVO - consultas do prontuário veterinário)
-- ✅ vaccine_records (NOVO - carteira de vacinação)
-- ✅ weight_logs (NOVO - histórico de peso)
-- ✅ automation_rules (NOVO - regras de automação do WhatsApp)
-- ==============================================================================
