import { ClientSidebar } from "@/components/ui/client-sidebar";
import { ClientBottomNav } from "@/components/ui/client-bottom-nav";
import { ClientHeader } from "@/components/ui/client-header";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-matte-canvas min-h-screen text-on-surface font-body-base flex flex-col md:flex-row">
      <ClientSidebar />
      <div className="flex-1 md:pl-64 pb-16 md:pb-0 min-h-screen flex flex-col">
        <ClientHeader />
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </div>
      <ClientBottomNav />
    </div>
  );
}
