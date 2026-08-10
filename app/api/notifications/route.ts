import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const STAFF_ROLES = [
  "admin",
  "dono",
  "veterinario",
  "banhista_tosador",
  "recepcionista",
  "entregador",
  "auxiliar",
  "funcionario",
];

// GET: Notificações filtradas por cargo (Admin, Dono, Veterinário, Banhista/Tosador, Recepcionista, Entregador, Auxiliar, Tutor)
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // 1. Buscar perfil do usuário para determinar seu cargo/função
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const userRole = profile?.role || "cliente";
    const isStaff = STAFF_ROLES.includes(userRole);

    if (isStaff) {
      // Notificações salvas na tabela 'notifications'
      const { data: stored, error } = await adminSupabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40);

      if (error) {
        console.error("Erro ao buscar notificações do sistema:", error);
      }

      // Alertas operacionais em tempo real da tabela de agendamentos
      const { data: appts } = await adminSupabase
        .from("appointments")
        .select("id, pet_id, service_type, scheduled_at, status, notes")
        .order("scheduled_at", { ascending: false })
        .limit(50);

      const { data: pets } = await adminSupabase.from("pets").select("id, name");
      const petMap = new Map((pets || []).map((p) => [p.id, p.name]));

      const todayStr = new Date().toISOString().slice(0, 10);
      const rawLiveAlerts: any[] = [];

      (appts || []).forEach((a) => {
        const petName = petMap.get(a.pet_id) || "Pet";
        const isToday = a.scheduled_at?.startsWith(todayStr);
        const isReady = a.status === "pronto" || a.notes?.includes("Status: pronto");
        const inService = a.status === "em_atendimento";
        const isDone = a.status === "concluido";
        const isDelivery = a.status === "em_rota" || a.notes?.includes("Status: em_rota");

        if (isReady) {
          rawLiveAlerts.push({
            id: `staff-ready-${a.id}`,
            type: "agendamento_confirmado",
            role_target: ["admin", "recepcionista", "banhista_tosador", "entregador", "auxiliar"],
            service_type: a.service_type,
            title: "Pet Pronto para Busca",
            body: `${petName} finalizou o atendimento de ${a.service_type} e aguarda na recepção.`,
            appointment_id: a.id,
            is_read: false,
            created_at: a.scheduled_at || new Date().toISOString(),
            computed: true,
          });
        } else if (inService) {
          rawLiveAlerts.push({
            id: `staff-service-${a.id}`,
            type: "agendamento_alterado",
            role_target: ["admin", "banhista_tosador", "veterinario", "auxiliar"],
            service_type: a.service_type,
            title: "Atendimento em Andamento",
            body: `${petName} deu entrada na esteira (${a.service_type}).`,
            appointment_id: a.id,
            is_read: false,
            created_at: a.scheduled_at || new Date().toISOString(),
            computed: true,
          });
        } else if (isDone) {
          rawLiveAlerts.push({
            id: `staff-done-${a.id}`,
            type: "agendamento_concluido",
            role_target: ["admin", "dono"],
            service_type: a.service_type,
            title: "Atendimento Concluído",
            body: `Serviço de ${a.service_type} para ${petName} finalizado com sucesso.`,
            appointment_id: a.id,
            is_read: false,
            created_at: a.scheduled_at || new Date().toISOString(),
            computed: true,
          });
        } else if (isDelivery) {
          rawLiveAlerts.push({
            id: `staff-delivery-${a.id}`,
            type: "agendamento_alterado",
            role_target: ["admin", "entregador", "recepcionista"],
            service_type: a.service_type,
            title: "Pet em Rota de Entrega",
            body: `${petName} está em rota de transporte para o tutor.`,
            appointment_id: a.id,
            is_read: false,
            created_at: a.scheduled_at || new Date().toISOString(),
            computed: true,
          });
        } else if (isToday && (a.status === "agendado" || a.status === "confirmado")) {
          rawLiveAlerts.push({
            id: `staff-today-${a.id}`,
            type: "agendamento_criado",
            role_target: ["admin", "dono", "recepcionista", "banhista_tosador", "veterinario", "auxiliar"],
            service_type: a.service_type,
            title: "Agendamento para Hoje",
            body: `${petName} — ${a.service_type} agendado para hoje.`,
            appointment_id: a.id,
            is_read: false,
            created_at: a.scheduled_at || new Date().toISOString(),
            computed: true,
          });
        }
      });

      // -------------------------------------------------------------
      // FILTRAGEM DE NOTIFICAÇÕES POR CARGO ESPECÍFICO DO USUÁRIO
      // -------------------------------------------------------------
      const filteredLiveAlerts = rawLiveAlerts.filter((item) => {
        // Admin: Vê TODAS as notificações
        if (userRole === "admin") return true;

        // Dono: Vê APENAS Agendamentos Novos e Conclusão de Atendimento
        if (userRole === "dono") {
          return item.type === "agendamento_criado" || item.type === "agendamento_concluido";
        }

        // Médico Veterinário: Notificações de consultas / veterinária
        if (userRole === "veterinario") {
          const s = (item.service_type || "").toLowerCase();
          const isVetService = s.includes("consulta") || s.includes("vacina") || s.includes("vet") || s.includes("exame");
          return isVetService || item.role_target.includes("veterinario");
        }

        // Banhista & Tosador: Banho, Tosa, Higienização, Hidratação
        if (userRole === "banhista_tosador") {
          const s = (item.service_type || "").toLowerCase();
          const isBathGrooming = s.includes("banho") || s.includes("tosa") || s.includes("higieni") || s.includes("hidrat");
          return isBathGrooming || item.role_target.includes("banhista_tosador");
        }

        // Recepcionista: Entrada, agendamentos novos, pets prontos
        if (userRole === "recepcionista") {
          return item.role_target.includes("recepcionista");
        }

        // Entregador: Pets prontos para busca/entrega e em rota
        if (userRole === "entregador") {
          return item.role_target.includes("entregador");
        }

        // Demais cargos da equipe (Auxiliar, Funcionário)
        return item.role_target.includes(userRole) || userRole === "funcionario";
      });

      // Evitar duplicidades e ordenar por data decrescente
      const notifMap = new Map<string, any>();
      [...filteredLiveAlerts, ...(stored || [])].forEach((n) => {
        if (!notifMap.has(n.id)) notifMap.set(n.id, n);
      });

      const allNotifs = Array.from(notifMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const unreadCount = allNotifs.filter((n) => !n.is_read).length;

      return NextResponse.json({ notifications: allNotifs, unreadCount });
    }

    // -------------------------------------------------------------
    // FLUXO DO CLIENTE (TUTOR)
    // -------------------------------------------------------------
    const { data: stored, error } = await adminSupabase
      .from("notifications")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Erro ao buscar notificações do tutor:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: pets } = await adminSupabase.from("pets").select("id, name").eq("client_id", user.id);
    const petIds = (pets || []).map((p) => p.id);
    const petMap = new Map((pets || []).map((p) => [p.id, p.name]));

    let reminders: any[] = [];
    if (petIds.length > 0) {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const { data: upcoming } = await adminSupabase
        .from("appointments")
        .select("id, pet_id, service_type, scheduled_at, status")
        .in("pet_id", petIds)
        .gte("scheduled_at", now.toISOString())
        .lte("scheduled_at", in24h.toISOString())
        .not("status", "in", "(cancelado,concluido,bloqueio)");

      reminders = (upcoming || []).map((a) => ({
        id: `reminder-${a.id}`,
        type: "lembrete",
        title: "Agendamento se aproxima",
        body: `${petMap.get(a.pet_id) || "Seu pet"} tem ${a.service_type} agendado para ${new Date(a.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.`,
        appointment_id: a.id,
        is_read: false,
        created_at: a.scheduled_at,
        computed: true,
      }));
    }

    const all = [...reminders, ...(stored || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const unreadCount = all.filter((n) => !n.is_read).length;

    return NextResponse.json({ notifications: all, unreadCount });
  } catch (err: any) {
    console.error("Erro em GET /api/notifications:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Marcar notificação(ões) como lida(s)
export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { id, markAll } = body;

    const adminSupabase = createAdminClient();

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const userRole = profile?.role || "cliente";
    const isStaff = STAFF_ROLES.includes(userRole);

    if (markAll) {
      if (isStaff) {
        const { error } = await adminSupabase
          .from("notifications")
          .update({ is_read: true })
          .eq("is_read", false);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      } else {
        const { error } = await adminSupabase
          .from("notifications")
          .update({ is_read: true })
          .eq("client_id", user.id)
          .eq("is_read", false);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (!id || typeof id !== "string" || id.startsWith("reminder-") || id.startsWith("staff-") || id.startsWith("admin-")) {
      return NextResponse.json({ success: true });
    }

    if (isStaff) {
      const { error } = await adminSupabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await adminSupabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("client_id", user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro em PATCH /api/notifications:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
