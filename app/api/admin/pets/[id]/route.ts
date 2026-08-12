import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenantRoute } from "@/lib/server/tenant";

// PUT: Admin atualiza os dados de qualquer pet do petshop
export const PUT = withTenantRoute(
  async (request: Request, _ctx: { tenantId: string }, { params }: { params: { id: string } }) => {
    try {
      const petId = params.id;
      if (!petId) {
        return NextResponse.json({ error: "ID do pet é obrigatório" }, { status: 400 });
      }

      const body = await request.json();
      const adminSupabase = createAdminClient();

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      const allowedFields = [
        "name", "species", "breed", "sex", "birth_date", "weight", "microchip",
        "coat", "color", "is_neutered", "allergies", "medications", "diseases",
        "observations", "photo_url", "current_status",
      ];
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = field === "weight" ? (body.weight !== null ? parseFloat(body.weight) : null) : body[field];
        }
      }

      const { data: pet, error } = await adminSupabase
        .from("pets")
        .update(updateData)
        .eq("pet_shop_id", getTenantId())
        .eq("id", petId)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar pet (admin):", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, pet });
    } catch (err: any) {
      console.error("Erro em PUT /api/admin/pets/[id]:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
);

// DELETE: Admin remove um pet cadastrado
export const DELETE = withTenantRoute(
  async (request: Request, _ctx: { tenantId: string }, { params }: { params: { id: string } }) => {
    try {
      const petId = params.id;
      if (!petId) {
        return NextResponse.json({ error: "ID do pet é obrigatório" }, { status: 400 });
      }

      const adminSupabase = createAdminClient();
      const { error } = await adminSupabase
        .from("pets")
        .delete()
        .eq("pet_shop_id", getTenantId())
        .eq("id", petId);

      if (error) {
        console.error("Erro ao remover pet (admin):", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    } catch (err: any) {
      console.error("Erro em DELETE /api/admin/pets/[id]:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
);
