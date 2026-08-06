import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminSupabase = createAdminClient();

    // 1. buscar perfis
    const { data: profiles, error: profileErr } = await adminSupabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profileErr) {
      console.error("Erro ao buscar perfis:", profileErr);
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    // 2. buscar auth.users para obter email real dos clientes (paginado, a API do Supabase
    // limita a listagem a uma página por chamada)
    const userEmailMap = new Map<string, string>();
    let page = 1;
    const perPage = 200;
    while (true) {
      const { data: usersPage, error: usersErr } = await adminSupabase.auth.admin.listUsers({ page, perPage });
      if (usersErr || !usersPage?.users) break;
      usersPage.users.forEach((u) => {
        if (u.email) userEmailMap.set(u.id, u.email);
      });
      if (usersPage.users.length < perPage) break;
      page++;
    }

    // 3. buscar pets de todos os clientes
    const { data: pets, error: petsErr } = await adminSupabase
      .from("pets")
      .select("*");

    // 3b. buscar agendamentos concluídos para calcular visitas reais por pet
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

    // 4. Mapear clientes com seus pets e dados reais
    const clientProfiles = (profiles || []).filter((p) => p.role !== "admin");

    const clientsList = clientProfiles.map((p) => {
      const clientPets = petsByClientMap.get(p.id) || [];
      const email = userEmailMap.get(p.id) || "Sem e-mail";

      return {
        id: p.id,
        full_name: p.full_name || "Cliente sem Nome",
        email: email,
        phone: p.phone || "Não informado",
        role: p.role,
        pets: clientPets,
        visits: visitsByClientMap.get(p.id) || 0,
        created_at: p.created_at,
        status: "Ativo",
      };
    });

    const totalPetsCount = pets ? pets.length : 0;
    const activeClientsCount = clientsList.length;
    const totalVisits = Array.from(visitsByClientMap.values()).reduce((sum, v) => sum + v, 0);

    return NextResponse.json({
      clients: clientsList,
      metrics: {
        totalClients: clientsList.length,
        activeClients: activeClientsCount,
        totalPets: totalPetsCount,
        totalVisits,
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

    if (!full_name) {
      return NextResponse.json(
        { error: "Nome completo é obrigatório" },
        { status: 400 }
      );
    }

    // Generate a deterministic UUID for the profile (since we may not have an auth user)
    const profileId = crypto.randomUUID();

    const { data: profile, error: insertErr } = await adminSupabase
      .from("profiles")
      .insert({
        id: profileId,
        full_name: full_name,
        phone: phone || null,
        role: "client",
        pet_shop_id: "00000000-0000-0000-0000-000000000001",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Erro ao inserir perfil:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    console.error("Erro em POST /api/admin/clients:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
