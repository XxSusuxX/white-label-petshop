"use client";

import Link from "next/link";
import React from "react";

interface OnboardingLayoutProps {
  step: 1 | 2;
  stepTitle: string;
  progressPercent: number;
  children: React.ReactNode;
}

export default function OnboardingLayout({
  stepTitle,
  progressPercent,
  children,
}: OnboardingLayoutProps) {
  return (
    <div className="bg-matte-canvas text-on-surface font-body-base selection:bg-primary/30 min-h-screen flex flex-col p-4 md:p-8">
      {/* Progress Header */}
      <header className="w-full max-w-7xl mx-auto mb-6 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-primary font-headline-md text-headline-md font-bold">
            PetNexus
          </Link>
          <span className="text-outline">/</span>
          <span className="text-label-bold font-label-bold text-on-surface-variant tracking-wider uppercase">
            {stepTitle}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-end gap-2 max-w-md">
          <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'wght' 700" }}
            >
              check_circle
            </span>
            <span className="text-caption font-label-bold uppercase tracking-wider">
              {progressPercent}% Concluído
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg gap-gutter lg:gap-12 overflow-hidden">
        {/* Left Column: Visuals & Benefits */}
        <section className="flex-1 flex flex-col justify-center gap-stack-lg order-2 lg:order-1">
          <div className="relative group rounded-2xl overflow-hidden extruded-shadow bg-elevated-card border border-hairline-border p-4 transition-transform duration-500 hover:scale-[1.01]">
            <img
              alt="Pet care illustration"
              className="w-full h-auto rounded-xl object-cover"
              src="/assets/img-cadastro-google-cli.png"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
              <div className="bg-primary/10 backdrop-blur-md border border-primary/20 px-4 py-2 rounded-full inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full pulse-node"></span>
                <span className="text-label-bold font-label-bold text-primary">
                  Seu novo melhor amigo digital
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-headline-md text-headline-md text-on-surface">Vantagens Exclusivas</h3>
            <ul className="space-y-stack-md">
              <li className="flex items-start gap-4 p-4 rounded-xl border border-hairline-border bg-surface-container-low transition-colors hover:bg-surface-container">
                <div className="bg-primary-container/10 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-primary">history_edu</span>
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface">Histórico de saúde</p>
                  <p className="font-caption text-caption text-on-surface-variant">
                    Acompanhamento completo de vacinas e consultas.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-xl border border-hairline-border bg-surface-container-low transition-colors hover:bg-surface-container">
                <div className="bg-primary-container/10 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-primary">calendar_month</span>
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface">Agenda de banhos</p>
                  <p className="font-caption text-caption text-on-surface-variant">
                    Nunca esqueça do bem-estar do seu pet.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-xl border border-hairline-border bg-surface-container-low transition-colors hover:bg-surface-container">
                <div className="bg-primary-container/10 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-primary">camera_alt</span>
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface">Fotos em tempo real</p>
                  <p className="font-caption text-caption text-on-surface-variant">
                    Receba atualizações visuais durante o cuidado.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Right Column: Dynamic Form Content */}
        <section className="flex-1 order-1 lg:order-2">
          {children}
        </section>
      </main>
    </div>
  );
}
