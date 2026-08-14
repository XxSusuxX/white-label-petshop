"use client";

import { useEffect, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { canAccessRoute } from "@/lib/auth-permissions";

export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkPermission() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/auth/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const role = profile?.role || user.user_metadata?.role || "admin";

        if (!canAccessRoute(role, pathname)) {
          console.warn(`Acesso negado para o cargo '${role}' na rota '${pathname}'`);
          router.replace("/admin/dashboard");
        } else {
          setIsAuthorized(true);
        }
      } catch (err) {
        console.error("Erro na verificação de permissões do Admin:", err);
        setIsAuthorized(true);
      }
    }
    checkPermission();
  }, [pathname, router]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6 text-on-surface-variant">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-primary animate-spin">sync</span>
          <span className="text-xs font-bold font-mono">Verificando permissões...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
