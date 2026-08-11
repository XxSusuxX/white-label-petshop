import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { userId, fullName, phone } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID é obrigatório." }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 1. Garantir pet shop matriz padrão
    await adminSupabase.from("pet_shops").upsert({
      id: "00000000-0000-0000-0000-000000000001",
      name: "PetNexus Matriz",
    });

    // 2. Inserir ou atualizar perfil com admin client (bypassing RLS)
    const { error: profileErr } = await adminSupabase.from("profiles").upsert({
      id: userId,
      full_name: fullName || "Tutor",
      phone: phone || null,
      role: "client",
      pet_shop_id: "00000000-0000-0000-0000-000000000001",
    });

    if (profileErr) {
      console.error("Erro ao salvar profile no server:", profileErr);
      return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }

    // Cacheia o role em app_metadata para o middleware não precisar consultar profiles a cada navegação
    await adminSupabase.auth.admin.updateUserById(userId, { app_metadata: { role: "client" } }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro em /api/auth/register-google:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
