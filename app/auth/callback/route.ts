import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const supabase = createClient();

  // Função auxiliar para redirecionar de acordo com o perfil/role do usuário ativo
  async function redirectByUserRole(user: any) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminSupabase = createAdminClient();

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role, full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      if (profile.role === "admin" || profile.role === "dono") {
        return NextResponse.redirect(`${origin}/admin/pets`);
      }
      if (!profile.full_name?.trim() || !profile.phone?.trim()) {
        return NextResponse.redirect(`${origin}/auth/register-google`);
      }
      return NextResponse.redirect(`${origin}/client`);
    }
    return NextResponse.redirect(`${origin}/auth/register-google`);
  }

  // 1. Se veio um erro de callback (ex: flow_state_already_used)
  if (errorParam || errorDescription) {
    console.warn("OAuth callback warning/error:", errorParam, errorDescription);

    // Se o estado já foi trocado (flow_state_already_used), verifica se a sessão já está logada
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return await redirectByUserRole(user);
    }

    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription || errorParam || "auth_failed")}`
    );
  }

  // 2. Trocar código por sessão (PKCE Code Exchange)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();

    // Se temos um usuário logado (mesmo se o exchangeCode deu warning/já foi executado antes)
    if (user) {
      return await redirectByUserRole(user);
    }

    if (error) {
      console.error("Erro no exchangeCodeForSession:", error.message);
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Se já há sessão ativa no navegador sem code
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    return await redirectByUserRole(user);
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
