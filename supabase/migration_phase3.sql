-- ==============================================================================
-- MIGRAÇÃO: Ampliar os status válidos de appointments (pronto / em_rota)
-- PetNexus White-Label Petshop
-- Data: 2026-08-11
-- ==============================================================================
-- INSTRUÇÕES: Copie e cole este script inteiro no Supabase SQL Editor e execute.
-- ==============================================================================
-- Contexto: a Operação (esteira Kanban) hoje usa os status 'pronto' e 'em_rota',
-- mas a CHECK constraint de appointments.status só permitia os 6 valores originais.
-- O código tinha um fallback (grava 'confirmado' na coluna e o status real dentro
-- de notes) só para não quebrar — este script remove a necessidade do fallback,
-- deixando o status real gravado na própria coluna.
-- ==============================================================================

ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
    CHECK (status IN (
        'agendado', 'confirmado', 'em_atendimento', 'pronto', 'em_rota',
        'concluido', 'cancelado', 'bloqueio'
    ));

-- ==============================================================================
-- RESULTADO ESPERADO:
-- ✅ appointments.status aceita 'pronto' e 'em_rota' nativamente
-- ✅ O fallback em app/api/admin/agenda/route.ts (grava 'confirmado' + tag em
--    notes quando a constraint rejeita) deixa de ser acionado, mas continua no
--    código como rede de segurança — não precisa remover.
-- ==============================================================================
