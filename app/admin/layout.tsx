import { AdminSidebar } from "../../components/ui/admin-sidebar";
import { AdminHeader } from "../../components/ui/admin-header";
import { AdminBottomNav } from "../../components/ui/admin-bottom-nav";
import { AdminRouteGuard } from "../../components/auth/AdminRouteGuard";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-matte-canvas flex flex-col md:flex-row font-body-base text-on-surface selection:bg-primary/30">
      <AdminSidebar />
      <div className="flex-1 w-full md:pl-64 flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1 pb-20 md:pb-0 relative overflow-x-hidden">
          <AdminRouteGuard>{children}</AdminRouteGuard>
        </main>
      </div>
      <AdminBottomNav />
    </div>
  );
}
