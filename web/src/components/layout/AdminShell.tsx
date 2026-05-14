import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/AuthContext";
import { AdminProgressBar } from "@/components/admin/AdminProgressBar";
import { ScrollToTop } from "./ScrollToTop";

export function AdminShell() {
  const { hasRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-surface">
      <ScrollToTop />
      <AdminProgressBar />
      <AdminSidebar hasRole={hasRole} />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation menu</SheetTitle>
          </SheetHeader>
          <AdminSidebar hasRole={hasRole} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-10">
          <div key={location.pathname} style={{ animation: "stagger-entry 0.35s ease both" }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
