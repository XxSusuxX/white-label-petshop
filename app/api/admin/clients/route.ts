import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const STAFF_ROLES = [
  "admin",
  "dono",
  "veterinario",
  "veterinarian",
  "banhista_tosador",
  "bather",
  "groomer",
  "recepcionista",
  "receptionist",
  "entregador",
  "auxiliar",
  "employee",
  "funcionario",
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  dono: "Dono(a)",
  veterinario: "Médico(a) Veterinário(a)",
  veterinarian: "Médico(a) Veterinário(a)",
  banhista_tosador: "Banhista & Tosador(a)",
  bather: "Banhista & Tosador(a)",
  groomer: "Banhista & Tosador(a)",
  recepcionista: "Recepcionista",
  receptionist: "Recepcionista",
  entregador: "Entregador",
  auxiliar: "Auxiliar Geral",
  employee: "Funcionário Geral",
  funcionario: "Funcionário Geral",
  cliente: "Cliente / Tutor",
  client: "Cliente / Tutor",
  tutor: "Cliente / Tutor",
};

export async function GET() {
  try {
    const adminSupabase = createAdminClient();

    // 1. Buscar perfis
    const { data: profiles, error: profileErr } = await adminSupabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profileErr) {
      console.error("Erro ao buscar perfis:", profileErr);
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    // 2. Buscar auth.users para obter email real e metadados de cargo
    const userEmailMap = new Map<string, string>();
    const userMetaRoleMap = new Map<string, string>();
    let page = 1;
    const perPage = 200;
    while (true) {
      const { data: usersPage, error: usersErr } = await adminSupabase.auth.admin.listUsers({ page, perPage });
      if (usersErr || !usersPage?.users) break;
      usersPage.users.forEach((u) => {
        if (u.email) userEmailMap.set(u.id, u.email);
        if (u.user_metadata?.role) userMetaRoleMap.set(u.id, u.user_metadata.role);
      });
      if (usersPage.users.length < perPage) break;
      page++;
    }

    // 3. Buscar pets de todos os clientes
    const { data: pets } = await adminSupabase.from("pets").select("*");

    // 3b. Buscar agendamentos concluídos
    const { data: completedAppointments } = await adminSupabase
      .from("appointments")
      .select("pet_id")
      .eq("status", "concluido");

    const petIdToClientId = new Map<string, string>();
    (pets || []).forEach((p) => {
      if (p.client_id) petIdToClientId.set(p.id, p.client_id);
    });

    const visitsByClientMap = new Map<string, number>();
    (completedAppointments || []).forEach((a) => {
      const clientId = petIdToClientId.get(a.pet_id);
      if (clientId) {
        visitsByClientMap.set(clientId, (visitsByClientMap.get(clientId) || 0) + 1);
      }
    });

    const petsByClientMap = new Map<string, any[]>();
    if (pets) {
      pets.forEach((p) => {
        if (p.client_id) {
          const list = petsByClientMap.get(p.client_id) || [];
          list.push({
            id: p.id,
            name: p.name,
            species: p.species,
            breed: p.breed,
          });
          petsByClientMap.set(p.client_id, list);
        }
      });
    }

    // 4. Separar Clientes e Funcionários/Equipe
    const clientProfiles = (profiles || []).filter((p) => !STAFF_ROLES.includes(p.role));
    const staffProfiles = (profiles || []).filter((p) => STAFF_ROLES.includes(p.role));

    const clientsList = clientProfiles.map((p) => {
      const clientPets = petsByClientMap.get(p.id) || [];
      const email = userEmailMap.get(p.id) || "Sem e-mail";

      return {
        id: p.id,
        full_name: p.full_name || "Cliente sem Nome",
        email: email,
        phone: p.phone || "Não informado",
        role: p.role || "tutor",
        pets: clientPets,
        visits: visitsByClientMap.get(p.id) || 0,
        created_at: p.created_at,
        status: "Ativo",
      };
    });

    const employeesList = staffProfiles.map((p) => {
      const email = userEmailMap.get(p.id) || "Sem e-mail";
      const metaRole = userMetaRoleMap.get(p.id) || p.role;

      return {
        id: p.id,
        full_name: p.full_name || "Colaborador sem Nome",
        email: email,
        phone: p.phone || "Não informado",
        role: metaRole || p.role || "funcionario",
        role_label: ROLE_LABELS[metaRole] || ROLE_LABELS[p.role] || metaRole || "Funcionário",
        created_at: p.created_at,
        status: "Ativo",
      };
    });

    const allUsersList = (profiles || []).map((p) => {
      const email = userEmailMap.get(p.id) || "Sem e-mail";
      const metaRole = userMetaRoleMap.get(p.id) || p.role;
      return {
        id: p.id,
        full_name: p.full_name || "Usuário do Sistema",
        email: email,
        phone: p.phone || "Não informado",
        role: metaRole || p.role || "usuario",
        role_label: ROLE_LABELS[metaRole] || ROLE_LABELS[p.role] || metaRole || "Usuário",
      };
    });

    const totalPetsCount = pets ? pets.length : 0;
    const activeClientsCount = clientsList.length;
    const totalVisits = Array.from(visitsByClientMap.values()).reduce((sum, v) => sum + v, 0);

    return NextResponse.json({
      clients: clientsList,
      employees: employeesList,
      allUsers: allUsersList,
      metrics: {
        totalClients: clientsList.length,
        activeClients: activeClientsCount,
        totalPets: totalPetsCount,
        totalVisits,
        totalEmployees: employeesList.length,
      },
    });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/clients:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const { full_name, phone, email } = body;

    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ error: "Nome completo do tutor é obrigatório." }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Telefone / WhatsApp é obrigatório." }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "E-mail do tutor é obrigatório." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: "E-mail com formato inválido." }, { status: 400 });
    }

    // Verificar se o usuário já existe no auth.users do Supabase
    const { data: usersData } = await adminSupabase.auth.admin.listUsers();
    const existingUser = usersData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);

    let userId = existingUser?.id;

    if (!existingUser) {
      const { data: newUser, error: createErr } = await adminSupabase.auth.admin.createUser({
        email: cleanEmail,
        email_confirm: true,
        user_metadata: { full_name: full_name.trim(), phone: phone.trim() },
      });

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 400 });
      }

      userId = newUser.user?.id;
    } else {
      await adminSupabase.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          ...existingUser.user_metadata,
          full_name: full_name.trim(),
          name: full_name.trim(),
          display_name: full_name.trim(),
          phone: phone.trim(),
        },
      });
    }

    if (userId) {
      const { error: profileErr } = await adminSupabase.from("profiles").upsert({
        id: userId,
        full_name: full_name.trim(),
        phone: phone.trim(),
        role: "client",
        pet_shop_id: "00000000-0000-0000-0000-000000000001",
      });

      if (profileErr) {
        return NextResponse.json({ error: profileErr.message }, { status: 500 });
      }

      // Cacheia o role em app_metadata para o middleware não precisar consultar profiles a cada navegação
      await adminSupabase.auth.admin.updateUserById(userId, { app_metadata: { role: "client" } }).catch(() => {});
    }

    return NextResponse.json({ success: true, userId });
  } catch (err: any) {
    console.error("Erro em POST /api/admin/clients:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
