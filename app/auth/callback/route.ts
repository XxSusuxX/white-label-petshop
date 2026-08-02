import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Buscar perfil com admin client no servidor de forma 100% confiável
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const adminSupabase = createAdminClient();

        const { data: profile } = await adminSupabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          // Usuário JÁ CADASTRADO -> Envia direto para o painel sem passar pela página de cadastro!
          if (profile.role === "admin") {
            return NextResponse.redirect(`${origin}/admin/pets`);
          }
          return NextResponse.redirect(`${origin}/client`);
        }
      }

      // Conta NOVA sem perfil -> Envia para o formulário de cadastro do Google
      return NextResponse.redirect(`${origin}/auth/register-google`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
