import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { triggerAutomation, getBookingContactInfo } from "@/lib/server/automations";
import { getTenantId, withTenant } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

type AdminClient = ReturnType<typeof createAdminClient>;

// Automações baseadas em tempo, sem um evento de disparo direto (diferente de
// pet_pronto/pedido_avaliacao, que disparam na hora em app/api/admin/agenda).
// Este endpoint deve ser chamado periodicamente por um cron externo (ex.:
// cron-job.org, GitHub Actions, Vercel Cron) com o header x-cron-secret.

async function runLembrete24h(adminSupabase: AdminClient) {
  const now = Date.now();
  const windowStart = new Date(now + 23 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now + 25 * 60 * 60 * 1000).toISOString();

  const { data: appointments } = await adminSupabase
    .from("appointments")
    .select("*")
    .eq("pet_shop_id", getTenantId())
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd)
    .is("reminder_sent_at", null)
    .not("status", "in", "(cancelado,concluido)");

  let sent = 0;
  for (const appt of appointments || []) {
    const info = await getBookingContactInfo(appt.pet_id);
    if (!info?.tutorPhone) continue;

    const time = new Date(appt.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const result = await triggerAutomation("lembrete_24h", info.tutorPhone, {
      tutor_name: info.tutorName,
      pet_name: info.petName,
      service_name: appt.service_type || "",
      time,
    });
    if (result.sent) {
      sent++;
      await adminSupabase.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", appt.id);
    }
  }
  return { candidates: (appointments || []).length, sent };
}

async function runAniversario(adminSupabase: AdminClient) {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const year = today.getFullYear();

  const { data: pets } = await adminSupabase
    .from("pets")
    .select("id, name, client_id, birth_date, last_birthday_greeted_year")
    .eq("pet_shop_id", getTenantId())
    .not("birth_date", "is", null);

  let sent = 0;
  let candidates = 0;
  for (const pet of pets || []) {
    if (pet.last_birthday_greeted_year === year) continue;
    const bd = new Date(pet.birth_date);
    if (bd.getUTCMonth() + 1 !== month || bd.getUTCDate() !== day) continue;
    candidates++;

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("full_name, phone")
      .eq("pet_shop_id", getTenantId())
      .eq("id", pet.client_id)
      .maybeSingle();
    if (!profile?.phone) continue;

    const result = await triggerAutomation("aniversario", profile.phone, {
      tutor_name: profile.full_name || "Tutor",
      pet_name: pet.name || "seu pet",
    });
    if (result.sent) {
      sent++;
      await adminSupabase.from("pets").update({ last_birthday_greeted_year: year }).eq("id", pet.id);
    }
  }
  return { candidates, sent };
}

async function runPacoteVencendo(adminSupabase: AdminClient) {
  const { data: packages } = await adminSupabase
    .from("client_packages")
    .select("*")
    .eq("pet_shop_id", getTenantId())
    .eq("status", "ativo")
    .is("low_credit_notified_at", null);

  const candidates = (packages || []).filter((p) => p.total_credits - p.used_credits <= 1 && p.total_credits - p.used_credits >= 0);

  let sent = 0;
  for (const pkg of candidates) {
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("full_name, phone")
      .eq("pet_shop_id", getTenantId())
      .eq("id", pkg.client_id)
      .maybeSingle();
    if (!profile?.phone) continue;

    const result = await triggerAutomation("pacote_vencendo", profile.phone, {
      tutor_name: profile.full_name || "Tutor",
      package_name: pkg.package_name || "seu pacote",
      remaining_credits: String(Math.max(pkg.total_credits - pkg.used_credits, 0)),
    });
    if (result.sent) {
      sent++;
      await adminSupabase.from("client_packages").update({ low_credit_notified_at: new Date().toISOString() }).eq("id", pkg.id);
    }
  }
  return { candidates: candidates.length, sent };
}

