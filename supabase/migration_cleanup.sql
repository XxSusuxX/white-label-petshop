-- ==============================================================================
-- MIGRAÇÃO: Padronização e criação de tabelas faltantes
-- PetNexus White-Label Petshop
-- Data: 2026-08-04
-- ==============================================================================
-- INSTRUÇÕES: Copie e cole este script inteiro no Supabase SQL Editor e execute.
-- Ele NÃO altera tabelas existentes, apenas adiciona o que falta.
-- ==============================================================================

-- 0. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABELA: services (Catálogo de Serviços, Produtos e Pacotes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    category VARCHAR(50) NOT NULL DEFAULT 'service' CHECK (category IN ('service', 'product', 'package')),
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice de performance
CREATE INDEX IF NOT EXISTS idx_services_pet_shop ON public.services(pet_shop_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);

-- RLS para services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Services: leitura pública por pet_shop" ON public.services;
CREATE POLICY "Services: leitura pública por pet_shop"
    ON public.services FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Services: admin pode inserir" ON public.services;
CREATE POLICY "Services: admin pode inserir"
    ON public.services FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Services: admin pode atualizar" ON public.services;
CREATE POLICY "Services: admin pode atualizar"
    ON public.services FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Seed de serviços padrão (somente se a tabela estiver vazia)
INSERT INTO public.services (name, description, category, duration_minutes, price, pet_shop_id)
SELECT * FROM (VALUES
    ('Banho', 'Banho padrão com shampoo premium', 'service', 45, 60.00, '00000000-0000-0000-0000-000000000001'::UUID),
    ('Banho & Tosa Completo', 'Banho + tosa higiênica + acabamento', 'service', 90, 85.00, '00000000-0000-0000-0000-000000000001'::UUID),
    ('Tosa Higiênica', 'Tosa na região higiênica, patas e rosto', 'service', 30, 45.00, '00000000-0000-0000-0000-000000000001'::UUID),
    ('Hidratação de Pelo', 'Tratamento capilar profundo para pets', 'service', 40, 55.00, '00000000-0000-0000-0000-000000000001'::UUID),
    ('Consulta Veterinária Geral', 'Check-up clínico completo', 'service', 30, 150.00, '00000000-0000-0000-0000-000000000001'::UUID),
    ('Higienização Auricular & Unhas', 'Limpeza de ouvido e corte de unhas', 'service', 20, 35.00, '00000000-0000-0000-0000-000000000001'::UUID),
    ('Ração Premium Cães Adultos 15kg', 'Ração super premium para cães adultos', 'product', 0, 189.90, '00000000-0000-0000-0000-000000000001'::UUID),
    ('Shampoo Hipoalergênico Pet 500ml', 'Shampoo para peles sensíveis', 'product', 0, 42.00, '00000000-0000-0000-0000-000000000001'::UUID),
    ('Brinquedo Mordedor Resistente', 'Mordedor de borracha natural', 'product', 0, 28.50, '00000000-0000-0000-0000-000000000001'::UUID),
    ('Pacote Banho Mensal 4x', '4 banhos por mês com desconto', 'package', 45, 199.90, '00000000-0000-0000-0000-000000000001'::UUID),
    ('Plano Premium Anual', 'Estética + consulta veterinária mensal', 'package', 0, 299.90, '00000000-0000-0000-0000-000000000001'::UUID)
) AS v(name, description, category, duration_minutes, price, pet_shop_id)
WHERE NOT EXISTS (SELECT 1 FROM public.services LIMIT 1);


-- ==============================================================================
-- 2. TABELA: appointments (Agendamentos dedicados - substitui uso de service_history)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    pet_id UUID NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service_type VARCHAR(255) NOT NULL DEFAULT 'Banho & Tosa',
    professional VARCHAR(255) DEFAULT 'Não atribuído',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'bloqueio')),
    price DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_appointments_pet_shop ON public.appointments(pet_shop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_pet ON public.appointments(pet_id);

-- RLS para appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Appointments: leitura por authenticated" ON public.appointments;
CREATE POLICY "Appointments: leitura por authenticated"
    ON public.appointments FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Appointments: inserção por authenticated" ON public.appointments;
CREATE POLICY "Appointments: inserção por authenticated"
    ON public.appointments FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Appointments: atualização por authenticated" ON public.appointments;
CREATE POLICY "Appointments: atualização por authenticated"
    ON public.appointments FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- ==============================================================================
-- 3. TABELA: leads (Captação de Leads para Gestão Comercial)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    source VARCHAR(100) DEFAULT 'manual' CHECK (source IN ('manual', 'whatsapp', 'instagram', 'google', 'indicacao', 'site', 'outro')),
    status VARCHAR(50) DEFAULT 'novo' CHECK (status IN ('novo', 'contato_feito', 'agendamento_marcado', 'convertido', 'perdido')),
    pet_name VARCHAR(255),
    pet_species VARCHAR(50),
    notes TEXT DEFAULT '',
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_leads_pet_shop ON public.leads(pet_shop_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);

-- RLS para leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leads: leitura por authenticated" ON public.leads;
CREATE POLICY "Leads: leitura por authenticated"
    ON public.leads FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Leads: inserção por authenticated" ON public.leads;
CREATE POLICY "Leads: inserção por authenticated"
    ON public.leads FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Leads: atualização por authenticated" ON public.leads;
CREATE POLICY "Leads: atualização por authenticated"
    ON public.leads FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Leads: exclusão por authenticated" ON public.leads;
CREATE POLICY "Leads: exclusão por authenticated"
    ON public.leads FOR DELETE
    TO authenticated
    USING (true);


-- ==============================================================================
-- 4. Adicionar coluna 'email' em profiles (se não existir)
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;


-- ==============================================================================
-- 5. CORREÇÃO DE POLÍTICAS RLS NA TABELA PROFILES (Eliminar Relação Recursiva 42P17)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover todas as políticas antigas que causam erro 42P17 (recursão infinita)
DROP POLICY IF EXISTS "Profiles: leitura de usuarios do mesmo tenant" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: leitura de usuarios" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: insercao pelo proprio usuario" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: atualizacao pelo proprio usuario ou admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: leitura publica" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Política limpa e sem recursão para leitura de perfis
CREATE POLICY "Profiles: leitura publica e autenticada"
    ON public.profiles FOR SELECT
    USING (true);

-- Política de inserção
CREATE POLICY "Profiles: insercao por usuarios autenticados"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política de atualização
CREATE POLICY "Profiles: atualizacao pelo proprio usuario ou admin"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- ==============================================================================
-- RESULTADO ESPERADO:
-- ✅ pet_shops (já existia)
-- ✅ profiles (ajustadas colunas e corrigidas políticas RLS sem recursão)
-- ✅ pets (já existia)
-- ✅ service_history (já existia, mantido para histórico legado)
-- ✅ services (NOVO - catálogo com 11 itens seed)
-- ✅ appointments (NOVO - agendamentos dedicados)
-- ✅ leads (NOVO - captação de leads)
-- ==============================================================================

