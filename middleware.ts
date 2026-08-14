import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const STAFF_ROLES = [
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPrivateRoute = pathname.startsWith("/client") || pathname.startsWith("/admin");
  const isAuthRoute =
    pathname === "/auth/register" ||
    pathname === "/auth/login" ||
    pathname === "/auth/register-google" ||
    pathname === "/auth/register-admin";
  const isAdminApiRoute = pathname.startsWith("/api/admin");

  // Rotas públicas ou que já se autenticam sozinhas:
  if (!isPrivateRoute && !isAuthRoute && !isAdminApiRoute) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Se as variáveis de ambiente ainda não foram configuradas na Vercel, não quebrar a página
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Middleware: Variáveis de ambiente do Supabase não configuradas.");
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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

    async function resolveRole(): Promise<string | null> {
      if (!user) return null;

      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const adminSupabase = createAdminClient();

        const { data: profile } = await adminSupabase
          .from("profiles")
          .select("role, full_name, phone")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) return null;

        const isStaff = STAFF_ROLES.includes(profile.role);
        if (!isStaff && (!profile.full_name?.trim() || !profile.phone?.trim())) {
          return null;
        }

        const cachedRole = user.app_metadata?.role as string | undefined;
        if (!cachedRole) {
          adminSupabase.auth.admin
            .updateUserById(user.id, { app_metadata: { ...user.app_metadata, role: profile.role } })
            .catch(() => {});
        }

        return profile.role;
      } catch (err) {
        console.error("Middleware resolveRole error:", err);
        return (user.app_metadata?.role as string) || null;
      }
    }

    // 0. Rotas /api/admin/* protegidas
    if (isAdminApiRoute) {
      if (!user) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
      }

      const role = await resolveRole();
      if (!role || !STAFF_ROLES.includes(role)) {
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

    // 2. Se ESTÁ LOGADO, resolver o cargo para decisões de roteamento
    if (user && (isPrivateRoute || isAuthRoute)) {
      const role = await resolveRole();

      // 2a. Se não tem perfil em profiles → forçar cadastro complementar
      if (!role && isPrivateRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/register-google";
        return NextResponse.redirect(url);
      }

      const isStaff = role ? STAFF_ROLES.includes(role) : false;

      // 2b. Se NÃO É DA EQUIPE tentando acessar /admin → redirecionar para /client
      if (role && pathname.startsWith("/admin") && !isStaff) {
        const url = request.nextUrl.clone();
        url.pathname = "/client";
        return NextResponse.redirect(url);
      }

      // 2c. Se JÁ tem perfil e tenta acessar telas de auth → redirecionar para painel
      if (role && isAuthRoute) {
        if (pathname === "/auth/register-admin" && (role === "admin" || role === "dono")) {
          return supabaseResponse;
        }

        const url = request.nextUrl.clone();
        url.pathname = isStaff ? "/admin/dashboard" : "/client";
        return NextResponse.redirect(url);
      }
    }
  } catch (middlewareErr) {
    console.error("Erro inesperado no middleware:", middlewareErr);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
