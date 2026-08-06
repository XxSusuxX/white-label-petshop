import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PET_SHOP_ID = "00000000-0000-0000-0000-000000000001";

const DEFAULT_RULES = [
  {
    rule_key: "lembrete_24h",
    title: "Lembrete de Agendamento (24h antes)",
    category: "lembrete",
    enabled: true,
    message_template:
      "Olá {tutor_name}! Lembramos que o agendamento de {service_name} para o pet {pet_name} está confirmado para amanhã às {time}. Responda 1 para confirmar ou 2 para reagendar.",
  },
  {
    rule_key: "pet_pronto",
    title: "Pet Pronto para Retirada (Esteira de Banho)",
    category: "operacao",
    enabled: true,
    message_template:
      "Parabéns {tutor_name}! O {pet_name} já terminou o banho e está cheiroso e pronto para ser retirado na recepção! 🐾",
  },
  {
    rule_key: "aniversario",
    title: "Mensagem no Aniversário do Pet",
    category: "marketing",
    enabled: true,
    message_template:
      "Hoje é um dia especial! 🎉 Desejamos um feliz aniversário para o fofíssimo {pet_name}! Como presente, você ganhou 10% OFF no próximo banho!",
  },
  {
    rule_key: "pacote_vencendo",
    title: "Aviso de Pacote Prestes a Vencer",
    category: "marketing",
    enabled: false,
    message_template:
      "Olá {tutor_name}! Seu pacote mensal de banho do {pet_name} tem apenas 1 banho restante. Clique aqui para renovar com desconto exclusivo.",
  },
  {
    rule_key: "resumo_diario",
    title: "Resumo Diário de Caixa (Para o Gestor)",
    category: "gestao",
    enabled: true,
    message_template:
      "📊 Resumo Diário SaaS Petshop:\nTotal faturado hoje: R$ {total_today}\nAtendimentos concluídos: {completed_count}\nNovos clientes: {new_clients_count}",
  },
];

// GET: Lista as regras de automação, semeando os padrões na primeira vez
export async function GET() {
  try {
    const adminSupabase = createAdminClient();

    const { data: existing, error } = await adminSupabase
      .from("automation_rules")
      .select("*")
      .eq("pet_shop_id", PET_SHOP_ID);

    if (error) {
      console.error("Erro ao buscar automation_rules:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!existing || existing.length === 0) {
      const { data: seeded, error: seedErr } = await adminSupabase
        .from("automation_rules")
        .insert(DEFAULT_RULES.map((r) => ({ ...r, pet_shop_id: PET_SHOP_ID })))
        .select();

      if (seedErr) {
        // Corrida entre duas requisições semeando ao mesmo tempo: alguém já inseriu
        // primeiro (violação da constraint única) — não é erro, apenas buscar de novo.
        if (seedErr.code === "23505") {
          const { data: retry, error: retryErr } = await adminSupabase
            .from("automation_rules")
            .select("*")
            .eq("pet_shop_id", PET_SHOP_ID);
          if (!retryErr) return NextResponse.json({ rules: retry || [] });
        }
        console.error("Erro ao semear automation_rules:", seedErr);
        return NextResponse.json({ error: seedErr.message }, { status: 500 });
      }
      return NextResponse.json({ rules: seeded || [] });
    }

    return NextResponse.json({ rules: existing });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/automations:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Atualiza enabled/message_template de uma regra (por rule_key)
export async function PUT(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();
    const { rule_key, enabled, message_template } = body;

    if (!rule_key) {
      return NextResponse.json({ error: "rule_key é obrigatório" }, { status: 400 });
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (enabled !== undefined) updateData.enabled = enabled;
    if (message_template !== undefined) updateData.message_template = message_template;

    const { data, error } = await adminSupabase
      .from("automation_rules")
      .update(updateData)
      .eq("pet_shop_id", PET_SHOP_ID)
      .eq("rule_key", rule_key)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar automation_rule:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, rule: data });
  } catch (err: any) {
    console.error("Erro em PUT /api/admin/automations:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
