import { Link, useRouterState } from "@tanstack/react-router";
import { Gem, Music4, Sparkles, Target, WalletMinimal } from "lucide-react";
import type { ReactNode } from "react";
import { BoomerangVideoBg } from "@/components/BoomerangVideoBg";

const NAV = [
  { to: "/", label: "Mine", icon: Gem },
  { to: "/studio", label: "Studio", icon: Music4 },
  { to: "/ai", label: "AI", icon: Sparkles },
  { to: "/tasks", label: "Tasks", icon: Target },
  { to: "/wallet", label: "Wallet", icon: WalletMinimal },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen w-full">
      <BoomerangVideoBg />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col">
        <main className="flex-1 px-4 pb-32 pt-6">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-4 pb-4">
          <div className="liquid-glass flex items-center justify-between rounded-2xl p-1.5">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] tracking-tight transition-transform duration-200 active:scale-95 ${
                    active ? "bg-white text-gray-900" : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.9} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
