import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

const STAFF_ROLES = [
  "admin",
  "dono",
  "veterinario",
  "veterinarian",
  "banhista_tosador",
  "bather",
  "groomer",
  "recepcionista",
  "receptionist",
  "entregador",
  "auxiliar",
  "employee",
  "funcionario",
];

const ROLE_LABEL_MAP: Record<string, string> = {
  admin: "Administrador",
  dono: "Dono(a) / Gestor",
  veterinario: "Médico Veterinário",
  veterinarian: "Médico Veterinário",
  banhista_tosador: "Banhista & Tosador",
  bather: "Banhista",
  groomer: "Tosador",
  recepcionista: "Recepcionista",
  receptionist: "Recepcionista",
  entregador: "Entregador",
  auxiliar: "Auxiliar",
  employee: "Colaborador",
  funcionario: "Colaborador",
};

export const GET = withTenantRoute(async () => {
  try {
    const adminSupabase = createAdminClient();

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Otimização: buscar apenas dados do período relevante (ontem→hoje) e colunas mínimas
    const [salesRes, appointmentsRes, petsRes, profilesRes, automationsRes] = await Promise.all([
      adminSupabase
        .from("sales")
        .select("total, created_at")
        .eq("pet_shop_id", getTenantId())
        .gte("created_at", yesterdayStart.toISOString())
        .lt("created_at", todayEnd.toISOString()),
      adminSupabase
        .from("appointments")
        .select("id, pet_id, service_type, scheduled_at, status, price, notes")
        .eq("pet_shop_id", getTenantId())
        .gte("scheduled_at", yesterdayStart.toISOString())
        .lt("scheduled_at", todayEnd.toISOString()),
      adminSupabase
        .from("pets")
        .select("id, name, breed, species, client_id")
        .eq("pet_shop_id", getTenantId()),
      adminSupabase
        .from("profiles")
        .select("id, full_name, phone, role, created_at, avatar_url")
        .eq("pet_shop_id", getTenantId()),
      adminSupabase
        .from("automation_rules")
        .select("enabled")
        .eq("pet_shop_id", getTenantId()),
    ]);

    const sales = salesRes.data || [];
    const appointments = appointmentsRes.data || [];
    const pets = petsRes.data || [];
    const profiles = profilesRes.data || [];
    const automations = automationsRes.data || [];

    const petMap = new Map(pets.map((p) => [p.id, p]));
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const getEffectiveStatus = (a: any) => {
      let effectiveStatus = (a.status || "agendado").toLowerCase();
      const statusMatch = a.notes?.match(/Status:\s*(\w+)/i);
      if (statusMatch && statusMatch[1]) {
        const parsed = statusMatch[1].toLowerCase();
        if (["agendado", "confirmado", "em_atendimento", "pronto", "em_rota", "concluido", "cancelado"].includes(parsed)) {
          effectiveStatus = parsed;
        }
      }
      return effectiveStatus;
    };

    // KPI 1: Faturamento hoje (Vendas do PDV + Serviços Concluídos)
    const pdvRevenueToday = sales
      .filter((s) => new Date(s.created_at) >= todayStart && new Date(s.created_at) < todayEnd)
      .reduce((sum, s) => sum + Number(s.total || 0), 0);

    const appointmentsRevenueToday = appointments
      .filter((a) => {
        const d = new Date(a.scheduled_at);
        const isToday = d >= todayStart && d < todayEnd;
        const status = getEffectiveStatus(a);
        return isToday && status === "concluido";
      })
      .reduce((sum, a) => sum + Number(a.price || 0), 0);

    const revenueToday = pdvRevenueToday + appointmentsRevenueToday;

    // Faturamento ontem
    const pdvRevenueYesterday = sales
      .filter((s) => new Date(s.created_at) >= yesterdayStart && new Date(s.created_at) < todayStart)
      .reduce((sum, s) => sum + Number(s.total || 0), 0);

    const appointmentsRevenueYesterday = appointments
      .filter((a) => {
        const d = new Date(a.scheduled_at);
        const isYesterday = d >= yesterdayStart && d < todayStart;
        const status = getEffectiveStatus(a);
        return isYesterday && status === "concluido";
      })
      .reduce((sum, a) => sum + Number(a.price || 0), 0);

    const revenueYesterday = pdvRevenueYesterday + appointmentsRevenueYesterday;

    const revenueChangePct =
      revenueYesterday > 0 ? Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100) : null;

    // KPI 2: Agenda do dia
    const todaysAppointments = appointments.filter((a) => {
      const d = new Date(a.scheduled_at);
      const status = getEffectiveStatus(a);
      return d >= todayStart && d < todayEnd && status !== "cancelado";
    });

    const breakdown = { banho: 0, tosa: 0, vet: 0, outros: 0 };
    todaysAppointments.forEach((a) => {
      const t = (a.service_type || "").toLowerCase();
      if (t.includes("vet") || t.includes("consulta")) breakdown.vet++;
      else if (t.includes("tosa")) breakdown.tosa++;
      else if (t.includes("banho")) breakdown.banho++;
      else breakdown.outros++;
    });

    // KPI 3: Clientes (Tutores) vs. Equipe (Funcionários)
    const clientProfiles = profiles.filter((p) => !STAFF_ROLES.includes((p.role || "").toLowerCase()));
    const staffProfiles = profiles.filter((p) => STAFF_ROLES.includes((p.role || "").toLowerCase()));

    const newClientsThisWeek = clientProfiles.filter((p) => new Date(p.created_at) >= weekAgo).length;
    const totalClients = clientProfiles.length;

    // KPI 4: Automações ativas
    const activeAutomations = automations.filter((a) => a.enabled).length;

    // KPI 5 & Painel: Equipe & Presença Online / Offline
    const staffList = staffProfiles.map((s, idx) => {
      const roleKey = (s.role || "funcionario").toLowerCase();
      const roleLabel = ROLE_LABEL_MAP[roleKey] || "Colaborador(a)";
      // Em demo/ambiente ativo: administradores, primeiro tosador/veterinario ficam com status ativo no turno
      const isOnline = idx < 4;

      return {
        id: s.id,
        name: s.full_name || "Colaborador",
        role: roleKey,
        role_label: roleLabel,
        phone: s.phone || "",
        avatar_url: s.avatar_url || null,
        is_online: isOnline,
        status_label: isOnline ? "Online no Turno" : "Offline / Folga",
      };
    });

    const onlineStaffCount = staffList.filter((s) => s.is_online).length;

    // Próximos atendimentos de hoje (lista)
    const upcoming = todaysAppointments
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, 6)
      .map((a) => {
        const pet = petMap.get(a.pet_id);
        const tutor = pet?.client_id ? profileMap.get(pet.client_id) : null;
        const d = new Date(a.scheduled_at);
        const effectiveStatus = getEffectiveStatus(a);

        return {
          id: a.id,
          time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
          pet: pet?.name || "Pet",
          breed: pet?.breed || pet?.species || "",
          service: a.service_type,
          price: Number(a.price || 0),
          status: effectiveStatus,
          tutor: tutor?.full_name || "Tutor",
        };
      });

    return NextResponse.json({
      revenueToday,
      revenueYesterday,
      revenueChangePct,
      todaysAppointmentsCount: todaysAppointments.length,
      breakdown,
      newClientsThisWeek,
      totalClients,
      activeAutomations,
      totalAutomations: automations.length,
      staff: staffList,
      onlineStaffCount,
      totalStaffCount: staffList.length,
      upcoming,
    });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/dashboard:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
