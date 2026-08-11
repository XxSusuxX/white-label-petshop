import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureBusinessHours } from "@/lib/server/business-hours";

export const dynamic = "force-dynamic";

const PET_SHOP_ID = "00000000-0000-0000-0000-000000000001";

// GET: Lista o horário de funcionamento dos 7 dias da semana, semeando os padrões na primeira vez
export async function GET() {
  try {
    const hours = await ensureBusinessHours();
    return NextResponse.json({ hours });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/business-hours:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Atualiza o horário de um dia da semana específico
export async function PUT(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();
    const { day_of_week, open_time, close_time, is_closed, slot_interval_minutes } = body;

    if (day_of_week === undefined || day_of_week === null || day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json({ error: "day_of_week deve estar entre 0 e 6" }, { status: 400 });
    }

    await ensureBusinessHours();

    const { data, error } = await adminSupabase
      .from("business_hours")
      .update({
        open_time: open_time || "09:00",
        close_time: close_time || "18:00",
        is_closed: !!is_closed,
        slot_interval_minutes: slot_interval_minutes || 60,
        updated_at: new Date().toISOString(),
      })
      .eq("pet_shop_id", PET_SHOP_ID)
      .eq("day_of_week", day_of_week)
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar business_hours:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, hours: data });
  } catch (err: any) {
    console.error("Erro em PUT /api/admin/business-hours:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
