-- ==============================================================================
-- MIGRATION PHASE 12 — Financeiro (Despesas)
-- ==============================================================================
-- financial_expenses é um livro-caixa simples e manual (aluguel, salários,
-- fornecedores, marketing, manutenção, outros) — independente das
-- movimentações de caixa (cash_movements), que são amarradas a uma sessão de
-- caixa aberta e servem para conferência de troco/sangria no dia a dia. Aqui
-- é para custos fixos/variáveis do negócio, usados pela tela /admin/financeiro
-- para calcular receita - despesas.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.financial_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    description VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'outros' CHECK (category IN ('aluguel', 'salarios', 'fornecedores', 'marketing', 'manutencao', 'outros')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_financial_expenses_date ON public.financial_expenses(expense_date);

-- Nenhuma consulta direta do navegador toca essa tabela (só via app/api/*
-- com service_role) — RLS habilitado sem políticas, mesmo padrão da
-- migration_phase7.sql.
ALTER TABLE public.financial_expenses ENABLE ROW LEVEL SECURITY;
