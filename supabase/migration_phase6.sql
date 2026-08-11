-- ==============================================================================
-- MIGRAÇÃO: Suporte à UazAPI como provedor de WhatsApp
-- PetNexus White-Label Petshop
-- Data: 2026-08-11
-- ==============================================================================
-- INSTRUÇÕES: Copie e cole este script inteiro no Supabase SQL Editor e execute.
-- ==============================================================================

-- Amplia os provedores aceitos para incluir 'uazapi'
ALTER TABLE public.whatsapp_config DROP CONSTRAINT IF EXISTS whatsapp_config_provider_check;
ALTER TABLE public.whatsapp_config ADD CONSTRAINT whatsapp_config_provider_check
    CHECK (provider IN ('none', 'evolution', 'official', 'twilio', 'uazapi'));

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'whatsapp_config' AND column_name = 'uazapi_api_url'
    ) THEN
        ALTER TABLE public.whatsapp_config ADD COLUMN uazapi_api_url TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'whatsapp_config' AND column_name = 'uazapi_token'
    ) THEN
        ALTER TABLE public.whatsapp_config ADD COLUMN uazapi_token TEXT DEFAULT '';
    END IF;
END $$;

-- ==============================================================================
-- RESULTADO ESPERADO:
-- ✅ whatsapp_config aceita provider = 'uazapi'
-- ✅ whatsapp_config.uazapi_api_url / uazapi_token (NOVO)
-- ==============================================================================
