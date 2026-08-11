-- ==============================================================================
-- MIGRAÇÃO: Controle de estoque no PDV, fotos reais de pet e pacotes por tutor
-- PetNexus White-Label Petshop
-- Data: 2026-08-11
-- ==============================================================================
-- INSTRUÇÕES: Copie e cole este script inteiro no Supabase SQL Editor e execute.
-- Ele NÃO altera dados existentes, apenas adiciona o que falta (idempotente).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ESTOQUE: coluna stock_quantity em services + função de baixa atômica
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'stock_quantity'
    ) THEN
        ALTER TABLE public.services ADD COLUMN stock_quantity INTEGER;
    END IF;

    -- Créditos concedidos por um item de categoria 'package' (ex.: 4 banhos) e validade em dias
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'package_credits'
    ) THEN
        ALTER TABLE public.services ADD COLUMN package_credits INTEGER;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'package_validity_days'
    ) THEN
        ALTER TABLE public.services ADD COLUMN package_validity_days INTEGER;
    END IF;
END $$;

-- stock_quantity NULL = item sem controle de estoque (ex.: serviços, pacotes).
-- A função abaixo faz a baixa de forma atômica: só decrementa (e só permite a
-- venda) se ainda houver estoque suficiente NA HORA da escrita, evitando que
-- duas vendas simultâneas vendam a mesma última unidade duas vezes.
CREATE OR REPLACE FUNCTION public.decrement_stock(item_id UUID, qty INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    updated_rows INT;
BEGIN
    UPDATE public.services
    SET stock_quantity = stock_quantity - qty
    WHERE id = item_id
      AND (stock_quantity IS NULL OR stock_quantity >= qty);

    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows > 0;
END;
$$;

-- ==============================================================================
-- 2. FOTOS REAIS DE PET: bucket público no Supabase Storage
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-photos', 'pet-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Pet photos: leitura publica" ON storage.objects;
CREATE POLICY "Pet photos: leitura publica" ON storage.objects
    FOR SELECT USING (bucket_id = 'pet-photos');

DROP POLICY IF EXISTS "Pet photos: upload por authenticated" ON storage.objects;
CREATE POLICY "Pet photos: upload por authenticated" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pet-photos');

DROP POLICY IF EXISTS "Pet photos: atualizacao por authenticated" ON storage.objects;
CREATE POLICY "Pet photos: atualizacao por authenticated" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'pet-photos');

DROP POLICY IF EXISTS "Pet photos: exclusao por authenticated" ON storage.objects;
CREATE POLICY "Pet photos: exclusao por authenticated" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'pet-photos');

-- ==============================================================================
-- 3. PACOTES/ASSINATURAS REAIS — vinculados ao TUTOR (client_id), não ao pet.
-- Um pacote comprado pode ser usado em qualquer pet daquele tutor.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.client_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    client_id UUID NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    package_name VARCHAR(255) NOT NULL,
    total_credits INTEGER NOT NULL DEFAULT 0,
    used_credits INTEGER NOT NULL DEFAULT 0,
    price_paid DECIMAL(10,2) DEFAULT 0.00,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'expirado', 'cancelado', 'finalizado')),
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_client_packages_client ON public.client_packages(client_id);
CREATE INDEX IF NOT EXISTS idx_client_packages_status ON public.client_packages(status);

ALTER TABLE public.client_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ClientPackages: leitura por authenticated" ON public.client_packages;
CREATE POLICY "ClientPackages: leitura por authenticated" ON public.client_packages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "ClientPackages: insercao por authenticated" ON public.client_packages;
CREATE POLICY "ClientPackages: insercao por authenticated" ON public.client_packages FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "ClientPackages: atualizacao por authenticated" ON public.client_packages;
CREATE POLICY "ClientPackages: atualizacao por authenticated" ON public.client_packages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Uso de 1 crédito de forma atômica (evita corrida entre dois agendamentos simultâneos
-- consumindo o último crédito do mesmo pacote); marca como 'finalizado' ao zerar.
CREATE OR REPLACE FUNCTION public.use_package_credit(package_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    updated_rows INT;
BEGIN
    UPDATE public.client_packages
    SET used_credits = used_credits + 1,
        status = CASE WHEN used_credits + 1 >= total_credits THEN 'finalizado' ELSE status END
    WHERE id = package_id
      AND status = 'ativo'
      AND used_credits < total_credits
      AND (expires_at IS NULL OR expires_at > now());

    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows > 0;
END;
$$;

-- Vincula um agendamento ao pacote usado para pagá-lo (quando aplicável)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'paid_via_package_id'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN paid_via_package_id UUID REFERENCES public.client_packages(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ==============================================================================
-- RESULTADO ESPERADO:
-- ✅ services.stock_quantity / package_credits / package_validity_days (NOVO)
-- ✅ decrement_stock() — baixa atômica de estoque no checkout do PDV
-- ✅ bucket 'pet-photos' no Storage, público para leitura
-- ✅ client_packages (NOVO) — pacotes comprados por tutor, com créditos
-- ✅ use_package_credit() — consumo atômico de 1 crédito de pacote
-- ==============================================================================