async function runResumoDiario(adminSupabase: AdminClient) {
  const { data: config } = await adminSupabase
    .from("whatsapp_config")
    .select("*")
    .eq("pet_shop_id", getTenantId())
    .maybeSingle();

  if (!config?.admin_notify_phone) {
    return { sent: false, reason: "admin_notify_phone não configurado." };
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (config.resumo_diario_last_sent_date === todayStr) {
    return { sent: false, reason: "Já enviado hoje." };
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const startIso = startOfDay.toISOString();

  const { data: sales } = await adminSupabase
    .from("sales")
    .select("total")
    .eq("pet_shop_id", getTenantId())
    .gte("created_at", startIso);
  const totalToday = (sales || []).reduce((sum, s: any) => sum + Number(s.total || 0), 0);

  const { count: completedCount } = await adminSupabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("pet_shop_id", getTenantId())
    .eq("status", "concluido")
    .gte("updated_at", startIso);

  const { count: newClientsCount } = await adminSupabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("pet_shop_id", getTenantId())
    .eq("role", "client")
    .gte("created_at", startIso);

  const result = await triggerAutomation("resumo_diario", config.admin_notify_phone, {
    total_today: totalToday.toFixed(2).replace(".", ","),
    completed_count: String(completedCount || 0),
    new_clients_count: String(newClientsCount || 0),
  });

  if (result.sent) {
    await adminSupabase
      .from("whatsapp_config")
      .update({ resumo_diario_last_sent_date: todayStr })
      .eq("pet_shop_id", getTenantId());
  }
  return result;
}

async function runClienteInativo(adminSupabase: AdminClient) {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: clients } = await adminSupabase
    .from("profiles")
    .select("id, full_name, phone, last_winback_sent_at")
    .eq("pet_shop_id", getTenantId())
    .eq("role", "client");
  const { data: pets } = await adminSupabase
    .from("pets")
    .select("id, name, client_id")
    .eq("pet_shop_id", getTenantId());
  const { data: recentAppointments } = await adminSupabase
    .from("appointments")
    .select("pet_id, scheduled_at")
    .eq("pet_shop_id", getTenantId())
    .gte("scheduled_at", sixtyDaysAgo);

  const petToClient = new Map((pets || []).map((p: any) => [p.id, p.client_id]));
  const activeClientIds = new Set((recentAppointments || []).map((a: any) => petToClient.get(a.pet_id)).filter(Boolean));
  const petNameByClient = new Map<string, string>();
  for (const p of pets || []) {
    if (!petNameByClient.has(p.client_id)) petNameByClient.set(p.client_id, p.name);
  }

  let sent = 0;
  let candidates = 0;
  for (const client of clients || []) {
    if (activeClientIds.has(client.id)) continue;
    if (!client.phone) continue;
    if (!petNameByClient.has(client.id)) continue;
    if (client.last_winback_sent_at && client.last_winback_sent_at > thirtyDaysAgo) continue;

    candidates++;
    const result = await triggerAutomation("cliente_inativo", client.phone, {
      tutor_name: client.full_name || "Tutor",
      pet_name: petNameByClient.get(client.id) || "seu pet",
    });
    if (result.sent) {
      sent++;
      await adminSupabase.from("profiles").update({ last_winback_sent_at: new Date().toISOString() }).eq("id", client.id);
    }
  }
  return { candidates, sent };
}

export async function POST(request: Request) {
  const expectedSecret = process.env.AUTOMATIONS_CRON_SECRET;
  if (!expectedSecret) {
    console.error("AUTOMATIONS_CRON_SECRET não está configurada no ambiente do servidor.");
    return NextResponse.json(
      { error: "Automações agendadas desativadas: segredo de cron não configurado no servidor." },
      { status: 500 }
    );
  }
  if (request.headers.get("x-cron-secret") !== expectedSecret) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const adminSupabase = createAdminClient();
    const { data: petshops } = await adminSupabase.from("pet_shops").select("id");
    const tenantIds = (petshops || []).map((p) => p.id);

    if (tenantIds.length === 0) {
      return NextResponse.json({ success: true, tenants: {}, note: "Nenhum pet shop cadastrado." });
    }

    const allResults: Record<string, any> = {};

    for (const tenantId of tenantIds) {
      const tenantResults = await withTenant(tenantId, async () => {
        const tenantAdmin = createAdminClient();
        const { data: rules } = await tenantAdmin
          .from("automation_rules")
          .select("rule_key, enabled")
          .eq("pet_shop_id", tenantId);
        const enabledKeys = new Set((rules || []).filter((r) => r.enabled).map((r) => r.rule_key));

        const results: Record<string, any> = {};

        if (enabledKeys.has("lembrete_24h")) results.lembrete_24h = await runLembrete24h(tenantAdmin);
        if (enabledKeys.has("aniversario")) results.aniversario = await runAniversario(tenantAdmin);
        if (enabledKeys.has("pacote_vencendo")) results.pacote_vencendo = await runPacoteVencendo(tenantAdmin);
        if (enabledKeys.has("resumo_diario")) results.resumo_diario = await runResumoDiario(tenantAdmin);
        if (enabledKeys.has("cliente_inativo")) results.cliente_inativo = await runClienteInativo(tenantAdmin);

        return results;
      });

      allResults[tenantId] = tenantResults;
    }

    return NextResponse.json({ success: true, tenants: allResults });
  } catch (err: any) {
    console.error("Erro em POST /api/admin/automations/run:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
