import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

export const PUT = withTenantRoute(
  async (request: Request, _ctx: { tenantId: string }, { params }: { params: { id: string } }) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
      }

      const petId = params.id;
      if (!petId) {
        return NextResponse.json({ error: "ID do pet é obrigatório" }, { status: 400 });
      }

      const body = await request.json();
      const adminSupabase = createAdminClient();

      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (body.name !== undefined) updatePayload.name = body.name;
      if (body.species !== undefined) updatePayload.species = body.species;
      if (body.breed !== undefined) updatePayload.breed = body.breed;
      if (body.sex !== undefined) updatePayload.sex = body.sex;
      if (body.weight !== undefined) updatePayload.weight = body.weight ? parseFloat(body.weight) : null;
      if (body.coat !== undefined) updatePayload.coat = body.coat;
      if (body.color !== undefined) updatePayload.color = body.color;
      if (body.photo_url !== undefined) updatePayload.photo_url = body.photo_url;
      if (body.observations !== undefined) updatePayload.observations = body.observations ? String(body.observations).trim() : null;

      if (body.age_years !== undefined || body.age_months !== undefined) {
        const yearsNum = parseInt(body.age_years || "0", 10);
        const monthsNum = parseInt(body.age_months || "0", 10);
        if (yearsNum > 0 || monthsNum > 0) {
          const now = new Date();
          now.setFullYear(now.getFullYear() - yearsNum);
          now.setMonth(now.getMonth() - monthsNum);
          updatePayload.birth_date = now.toISOString().split("T")[0];
        }
      }

      // Atualizar pet garantindo que pertence ao usuário logado
      const { data: pet, error } = await adminSupabase
        .from("pets")
        .update(updatePayload)
        .eq("pet_shop_id", getTenantId())
        .eq("id", petId)
        .eq("client_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar pet via API:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, pet });
    } catch (err: any) {
      console.error("Erro de API PUT /api/pets/[id]:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
);

export const DELETE = withTenantRoute(
  async (request: Request, _ctx: { tenantId: string }, { params }: { params: { id: string } }) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
      }

      const petId = params.id;
      if (!petId) {
        return NextResponse.json({ error: "ID do pet é obrigatório" }, { status: 400 });
      }

      const adminSupabase = createAdminClient();

      // Deletar pet garantindo que pertence ao usuário logado
      const { error } = await adminSupabase
        .from("pets")
        .delete()
        .eq("pet_shop_id", getTenantId())
        .eq("id", petId)
        .eq("client_id", user.id);

      if (error) {
        console.error("Erro ao deletar pet via API:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    } catch (err: any) {
      console.error("Erro de API DELETE /api/pets/[id]:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
);
