import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findSchedulingConflict } from "@/lib/server/booking";
import { createNotification, getClientIdForPet } from "@/lib/server/notifications";

export const dynamic = "force-dynamic";

const PET_SHOP_ID = "00000000-0000-0000-0000-000000000001";

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

    // 3. Buscar agendamentos da tabela appointments (fonte de verdade).
    // Só cai para o histórico legado (service_history) se a própria consulta falhar
    // (ex.: tabela ainda não migrada) — uma lista real vazia continua vazia, nunca é
    // mascarada com dados antigos de service_history como se fossem atuais.
    let appointmentsList: any[] = [];

    const { data: appointments, error: apptErr } = await adminSupabase
      .from("appointments")
      .select("*")
      .order("scheduled_at", { ascending: false });

    if (!apptErr) {
      appointmentsList = (appointments || []).map((a) => {
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
          tutor_id: pet?.client_id || null,
          tutor_name: tutor ? tutor.full_name : "Tutor Não Identificado",
          tutor_phone: tutor ? tutor.phone : "Não informado",
          service_id: a.service_id || null,
          service_type: a.service_type || "Banho & Tosa",
          status: a.status || "agendado",
          professional: a.professional || "Não atribuído",
          price: a.price ?? 85.0,
          day,
          month,
          year,
          date_iso: a.scheduled_at,
          time: `${hours}:${minutes}`,
          notes: a.notes || "",
          address: a.address || "",
          created_at: a.created_at,
          updated_at: a.updated_at,
        };
      });
    } else {
      // Fallback apenas em caso de erro real na consulta (ex.: tabela indisponível)
      console.warn("Falha ao consultar appointments, usando service_history como fallback:", apptErr.message);
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
          tutor_id: pet?.client_id || null,
          tutor_name: tutor ? tutor.full_name : "Tutor Não Identificado",
          tutor_phone: tutor ? tutor.phone : "Não informado",
          service_id: null,
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
          created_at: h.created_at,
          updated_at: h.created_at,
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

// POST: Criar novo agendamento na tabela appointments (feito pelo admin)
export async function POST(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const { pet_id, service_id, service_type, service_date, notes, address, professional, price, force } = body;

    if (!pet_id || !service_type || !service_date) {
      return NextResponse.json(
        { error: "pet_id, service_type e service_date são obrigatórios" },
        { status: 400 }
      );
    }

    if (!force) {
      const conflict = await findSchedulingConflict({
        scheduledAt: service_date,
        serviceId: service_id,
        professional,
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Já existe um agendamento nesse horário.", conflict },
          { status: 409 }
        );
      }
    }

    const { data: newRow, error: insertErr } = await adminSupabase
      .from("appointments")
      .insert({
        pet_id,
        service_id: service_id || null,
        pet_shop_id: PET_SHOP_ID,
        service_type,
        scheduled_at: service_date,
        professional: professional || "Não atribuído",
        price: price ?? 85.0,
        status: "agendado",
        notes: notes || "",
        address: address || "",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Erro ao inserir agendamento:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    const clientId = await getClientIdForPet(pet_id);
    if (clientId) {
      const dateLabel = new Date(service_date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
      await createNotification({
        clientId,
        appointmentId: newRow.id,
        type: "agendamento_confirmado",
        title: "Agendamento confirmado",
        body: `Seu agendamento de ${service_type} foi confirmado para ${dateLabel}.`,
      });
    }

    return NextResponse.json({ appointment: newRow, success: true });
  } catch (err: any) {
    console.error("Erro no POST /api/admin/agenda:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Alterar status e/ou reagendar (data, serviço, profissional, pet, observações)
export async function PATCH(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const { id, status, notes, address, service_date, service_id, service_type, professional, price, force } = body;

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    const { data: existing, error: fetchErr } = await adminSupabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const isReschedule = service_date !== undefined && service_date !== existing.scheduled_at;
    if (isReschedule && !force) {
      const conflict = await findSchedulingConflict({
        scheduledAt: service_date,
        serviceId: service_id ?? existing.service_id,
        professional: professional ?? existing.professional,
        excludeAppointmentId: id,
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Já existe um agendamento nesse horário.", conflict },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (address !== undefined) updateData.address = address;
    if (service_date !== undefined) updateData.scheduled_at = service_date;
    if (service_id !== undefined) updateData.service_id = service_id;
    if (service_type !== undefined) updateData.service_type = service_type;
    if (professional !== undefined) updateData.professional = professional;
    if (price !== undefined) updateData.price = price;

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

    const clientId = await getClientIdForPet(data.pet_id);
    if (clientId) {
      if (status !== undefined && status !== existing.status) {
        const STATUS_MESSAGES: Record<string, { title: string; body: string; type: any }> = {
          confirmado: { title: "Agendamento confirmado", body: `Seu agendamento de ${data.service_type} foi confirmado.`, type: "agendamento_confirmado" },
          em_atendimento: { title: "Atendimento iniciado", body: `O atendimento de ${data.service_type} do seu pet começou agora.`, type: "agendamento_alterado" },
          concluido: { title: "Atendimento concluído", body: `O atendimento de ${data.service_type} foi concluído.`, type: "agendamento_alterado" },
          cancelado: { title: "Agendamento cancelado", body: `Seu agendamento de ${data.service_type} foi cancelado.`, type: "agendamento_cancelado" },
        };
        const msg = STATUS_MESSAGES[status];
        if (msg) await createNotification({ clientId, appointmentId: id, ...msg });
      } else if (isReschedule) {
        const dateLabel = new Date(data.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
        await createNotification({
          clientId,
          appointmentId: id,
          type: "agendamento_alterado",
          title: "Agendamento alterado",
          body: `Seu agendamento de ${data.service_type} foi remarcado para ${dateLabel}.`,
        });
      }
    }

    return NextResponse.json({ success: true, appointment: data });
  } catch (err: any) {
    console.error("Erro no PATCH /api/admin/agenda:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
