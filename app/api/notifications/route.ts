import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET: Notificações para Tutores (Client) e Gestores (Admin)
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

    // Verificar se o usuário é Administrador ou Funcionário
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin" || profile?.role === "funcionario";

    if (isAdmin) {
      // 1. Notificações gravadas no sistema
      const { data: stored, error } = await adminSupabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        console.error("Erro ao buscar notificações do admin:", error);
      }

      // 2. Alertas calculados da operação ao vivo
      const { data: appts } = await adminSupabase
        .from("appointments")
        .select("id, pet_id, service_type, scheduled_at, status, notes")
        .order("scheduled_at", { ascending: false })
        .limit(50);

      const { data: pets } = await adminSupabase.from("pets").select("id, name");
      const petMap = new Map((pets || []).map((p) => [p.id, p.name]));

      const todayStr = new Date().toISOString().slice(0, 10);
      const liveAlerts: any[] = [];

      (appts || []).forEach((a) => {
        const petName = petMap.get(a.pet_id) || "Pet";
        const isToday = a.scheduled_at?.startsWith(todayStr);
        const isReady = a.status === "pronto" || a.notes?.includes("Status: pronto");
        const inService = a.status === "em_atendimento";

        if (isReady) {
          liveAlerts.push({
            id: `admin-ready-${a.id}`,
            type: "agendamento_confirmado",
            title: "Pet Pronto para Busca",
            body: `${petName} finalizou o atendimento de ${a.service_type} e está pronto na recepção.`,
            appointment_id: a.id,
            is_read: false,
            created_at: a.scheduled_at || new Date().toISOString(),
            computed: true,
          });
        } else if (inService) {
          liveAlerts.push({
            id: `admin-[OPERACAO]-${a.id}`,
            type: "agendamento_alterado",
            title: "Atendimento em Andamento",
            body: `${petName} está na esteira de atendimento (${a.service_type}).`,
            appointment_id: a.id,
            is_read: false,
            created_at: a.scheduled_at || new Date().toISOString(),
            computed: true,
          });
        } else if (isToday && (a.status === "agendado" || a.status === "confirmado")) {
          liveAlerts.push({
            id: `admin-today-${a.id}`,
            type: "agendamento_criado",
            title: "Agendamento para Hoje",
            body: `${petName} — ${a.service_type} está agendado para hoje.`,
            appointment_id: a.id,
            is_read: false,
            created_at: a.scheduled_at || new Date().toISOString(),
            computed: true,
          });
        }
      });

      // Evitar duplicidades e ordenar por data decrescente
      const notifMap = new Map<string, any>();
      [...liveAlerts, ...(stored || [])].forEach((n) => {
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

    const isAdmin = profile?.role === "admin" || profile?.role === "funcionario";

    if (markAll) {
      if (isAdmin) {
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

    if (!id || typeof id !== "string" || id.startsWith("reminder-") || id.startsWith("admin-")) {
      return NextResponse.json({ success: true });
    }

    if (isAdmin) {
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
