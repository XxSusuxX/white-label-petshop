import { createAdminClient } from "@/lib/supabase/admin";

const PET_SHOP_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_INTERVAL_MINUTES = 60;

export interface BusinessHoursRow {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
  slot_interval_minutes: number;
}

const FALLBACK_ROWS: BusinessHoursRow[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day_of_week: day,
  open_time: "09:00",
  close_time: "18:00",
  is_closed: day === 0,
  slot_interval_minutes: DEFAULT_INTERVAL_MINUTES,
}));

/** Garante que exista uma linha de business_hours para cada dia da semana (seg-sáb aberto, domingo fechado por padrão). */
export async function ensureBusinessHours(): Promise<BusinessHoursRow[]> {
  const adminSupabase = createAdminClient();
  const { data: existing } = await adminSupabase
    .from("business_hours")
    .select("*")
    .eq("pet_shop_id", PET_SHOP_ID);

  const existingDays = new Set((existing || []).map((r) => r.day_of_week));
  const missing = FALLBACK_ROWS.filter((r) => !existingDays.has(r.day_of_week));

  if (missing.length > 0) {
    const { data: seeded, error } = await adminSupabase
      .from("business_hours")
      .insert(missing.map((r) => ({ ...r, pet_shop_id: PET_SHOP_ID })))
      .select();
    if (!error && seeded) {
      return [...(existing || []), ...seeded].sort((a, b) => a.day_of_week - b.day_of_week);
    }
  }

  return (existing && existing.length > 0 ? existing : FALLBACK_ROWS).sort((a, b) => a.day_of_week - b.day_of_week);
}

/** Parseia "YYYY-MM-DD" como data local (evita o shift de fuso horário do parser UTC nativo do Date). */
function parseDateOnlyLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Gera os horários possíveis para uma data (considerando o horário de
 * funcionamento do dia da semana e bloqueios de data pontuais). Não filtra
 * horários já ocupados por outros agendamentos — isso é responsabilidade de
 * quem consome (ver GET /api/appointments/availability).
 */
export async function generateSlotsForDate(
  dateStr: string,
  durationMinutes: number
): Promise<{ slots: string[]; closed: boolean; closedReason?: string }> {
  const adminSupabase = createAdminClient();

  const { data: blocked } = await adminSupabase
    .from("blocked_dates")
    .select("*")
    .eq("pet_shop_id", PET_SHOP_ID)
    .eq("blocked_date", dateStr)
    .maybeSingle();

  if (blocked) {
    return { slots: [], closed: true, closedReason: blocked.reason || "Fechado nesta data." };
  }

  const dayOfWeek = parseDateOnlyLocal(dateStr).getDay();

  const { data: hoursRow } = await adminSupabase
    .from("business_hours")
    .select("*")
    .eq("pet_shop_id", PET_SHOP_ID)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  const effective: BusinessHoursRow = hoursRow || FALLBACK_ROWS[dayOfWeek];

  if (effective.is_closed) {
    return { slots: [], closed: true, closedReason: "Fechado neste dia da semana." };
  }

  const [openH, openM] = String(effective.open_time).slice(0, 5).split(":").map(Number);
  const [closeH, closeM] = String(effective.close_time).slice(0, 5).split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const interval = effective.slot_interval_minutes || DEFAULT_INTERVAL_MINUTES;

  const slots: string[] = [];
  for (let t = openMinutes; t + durationMinutes <= closeMinutes; t += interval) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }

  return { slots, closed: false };
}
