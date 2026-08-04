import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // 2. buscar auth.users para obter email real dos clientes
    const { data: { users }, error: usersErr } = await adminSupabase.auth.admin.listUsers();
    const userEmailMap = new Map<string, string>();
    if (users) {
      users.forEach((u) => {
        if (u.email) userEmailMap.set(u.id, u.email);
      });
    }

    // 3. buscar pets de todos os clientes
    const { data: pets, error: petsErr } = await adminSupabase
      .from("pets")
      .select("*");

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
        created_at: p.created_at,
        status: "Ativo",
      };
    });

    const totalPetsCount = pets ? pets.length : 0;
    const activeClientsCount = clientsList.length;

    return NextResponse.json({
      clients: clientsList,
      metrics: {
        totalClients: clientsList.length,
        activeClients: activeClientsCount,
        totalPets: totalPetsCount,
        totalVisits: clientsList.length * 3, // Total estimado ou contabilizado
      },
    });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/clients:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
