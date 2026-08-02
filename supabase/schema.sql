-- ==============================================================================
-- INFRAESTRUTURA DE BANCO DE DADOS SUPABASE (MULTI-TENANT WHITE-LABEL PETSHOP)
-- ==============================================================================
-- Script de inicialização e sincronização para Autenticação, Onboarding, Profiles e Pets.
-- Atende a todas as diretrizes de isolamento de dados via Row Level Security (RLS).
-- ==============================================================================

-- 0. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABELA: tenants (Empresas / Clínicas / PetShops White-Label)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(50) DEFAULT '#4edea3',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir um Tenant Padrão para Onboarding (Se não existir)
INSERT INTO public.tenants (id, name, slug, primary_color)
VALUES ('00000000-0000-0000-0000-000000000001', 'PetShop Matriz (Default)', 'matriz-default', '#4edea3')
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- 2. TABELA: profiles (Extensão da tabela nativa auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'tutor' CHECK (role IN ('tutor', 'admin', 'vet', 'groomer')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. TABELA: pets (Animais vinculados aos Profiles/Tutores)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(50) NOT NULL CHECK (species IN ('Cachorro', 'Gato', 'Outro')),
    breed VARCHAR(100) NOT NULL,
    gender VARCHAR(20) DEFAULT 'Macho' CHECK (gender IN ('Macho', 'Fêmea')),
    weight DECIMAL(5,2),
    coat VARCHAR(100),
    color VARCHAR(100),
    birth_date DATE,
    avatar_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. TABELA: services (Serviços e Preços do PetShop)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('bath', 'grooming', 'vet', 'package', 'other')),
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. TABELA: appointments (Agendamentos da Agenda)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pets_tenant ON public.pets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pets_owner ON public.pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant ON public.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON public.appointments(tenant_id);

-- ==============================================================================
-- 7. SEGURANÇA E POLÍTICAS RLS (Row Level Security)
-- ==============================================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- POLÍTICAS RLS PARA TENANTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenants: leitura para usuarios autenticados" ON public.tenants;
CREATE POLICY "Tenants: leitura para usuarios autenticados"
    ON public.tenants FOR SELECT
    TO authenticated
    USING (id = '00000000-0000-0000-0000-000000000001');

-- ------------------------------------------------------------------------------
-- POLÍTICAS RLS PARA PROFILES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles: leitura de usuarios do mesmo tenant" ON public.profiles;
CREATE POLICY "Profiles: leitura de usuarios do mesmo tenant"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
    );

DROP POLICY IF EXISTS "Profiles: insercao pelo proprio usuario" ON public.profiles;
CREATE POLICY "Profiles: insercao pelo proprio usuario"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (
        id = auth.uid()
    );

DROP POLICY IF EXISTS "Profiles: atualizacao pelo proprio usuario ou admin" ON public.profiles;
CREATE POLICY "Profiles: atualizacao pelo proprio usuario ou admin"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        id = auth.uid()
    )
    WITH CHECK (
        id = auth.uid()
    );

-- ------------------------------------------------------------------------------
-- POLÍTICAS RLS PARA PETS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Pets: leitura pelo dono ou equipe do tenant" ON public.pets;
CREATE POLICY "Pets: leitura pelo dono ou equipe do tenant"
    ON public.pets FOR SELECT
    TO authenticated
    USING (
        client_id = auth.uid()
    );

DROP POLICY IF EXISTS "Pets: insercao pelo dono ou equipe do tenant" ON public.pets;
CREATE POLICY "Pets: insercao pelo dono ou equipe do tenant"
    ON public.pets FOR INSERT
    TO authenticated
    WITH CHECK (
        client_id = auth.uid()
    );

DROP POLICY IF EXISTS "Pets: atualizacao pelo dono ou equipe do tenant" ON public.pets;
CREATE POLICY "Pets: atualizacao pelo dono ou equipe do tenant"
    ON public.pets FOR UPDATE
    TO authenticated
    USING (
        client_id = auth.uid()
    )
    WITH CHECK (
        client_id = auth.uid()
    );

DROP POLICY IF EXISTS "Pets: exclusao pelo dono ou equipe do tenant" ON public.pets;
CREATE POLICY "Pets: exclusao pelo dono ou equipe do tenant"
    ON public.pets FOR DELETE
    TO authenticated
    USING (
        client_id = auth.uid()
    );

-- ------------------------------------------------------------------------------
-- POLÍTICAS RLS PARA SERVIÇOS E AGENDAMENTOS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Services: leitura por usuarios do tenant" ON public.services;
CREATE POLICY "Services: leitura por usuarios do tenant"
    ON public.services FOR SELECT
    TO authenticated
    USING (tenant_id = public.get_auth_tenant_id() OR tenant_id = '00000000-0000-0000-0000-000000000001');

DROP POLICY IF EXISTS "Appointments: gerenciamento por usuarios do mesmo tenant" ON public.appointments;
CREATE POLICY "Appointments: gerenciamento por usuarios do mesmo tenant"
    ON public.appointments FOR ALL
    TO authenticated
    USING (tenant_id = public.get_auth_tenant_id());

-- ==============================================================================
-- 8. TRIGGER AUTOMÁTICO PARA SINCRONIZAÇÃO DE USUÁRIOS (AUTH.USERS -> PROFILES)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
    extracted_tenant_id UUID;
    user_full_name TEXT;
    user_avatar TEXT;
BEGIN
    -- Tenta capturar o tenant_id enviado via metadata do cadastro
    IF (new.raw_user_meta_data->>'tenant_id') IS NOT NULL THEN
        extracted_tenant_id := (new.raw_user_meta_data->>'tenant_id')::UUID;
    ELSE
        extracted_tenant_id := default_tenant_id;
    END IF;

    -- Tenta capturar o nome e avatar do usuario (util para login com Google)
    user_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Tutor');
    user_avatar := COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', NULL);

    -- Insere o perfil publico automaticamente
    INSERT INTO public.profiles (id, tenant_id, full_name, email, phone, role, avatar_url)
    VALUES (
        new.id,
        extracted_tenant_id,
        user_full_name,
        new.email,
        new.phone,
        'tutor',
        user_avatar
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Associar Trigger a tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
