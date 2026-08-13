import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

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

// GET: Notificações filtradas com separação entre Staff e Cliente e persistência de lidas
export const GET = withTenantRoute(async () => {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // IDs de notificações que o usuário já marcou como lidas (salvos em user_metadata)
    const readNotifIds = new Set<string>(user.user_metadata?.read_notif_ids || []);

    // 1. Buscar perfil do usuário para determinar seu cargo/função
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const userRole = profile?.role || "cliente";
    const isStaff = STAFF_ROLES.includes(userRole);

    // Por instrução do projeto: Notificações desativadas para equipe (Staff) por enquanto, focando 100% no cliente
    if (isStaff) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    // -------------------------------------------------------------
    // FLUXO EXCLUSIVO DO CLIENTE (TUTOR)
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
        title: "Agendamento se aproxima ⏰",
        body: `${petMap.get(a.pet_id) || "Seu pet"} tem ${a.service_type} agendado para ${new Date(a.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.`,
        appointment_id: a.id,
        is_read: false,
        created_at: a.scheduled_at,
        computed: true,
      }));
    }

    // Unificar notificações armazenadas no DB e lembretes computados do cliente
    const notifMap = new Map<string, any>();
    [...reminders, ...(stored || [])].forEach((n) => {
      if (!notifMap.has(n.id)) {
        const isRead = n.is_read || readNotifIds.has(n.id);
        notifMap.set(n.id, { ...n, is_read: isRead });
      }
    });

    const all = Array.from(notifMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const unreadCount = all.filter((n) => !n.is_read).length;

    return NextResponse.json({ notifications: all, unreadCount });
  } catch (err: any) {
    console.error("Erro em GET /api/notifications:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

// PATCH: Marcar notificação(ões) como lida(s) e salvar estado em user_metadata
export const PATCH = withTenantRoute(async (request: Request) => {
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

    const currentReadIds: string[] = user.user_metadata?.read_notif_ids || [];
    let updatedReadIds = [...currentReadIds];

    if (markAll) {
      // 1. Marca no banco se houver registro físico
      await adminSupabase
        .from("notifications")
        .update({ is_read: true })
        .eq("client_id", user.id);

      await adminSupabase
        .from("notifications")
        .update({ is_read: true })
        .eq("pet_shop_id", getTenantId());

      // 2. Marca todas as notificações (incluindo computadas) como lidas salvando seus IDs
      // Para markAll, buscamos a lista atual e marcamos os IDs computados também
      const getRes = await fetch(new URL("/api/notifications", request.url).toString(), {
        headers: { cookie: request.headers.get("cookie") || "" },
      }).catch(() => null);

      if (getRes && getRes.ok) {
        const data = await getRes.json();
        const allIds: string[] = (data.notifications || []).map((n: any) => n.id);
        updatedReadIds = Array.from(new Set([...currentReadIds, ...allIds]));
      }

      await adminSupabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, read_notif_ids: updatedReadIds },
      });

      return NextResponse.json({ success: true });
    }

    if (id && typeof id === "string") {
      if (!updatedReadIds.includes(id)) {
        updatedReadIds.push(id);
        await adminSupabase.auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, read_notif_ids: updatedReadIds },
        });
      }

      // Se não for um ID puramente computado (começando com reminder- ou staff-), atualiza no Supabase
      if (!id.startsWith("reminder-") && !id.startsWith("staff-")) {
        await adminSupabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro em PATCH /api/notifications:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
