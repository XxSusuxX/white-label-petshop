-- ==============================================================================
-- MIGRATION PHASE 14 — Multi-Tenancy: slug dos pet shops + índices de tenant
-- ==============================================================================
-- Habilita o white-label de verdade: cada pet shop passa a ter um slug único
-- (usado como subdomínio, ex.: petshop-a.meusistema.com). O app resolve o tenant
-- da requisição pelo subdomínio do host (rotas públicas de agendamento) ou pelo
-- pet_shop_id do perfil do usuário logado (rotas autenticadas). Nenhum dado mais
-- fica preso ao pet_shop_id fixo '00000...-0001' definido no código.
-- ==============================================================================

-- 1. Coluna slug em pet_shops
ALTER TABLE public.pet_shops ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- 2. Backfill: gera um slug a partir do nome dos pet shops já existentes
UPDATE public.pet_shops
SET slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- 3. Corrige slugs duplicados adicionando um sufixo curto do id (garante unicidade)
WITH dupes AS (
  SELECT id,
         row_number() OVER (PARTITION BY slug ORDER BY created_at) AS rn
  FROM public.pet_shops
  WHERE slug IS NOT NULL AND slug <> ''
)
UPDATE public.pet_shops p
SET slug = p.slug || '-' || substr(replace(p.id::text, '-', ''), 1, 6)
FROM dupes d
WHERE d.id = p.id AND d.rn > 1;

-- 4. Slug estável e amigável para o tenant padrão
UPDATE public.pet_shops
SET slug = 'matriz'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 5. Garantir unicidade (índice único parcial)
CREATE UNIQUE INDEX IF NOT EXISTS pet_shops_slug_key
  ON public.pet_shops(slug)
  WHERE slug IS NOT NULL;

-- 6. Índices para as consultas por tenant nas tabelas mais movimentadas
CREATE INDEX IF NOT EXISTS idx_profiles_pet_shop ON public.profiles(pet_shop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_pet_shop_schedule
  ON public.appointments(pet_shop_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_pets_pet_shop ON public.pets(pet_shop_id);
CREATE INDEX IF NOT EXISTS idx_services_pet_shop ON public.services(pet_shop_id);
