import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const POST = withTenantRoute(async (request: Request) => {
  try {
    // O id do usuário vem da sessão verificada no servidor, nunca do corpo da
    // requisição — caso contrário qualquer chamador poderia sobrescrever o
    // perfil (nome/telefone) e mesclar registros de "convidado" na conta de
    // outro usuário só informando o userId dele.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const userId = user.id;

    const { fullName, phone } = await request.json();

    const adminSupabase = createAdminClient();

    // 1. Garantir que o pet shop do tenant atual existe
    await adminSupabase.from("pet_shops").upsert({
      id: getTenantId(),
      name: "PetNexus Matriz",
    });

    // Telefone normalizado (só dígitos) para casar com perfis convidado criados via /api/agendar
    const cleanPhone = phone ? String(phone).replace(/\D/g, "") : "";

    // 2. Inserir ou atualizar perfil com admin client (bypassing RLS)
    const { error: profileErr } = await adminSupabase.from("profiles").upsert({
      id: userId,
      full_name: fullName || "Tutor",
      phone: cleanPhone || null,
      role: "client",
      pet_shop_id: getTenantId(),
    });

    if (profileErr) {
      console.error("Erro ao salvar profile no server:", profileErr);
      return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }

    // 2b. Mescla um perfil "convidado" (criado sem conta via link público, com o
    // mesmo telefone) para dentro da conta real: transfere pets, pacotes e
    // notificações e remove o perfil duplicado. Evita que o tutor agende via
    // link, depois crie a conta e "perca" o histórico.
    if (cleanPhone && cleanPhone.length >= 8) {
      const { data: guests } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("pet_shop_id", getTenantId())
        .eq("phone", cleanPhone)
        .neq("id", userId)
        .limit(10);

      for (const guest of guests || []) {
        await adminSupabase.from("pets").update({ client_id: userId }).eq("client_id", guest.id);
        await adminSupabase.from("client_packages").update({ client_id: userId }).eq("client_id", guest.id);
        await adminSupabase.from("notifications").update({ client_id: userId }).eq("client_id", guest.id);
        await adminSupabase.from("profiles").delete().eq("id", guest.id);
      }
    }

    // Cacheia o role em app_metadata para o middleware não precisar consultar profiles a cada navegação
    await adminSupabase.auth.admin.updateUserById(userId, { app_metadata: { role: "client" } }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro em /api/auth/register-google:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
