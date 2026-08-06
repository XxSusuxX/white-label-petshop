import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PET_SHOP_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_DURATION_MINUTES = 60;

// GET ?date=YYYY-MM-DD&duration_minutes=60
// Retorna os intervalos de horário já ocupados naquele dia (para o cliente filtrar
// os horários disponíveis no agendamento). Não expõe dados de outros tutores.
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) {
      return NextResponse.json({ error: "date é obrigatório (YYYY-MM-DD)" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const { data: appointments, error } = await adminSupabase
      .from("appointments")
      .select("scheduled_at, service_id")
      .eq("pet_shop_id", PET_SHOP_ID)
      .gte("scheduled_at", dayStart.toISOString())
      .lte("scheduled_at", dayEnd.toISOString())
      .not("status", "in", "(cancelado,bloqueio)");

    if (error) {
      console.error("Erro ao buscar disponibilidade:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const serviceIds = Array.from(new Set((appointments || []).map((a) => a.service_id).filter(Boolean)));
    const durationMap = new Map<string, number>();
    if (serviceIds.length > 0) {
      const { data: services } = await adminSupabase
        .from("services")
        .select("id, duration_minutes")
        .in("id", serviceIds as string[]);
      (services || []).forEach((s) => durationMap.set(s.id, s.duration_minutes || DEFAULT_DURATION_MINUTES));
    }

    const occupied = (appointments || []).map((a) => {
      const start = new Date(a.scheduled_at);
      const duration = a.service_id ? durationMap.get(a.service_id) || DEFAULT_DURATION_MINUTES : DEFAULT_DURATION_MINUTES;
      const end = new Date(start.getTime() + duration * 60000);
      return { start: start.toISOString(), end: end.toISOString() };
    });

    return NextResponse.json({ occupied });
  } catch (err: any) {
    console.error("Erro em GET /api/appointments/availability:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
