-- ==============================================================================
-- MIGRATION PHASE 16 — Notificações: rastreio de autor para evitar auto-notificação
-- ==============================================================================
-- Problema: os "alertas ao vivo" da equipe (GET /api/notifications) são
-- recalculados a partir do status ATUAL de cada agendamento a cada requisição,
-- sem saber quem fez a última alteração. Como o cargo 'admin' está incluído em
-- todo role_target, o próprio usuário que muda o status vê imediatamente um
-- alerta sobre a ação que ele mesmo acabou de fazer.
--
-- Esta migration adiciona appointments.updated_by (quem criou/alterou por
-- último o agendamento) para permitir filtrar esses alertas por autor.
-- ==============================================================================

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS updated_by UUID;

CREATE INDEX IF NOT EXISTS idx_appointments_updated_by
  ON public.appointments(updated_by);
