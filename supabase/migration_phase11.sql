-- ==============================================================================
-- MIGRATION PHASE 11 — Horário de Funcionamento & Datas Bloqueadas
-- ==============================================================================
-- business_hours: um registro por dia da semana (0=domingo .. 6=sábado) com o
-- horário de abertura/fechamento, se está fechado nesse dia, e o intervalo
-- entre horários oferecidos ao tutor. blocked_dates: fechamentos pontuais
-- (feriados, eventos). Ambos alimentam a geração dinâmica de horários em
-- lib/server/business-hours.ts, usada por GET /api/appointments/availability
-- — substitui a lista fixa de horários que existia antes no front-end do
-- cliente (TIME_SLOTS).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TIME NOT NULL DEFAULT '09:00',
    close_time TIME NOT NULL DEFAULT '18:00',
    is_closed BOOLEAN NOT NULL DEFAULT false,
    slot_interval_minutes INT NOT NULL DEFAULT 60 CHECK (slot_interval_minutes > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(pet_shop_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS public.blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    blocked_date DATE NOT NULL,
    reason TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(pet_shop_id, blocked_date)
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON public.blocked_dates(blocked_date);

-- Nenhuma consulta direta do navegador toca essas tabelas (só via app/api/*
-- com service_role) — RLS habilitado sem políticas, mesmo padrão da
-- migration_phase7.sql.
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
