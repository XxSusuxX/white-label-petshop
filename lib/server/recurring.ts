import { createAdminClient } from "@/lib/supabase/admin";
import { findSchedulingConflict } from "@/lib/server/booking";
import { getTenantId } from "@/lib/server/tenant";

/** Cria a recorrência (o "molde") antes do primeiro agendamento, para que ele já
 * nasça com recurring_booking_id preenchido. Retorna null em caso de erro. */
export async function createRecurringBooking(params: {
  petId: string;
  serviceId: string | null;
  serviceType: string;
  professional: string;
  price: number;
  address: string;
  intervalDays: number;
}): Promise<string | null> {
  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("recurring_bookings")
    .insert({
      pet_shop_id: getTenantId(),
      pet_id: params.petId,
      service_id: params.serviceId,
      service_type: params.serviceType,
      professional: params.professional,
      price: params.price,
      address: params.address,
      interval_days: params.intervalDays,
      status: "ativo",
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar recurring_booking:", error.message);
    return null;
  }
  return data.id;
}

/**
 * Chamado quando um agendamento muda para "concluido". Se ele pertencer a uma
 * recorrência ativa, cria automaticamente a próxima ocorrência (scheduled_at +
 * interval_days). Best-effort: nunca lança erro, e não cria nada se detectar
 * conflito de horário (para não duplicar/sobrepor agendamentos silenciosamente).
 */
export async function scheduleNextRecurrence(appointment: {
  pet_id: string;
  service_id: string | null;
  service_type: string;
  professional: string;
  price: number;
  address: string;
  scheduled_at: string;
  recurring_booking_id: string | null;
}) {
  if (!appointment.recurring_booking_id) return;

  try {
    const adminSupabase = createAdminClient();
    const { data: recurring } = await adminSupabase
      .from("recurring_bookings")
      .select("*")
      .eq("id", appointment.recurring_booking_id)
      .maybeSingle();

    if (!recurring || recurring.status !== "ativo") return;

    const nextDate = new Date(appointment.scheduled_at);
    nextDate.setDate(nextDate.getDate() + recurring.interval_days);
    const nextDateIso = nextDate.toISOString();

    const conflict = await findSchedulingConflict({
      scheduledAt: nextDateIso,
      serviceId: appointment.service_id,
      professional: appointment.professional,
    });
    if (conflict) {
      console.warn(
        `Recorrência ${recurring.id}: conflito de horário em ${nextDateIso}, próxima ocorrência não foi criada automaticamente.`
      );
      return;
    }

    await adminSupabase.from("appointments").insert({
      pet_id: appointment.pet_id,
      pet_shop_id: getTenantId(),
      service_id: appointment.service_id,
      service_type: appointment.service_type,
      scheduled_at: nextDateIso,
      professional: appointment.professional,
      price: appointment.price,
      status: "agendado",
      notes: "Status: agendado | [STEP:0]",
      address: appointment.address || "",
      recurring_booking_id: recurring.id,
    });
  } catch (err: any) {
    console.error("Erro ao criar próxima ocorrência recorrente:", err.message);
  }
}
