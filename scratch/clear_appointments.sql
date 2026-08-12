-- Limpa todos os agendamentos do sistema (tabela public.appointments)
-- Também zera a referência em notifications, já que appointment_id ficaria orfao

BEGIN;

UPDATE public.notifications
SET appointment_id = NULL
WHERE appointment_id IS NOT NULL;

DELETE FROM public.appointments;

COMMIT;
