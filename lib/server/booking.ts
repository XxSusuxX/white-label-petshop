import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId } from "@/lib/server/tenant";

const DEFAULT_DURATION_MINUTES = 60;

interface ConflictCheckParams {
  scheduledAt: string;
  serviceId?: string | null;
  durationMinutes?: number;
  professional?: string | null;
  excludeAppointmentId?: string;
}

interface ConflictResult {
  id: string;
  scheduled_at: string;
  professional: string | null;
}

/**
 * Verifica se um horário conflita com outro agendamento existente (mesmo intervalo
 * de tempo, considerando a duração do serviço). Se ambos os agendamentos têm um
 * profissional atribuído e são diferentes, não é tratado como conflito — do
 * contrário (profissional "Não atribuído" ou ausente), o conflito é verificado
 * no petshop inteiro, já que não há como saber se seriam atendidos em paralelo.
 */
export async function findSchedulingConflict(params: ConflictCheckParams): Promise<ConflictResult | null> {
  const adminSupabase = createAdminClient();

  let ownDuration = params.durationMinutes;
  if (!ownDuration && params.serviceId) {
    const { data: service } = await adminSupabase
      .from("services")
      .select("duration_minutes")
      .eq("id", params.serviceId)
      .maybeSingle();
    ownDuration = service?.duration_minutes || DEFAULT_DURATION_MINUTES;
  }
  ownDuration = ownDuration || DEFAULT_DURATION_MINUTES;

  const start = new Date(params.scheduledAt);
  const end = new Date(start.getTime() + ownDuration * 60000);

  // Busca apenas a janela relevante (margem de 12h), em vez de carregar TODOS
  // os agendamentos do petshop em memória. O overlap exato continua sendo
  // calculado aqui com a duração de cada serviço.
  const WINDOW_MS = 12 * 60 * 60000;
  const windowStart = new Date(start.getTime() - WINDOW_MS).toISOString();
  const windowEnd = new Date(end.getTime() + WINDOW_MS).toISOString();

  const { data: candidates, error } = await adminSupabase
    .from("appointments")
    .select("id, scheduled_at, professional, services ( duration_minutes )")
    .eq("pet_shop_id", getTenantId())
    .not("status", "in", "(cancelado,bloqueio)")
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd);

  if (error) throw new Error(error.message);

  const ownProfessional = params.professional && params.professional !== "Não atribuído" ? params.professional : null;

  for (const c of candidates || []) {
    if (params.excludeAppointmentId && c.id === params.excludeAppointmentId) continue;

    const candidateProfessional = c.professional && c.professional !== "Não atribuído" ? c.professional : null;
    if (ownProfessional && candidateProfessional && ownProfessional !== candidateProfessional) {
      continue;
    }

    const cStart = new Date(c.scheduled_at);
    const svc = Array.isArray(c.services) ? c.services[0] : c.services;
    const cDuration = svc?.duration_minutes || DEFAULT_DURATION_MINUTES;
    const cEnd = new Date(cStart.getTime() + cDuration * 60000);

    if (start < cEnd && cStart < end) {
      return { id: c.id, scheduled_at: c.scheduled_at, professional: c.professional };
    }
  }

  return null;
}
