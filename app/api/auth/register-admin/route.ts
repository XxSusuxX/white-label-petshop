import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email, password, fullName, phone, adminSecretKey } = await request.json();

    if (adminSecretKey?.trim() !== "admin123") {
      return NextResponse.json({ error: "Chave secreta de administrador incorreta." }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 1. Garantir pet shop matriz padrão
    await adminSupabase.from("pet_shops").upsert({
      id: "00000000-0000-0000-0000-000000000001",
      name: "PetNexus Matriz",
    });

    // 2. Verificar se o usuário já existe no auth.users
    const { data: usersData } = await adminSupabase.auth.admin.listUsers();
    const existingUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    let userId = existingUser?.id;

    if (!existingUser) {
      // Criar nova conta no Supabase Auth
      const { data: newUserData, error: createError } =
        await adminSupabase.auth.admin.createUser({
          email: email.trim(),
          password: password,
          email_confirm: true,
          user_metadata: { full_name: fullName, phone, role: "admin" },
        });

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      userId = newUserData.user?.id;
    }

    if (userId) {
      // 3. Atualizar/Inserir perfil como 'admin'
      const { error: profileErr } = await adminSupabase.from("profiles").upsert({
        id: userId,
        full_name: fullName || "Administrador",
        phone: phone || null,
        role: "admin",
        pet_shop_id: "00000000-0000-0000-0000-000000000001",
      });

      if (profileErr) {
        return NextResponse.json({ error: profileErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro em /api/auth/register-admin:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
