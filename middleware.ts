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

    // 2b. Se é CLIENTE tentando acessar /admin → bloquear e redirecionar para /client
    if (profile && pathname.startsWith("/admin") && profile.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }

    // 2c. Se JÁ tem perfil e tenta acessar telas de auth → redirecionar para painel
    if (profile && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = profile.role === "admin" ? "/admin/dashboard" : "/client";
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
