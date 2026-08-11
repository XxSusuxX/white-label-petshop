import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getWhatsAppConfig,
  getEvolutionQrCode,
  getEvolutionConnectionState,
  verifyOfficialCredentials,
  verifyTwilioCredentials,
  getUazapiQrCode,
  getUazapiConnectionState,
} from "@/lib/server/whatsapp";

export const dynamic = "force-dynamic";

const PET_SHOP_ID = "00000000-0000-0000-0000-000000000001";

// POST: Inicia a conexão com o provedor configurado.
// - evolution: retorna um QR code real para o admin escanear no celular.
// - official / twilio: valida as credenciais direto na API do provedor.
export async function POST() {
  try {
    const config = await getWhatsAppConfig();
    if (!config || config.provider === "none") {
      return NextResponse.json({ error: "Selecione um provedor antes de conectar." }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    if (config.provider === "evolution") {
      const result = await getEvolutionQrCode(config);
      if (result.error) {
        await adminSupabase
          .from("whatsapp_config")
          .update({ last_error: result.error, last_checked_at: new Date().toISOString() })
          .eq("pet_shop_id", PET_SHOP_ID);
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ qrCodeBase64: result.qrCodeBase64 });
    }

    if (config.provider === "official") {
      const result = await verifyOfficialCredentials(config);
      await adminSupabase
        .from("whatsapp_config")
        .update({
          is_connected: result.connected,
          connected_number: result.number || "",
          last_error: result.error || "",
          last_checked_at: new Date().toISOString(),
        })
        .eq("pet_shop_id", PET_SHOP_ID);

      if (!result.connected) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ connected: true, number: result.number });
    }

    if (config.provider === "twilio") {
      const result = await verifyTwilioCredentials(config);
      await adminSupabase
        .from("whatsapp_config")
        .update({
          is_connected: result.connected,
          connected_number: result.number || "",
          last_error: result.error || "",
          last_checked_at: new Date().toISOString(),
        })
        .eq("pet_shop_id", PET_SHOP_ID);

      if (!result.connected) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ connected: true, number: result.number });
    }

    if (config.provider === "uazapi") {
      const result = await getUazapiQrCode(config);
      if (result.error) {
        await adminSupabase
          .from("whatsapp_config")
          .update({ last_error: result.error, last_checked_at: new Date().toISOString() })
          .eq("pet_shop_id", PET_SHOP_ID);
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      if (!result.qrCodeBase64) {
        // Sem QR retornado — a instância pode já estar conectada; confirma via status.
        const state = await getUazapiConnectionState(config);
        await adminSupabase
          .from("whatsapp_config")
          .update({
            is_connected: state.connected,
            connected_number: state.number || "",
            last_checked_at: new Date().toISOString(),
          })
          .eq("pet_shop_id", PET_SHOP_ID);
        if (state.connected) return NextResponse.json({ connected: true, number: state.number });
        return NextResponse.json({ error: "Não foi possível obter o QR code. Verifique a URL e o token." }, { status: 400 });
      }
      return NextResponse.json({ qrCodeBase64: result.qrCodeBase64 });
    }

    return NextResponse.json({ error: "Provedor desconhecido." }, { status: 400 });
  } catch (err: any) {
    console.error("Erro em POST /api/admin/whatsapp-config/connect:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: Consulta o status de conexão atual (usado para o polling depois de escanear o QR da Evolution)
export async function GET() {
  try {
    const config = await getWhatsAppConfig();
    if (!config || config.provider === "none") {
      return NextResponse.json({ connected: false });
    }

    if (config.provider !== "evolution" && config.provider !== "uazapi") {
      return NextResponse.json({ connected: config.is_connected, number: config.connected_number });
    }

    const state =
      config.provider === "evolution"
        ? await getEvolutionConnectionState(config)
        : await getUazapiConnectionState(config);

    const adminSupabase = createAdminClient();
    await adminSupabase
      .from("whatsapp_config")
      .update({
        is_connected: state.connected,
        connected_number: state.number || "",
        last_checked_at: new Date().toISOString(),
      })
      .eq("pet_shop_id", PET_SHOP_ID);

    return NextResponse.json({ connected: state.connected, number: state.number, error: state.error });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/whatsapp-config/connect:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
