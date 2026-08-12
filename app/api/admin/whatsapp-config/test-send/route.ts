import { NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/server/whatsapp";
import { withTenantRoute } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

// POST: Envia uma mensagem de teste de verdade através do provedor configurado
// (Evolution/UazAPI/Oficial/Twilio) — usado pelo botão "Testar Envio via API"
// na tela de automações do WhatsApp, em vez do antigo link wa.me manual.
export const POST = withTenantRoute(async (request: Request) => {
  try {
    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !String(phone).trim()) {
      return NextResponse.json({ error: "Informe um número de telefone." }, { status: 400 });
    }
    if (!message || !String(message).trim()) {
      return NextResponse.json({ error: "A mensagem está vazia." }, { status: 400 });
    }

    const result = await sendWhatsAppMessage(phone, message);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Falha ao enviar mensagem." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro em POST /api/admin/whatsapp-config/test-send:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
