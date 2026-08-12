import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PET_SHOP_ID = "00000000-0000-0000-0000-000000000001";

const DEFAULT_RULES = [
  {
    rule_key: "agendamento_realizado",
    title: "Agendamento Realizado (Confirmação Inicial)",
    category: "operacao",
    enabled: true,
    message_template:
      "Olá {tutor_name}! Seu agendamento de {service_name} para o pet {pet_name} em {date} às {time} foi realizado com sucesso! 🐾",
  },
  {
    rule_key: "agendamento_confirmado",
    title: "Agendamento Confirmado pela Equipe",
    category: "operacao",
    enabled: true,
    message_template:
      "Olá {tutor_name}! Seu agendamento de {service_name} para o pet {pet_name} foi confirmado pela nossa recepção. Esperamos vocês!",
  },
  {
    rule_key: "agendamento_cancelado",
    title: "Agendamento Cancelado",
    category: "operacao",
    enabled: true,
    message_template:
      "Olá {tutor_name}! Informamos que o agendamento de {service_name} para {pet_name} foi cancelado. Caso deseje reagendar, acesse nosso link ou entre em contato.",
  },
  {
    rule_key: "atendimento_iniciado",
    title: "Atendimento Iniciado na Operação",
    category: "operacao",
    enabled: true,
    message_template:
      "Olá {tutor_name}! O atendimento de {service_name} do seu pet {pet_name} acabou de ser iniciado pela nossa equipe! ✂️🛁",
  },
  {
    rule_key: "atendimento_em_andamento",
    title: "Atualização de Etapa em Andamento",
    category: "operacao",
    enabled: true,
    message_template:
      "Olá {tutor_name}! O pet {pet_name} está em atendimento ({current_step}). Em breve estará cheiroso e pronto!",
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
    rule_key: "atendimento_concluido",
    title: "Atendimento Concluído / Entregue",
    category: "operacao",
    enabled: true,
    message_template:
      "Olá {tutor_name}! O atendimento de {service_name} do pet {pet_name} foi concluído com sucesso. Muito obrigado pela confiança! 🐾",
  },
  {
    rule_key: "boas_vindas_novo_cliente",
    title: "Boas-Vindas para Novos Clientes (Link de Agendamento)",
    category: "marketing",
    enabled: true,
    message_template:
      "Olá {tutor_name}! Seja muito bem-vindo ao nosso petshop! 🐾 Para facilitar seu dia a dia, você pode agendar o atendimento do seu pet online no horário de sua preferência acessando: {booking_url}",
  },
  {
    rule_key: "lembrete_24h",
    title: "Lembrete de Agendamento (24h antes)",
    category: "lembrete",
    enabled: true,
    message_template:
      "Olá {tutor_name}! Lembramos que o agendamento de {service_name} para o pet {pet_name} está confirmado para amanhã às {time}. Responda 1 para confirmar ou 2 para reagendar.",
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
      "Olá {tutor_name}! Seu pacote \"{package_name}\" está com apenas {remaining_credits} crédito(s) restante(s). Que tal já garantir a renovação com desconto exclusivo?",
  },
  {
    rule_key: "resumo_diario",
    title: "Resumo Diário de Caixa (Para o Gestor)",
    category: "gestao",
    enabled: true,
    message_template:
      "📊 Resumo Diário SaaS Petshop:\nTotal faturado hoje: R$ {total_today}\nAtendimentos concluídos: {completed_count}\nNovos clientes: {new_clients_count}",
  },
  {
    rule_key: "pedido_avaliacao",
    title: "Pedido de Avaliação Pós-Atendimento",
    category: "marketing",
    enabled: true,
    message_template:
      "Olá {tutor_name}! Esperamos que o {pet_name} tenha adorado o atendimento de {service_name} hoje 🐾. Poderia nos avaliar com uma nota de 0 a 10? Sua opinião é muito importante para nós!",
  },
  {
    rule_key: "cliente_inativo",
    title: "Reativação de Clientes Inativos",
    category: "marketing",
    enabled: false,
    message_template:
      "Sentimos sua falta, {tutor_name}! Já faz um tempo que o {pet_name} não vem nos visitar. Que tal agendar um banho com 15% de desconto? É só responder esta mensagem!",
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

    // Semeia regras ausentes: cobre tanto a primeira execução (tabela vazia)
    // quanto deploys já em produção que ganharam novas regras padrão depois
    // (ex.: pedido_avaliacao, cliente_inativo) — cada uma é inserida só uma vez.
    const existingKeys = new Set((existing || []).map((r) => r.rule_key));
    const missingRules = DEFAULT_RULES.filter((r) => !existingKeys.has(r.rule_key));

    if (missingRules.length > 0) {
      const { data: seeded, error: seedErr } = await adminSupabase
        .from("automation_rules")
        .insert(missingRules.map((r) => ({ ...r, pet_shop_id: PET_SHOP_ID })))
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
      return NextResponse.json({ rules: [...(existing || []), ...(seeded || [])] });
    }

    return NextResponse.json({ rules: existing || [] });
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
