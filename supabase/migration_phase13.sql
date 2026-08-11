-- ==============================================================================
-- MIGRATION PHASE 13 — Correção de recursão infinita em RLS (42P17)
-- ==============================================================================
-- Descoberta em verificação pós-deploy: profiles, pets, pet_shops e
-- service_history têm políticas RLS pré-existentes (criadas fora de qualquer
-- migration deste repositório, provavelmente direto pelo painel do Supabase
-- em algum momento anterior) que fazem uma checagem de admin do tipo
-- "EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')"
-- dentro de uma política DA PRÓPRIA profiles — isso é recursivo e o Postgres
-- rejeita com o erro 42P17 (infinite recursion detected in policy for
-- relation "profiles"). Como a migration_phase7.sql só derrubava políticas
-- pelo nome exato que ela conhecia, essas políticas "invisíveis" sobreviveram
-- e continuam quebrando qualquer leitura de profiles/pets/pet_shops/
-- service_history — inclusive para usuários autenticados normais (sidebar,
-- agenda, cadastro, etc.), não só para acesso anônimo.
--
-- Esta migration remove TODAS as políticas existentes nessas 4 tabelas
-- (usando o catálogo pg_policies, não uma lista de nomes) e recria apenas o
-- que é pretendido: profiles com leitura/escrita restrita à própria linha
-- (igual à migration_phase7.sql); pets/pet_shops/service_history com RLS
-- habilitado e zero políticas (acesso restrito ao service_role, usado pelas
-- rotas em app/api/*, já que nenhuma tela do navegador consulta essas três
-- tabelas diretamente).
-- ==============================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename FROM pg_policies
        WHERE schemaname = 'public' AND tablename IN ('profiles', 'pets', 'pet_shops', 'service_history')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Recria as políticas de profiles (mesmo conteúdo da migration_phase7.sql)
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

-- pets / pet_shops / service_history: RLS habilitado, sem políticas (deny-all
-- para anon/authenticated; service_role continua com acesso total).
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;
