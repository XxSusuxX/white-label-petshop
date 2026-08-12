import { createAdminClient } from "@/lib/supabase/admin";
import { getWhatsAppConfig, sendWhatsAppMessage } from "@/lib/server/whatsapp";
import { getTenantId } from "@/lib/server/tenant";

function fillTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_match, key) => vars[key] ?? "");
}

/**
 * Dispara uma automação de WhatsApp real pela rule_key configurada em
 * automation_rules. Best-effort: nunca lança erro (não deve travar o fluxo
 * principal, ex.: mudar o status de um agendamento), apenas retorna se
 * conseguiu enviar e, se não, o motivo (regra desativada, WhatsApp
 * desconectado, tutor sem telefone, etc.).
 */
export async function triggerAutomation(
  ruleKey: string,
  phone: string | null | undefined,
  vars: Record<string, string>
): Promise<{ sent: boolean; reason?: string }> {
  try {
    if (!phone) return { sent: false, reason: "Tutor sem telefone cadastrado." };

    const adminSupabase = createAdminClient();
    const { data: rule } = await adminSupabase
      .from("automation_rules")
      .select("*")
      .eq("pet_shop_id", getTenantId())
      .eq("rule_key", ruleKey)
      .maybeSingle();

    if (!rule || !rule.enabled) {
      return { sent: false, reason: "Regra de automação desativada ou não encontrada." };
    }

    const config = await getWhatsAppConfig();
    if (!config || config.provider === "none" || !config.is_connected) {
      return { sent: false, reason: "Nenhum WhatsApp conectado." };
    }

    const message = fillTemplate(rule.message_template || "", vars).trim();
    if (!message) return { sent: false, reason: "Mensagem da automação está vazia." };

    const result = await sendWhatsAppMessage(phone, message);
    return { sent: result.success, reason: result.error };
  } catch (err: any) {
    console.error(`Erro ao disparar automação "${ruleKey}":`, err.message);
    return { sent: false, reason: err.message };
  }
}

/** Busca tutor (nome/telefone) e nome do pet a partir do pet_id, para preencher templates de automação. */
export async function getBookingContactInfo(
  petId: string
): Promise<{ clientId: string; tutorName: string; tutorPhone: string; petName: string } | null> {
  const adminSupabase = createAdminClient();
  const { data: pet } = await adminSupabase.from("pets").select("client_id, name").eq("id", petId).maybeSingle();
  if (!pet?.client_id) return null;

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", pet.client_id)
    .maybeSingle();

  return {
    clientId: pet.client_id,
    tutorName: profile?.full_name || "Tutor",
    tutorPhone: profile?.phone || "",
    petName: pet.name || "seu pet",
  };
}
