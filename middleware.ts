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

  const isPrivateRoute = pathname.startsWith("/client") || pathname.startsWith("/admin");
  const isAuthRoute =
    pathname === "/auth/register" ||
    pathname === "/auth/login" ||
    pathname === "/auth/register-google" ||
    pathname === "/auth/register-admin";
  const isAdminApiRoute = pathname.startsWith("/api/admin");

  // 0. Rotas /api/admin/* usam a service-role key internamente, então precisam
  // ser protegidas aqui — o prefixo "/admin" acima não cobre "/api/admin".
  if (isAdminApiRoute) {
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminSupabase = createAdminClient();

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return supabaseResponse;
  }

  // 1. Se NÃO ESTÁ LOGADO e tenta acessar páginas privadas, redireciona para login
  if (!user && isPrivateRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // 2. Se ESTÁ LOGADO, fazer uma única consulta de perfil para todas as decisões
  if (user && (isPrivateRoute || isAuthRoute)) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminSupabase = createAdminClient();

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    // 2a. Se não tem perfil em profiles → forçar cadastro complementar (Google)
    if (!profile && isPrivateRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/register-google";
      return NextResponse.redirect(url);
    }

    const staffRoles = [
      "admin",
      "dono",
      "veterinario",
      "veterinarian",
      "banhista_tosador",
      "bather",
      "groomer",
      "recepcionista",
      "receptionist",
      "entregador",
      "auxiliar",
      "employee",
      "funcionario",
    ];
    const isStaff = staffRoles.includes(profile?.role);

    // 2b. Se NÃO É DA EQUIPE/ADMIN tentando acessar /admin → bloquear e redirecionar para /client
    if (profile && pathname.startsWith("/admin") && !isStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/client";
      return NextResponse.redirect(url);
    }

    // 2c. Se JÁ tem perfil e tenta acessar telas de auth → redirecionar para painel
    if (profile && isAuthRoute) {
      // Exceção: Administradores e Donos logados PODEM acessar /auth/register-admin para cadastrar novos colaboradores
      if (pathname === "/auth/register-admin" && (profile.role === "admin" || profile.role === "dono")) {
        return supabaseResponse;
      }

      const url = request.nextUrl.clone();
      url.pathname = isStaff ? "/admin/dashboard" : "/client";
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
