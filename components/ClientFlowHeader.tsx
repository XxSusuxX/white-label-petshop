"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ClientFlowHeader() {
  const pathname = usePathname();

  const steps = [
    { id: 1, label: "Login", href: "/auth/login" },
    { id: 2, label: "Cadastro do Tutor", href: "/auth/register" },
    { id: 3, label: "Cadastro do Pet", href: "/auth/pet-register" },
  ];

  return (
    <div className="w-full bg-[#0a0f0d] border-b border-hairline-border py-3 px-4 sticky top-0 z-[100] backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-start md:justify-center overflow-x-auto no-scrollbar gap-2 md:gap-4">
        {steps.map((step) => {
          const isActive = pathname === step.href;

          return (
            <Link
              key={step.id}
              href={step.href}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? "bg-primary/20 text-primary border border-primary/50 shadow-[0_0_12px_rgba(78,222,163,0.3)]"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-transparent"
              }`}
            >
              {step.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
