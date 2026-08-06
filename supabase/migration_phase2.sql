-- ==============================================================================
-- MIGRAÇÃO: Notificações do cliente + Fluxo de Caixa (abertura/movimentação/fechamento)
-- PetNexus White-Label Petshop
-- Data: 2026-08-06
-- ==============================================================================
-- INSTRUÇÕES: Copie e cole este script inteiro no Supabase SQL Editor e execute.
-- Ele NÃO altera tabelas existentes, apenas adiciona o que falta (idempotente).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 0. Adicionar coluna 'address' em appointments (endereço de coleta do agendamento)
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'address'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN address TEXT DEFAULT '';
    END IF;
END $$;

-- ==============================================================================
-- 1. TABELA: notifications (Notificações do tutor/cliente)
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

CREATE INDEX IF NOT EXISTS idx_notifications_client ON public.notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Notifications: leitura por authenticated" ON public.notifications;
CREATE POLICY "Notifications: leitura por authenticated" ON public.notifications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Notifications: inserção por authenticated" ON public.notifications;
CREATE POLICY "Notifications: inserção por authenticated" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Notifications: atualização por authenticated" ON public.notifications;
CREATE POLICY "Notifications: atualização por authenticated" ON public.notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 2. TABELAS: cash_sessions / cash_movements (Fluxo de Caixa)
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

CREATE INDEX IF NOT EXISTS idx_cash_sessions_pet_shop ON public.cash_sessions(pet_shop_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON public.cash_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON public.cash_movements(cash_session_id);

ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CashSessions: leitura por authenticated" ON public.cash_sessions;
CREATE POLICY "CashSessions: leitura por authenticated" ON public.cash_sessions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "CashSessions: inserção por authenticated" ON public.cash_sessions;
CREATE POLICY "CashSessions: inserção por authenticated" ON public.cash_sessions FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "CashSessions: atualização por authenticated" ON public.cash_sessions;
CREATE POLICY "CashSessions: atualização por authenticated" ON public.cash_sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CashMovements: leitura por authenticated" ON public.cash_movements;
CREATE POLICY "CashMovements: leitura por authenticated" ON public.cash_movements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "CashMovements: inserção por authenticated" ON public.cash_movements;
CREATE POLICY "CashMovements: inserção por authenticated" ON public.cash_movements FOR INSERT TO authenticated WITH CHECK (true);

-- ==============================================================================
-- RESULTADO ESPERADO:
-- ✅ notifications (NOVO - central de notificações do tutor)
-- ✅ cash_sessions / cash_movements (NOVO - abertura, movimentação e fechamento de caixa)
-- ==============================================================================
