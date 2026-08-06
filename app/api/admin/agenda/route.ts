import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const adminSupabase = createAdminClient();

    // 1. Buscar todos os pets
    const { data: pets } = await adminSupabase.from("pets").select("*");
    const petMap = new Map<string, any>();
    if (pets) {
      pets.forEach((p) => petMap.set(p.id, p));
    }

    // 2. Buscar todos os tutores/profiles
    const { data: profiles } = await adminSupabase.from("profiles").select("*");
    const profileMap = new Map<string, any>();
    if (profiles) {
      profiles.forEach((pr) => profileMap.set(pr.id, pr));
    }

    // 3. Buscar agendamentos da tabela appointments (nova) + fallback para service_history (legado)
    let appointmentsList: any[] = [];

    // Tentar appointments primeiro
    const { data: appointments, error: apptErr } = await adminSupabase
      .from("appointments")
      .select("*")
      .order("scheduled_at", { ascending: false });

    if (!apptErr && appointments && appointments.length > 0) {
      appointmentsList = appointments.map((a) => {
        const pet = petMap.get(a.pet_id);
        const tutor = pet ? profileMap.get(pet.client_id) : null;

        const dateObj = new Date(a.scheduled_at);
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        const year = dateObj.getFullYear();
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");

        return {
          id: a.id,
          pet_id: a.pet_id,
          pet_name: pet ? pet.name : "Pet Desconhecido",
          pet_breed: pet ? `${pet.breed || pet.species}` : "Vira-Lata",
          pet_species: pet ? pet.species : "Cachorro",
          pet_photo: pet?.photo_url || null,
          tutor_name: tutor ? tutor.full_name : "Tutor Não Identificado",
          tutor_phone: tutor ? tutor.phone : "Não informado",
          service_type: a.service_type || "Banho & Tosa",
          status: a.status || "agendado",
          professional: a.professional || "Não atribuído",
          price: a.price || 85.0,
          day,
          month,
          year,
          date_iso: a.scheduled_at,
          time: `${hours}:${minutes}`,
          notes: a.notes || "",
        };
      });
    } else {
      // Fallback: ler de service_history (legado)
      const { data: history } = await adminSupabase
        .from("service_history")
        .select("*")
        .order("created_at", { ascending: false });

      appointmentsList = (history || []).map((h) => {
        const pet = petMap.get(h.pet_id);
        const tutor = pet ? profileMap.get(pet.client_id) : null;

        const dateObj = new Date(h.service_date || h.created_at);
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        const year = dateObj.getFullYear();
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");

        return {
          id: h.id,
          pet_id: h.pet_id,
          pet_name: pet ? pet.name : "Pet Desconhecido",
          pet_breed: pet ? `${pet.breed || pet.species}` : "Vira-Lata",
          pet_species: pet ? pet.species : "Cachorro",
          pet_photo: pet?.photo_url || null,
          tutor_name: tutor ? tutor.full_name : "Tutor Não Identificado",
          tutor_phone: tutor ? tutor.phone : "Não informado",
          service_type: h.service_type || "Banho & Tosa",
          status: h.notes?.includes("cancelado")
            ? "cancelado"
            : h.notes?.includes("concluido")
            ? "concluido"
            : h.notes?.includes("atendimento")
            ? "em_atendimento"
            : "agendado",
          professional: "Não atribuído",
          price: 85.0,
          day,
          month,
          year,
          date_iso: h.service_date || h.created_at,
          time: `${hours}:${minutes}`,
          notes: h.notes || "",
        };
      });
    }

    return NextResponse.json({
      appointments: appointmentsList,
      petsList: pets || [],
      tutorsList: profiles || [],
    });
  } catch (err: any) {
    console.error("Erro no GET /api/admin/agenda:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Criar novo agendamento na tabela appointments
export async function POST(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const { pet_id, service_type, service_date, notes, professional, price } = body;

    if (!pet_id || !service_type) {
      return NextResponse.json(
        { error: "pet_id e service_type são obrigatórios" },
        { status: 400 }
      );
    }

    // Tentar inserir na tabela appointments (nova)
    const { data: newRow, error: insertErr } = await adminSupabase
      .from("appointments")
      .insert({
        pet_id,
        pet_shop_id: "00000000-0000-0000-0000-000000000001",
        service_type,
        scheduled_at: service_date || new Date().toISOString(),
        professional: professional || "Não atribuído",
        price: price || 85.0,
        status: "agendado",
        notes: notes || "",
      })
      .select()
      .single();

    if (insertErr) {
      // Fallback: inserir em service_history (legado)
      console.warn("Tabela appointments não disponível, usando service_history:", insertErr.message);
      const { data: legacyRow, error: legacyErr } = await adminSupabase
        .from("service_history")
        .insert({
          pet_id,
          pet_shop_id: "00000000-0000-0000-0000-000000000001",
          service_type,
          service_date: service_date || new Date().toISOString(),
          notes: notes || `Profissional: ${professional || "Groomer"}`,
        })
        .select()
        .single();

      if (legacyErr) {
        return NextResponse.json({ error: legacyErr.message }, { status: 500 });
      }
      return NextResponse.json({ appointment: legacyRow, success: true });
    }

    return NextResponse.json({ appointment: newRow, success: true });
  } catch (err: any) {
    console.error("Erro no POST /api/admin/agenda:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Alterar status de um agendamento existente
export async function PATCH(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "id e status são obrigatórios" },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await adminSupabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar agendamento:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointment: data });
  } catch (err: any) {
    console.error("Erro no PATCH /api/admin/agenda:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
