-- ==============================================================================
-- MIGRATION PHASE 8 — Fecha o loop de automação de WhatsApp (gatilhos por tempo)
-- ==============================================================================
-- Colunas de "já notificado" para cada automação baseada em tempo, evitando
-- reenviar a mesma mensagem em execuções repetidas do cron externo que chama
-- POST /api/admin/automations/run. Cada uma guarda quando (ou qual ano/ciclo)
-- a mensagem já foi disparada.
-- ==============================================================================

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.pets
    ADD COLUMN IF NOT EXISTS last_birthday_greeted_year INT;

ALTER TABLE public.client_packages
    ADD COLUMN IF NOT EXISTS low_credit_notified_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS last_winback_sent_at TIMESTAMP WITH TIME ZONE;

-- Número (com DDI/DDD, ex: 5511999998888) para onde o resumo_diario e outros
-- avisos operacionais são enviados — normalmente o WhatsApp pessoal do gestor,
-- diferente do número conectado como instância de disparo.
ALTER TABLE public.whatsapp_config
    ADD COLUMN IF NOT EXISTS admin_notify_phone TEXT;

ALTER TABLE public.whatsapp_config
    ADD COLUMN IF NOT EXISTS resumo_diario_last_sent_date DATE;
