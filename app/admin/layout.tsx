import { AdminSidebar } from "../../components/ui/admin-sidebar";
import { AdminBottomNav } from "../../components/ui/admin-bottom-nav";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-matte-canvas flex flex-col md:flex-row font-body-base text-on-surface selection:bg-primary/30">
      <AdminSidebar />
      <main className="flex-1 w-full pb-20 md:pb-0 relative overflow-x-hidden">
        {children}
      </main>
      <AdminBottomNav />
    </div>
  );
}
