import { createAdminClient } from "@/lib/supabase/admin";

const PET_SHOP_ID = "00000000-0000-0000-0000-000000000001";

export type NotificationType =
  | "agendamento_criado"
  | "agendamento_confirmado"
  | "agendamento_alterado"
  | "agendamento_cancelado"
  | "lembrete"
  | "mensagem";

/** Best-effort: nunca lança erro, para não travar a operação principal (ex.: criar agendamento). */
export async function createNotification(params: {
  clientId: string;
  appointmentId?: string | null;
  type: NotificationType;
  title: string;
  body?: string;
}) {
  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.from("notifications").insert({
      pet_shop_id: PET_SHOP_ID,
      client_id: params.clientId,
      appointment_id: params.appointmentId || null,
      type: params.type,
      title: params.title,
      body: params.body || "",
    });
    if (error) console.error("Erro ao criar notificação:", error.message);
  } catch (err: any) {
    console.error("Erro inesperado ao criar notificação:", err.message);
  }
}

/** Busca o client_id (tutor) dono de um agendamento a partir do pet_id. */
export async function getClientIdForPet(petId: string): Promise<string | null> {
  const adminSupabase = createAdminClient();
  const { data: pet } = await adminSupabase.from("pets").select("client_id").eq("id", petId).maybeSingle();
  return pet?.client_id || null;
}
