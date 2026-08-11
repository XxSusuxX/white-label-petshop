-- ==============================================================================
-- MIGRAÇÃO: Configuração de conexão do WhatsApp (Evolution API / Oficial / Twilio)
-- PetNexus White-Label Petshop
-- Data: 2026-08-11
-- ==============================================================================
-- INSTRUÇÕES: Copie e cole este script inteiro no Supabase SQL Editor e execute.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.whatsapp_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL UNIQUE DEFAULT '00000000-0000-0000-0000-000000000001',
    provider VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (provider IN ('none', 'evolution', 'official', 'twilio')),
    is_connected BOOLEAN DEFAULT false,
    connected_number VARCHAR(50) DEFAULT '',
    last_checked_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT DEFAULT '',

    -- Evolution API (instância self-hosted, baseada em Baileys/WhatsApp Web)
    evolution_api_url TEXT DEFAULT '',
    evolution_api_key TEXT DEFAULT '',
    evolution_instance_name VARCHAR(100) DEFAULT '',

    -- WhatsApp Cloud API oficial (Meta)
    official_phone_number_id VARCHAR(100) DEFAULT '',
    official_waba_id VARCHAR(100) DEFAULT '',
    official_access_token TEXT DEFAULT '',

    -- Twilio WhatsApp API
    twilio_account_sid VARCHAR(100) DEFAULT '',
    twilio_auth_token TEXT DEFAULT '',
    twilio_whatsapp_number VARCHAR(50) DEFAULT '',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "WhatsappConfig: leitura por authenticated" ON public.whatsapp_config;
CREATE POLICY "WhatsappConfig: leitura por authenticated" ON public.whatsapp_config FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "WhatsappConfig: inserção por authenticated" ON public.whatsapp_config;
CREATE POLICY "WhatsappConfig: inserção por authenticated" ON public.whatsapp_config FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "WhatsappConfig: atualização por authenticated" ON public.whatsapp_config;
CREATE POLICY "WhatsappConfig: atualização por authenticated" ON public.whatsapp_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- RESULTADO ESPERADO:
-- ✅ whatsapp_config (NOVO — guarda credenciais de Evolution API / WhatsApp Cloud
--    API oficial / Twilio para o petshop. Os tokens/keys nunca são devolvidos em
--    texto puro pela API do Next.js — são mascarados na leitura.)
-- ==============================================================================
