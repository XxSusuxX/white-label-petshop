import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET: Notificações persistidas do tutor + lembretes calculados na hora (agendamentos
// próximos nas próximas 24h que ainda não foram concluídos/cancelados).
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

    const { data: stored, error } = await adminSupabase
      .from("notifications")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Erro ao buscar notificações:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Lembretes calculados: próximos agendamentos do tutor nas próximas 24h
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

    if (markAll) {
      const { error } = await adminSupabase
        .from("notifications")
        .update({ is_read: true })
        .eq("client_id", user.id)
        .eq("is_read", false);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (!id || typeof id !== "string" || id.startsWith("reminder-")) {
      // Lembretes calculados não são persistidos — não há o que marcar como lido.
      return NextResponse.json({ success: true });
    }

    const { error } = await adminSupabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("client_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro em PATCH /api/notifications:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
