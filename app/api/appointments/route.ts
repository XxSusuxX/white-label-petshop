import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findSchedulingConflict } from "@/lib/server/booking";
import { createNotification } from "@/lib/server/notifications";
import { createRecurringBooking } from "@/lib/server/recurring";

const PET_SHOP_ID = "00000000-0000-0000-0000-000000000001";

// GET: Histórico/agenda do próprio tutor autenticado (usado em /client/historico e /client/agenda)
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    const { data: pets } = await adminSupabase
      .from("pets")
      .select("id, name, breed, species, photo_url")
      .eq("client_id", user.id);

    const petIds = (pets || []).map((p) => p.id);
    if (petIds.length === 0) {
      return NextResponse.json({ appointments: [] });
    }

    const petMap = new Map((pets || []).map((p) => [p.id, p]));

    const { data: appointments, error } = await adminSupabase
      .from("appointments")
      .select("*")
      .in("pet_id", petIds)
      .order("scheduled_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar appointments do cliente:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapped = (appointments || []).map((a) => {
      const pet = petMap.get(a.pet_id);
      return {
        id: a.id,
        pet_id: a.pet_id,
        pet_name: pet?.name || "Pet",
        pet_breed: pet?.breed || pet?.species || "",
        pet_photo: pet?.photo_url || null,
        service_id: a.service_id || null,
        service_type: a.service_type,
        status: a.status,
        professional: a.professional,
        price: a.price,
        scheduled_at: a.scheduled_at,
        notes: a.notes,
        address: a.address || "",
        paid_via_package_id: a.paid_via_package_id || null,
        recurring_booking_id: a.recurring_booking_id || null,
        updated_at: a.updated_at,
      };
    });

    return NextResponse.json({ appointments: mapped });
  } catch (err: any) {
    console.error("Erro em GET /api/appointments:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Cliente cria um agendamento para um dos seus próprios pets
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { pet_id, service_id, service_type, service_date, price, notes, address, use_package_id, recurring_interval_days } = body;

    if (!pet_id || !service_type || !service_date) {
      return NextResponse.json(
        { error: "pet_id, service_type e service_date são obrigatórios" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Garante que o pet pertence ao próprio tutor autenticado
    const { data: pet, error: petErr } = await adminSupabase
      .from("pets")
      .select("id, client_id")
      .eq("id", pet_id)
      .single();

    if (petErr || !pet || pet.client_id !== user.id) {
      return NextResponse.json({ error: "Pet inválido para este usuário" }, { status: 403 });
    }

    const conflict = await findSchedulingConflict({ scheduledAt: service_date, serviceId: service_id });
    if (conflict) {
      return NextResponse.json(
        { error: "Esse horário acabou de ser reservado por outro agendamento. Escolha outro horário." },
        { status: 409 }
      );
    }

    // Se o tutor optou por pagar com um pacote, valida que o pacote é dele, cobre
    // esse serviço e ainda tem crédito — e consome 1 crédito de forma atômica.
    let finalPrice = price ?? 0;
    let usedPackageId: string | null = null;
    if (use_package_id) {
      const { data: pkg } = await adminSupabase
        .from("client_packages")
        .select("*")
        .eq("id", use_package_id)
        .eq("client_id", user.id)
        .maybeSingle();

      if (!pkg || pkg.service_id !== service_id || pkg.status !== "ativo" || pkg.used_credits >= pkg.total_credits) {
        return NextResponse.json({ error: "Pacote inválido ou sem créditos disponíveis." }, { status: 400 });
      }

      const { data: consumed } = await adminSupabase.rpc("use_package_credit", { package_id: use_package_id });
      if (!consumed) {
        return NextResponse.json({ error: "Não foi possível usar o crédito do pacote. Tente novamente." }, { status: 409 });
      }
      finalPrice = 0;
      usedPackageId = use_package_id;
    }

    let recurringBookingId: string | null = null;
    if (recurring_interval_days && Number(recurring_interval_days) > 0) {
      recurringBookingId = await createRecurringBooking({
        petId: pet_id,
        serviceId: service_id || null,
        serviceType: service_type,
        professional: "Não atribuído",
        price: finalPrice,
        address: address || "",
        intervalDays: Number(recurring_interval_days),
      });
    }

    const { data: appointment, error } = await adminSupabase
      .from("appointments")
      .insert({
        pet_id,
        service_id: service_id || null,
        pet_shop_id: PET_SHOP_ID,
        service_type,
        scheduled_at: service_date,
        professional: "Não atribuído",
        price: finalPrice,
        status: "agendado",
        notes: notes || "",
        address: address || "",
        paid_via_package_id: usedPackageId,
        recurring_booking_id: recurringBookingId,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar agendamento do cliente:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (address) {
      await adminSupabase.from("profiles").update({ address }).eq("id", user.id);
    }

    const dateLabel = new Date(service_date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    await createNotification({
      clientId: user.id,
      appointmentId: appointment.id,
      type: "agendamento_criado",
      title: "Agendamento criado",
      body: `Seu agendamento de ${service_type} para ${dateLabel} foi registrado com sucesso.`,
    });

    return NextResponse.json({ success: true, appointment });
  } catch (err: any) {
    console.error("Erro em POST /api/appointments:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Cliente cancela um agendamento próprio (único status que o tutor pode alterar)
export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || status !== "cancelado") {
      return NextResponse.json({ error: "Apenas o cancelamento é permitido pelo tutor" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: appointment, error: fetchErr } = await adminSupabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const { data: pet } = await adminSupabase
      .from("pets")
      .select("client_id")
      .eq("id", appointment.pet_id)
      .single();

    if (!pet || pet.client_id !== user.id) {
      return NextResponse.json({ error: "Agendamento não encontrado para este usuário" }, { status: 404 });
    }

    const { data: updated, error } = await adminSupabase
      .from("appointments")
      .update({ status: "cancelado", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao cancelar agendamento:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (err: any) {
    console.error("Erro em PATCH /api/appointments:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
