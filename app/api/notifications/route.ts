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

    if (isStaff) {
      // -------------------------------------------------------------
      // FLUXO DA EQUIPE / GESTOR (STAFF)
      // -------------------------------------------------------------
      const { data: stored, error } = await adminSupabase
        .from("notifications")
        .select("*")
        .eq("pet_shop_id", getTenantId())
        .order("created_at", { ascending: false })
        .limit(40);

      if (error) {
        console.error("Erro ao buscar notificações do sistema:", error);
      }

      // Alertas operacionais da esteira de agendamentos
      const { data: appts } = await adminSupabase
        .from("appointments")
        .select("id, pet_id, service_type, scheduled_at, status, notes, updated_by")
        .eq("pet_shop_id", getTenantId())
        .order("scheduled_at", { ascending: false })
        .limit(50);

      const { data: pets } = await adminSupabase
        .from("pets")
        .select("id, name")
        .eq("pet_shop_id", getTenantId());
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
            actor_id: a.updated_by || null,
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
            actor_id: a.updated_by || null,
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
            actor_id: a.updated_by || null,
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
            actor_id: a.updated_by || null,
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
            actor_id: a.updated_by || null,
            is_read: false,
            created_at: a.scheduled_at || new Date().toISOString(),
            computed: true,
          });
        }
      });

      // Filtragem por cargo específico do usuário da equipe
      const filteredLiveAlerts = rawLiveAlerts.filter((item) => {
        // Nunca notificar o próprio autor da mudança de status que gerou o alerta
        if (item.actor_id && item.actor_id === user.id) return false;

        if (userRole === "admin") return item.role_target.includes("admin");
        if (userRole === "dono") {
          return item.type === "agendamento_criado" || item.type === "agendamento_concluido";
        }
        if (userRole === "veterinario") {
          const s = (item.service_type || "").toLowerCase();
          return s.includes("consulta") || s.includes("vacina") || s.includes("vet") || item.role_target.includes("veterinario");
        }
        if (userRole === "banhista_tosador") {
          const s = (item.service_type || "").toLowerCase();
          return s.includes("banho") || s.includes("tosa") || s.includes("higieni") || item.role_target.includes("banhista_tosador");
        }
        return item.role_target.includes(userRole) || userRole === "funcionario";
      });

      // Filtrar notificações armazenadas que não sejam estritamente mensagens privadas de tutor
      const staffStored = (stored || []).filter((n) => {
        const title = (n.title || "").toLowerCase();
        const body = (n.body || "").toLowerCase();
        // Incluir se for alerta geral ou agendamento novo/cancelado
        if (title.includes("novo agendamento") || title.includes("cancelado") || title.includes("cliente")) return true;
        // Ocultar notificações que são mensagens direcionadas apenas ao tutor individual (ex: "Seu pet está em banho")
        if (body.startsWith("seu pet") || body.startsWith("seu agendamento")) return false;
        return true;
      });

      // Unificar e aplicar estado de leitura persistido
      const notifMap = new Map<string, any>();
      [...filteredLiveAlerts, ...staffStored].forEach((n) => {
        if (!notifMap.has(n.id)) {
          const isRead = n.is_read || readNotifIds.has(n.id);
          notifMap.set(n.id, { ...n, is_read: isRead });
        }
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
        title: "Agendamento se aproxima ⏰",
        body: `${petMap.get(a.pet_id) || "Seu pet"} tem ${a.service_type} agendado para ${new Date(a.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.`,
        appointment_id: a.id,
        is_read: false,
        created_at: a.scheduled_at,
        computed: true,
      }));
    }

    // Unificar e aplicar estado de leitura
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
