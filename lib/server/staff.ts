import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId } from "@/lib/server/tenant";

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

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  dono: "Dono(a)",
  veterinario: "Veterinário(a)",
  veterinarian: "Veterinário(a)",
  banhista_tosador: "Banhista & Tosador(a)",
  bather: "Banhista & Tosador(a)",
  groomer: "Banhista & Tosador(a)",
  recepcionista: "Recepcionista",
  receptionist: "Recepcionista",
  entregador: "Entregador",
  auxiliar: "Auxiliar Geral",
  employee: "Funcionário Geral",
  funcionario: "Funcionário Geral",
};

export interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  role_label: string;
  label: string;
}

export function formatStaffLabel(fullName: string, roleLabel: string) {
  return `${fullName} (${roleLabel})`;
}

/** Lista os membros da equipe (perfis com cargo != cliente), a partir de profiles.role. */
export async function getActiveStaffList(): Promise<StaffMember[]> {
  const adminSupabase = createAdminClient();
  const { data: profiles } = await adminSupabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("pet_shop_id", getTenantId())
    .in("role", STAFF_ROLES);

  return (profiles || []).map((p) => {
    const roleLabel = ROLE_LABELS[p.role] || p.role || "Funcionário";
    const fullName = p.full_name || "Colaborador";
    return {
      id: p.id,
      full_name: fullName,
      role: p.role,
      role_label: roleLabel,
      label: formatStaffLabel(fullName, roleLabel),
    };
  });
}

/**
 * Verifica se um profissional (identificado pela string exibida no seletor,
 * ex.: "Ana Costa (Banhista & Tosador(a))") está de fato escalado para
 * trabalhar no dia/horário do agendamento, segundo staff_schedules.
 * Se o profissional for "Não atribuído" ou não corresponder a nenhum membro
 * cadastrado (ex.: nome digitado livremente em dados antigos), não bloqueia.
 */
export async function checkStaffShiftCapacity(
  professionalLabel: string | null | undefined,
  scheduledAtIso: string
): Promise<{ ok: boolean; reason?: string }> {
  if (!professionalLabel || professionalLabel === "Não atribuído") return { ok: true };

  const staffList = await getActiveStaffList();
  const staff = staffList.find((s) => s.label === professionalLabel);
  if (!staff) return { ok: true };

  const adminSupabase = createAdminClient();

  // Enforcement é opt-in: se o admin nunca configurou nenhuma escala para esse
  // profissional, não bloqueia (evita quebrar agendamentos em instalações que
  // ainda não usam a tela de Escala da Equipe).
  const { count: configuredDays } = await adminSupabase
    .from("staff_schedules")
    .select("id", { count: "exact", head: true })
    .eq("pet_shop_id", getTenantId())
    .eq("staff_id", staff.id);
  if (!configuredDays) return { ok: true };

  const scheduledDate = new Date(scheduledAtIso);
  const dayOfWeek = scheduledDate.getDay();

  const { data: schedule } = await adminSupabase
    .from("staff_schedules")
    .select("*")
    .eq("pet_shop_id", getTenantId())
    .eq("staff_id", staff.id)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (!schedule || !schedule.is_active) {
    const DAY_LABELS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
    return { ok: false, reason: `${staff.full_name} não está escalado(a) para trabalhar ${DAY_LABELS[dayOfWeek]}.` };
  }

  const minutesOfDay = scheduledDate.getHours() * 60 + scheduledDate.getMinutes();
  const [startH, startM] = String(schedule.start_time).slice(0, 5).split(":").map(Number);
  const [endH, endM] = String(schedule.end_time).slice(0, 5).split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (minutesOfDay < startMinutes || minutesOfDay >= endMinutes) {
    return {
      ok: false,
      reason: `${staff.full_name} atende nesse dia das ${String(schedule.start_time).slice(0, 5)} às ${String(schedule.end_time).slice(0, 5)}.`,
    };
  }

  return { ok: true };
}
