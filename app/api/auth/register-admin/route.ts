import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ROLE_TO_DB_MAP: Record<string, string> = {
  admin: "admin",
  dono: "admin",
  veterinario: "veterinarian",
  banhista_tosador: "bather",
  recepcionista: "receptionist",
  entregador: "employee",
  auxiliar: "employee",
  funcionario: "employee",
};

export async function POST(request: Request) {
  try {
    const { email, password, fullName, phone, adminSecretKey, role } = await request.json();

    const expectedSecret = process.env.ADMIN_SIGNUP_SECRET;
    if (!expectedSecret) {
      console.error("ADMIN_SIGNUP_SECRET não está configurada no ambiente do servidor.");
      return NextResponse.json(
        { error: "Cadastro de administrador desativado: chave de segurança não configurada no servidor." },
        { status: 500 }
      );
    }
    if (adminSecretKey?.trim() !== expectedSecret) {
      return NextResponse.json({ error: "Chave secreta de administrador incorreta." }, { status: 400 });
    }

    const requestedRole = role || "admin";
    const dbRole = ROLE_TO_DB_MAP[requestedRole] || "admin";

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
          user_metadata: {
            full_name: fullName,
            name: fullName,
            display_name: fullName,
            phone,
            role: requestedRole,
            db_role: dbRole,
          },
          app_metadata: { role: dbRole },
        });

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      userId = newUserData.user?.id;
    } else {
      // Atualizar a senha e sobrescrever metadados (incluindo nome do Google OAuth se houver)
      const updatePayload: any = {
        user_metadata: {
          ...existingUser.user_metadata,
          full_name: fullName,
          name: fullName,
          display_name: fullName,
          phone,
          role: requestedRole,
          db_role: dbRole,
        },
        // Mantém o cache de role usado pelo middleware sempre em dia — essencial
        // aqui pois este é o único fluxo que pode MUDAR o cargo de um usuário já existente.
        app_metadata: { ...existingUser.app_metadata, role: dbRole },
      };

      if (password && password.trim().length >= 6) {
        updatePayload.password = password.trim();
      }

      await adminSupabase.auth.admin.updateUserById(existingUser.id, updatePayload);
    }

    if (userId) {
      // 3. Atualizar/Inserir perfil no banco de dados com o nome e o dbRole compatível
      const { error: profileErr } = await adminSupabase.from("profiles").upsert({
        id: userId,
        full_name: fullName || "Colaborador",
        phone: phone || null,
        role: dbRole,
        pet_shop_id: "00000000-0000-0000-0000-000000000001",
      });

      if (profileErr) {
        console.error("Erro ao salvar perfil:", profileErr);
        return NextResponse.json({ error: profileErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro em /api/auth/register-admin:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
