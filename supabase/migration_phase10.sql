-- ==============================================================================
-- MIGRATION PHASE 10 — Escala de Equipe (Staff Scheduling / Capacidade)
-- ==============================================================================
-- Cada linha define o turno de um membro da equipe (profiles.id com um cargo
-- de staff) em um dia da semana (0=domingo .. 6=sábado). Sem linha para um dia
-- = a pessoa não trabalha naquele dia. Usado por lib/server/staff.ts para
-- impedir (ou avisar, com override "force") que o admin agende um profissional
-- fora do horário/dia em que ele está escalado.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    staff_id UUID NOT NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL DEFAULT '09:00',
    end_time TIME NOT NULL DEFAULT '18:00',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(staff_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff ON public.staff_schedules(staff_id);

-- Nenhuma consulta direta do navegador toca essa tabela (só via app/api/*
-- com service_role) — RLS habilitado sem políticas, mesmo padrão da
-- migration_phase7.sql.
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
