import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId, withTenant } from "@/lib/server/tenant-context";

export { getTenantId, withTenant };

/**
 * Tenant padrão usado em desenvolvimento / hosts sem subdomínio (ex.: localhost).
 * Em produção, cada pet shop deve ter um slug (subdomínio) próprio.
 */
export const DEFAULT_TENANT_ID =
  process.env.DEFAULT_TENANT_ID || "00000000-0000-0000-0000-000000000001";

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
}

/** Resolve o tenant de um usuário autenticado a partir do pet_shop_id do perfil. */
export async function getTenantIdForUser(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("pet_shop_id")
    .eq("id", userId)
    .maybeSingle();
  return data?.pet_shop_id || null;
}

/**
 * Resolve o tenant pelo subdomínio do host (ex.: petshop-a.meusistema.com -> slug "petshop-a").
 * Hosts locais e o domínio raiz caem no tenant padrão (desenvolvimento).
 */
export async function getTenantIdFromHost(host: string | null): Promise<string | null> {
  if (!host) return null;

  const hostname = host.split(":")[0].toLowerCase();
  const parts = hostname.split(".");

  if (isLocalHost(hostname) || parts.length < 3) {
    return DEFAULT_TENANT_ID;
  }

  const subdomainIndex = parts[0] === "www" ? (parts.length > 3 ? 1 : -1) : 0;
  if (subdomainIndex === -1) return DEFAULT_TENANT_ID;
  const subdomain = parts[subdomainIndex];
  if (!subdomain) return DEFAULT_TENANT_ID;

  const admin = createAdminClient();
  const { data } = await admin
    .from("pet_shops")
    .select("id")
    .eq("slug", subdomain)
    .maybeSingle();
  return data?.id || null;
}

/**
 * Resolve o tenant de uma requisição:
 * 1. Usuário autenticado -> tenant do perfil (rotas privadas / admin).
 * 2. Usuário autenticado sem perfil ainda (onboarding Google) -> host.
 * 3. Anônimo -> subdomínio do host (páginas públicas de agendamento).
 */
export async function resolveTenantFromRequest(request: Request): Promise<string | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const tenant = await getTenantIdForUser(user.id);
      if (tenant) return tenant;
    }
  } catch {
    // Sem sessão/cookies — segue para a resolução por subdomínio.
  }

  return getTenantIdFromHost(request.headers.get("host"));
}

/**
 * Wrapper de rota: resolve o tenant automaticamente e executa o handler dentro
 * do contexto multi-tenant. Uso:
 *   export const GET = withTenantRoute(async () => { ... });
 *   export const POST = withTenantRoute(async (request) => { ... });
 *   export const PUT = withTenantRoute(async (request, _ctx, { params }) => { ... });
 */
export function withTenantRoute(
  handler: (
    request: Request,
    ctx: { tenantId: string },
    ...args: any[]
  ) => Promise<Response> | Response
) {
  return async (request: Request, ...args: any[]) => {
    let tenantId: string | null = null;
    try {
      tenantId = await resolveTenantFromRequest(request);
    } catch {
      tenantId = null;
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "Pet shop não encontrado para este endereço." },
        { status: 404 }
      );
    }

    return withTenant(tenantId, () => handler(request, { tenantId }, ...args));
  };
}
