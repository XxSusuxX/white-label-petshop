-- ==============================================================================
-- MIGRATION PHASE 7 — Hardening de segurança (RLS)
-- ==============================================================================
-- Contexto: toda a aplicação acessa o banco via rotas server-side em app/api/*
-- usando o cliente com service_role (lib/supabase/admin.ts), que ignora RLS.
-- A ÚNICA leitura/escrita feita diretamente do navegador (com a anon key) é:
--   - public.profiles: leitura da própria linha (id = auth.uid()) em várias
--     páginas/menus, e upsert da própria linha em app/auth/register/page.tsx
--     (sempre com role fixo "client").
--   - storage.objects no bucket pet-photos (já possui políticas próprias,
--     criadas na migration_phase5.sql — não alteradas aqui).
-- Nenhuma outra tabela é consultada diretamente do navegador.
--
-- Antes desta migration, várias tabelas tinham políticas "USING (true) TO
-- authenticated", ou seja: qualquer usuário logado (inclusive um tutor comum)
-- podia ler/escrever, via anon key direto no REST do Supabase, dados de TODOS
-- os clientes — incluindo appointments, sales, medical_records, cash_movements
-- e até os segredos de integração em whatsapp_config. Além disso, pets,
-- pet_shops e service_history nunca tiveram RLS habilitado, ou seja, eram
-- acessíveis publicamente mesmo sem login.
--
-- Esta migration:
--   1. Restringe profiles: cada usuário só lê/atualiza a própria linha, e não
--      pode alterar o próprio "role" nem "pet_shop_id" via update direto.
--   2. Habilita RLS (sem nenhuma política) em pets, pet_shops e
--      service_history, que nunca tiveram RLS.
--   3. Remove as políticas "USING (true)" das demais tabelas, mantendo RLS
--      habilitado e sem políticas — nega acesso a anon/authenticated e deixa
--      o acesso restrito ao service_role usado pelas rotas server-side.
-- ==============================================================================


-- ------------------------------------------------------------------------------
-- 1. PROFILES — leitura/escrita restrita à própria linha, sem auto-promoção de role
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles: leitura publica e autenticada" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: insercao por usuarios autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: atualizacao pelo proprio usuario ou admin" ON public.profiles;

CREATE POLICY "Profiles: leitura da propria linha"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Profiles: insercao da propria linha como cliente"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid() AND role = 'client');

CREATE POLICY "Profiles: atualizacao da propria linha sem trocar role"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = 'client');


-- ------------------------------------------------------------------------------
-- 2. TABELAS SEM RLS ATÉ AGORA — habilita RLS sem nenhuma política (nega tudo
--    para anon/authenticated; service_role continua com acesso total)
-- ------------------------------------------------------------------------------
ALTER TABLE public.pet_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------------------------
-- 3. TABELAS COM POLÍTICAS "USING (true)" — remove as políticas permissivas.
--    RLS permanece habilitado e sem políticas, o que nega acesso a
--    anon/authenticated (apenas o service_role, usado pelas rotas em
--    app/api/*, continua acessando normalmente).
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Services: leitura pública por pet_shop" ON public.services;
DROP POLICY IF EXISTS "Services: admin pode inserir" ON public.services;
DROP POLICY IF EXISTS "Services: admin pode atualizar" ON public.services;

DROP POLICY IF EXISTS "Appointments: leitura por authenticated" ON public.appointments;
DROP POLICY IF EXISTS "Appointments: inserção por authenticated" ON public.appointments;
DROP POLICY IF EXISTS "Appointments: atualização por authenticated" ON public.appointments;

DROP POLICY IF EXISTS "Leads: leitura por authenticated" ON public.leads;
DROP POLICY IF EXISTS "Leads: inserção por authenticated" ON public.leads;
DROP POLICY IF EXISTS "Leads: atualização por authenticated" ON public.leads;
DROP POLICY IF EXISTS "Leads: exclusão por authenticated" ON public.leads;

DROP POLICY IF EXISTS "Sales: leitura por authenticated" ON public.sales;
DROP POLICY IF EXISTS "Sales: inserção por authenticated" ON public.sales;

DROP POLICY IF EXISTS "SaleItems: leitura por authenticated" ON public.sale_items;
DROP POLICY IF EXISTS "SaleItems: inserção por authenticated" ON public.sale_items;

DROP POLICY IF EXISTS "MedicalRecords: leitura por authenticated" ON public.medical_records;
DROP POLICY IF EXISTS "MedicalRecords: inserção por authenticated" ON public.medical_records;

DROP POLICY IF EXISTS "VaccineRecords: leitura por authenticated" ON public.vaccine_records;
DROP POLICY IF EXISTS "VaccineRecords: inserção por authenticated" ON public.vaccine_records;

DROP POLICY IF EXISTS "WeightLogs: leitura por authenticated" ON public.weight_logs;
DROP POLICY IF EXISTS "WeightLogs: inserção por authenticated" ON public.weight_logs;

DROP POLICY IF EXISTS "AutomationRules: leitura por authenticated" ON public.automation_rules;
DROP POLICY IF EXISTS "AutomationRules: inserção por authenticated" ON public.automation_rules;
DROP POLICY IF EXISTS "AutomationRules: atualização por authenticated" ON public.automation_rules;

DROP POLICY IF EXISTS "Notifications: leitura por authenticated" ON public.notifications;
DROP POLICY IF EXISTS "Notifications: inserção por authenticated" ON public.notifications;
DROP POLICY IF EXISTS "Notifications: atualização por authenticated" ON public.notifications;

DROP POLICY IF EXISTS "CashSessions: leitura por authenticated" ON public.cash_sessions;
DROP POLICY IF EXISTS "CashSessions: inserção por authenticated" ON public.cash_sessions;
DROP POLICY IF EXISTS "CashSessions: atualização por authenticated" ON public.cash_sessions;

DROP POLICY IF EXISTS "CashMovements: leitura por authenticated" ON public.cash_movements;
DROP POLICY IF EXISTS "CashMovements: inserção por authenticated" ON public.cash_movements;

DROP POLICY IF EXISTS "WhatsappConfig: leitura por authenticated" ON public.whatsapp_config;
DROP POLICY IF EXISTS "WhatsappConfig: inserção por authenticated" ON public.whatsapp_config;
DROP POLICY IF EXISTS "WhatsappConfig: atualização por authenticated" ON public.whatsapp_config;

DROP POLICY IF EXISTS "ClientPackages: leitura por authenticated" ON public.client_packages;
DROP POLICY IF EXISTS "ClientPackages: insercao por authenticated" ON public.client_packages;
DROP POLICY IF EXISTS "ClientPackages: atualizacao por authenticated" ON public.client_packages;

-- Garante que RLS está habilitado nessas tabelas (idempotente — já estava
-- habilitado desde as migrations anteriores, mas não custa reforçar).
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_packages ENABLE ROW LEVEL SECURITY;
