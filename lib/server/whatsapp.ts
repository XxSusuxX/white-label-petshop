import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId } from "@/lib/server/tenant";

export type WhatsAppProvider = "none" | "evolution" | "official" | "twilio" | "uazapi";

export interface WhatsAppConfig {
  id: string;
  provider: WhatsAppProvider;
  is_connected: boolean;
  connected_number: string;
  last_checked_at: string | null;
  last_error: string;
  evolution_api_url: string;
  evolution_api_key: string;
  evolution_instance_name: string;
  official_phone_number_id: string;
  official_waba_id: string;
  official_access_token: string;
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_whatsapp_number: string;
  uazapi_api_url: string;
  uazapi_token: string;
}

export async function getWhatsAppConfig(): Promise<WhatsAppConfig | null> {
  const adminSupabase = createAdminClient();
  const { data } = await adminSupabase
    .from("whatsapp_config")
    .select("*")
    .eq("pet_shop_id", getTenantId())
    .maybeSingle();
  return data as WhatsAppConfig | null;
}

export async function ensureWhatsAppConfig(): Promise<WhatsAppConfig> {
  const existing = await getWhatsAppConfig();
  if (existing) return existing;

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("whatsapp_config")
    .insert({ pet_shop_id: getTenantId(), provider: "none" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as WhatsAppConfig;
}

/**
 * Envia uma mensagem de WhatsApp através do provedor configurado pelo admin.
 * Retorna { success: false } (nunca lança) se não houver provedor conectado —
 * quem chamar deve decidir se cai para o fallback manual (link wa.me).
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getWhatsAppConfig();
    if (!config || config.provider === "none") {
      return { success: false, error: "Nenhum provedor de WhatsApp configurado." };
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      return { success: false, error: "Número de telefone inválido." };
    }

    if (config.provider === "evolution") {
      return sendViaEvolution(config, cleanPhone, message);
    }
    if (config.provider === "official") {
      return sendViaOfficial(config, cleanPhone, message);
    }
    if (config.provider === "twilio") {
      return sendViaTwilio(config, cleanPhone, message);
    }
    if (config.provider === "uazapi") {
      return sendViaUazapi(config, cleanPhone, message);
    }

    return { success: false, error: "Provedor desconhecido." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==============================================================================
// Evolution API — instância self-hosted baseada em Baileys (WhatsApp Web).
// Segue o contrato REST mais comum da v2 (github.com/EvolutionAPI/evolution-api).
// Versões/forks diferentes podem variar os caminhos exatos — ajuste aqui se a
// instância do usuário usar uma rota diferente.
// ==============================================================================
async function sendViaEvolution(config: WhatsAppConfig, phone: string, message: string) {
  if (!config.evolution_api_url || !config.evolution_instance_name) {
    return { success: false, error: "Evolution API não está totalmente configurada." };
  }
  const url = `${config.evolution_api_url.replace(/\/$/, "")}/message/sendText/${config.evolution_instance_name}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.evolution_api_key || "",
    },
    body: JSON.stringify({ number: phone, text: message }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { success: false, error: `Evolution API respondeu ${res.status}: ${body.slice(0, 200)}` };
  }
  return { success: true };
}

export async function getEvolutionQrCode(config: WhatsAppConfig): Promise<{ qrCodeBase64?: string; error?: string }> {
  if (!config.evolution_api_url || !config.evolution_instance_name) {
    return { error: "Preencha a URL da API, a chave e o nome da instância antes de conectar." };
  }
  const base = config.evolution_api_url.replace(/\/$/, "");

  try {
    // Tenta conectar a uma instância já existente e obter o QR code
    const connectRes = await fetch(`${base}/instance/connect/${config.evolution_instance_name}`, {
      method: "GET",
      headers: { apikey: config.evolution_api_key || "" },
    });

    if (connectRes.ok) {
      const data = await connectRes.json().catch(() => ({}));
      const qr = data?.base64 || data?.qrcode?.base64 || data?.qr;
      if (qr) return { qrCodeBase64: qr };
    }

    // Se a instância ainda não existe, tenta criá-la com QR code habilitado
    const createRes = await fetch(`${base}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config.evolution_api_key || "" },
      body: JSON.stringify({
        instanceName: config.evolution_instance_name,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });

    const createData = await createRes.json().catch(() => ({}));
    const qr = createData?.qrcode?.base64 || createData?.base64;
    if (!createRes.ok || !qr) {
      return { error: `Não foi possível obter o QR code (status ${createRes.status}). Verifique a URL e a chave da API.` };
    }
    return { qrCodeBase64: qr };
  } catch (err: any) {
    return { error: `Falha de conexão com a Evolution API: ${err.message}` };
  }
}

export async function getEvolutionConnectionState(config: WhatsAppConfig): Promise<{ connected: boolean; number?: string; error?: string }> {
  if (!config.evolution_api_url || !config.evolution_instance_name) {
    return { connected: false, error: "Instância não configurada." };
  }
  const base = config.evolution_api_url.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/instance/connectionState/${config.evolution_instance_name}`, {
      headers: { apikey: config.evolution_api_key || "" },
    });
    if (!res.ok) return { connected: false, error: `Status ${res.status}` };
    const data = await res.json().catch(() => ({}));
    const state = data?.instance?.state || data?.state;
    return { connected: state === "open" || state === "connected", number: data?.instance?.owner };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}

// ==============================================================================
// WhatsApp Cloud API oficial (Meta) — https://developers.facebook.com/docs/whatsapp
// ==============================================================================
async function sendViaOfficial(config: WhatsAppConfig, phone: string, message: string) {
  if (!config.official_phone_number_id || !config.official_access_token) {
    return { success: false, error: "WhatsApp Cloud API não está totalmente configurada." };
  }
  const res = await fetch(`https://graph.facebook.com/v19.0/${config.official_phone_number_id}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.official_access_token}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message },
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, error: body?.error?.message || `WhatsApp Cloud API respondeu ${res.status}` };
  }
  return { success: true };
}

export async function verifyOfficialCredentials(config: WhatsAppConfig): Promise<{ connected: boolean; number?: string; error?: string }> {
  if (!config.official_phone_number_id || !config.official_access_token) {
    return { connected: false, error: "Preencha o Phone Number ID e o Access Token." };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${config.official_phone_number_id}?fields=display_phone_number,verified_name`,
      { headers: { Authorization: `Bearer ${config.official_access_token}` } }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { connected: false, error: data?.error?.message || `Meta respondeu ${res.status}` };
    }
    return { connected: true, number: data.display_phone_number };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}

// ==============================================================================
// Twilio WhatsApp API — https://www.twilio.com/docs/whatsapp
// ==============================================================================
async function sendViaTwilio(config: WhatsAppConfig, phone: string, message: string) {
  if (!config.twilio_account_sid || !config.twilio_auth_token || !config.twilio_whatsapp_number) {
    return { success: false, error: "Twilio não está totalmente configurado." };
  }
  const auth = Buffer.from(`${config.twilio_account_sid}:${config.twilio_auth_token}`).toString("base64");
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.twilio_account_sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${config.twilio_whatsapp_number}`,
        To: `whatsapp:+${phone}`,
        Body: message,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, error: body?.message || `Twilio respondeu ${res.status}` };
  }
  return { success: true };
}

export async function verifyTwilioCredentials(config: WhatsAppConfig): Promise<{ connected: boolean; number?: string; error?: string }> {
  if (!config.twilio_account_sid || !config.twilio_auth_token) {
    return { connected: false, error: "Preencha o Account SID e o Auth Token." };
  }
  try {
    const auth = Buffer.from(`${config.twilio_account_sid}:${config.twilio_auth_token}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.twilio_account_sid}.json`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { connected: false, error: data?.message || `Twilio respondeu ${res.status}` };
    }
    return { connected: true, number: config.twilio_whatsapp_number };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}

// ==============================================================================
// UazAPI — instância WhatsApp (baseada em WhatsApp Web/Baileys), formato
// https://<subdominio>.uazapi.com. Contrato confirmado em docs.uazapi.com e no
// pacote oficial de integração n8n (n8n-nodes-uazapi-api): autenticação via
// header "token" (token da própria instância), endpoints POST /instance/connect
// (gera QR code), GET /instance/status (estado da conexão) e POST /send/text
// (envio de mensagem).
// ==============================================================================
async function sendViaUazapi(config: WhatsAppConfig, phone: string, message: string) {
  if (!config.uazapi_api_url || !config.uazapi_token) {
    return { success: false, error: "UazAPI não está totalmente configurada." };
  }
  const base = config.uazapi_api_url.replace(/\/$/, "");
  const res = await fetch(`${base}/send/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token: config.uazapi_token,
    },
    body: JSON.stringify({ number: phone, text: message }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { success: false, error: `UazAPI respondeu ${res.status}: ${body.slice(0, 200)}` };
  }
  return { success: true };
}

export async function getUazapiQrCode(config: WhatsAppConfig): Promise<{ qrCodeBase64?: string; error?: string }> {
  if (!config.uazapi_api_url || !config.uazapi_token) {
    return { error: "Preencha a URL da API e o token da instância antes de conectar." };
  }
  const base = config.uazapi_api_url.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/instance/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token: config.uazapi_token },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { error: data?.message || `UazAPI respondeu ${res.status} ao tentar conectar.` };
    }

    const qr = data?.instance?.qrcode || data?.qrcode || data?.base64 || data?.qr;
    if (!qr) {
      // Instância já pode estar conectada (sem QR necessário) — deixa o polling de status confirmar.
      return {};
    }
    return { qrCodeBase64: qr };
  } catch (err: any) {
    return { error: `Falha de conexão com a UazAPI: ${err.message}` };
  }
}

export async function getUazapiConnectionState(config: WhatsAppConfig): Promise<{ connected: boolean; number?: string; error?: string }> {
  if (!config.uazapi_api_url || !config.uazapi_token) {
    return { connected: false, error: "Instância não configurada." };
  }
  const base = config.uazapi_api_url.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/instance/status`, {
      headers: { token: config.uazapi_token },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { connected: false, error: data?.message || `Status ${res.status}` };
    }
    const status = data?.instance?.status || data?.status;
    const number = data?.instance?.owner || data?.owner || data?.instance?.profileName || data?.profileName;
    return { connected: status === "connected", number };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}
