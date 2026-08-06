-- ==============================================================================
-- SCHEMA DE REFERÊNCIA — BANCO DE DADOS SUPABASE
-- PetNexus White-Label Petshop (Multi-Tenant)
-- ==============================================================================
-- Este arquivo documenta a estrutura REAL do banco conforme está no Supabase.
-- Última atualização: 2026-08-04
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABELA: pet_shops (Empresas / Clínicas / PetShops = Tenants)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pet_shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tenant padrão
INSERT INTO public.pet_shops (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'PetNexus Matriz')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 2. TABELA: profiles (Extensão de auth.users — Tutores, Admins, Funcionários)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL DEFAULT 'Tutor',
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin', 'vet', 'groomer')),
    avatar_url TEXT,
    pet_shop_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. TABELA: pets (Animais vinculados aos Tutores)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    species VARCHAR(50) NOT NULL DEFAULT 'Cachorro',
    breed VARCHAR(100) DEFAULT 'Vira-lata',
    sex VARCHAR(20) DEFAULT 'Macho',
    birth_date DATE,
    weight DECIMAL(5,2),
    microchip VARCHAR(100),
    coat VARCHAR(100),
    color VARCHAR(100),
    is_neutered BOOLEAN DEFAULT false,
    allergies TEXT,
    medications TEXT,
    diseases TEXT,
    observations TEXT,
    photo_url TEXT,
    current_status VARCHAR(50) DEFAULT 'Em casa',
    client_id UUID NOT NULL,
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. TABELA: services (Catálogo de Serviços, Produtos e Pacotes)
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

-- ==============================================================================
-- 5. TABELA: service_history (Histórico legado de serviços realizados)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.service_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL,
    service_type VARCHAR(255) NOT NULL DEFAULT 'Banho & Tosa',
    service_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    employee_id UUID,
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. TABELA: appointments (Agendamentos dedicados)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    pet_id UUID NOT NULL,
    service_id UUID,
    service_type VARCHAR(255) NOT NULL DEFAULT 'Banho & Tosa',
    professional VARCHAR(255) DEFAULT 'Não atribuído',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'bloqueio')),
    price DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. TABELA: leads (Captação de Leads para Gestão Comercial)
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

-- ==============================================================================
-- 8. ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_pet_shop ON public.profiles(pet_shop_id);
CREATE INDEX IF NOT EXISTS idx_pets_client ON public.pets(client_id);
CREATE INDEX IF NOT EXISTS idx_pets_pet_shop ON public.pets(pet_shop_id);
CREATE INDEX IF NOT EXISTS idx_services_pet_shop ON public.services(pet_shop_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_appointments_pet_shop ON public.appointments(pet_shop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_leads_pet_shop ON public.leads(pet_shop_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
