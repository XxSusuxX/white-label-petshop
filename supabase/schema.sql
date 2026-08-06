-- ==============================================================================
-- SCHEMA DE REFERÊNCIA — BANCO DE DADOS SUPABASE
-- PetNexus White-Label Petshop (Multi-Tenant)
-- ==============================================================================
-- Este arquivo documenta a estrutura REAL do banco conforme está no Supabase.
-- Última atualização: 2026-08-06
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
    address TEXT DEFAULT '',
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
-- 8. TABELAS: sales / sale_items (Checkout do PDV)
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

-- ==============================================================================
-- 9. TABELA: medical_records (Consultas do Prontuário Veterinário)
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

-- ==============================================================================
-- 10. TABELA: vaccine_records (Carteira de Vacinação)
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

-- ==============================================================================
-- 11. TABELA: weight_logs (Histórico de Peso)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.weight_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 12. TABELA: automation_rules (Regras de Automação do WhatsApp)
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

-- ==============================================================================
-- 13. TABELA: notifications (Notificações do tutor/cliente)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    client_id UUID NOT NULL,
    appointment_id UUID,
    type VARCHAR(50) NOT NULL DEFAULT 'mensagem' CHECK (type IN (
        'agendamento_criado', 'agendamento_confirmado', 'agendamento_alterado',
        'agendamento_cancelado', 'lembrete', 'mensagem'
    )),
    title VARCHAR(255) NOT NULL,
    body TEXT DEFAULT '',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 14. TABELAS: cash_sessions / cash_movements (Fluxo de Caixa)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    opened_by UUID,
    opened_by_name VARCHAR(255) DEFAULT '',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    opening_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    closed_by UUID,
    closed_by_name VARCHAR(255) DEFAULT '',
    closed_at TIMESTAMP WITH TIME ZONE,
    expected_amount DECIMAL(10,2),
    counted_amount DECIMAL(10,2),
    difference_amount DECIMAL(10,2),
    status VARCHAR(20) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
    notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.cash_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cash_session_id UUID NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'saida')),
    payment_method VARCHAR(50) DEFAULT '',
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255) DEFAULT '',
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 15. ÍNDICES DE PERFORMANCE
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
CREATE INDEX IF NOT EXISTS idx_sales_pet_shop ON public.sales(pet_shop_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_pet ON public.medical_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_vaccine_records_pet ON public.vaccine_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_pet ON public.weight_logs(pet_id);
CREATE INDEX IF NOT EXISTS idx_notifications_client ON public.notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_pet_shop ON public.cash_sessions(pet_shop_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON public.cash_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON public.cash_movements(cash_session_id);
