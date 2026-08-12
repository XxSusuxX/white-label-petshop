import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveStaffList } from "@/lib/server/staff";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

// GET: Lista a equipe (perfis com cargo de staff) com a escala semanal de cada um
export const GET = withTenantRoute(async () => {
  try {
    const staff = await getActiveStaffList();
    const adminSupabase = createAdminClient();

    const { data: schedules } = await adminSupabase
      .from("staff_schedules")
      .select("*")
      .eq("pet_shop_id", getTenantId())
      .in("staff_id", staff.map((s) => s.id).length > 0 ? staff.map((s) => s.id) : ["00000000-0000-0000-0000-000000000000"]);

    const scheduleByStaff = new Map<string, Record<number, any>>();
    for (const row of schedules || []) {
      const map = scheduleByStaff.get(row.staff_id) || {};
      map[row.day_of_week] = {
        start_time: String(row.start_time).slice(0, 5),
        end_time: String(row.end_time).slice(0, 5),
        is_active: row.is_active,
      };
      scheduleByStaff.set(row.staff_id, map);
    }

    const result = staff.map((s) => ({
      ...s,
      schedule: scheduleByStaff.get(s.id) || {},
    }));

    return NextResponse.json({ staff: result });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/staff:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

// PUT: Cria/atualiza o turno de um membro da equipe em um dia da semana
export const PUT = withTenantRoute(async (request: Request) => {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();
    const { staff_id, day_of_week, start_time, end_time, is_active } = body;

    if (!staff_id || day_of_week === undefined || day_of_week === null) {
      return NextResponse.json({ error: "staff_id e day_of_week são obrigatórios" }, { status: 400 });
    }
    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json({ error: "day_of_week deve estar entre 0 e 6" }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from("staff_schedules")
      .upsert(
        {
          pet_shop_id: getTenantId(),
          staff_id,
          day_of_week,
          start_time: start_time || "09:00",
          end_time: end_time || "18:00",
          is_active: is_active !== undefined ? is_active : true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "staff_id,day_of_week" }
      )
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar staff_schedule:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, schedule: data });
  } catch (err: any) {
    console.error("Erro em PUT /api/admin/staff:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
