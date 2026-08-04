import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam || errorDescription) {
    console.error("OAuth callback error do Google/Supabase:", errorParam, errorDescription);
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorDescription || errorParam || "auth_failed")}`);
  }

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Erro no exchangeCodeForSession:", error.message);
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`);
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const adminSupabase = createAdminClient();

      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        if (profile.role === "admin") {
          return NextResponse.redirect(`${origin}/admin/pets`);
        }
        return NextResponse.redirect(`${origin}/client`);
      }
    }

    return NextResponse.redirect(`${origin}/auth/register-google`);
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
