-- ==============================================================================
-- MIGRATION PHASE 9 — Agendamentos Recorrentes
-- ==============================================================================
-- recurring_bookings guarda o "molde" de uma recorrência (serviço, profissional,
-- intervalo em dias). Cada agendamento gerado por ela referencia essa linha via
-- appointments.recurring_booking_id. Quando um agendamento da série é marcado
-- como "concluido" (em app/api/admin/agenda PATCH), o próximo é criado
-- automaticamente por lib/server/recurring.ts, respeitando a checagem de
-- conflito de horário.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.recurring_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    pet_id UUID NOT NULL,
    service_id UUID,
    service_type VARCHAR(255) NOT NULL,
    professional VARCHAR(255) DEFAULT 'Não atribuído',
    price DECIMAL(10,2) DEFAULT 0.00,
    address TEXT DEFAULT '',
    interval_days INT NOT NULL DEFAULT 30 CHECK (interval_days > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS recurring_booking_id UUID REFERENCES public.recurring_bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recurring_bookings_pet ON public.recurring_bookings(pet_id);
CREATE INDEX IF NOT EXISTS idx_appointments_recurring_booking ON public.appointments(recurring_booking_id);

-- Nenhuma consulta direta do navegador toca essa tabela (só via app/api/*
-- com service_role) — RLS habilitado sem políticas, mesmo padrão da
-- migration_phase7.sql.
ALTER TABLE public.recurring_bookings ENABLE ROW LEVEL SECURITY;
