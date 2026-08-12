import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const dynamic = "force-dynamic";

// GET: Retorna consultas, vacinas e histórico de peso de um pet específico
export const GET = withTenantRoute(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const petId = searchParams.get("pet_id");

    if (!petId) {
      return NextResponse.json({ error: "pet_id é obrigatório" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const [{ data: records, error: recErr }, { data: vaccines, error: vacErr }, { data: weightLogs, error: wErr }] =
      await Promise.all([
        adminSupabase
          .from("medical_records")
          .select("*")
          .eq("pet_shop_id", getTenantId())
          .eq("pet_id", petId)
          .order("created_at", { ascending: false }),
        adminSupabase
          .from("vaccine_records")
          .select("*")
          .eq("pet_shop_id", getTenantId())
          .eq("pet_id", petId)
          .order("applied_at", { ascending: false }),
        adminSupabase
          .from("weight_logs")
          .select("*")
          .eq("pet_id", petId)
          .order("recorded_at", { ascending: false }),
      ]);

    if (recErr || vacErr || wErr) {
      const err = recErr || vacErr || wErr;
      console.error("Erro ao buscar prontuário:", err);
      return NextResponse.json({ error: err?.message }, { status: 500 });
    }

    return NextResponse.json({
      medicalRecords: records || [],
      vaccines: vaccines || [],
      weightLogs: weightLogs || [],
    });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/prontuario:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

// POST: Cria um registro de consulta, vacina ou peso (dispatch por "type")
export const POST = withTenantRoute(async (request: Request) => {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();
    const { type, pet_id } = body;

    if (!type || !pet_id) {
      return NextResponse.json({ error: "type e pet_id são obrigatórios" }, { status: 400 });
    }

    if (type === "consulta") {
      const { vet_name, diagnosis, treatment, prescription } = body;
      const { data, error } = await adminSupabase
        .from("medical_records")
        .insert({
          pet_shop_id: getTenantId(),
          pet_id,
          vet_name: vet_name || "",
          diagnosis: diagnosis || "",
          treatment: treatment || "",
          prescription: prescription || "",
        })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, record: data });
    }

    if (type === "vacina") {
      const { vaccine_name, applied_at, next_due_at } = body;
      const { data, error } = await adminSupabase
        .from("vaccine_records")
        .insert({
          pet_shop_id: getTenantId(),
          pet_id,
          vaccine_name,
          applied_at: applied_at || null,
          next_due_at: next_due_at || null,
        })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, record: data });
    }

    if (type === "peso") {
      const { weight } = body;
      const { data, error } = await adminSupabase
        .from("weight_logs")
        .insert({ pet_id, weight })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Mantém pets.weight (peso atual) sincronizado com o último registro
      await adminSupabase.from("pets").update({ weight }).eq("pet_shop_id", getTenantId()).eq("id", pet_id);

      return NextResponse.json({ success: true, record: data });
    }

    return NextResponse.json({ error: "type inválido" }, { status: 400 });
  } catch (err: any) {
    console.error("Erro em POST /api/admin/prontuario:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
