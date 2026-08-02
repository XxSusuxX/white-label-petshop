import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 1. Se NÃO ESTÁ LOGADO e tenta acessar páginas privadas (/client ou /admin), redireciona para login
  if (!user && (pathname.startsWith("/client") || pathname.startsWith("/admin"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // 2. Se ESTÁ LOGADO e tenta acessar áreas privadas (/client ou /admin)
  if (user && (pathname.startsWith("/client") || pathname.startsWith("/admin"))) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminSupabase = createAdminClient();

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    // Se NÃO possui perfil cadastrado em profiles -> Força o cadastro do Google
    if (!profile) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/register-google";
      return NextResponse.redirect(url);
    }

    // Se é CLIENTE e tenta acessar /admin -> Bloqueia e redireciona para /client
    if (pathname.startsWith("/admin") && profile.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/client";
      return NextResponse.redirect(url);
    }
  }

  // 3. Se JÁ ESTÁ LOGADO e tem perfil, impede o acesso às telas de login/cadastro inicial (/auth/register, /auth/login, /auth/register-google)
  if (user && (pathname === "/auth/register" || pathname === "/auth/login" || pathname === "/auth/register-google")) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminSupabase = createAdminClient();

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      const url = request.nextUrl.clone();
      url.pathname = profile.role === "admin" ? "/admin/pets" : "/client";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
