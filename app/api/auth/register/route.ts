import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

export const POST = withTenantRoute(async (request: Request) => {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const { email, password, fullName, phone, petName, species, breed, sex } = body;

    if (!email || !email.trim() || !password || !password.trim()) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
    }

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "Nome completo é obrigatório." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? String(phone).replace(/\D/g, "") : "";

    // 1. Garantir que o pet shop do tenant atual existe
    await adminSupabase.from("pet_shops").upsert({
      id: getTenantId(),
      name: "PetNexus Matriz",
    });

    // 2. Verificar se o usuário já existe no auth.users
    const { data: usersData } = await adminSupabase.auth.admin.listUsers();
    const existingUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    let userId = existingUser?.id;

    if (!existingUser) {
      const { data: newUserData, error: createError } = await adminSupabase.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName.trim(),
          name: fullName.trim(),
          display_name: fullName.trim(),
          phone: phone?.trim() || "",
          role: "client",
        },
        app_metadata: { role: "client" },
      });

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      userId = newUserData.user?.id;
    } else {
      // Se o usuário já existia, atualiza metadados
      await adminSupabase.auth.admin.updateUserById(existingUser.id, {
        password: password,
        user_metadata: {
          ...existingUser.user_metadata,
          full_name: fullName.trim(),
          name: fullName.trim(),
          display_name: fullName.trim(),
          phone: phone?.trim() || "",
          role: "client",
        },
        app_metadata: { role: "client" },
      });
    }

    if (userId) {
      // 3. Inserir ou atualizar perfil com pet_shop_id garantido
      const { error: profileErr } = await adminSupabase.from("profiles").upsert({
        id: userId,
        full_name: fullName.trim(),
        phone: cleanPhone || phone?.trim() || null,
        role: "client",
        pet_shop_id: getTenantId(),
      });

      if (profileErr) {
        console.error("Erro ao salvar perfil em /api/auth/register:", profileErr);
        return NextResponse.json({ error: profileErr.message }, { status: 500 });
      }

      // 4. Cadastrar pet se fornecido
      if (petName && petName.trim()) {
        await adminSupabase.from("pets").insert({
          pet_shop_id: getTenantId(),
          client_id: userId,
          name: petName.trim(),
          species: species || "Cachorro",
          breed: breed?.trim() || "Vira-lata",
          sex: sex || "Macho",
        });
      }
    }

    return NextResponse.json({ success: true, userId });
  } catch (err: any) {
    console.error("Erro em /api/auth/register:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
