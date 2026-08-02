import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ pets: [] });
    }

    const adminSupabase = createAdminClient();

    // Buscar pets do usuário autenticado no servidor
    const { data: pets, error } = await adminSupabase
      .from("pets")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar pets:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ pets: pets || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
    const adminSupabase = createAdminClient();

    // 1. Garantir perfil do usuário em profiles sem bloqueio de RLS
    await adminSupabase.from("profiles").upsert({
      id: user.id,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Tutor",
      role: "client",
    });

    // 2. Garantir pet_shop padrão cadastrado
    await adminSupabase.from("pet_shops").upsert({
      id: "00000000-0000-0000-0000-000000000001",
      name: "PetNexus Matriz",
    });

    // 3. Inserir o pet com segurança no backend
    const { data: pet, error } = await adminSupabase
      .from("pets")
      .insert({
        pet_shop_id: "00000000-0000-0000-0000-000000000001",
        client_id: user.id,
        name: body.name,
        species: body.species || "Cachorro",
        breed: body.breed || "Vira-lata",
        sex: body.sex || "Macho",
        weight: body.weight ? parseFloat(body.weight) : null,
        coat: body.coat || "curta",
        color: body.color || "Caramelo",
        photo_url: body.photo_url || null,
        observations: body.observations || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar pet via API:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, pet });
  } catch (err: any) {
    console.error("Erro de API /api/pets:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
