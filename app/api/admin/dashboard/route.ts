import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

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

    const [salesRes, appointmentsRes, petsRes, profilesRes, automationsRes] = await Promise.all([
      adminSupabase.from("sales").select("total, created_at").eq("pet_shop_id", getTenantId()),
      adminSupabase.from("appointments").select("*").eq("pet_shop_id", getTenantId()),
      adminSupabase.from("pets").select("id, name, breed, species, client_id").eq("pet_shop_id", getTenantId()),
      adminSupabase.from("profiles").select("id, full_name, phone, role, created_at").eq("pet_shop_id", getTenantId()).eq("role", "client"),
      adminSupabase.from("automation_rules").select("enabled").eq("pet_shop_id", getTenantId()),
    ]);

    const sales = salesRes.data || [];
    const appointments = appointmentsRes.data || [];
    const pets = petsRes.data || [];
    const profiles = profilesRes.data || [];
    const automations = automationsRes.data || [];

    const petMap = new Map(pets.map((p) => [p.id, p]));
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    // KPI 1: Faturamento hoje vs. ontem
    const revenueToday = sales
      .filter((s) => new Date(s.created_at) >= todayStart && new Date(s.created_at) < todayEnd)
      .reduce((sum, s) => sum + Number(s.total || 0), 0);
    const revenueYesterday = sales
      .filter((s) => new Date(s.created_at) >= yesterdayStart && new Date(s.created_at) < todayStart)
      .reduce((sum, s) => sum + Number(s.total || 0), 0);
    const revenueChangePct =
      revenueYesterday > 0 ? Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100) : null;

    // KPI 2: Agenda do dia
    const todaysAppointments = appointments.filter((a) => {
      const d = new Date(a.scheduled_at);
      return d >= todayStart && d < todayEnd && a.status !== "cancelado";
    });
    const breakdown = { banho: 0, tosa: 0, vet: 0, outros: 0 };
    todaysAppointments.forEach((a) => {
      const t = (a.service_type || "").toLowerCase();
      if (t.includes("vet") || t.includes("consulta")) breakdown.vet++;
      else if (t.includes("tosa")) breakdown.tosa++;
      else if (t.includes("banho")) breakdown.banho++;
      else breakdown.outros++;
    });

    // KPI 3: Novos clientes na última semana
    const newClientsThisWeek = profiles.filter((p) => new Date(p.created_at) >= weekAgo).length;

    // KPI 4: Automações ativas
    const activeAutomations = automations.filter((a) => a.enabled).length;

    // Próximos atendimentos de hoje (lista)
    const upcoming = todaysAppointments
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, 5)
      .map((a) => {
        const pet = petMap.get(a.pet_id);
        const tutor = pet?.client_id ? profileMap.get(pet.client_id) : null;
        const d = new Date(a.scheduled_at);
        return {
          time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
          pet: pet?.name || "Pet",
          breed: pet?.breed || pet?.species || "",
          service: a.service_type,
          status: a.status,
          tutor: tutor?.full_name || "Tutor",
        };
      });

    return NextResponse.json({
      revenueToday,
      revenueChangePct,
      todaysAppointmentsCount: todaysAppointments.length,
      breakdown,
      newClientsThisWeek,
      totalClients: profiles.length,
      activeAutomations,
      totalAutomations: automations.length,
      upcoming,
    });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/dashboard:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
