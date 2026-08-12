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

      // Atualizar pet garantindo que pertence ao usuário logado
      const { data: pet, error } = await adminSupabase
        .from("pets")
        .update({
          name: body.name,
          species: body.species,
          breed: body.breed,
          sex: body.sex,
          weight: body.weight ? parseFloat(body.weight) : null,
          coat: body.coat,
          color: body.color,
          photo_url: body.photo_url,
          observations: body.observations,
          updated_at: new Date().toISOString(),
        })
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
