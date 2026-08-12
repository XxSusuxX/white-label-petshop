-- ==============================================================================
-- MIGRATION PHASE 15 — Integridade: vocabulário de cargos + agendamento atômico
-- ==============================================================================
-- 1. Alinha o CHECK de profiles.role com os cargos realmente usados pelo código
--    (PT-BR e EN). O CHECK antigo só aceitava ('client','admin','vet','groomer'),
--    então inserts de 'dono', 'veterinario', 'banhista_tosador', 'recepcionista',
--    'tutor' etc. falhavam ou dependiam de ajustes fora das migrations.
-- 2. book_appointment(): agendamento ATÔMICO — checagem de conflito + consumo de
--    crédito de pacote + INSERT na mesma transação. Corrige a perda de crédito
--    quando o insert falhava (o crédito era consumido antes) e a corrida entre
--    dois agendamentos simultâneos no mesmo horário (advisory lock + re-check).
-- 3. refund_package_credit(): estorno de 1 crédito (rollback manual/compensação).
-- 4. Índice para checagem de conflito por profissional.
-- ==============================================================================

-- ---------------------------------------------------------------------------
-- 1. Vocabulário de cargos (profiles.role)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'client', 'tutor',
    'admin', 'dono',
    'vet', 'veterinarian', 'veterinario',
    'groomer', 'bather', 'banhista_tosador',
    'receptionist', 'recepcionista',
    'delivery', 'entregador',
    'employee', 'funcionario', 'auxiliar'
  ));

-- ---------------------------------------------------------------------------
-- 2. RPC de agendamento atômico
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_pet_id UUID,
  p_pet_shop_id UUID,
  p_service_id UUID,
  p_service_type TEXT,
  p_scheduled_at TIMESTAMPTZ,
  p_professional TEXT,
  p_price NUMERIC,
  p_notes TEXT DEFAULT '',
  p_address TEXT DEFAULT '',
  p_package_id UUID DEFAULT NULL,
  p_recurring_booking_id UUID DEFAULT NULL,
  p_exclude_appointment_id UUID DEFAULT NULL,
  p_force BOOLEAN DEFAULT false
) RETURNS public.appointments
LANGUAGE plpgsql
AS $$
DECLARE
  v_duration INT;
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_conflict public.appointments;
  v_new public.appointments;
  v_lock_key INT;
BEGIN
  -- Duração do serviço (para calcular o fim do agendamento)
  IF p_service_id IS NOT NULL THEN
    SELECT COALESCE(duration_minutes, 60) INTO v_duration
    FROM public.services
    WHERE id = p_service_id;
    IF NOT FOUND THEN
      v_duration := 60;
    END IF;
  ELSE
    v_duration := 60;
  END IF;

  v_start := p_scheduled_at;
  v_end := v_start + make_interval(mins => v_duration);

  -- Serializa agendamentos concorrentes no mesmo tenant + minuto de início.
  -- Fecha a janela entre o check e o insert (dois pedidos simultâneos).
  v_lock_key := hashtext(p_pet_shop_id::text || '|' ||
                          to_char(v_start AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI'));
  PERFORM pg_advisory_xact_lock(v_lock_key);

  IF NOT p_force THEN
    -- Re-checagem de conflito DENTRO da transação, com overlap real por duração.
    -- Regra idêntica à do app (lib/server/booking.ts): profissionais diferentes
    -- não conflitam; agendamentos sem profissional ("Não atribuído") conflitam
    -- no petshop inteiro.
    SELECT a.* INTO v_conflict
    FROM public.appointments a
    LEFT JOIN public.services s ON s.id = a.service_id
    WHERE a.pet_shop_id = p_pet_shop_id
      AND a.status NOT IN ('cancelado', 'bloqueio')
      AND a.scheduled_at < v_end
      AND a.scheduled_at + make_interval(mins => COALESCE(s.duration_minutes, 60)) > v_start
      AND (
        (p_professional IS NULL OR p_professional = 'Não atribuído')
        OR (a.professional IS NULL OR a.professional = 'Não atribuído')
        OR (a.professional = p_professional)
      )
      AND (p_exclude_appointment_id IS NULL OR a.id <> p_exclude_appointment_id)
    ORDER BY a.scheduled_at
    LIMIT 1;

    IF v_conflict.id IS NOT NULL THEN
      RAISE EXCEPTION 'horario_ocupado';
    END IF;
  END IF;

  -- Consome o crédito do pacote na MESMA transação: se o insert abaixo falhar,
  -- a transação inteira é revertida e o crédito não se perde.
  IF p_package_id IS NOT NULL THEN
    IF NOT public.use_package_credit(p_package_id) THEN
      RAISE EXCEPTION 'pacote_sem_credito';
    END IF;
  END IF;

  INSERT INTO public.appointments (
    pet_id, pet_shop_id, service_id, service_type, scheduled_at,
    professional, price, status, notes, address,
    paid_via_package_id, recurring_booking_id
  ) VALUES (
    p_pet_id, p_pet_shop_id, p_service_id, p_service_type, v_start,
    COALESCE(NULLIF(p_professional, ''), 'Não atribuído'), p_price, 'agendado',
    p_notes, p_address, p_package_id, p_recurring_booking_id
  )
  RETURNING * INTO v_new;

  RETURN v_new;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Estorno de crédito de pacote (compensação/rollback manual)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refund_package_credit(package_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  updated_rows INT;
BEGIN
  UPDATE public.client_packages
  SET used_credits = GREATEST(used_credits - 1, 0),
      status = CASE WHEN status = 'finalizado' THEN 'ativo' ELSE status END
  WHERE id = package_id;
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Índice para checagem de conflito por profissional
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_professional_schedule
  ON public.appointments(pet_shop_id, professional, scheduled_at);
