import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureWhatsAppConfig } from "@/lib/server/whatsapp";

export const dynamic = "force-dynamic";

const PET_SHOP_ID = "00000000-0000-0000-0000-000000000001";
const SECRET_FIELDS = ["evolution_api_key", "official_access_token", "twilio_auth_token", "uazapi_token"];
const MASK = "••••••••";

function maskSecret(value: string | null | undefined) {
  if (!value) return "";
  return value.length > 4 ? `${MASK}${value.slice(-4)}` : MASK;
}

// GET: Retorna a configuração atual do WhatsApp com os campos sensíveis mascarados
export async function GET() {
  try {
    const config = await ensureWhatsAppConfig();
    const masked = { ...config } as any;
    for (const field of SECRET_FIELDS) {
      masked[field] = maskSecret(config[field as keyof typeof config] as string);
    }
    masked[`_has_evolution_api_key`] = !!config.evolution_api_key;
    masked[`_has_official_access_token`] = !!config.official_access_token;
    masked[`_has_twilio_auth_token`] = !!config.twilio_auth_token;
    masked[`_has_uazapi_token`] = !!config.uazapi_token;

    return NextResponse.json({ config: masked });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/whatsapp-config:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Salva a configuração. Campos secretos só são sobrescritos se um valor novo
// (não mascarado) for enviado — assim o formulário pode reenviar o resto sem
// precisar que o admin redigite a chave toda vez.
export async function PUT(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    const plainFields = [
      "provider",
      "evolution_api_url",
      "evolution_instance_name",
      "official_phone_number_id",
      "official_waba_id",
      "twilio_account_sid",
      "twilio_whatsapp_number",
      "uazapi_api_url",
      "admin_notify_phone",
    ];
    for (const field of plainFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    for (const field of SECRET_FIELDS) {
      const value = body[field];
      if (value !== undefined && value !== "" && !String(value).startsWith(MASK)) {
        updateData[field] = value;
      }
    }

    // Qualquer alteração de configuração invalida o status de conexão anterior
    if (Object.keys(updateData).length > 1) {
      updateData.is_connected = false;
    }

    await ensureWhatsAppConfig();

    const { data, error } = await adminSupabase
      .from("whatsapp_config")
      .update(updateData)
      .eq("pet_shop_id", PET_SHOP_ID)
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar whatsapp_config:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config: data });
  } catch (err: any) {
    console.error("Erro em PUT /api/admin/whatsapp-config:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Desconecta a instância sem apagar as credenciais salvas (facilita reconectar depois)
export async function PATCH() {
  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("whatsapp_config")
      .update({ is_connected: false, connected_number: "", updated_at: new Date().toISOString() })
      .eq("pet_shop_id", PET_SHOP_ID);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro em PATCH /api/admin/whatsapp-config:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
