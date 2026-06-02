"use client";

import type { Package } from "@/type/purchase";
import { Check } from "lucide-react";

interface StepPackageProps {
  packages: Package[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function StepPackage({
  packages,
  selectedId,
  onSelect,
}: StepPackageProps) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-extrabold tracking-tight font-[family-name:var(--font-bricolage-grotesque)]">
          Quel forfait vous convient ?
        </h3>
        <p className="text-xs text-muted-foreground">
          Choisissez le montant à recharger
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {packages.map((pkg) => {
          const active = selectedId === pkg.id;

          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelect(pkg.id)}
              className={`
                group relative overflow-hidden rounded-2xl border-2 p-4 text-left
                transition-all duration-200 ease-out
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                ${
                  active
                    ? "border-primary bg-gradient-to-b from-primary/10 to-primary/3 shadow-xl shadow-primary/15 scale-[1.03]"
                    : "border-border bg-card hover:border-primary/30 hover:shadow-md"
                }
              `}
            >
              <div
                className={`
                  absolute bottom-3 right-3 flex h-5 w-5 items-center justify-center
                  rounded-full transition-all duration-200
                  ${active ? "bg-primary text-primary-foreground scale-100" : "bg-muted scale-0"}
                `}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </div>

              <div className="flex flex-col gap-2.5">
                <p
                  className={`
                    text-[10px] font-bold uppercase tracking-[0.15em] truncate
                    font-[family-name:var(--font-bricolage-grotesque)]
                    ${active ? "text-primary" : "text-muted-foreground"}
                  `}
                >
                  {pkg.name}
                </p>

                <div className="flex items-baseline gap-1">
                  <span
                    className={`
                      text-3xl font-black leading-none tracking-tighter
                      font-[family-name:var(--font-geist-mono)]
                      ${active ? "text-primary" : "text-foreground"}
                    `}
                  >
                    {pkg.priceXaf.toLocaleString("fr-FR")}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                    FCFA
                  </span>
                </div>

                <div
                  className={`h-px w-full transition-colors ${
                    active
                      ? "bg-primary/20"
                      : "bg-border group-hover:bg-primary/10"
                  }`}
                />

                <div>
                  <p className="font-[family-name:var(--font-inter)]">
                    <span className="text-lg font-extrabold leading-none text-foreground">
                      {pkg.priceXaf.toLocaleString("fr-FR")}
                    </span>
                    <span className="ml-1 text-[9px] font-medium text-muted-foreground">
                      FCFA
                    </span>
                  </p>
                  {pkg.description && (
                    <p className="mt-0.5 text-[9px] font-medium text-muted-foreground/50">
                      {pkg.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
