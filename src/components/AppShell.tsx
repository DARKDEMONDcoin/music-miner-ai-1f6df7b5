import { Link, useRouterState } from "@tanstack/react-router";
import { Pickaxe, SlidersHorizontal, Sparkles, ListChecks, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { useGame } from "@/hooks/useGame";
import { BoomerangVideoBg } from "@/components/BoomerangVideoBg";
import { formatCrypto, formatNumber, isPremium } from "@/lib/game";
import { GramIcon, UsdtIcon } from "@/components/CoinIcon";

const NAV = [
  { to: "/", label: "Mine", icon: Pickaxe },
  { to: "/studio", label: "Studio", icon: SlidersHorizontal },
  { to: "/ai", label: "AI", icon: Sparkles },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/wallet", label: "Wallet", icon: Wallet },
] as const;

function Logo() {
  return (
    <svg viewBox="0 0 256 256" width="20" height="20" aria-hidden="true" className="fill-foreground">
      <path d="M 256 256 L 128 256 C 198.692 256 256 198.692 256 128 C 256 57.308 198.692 0 128 0 C 57.308 0 0 57.308 0 128 C 0 198.692 57.308 256 128 256 L 0 256 L 0 0 L 256 0 Z M 128 104 C 141.255 104 152 114.745 152 128 C 152 141.255 141.255 152 128 152 C 114.745 152 104 141.255 104 128 C 104 114.745 114.745 104 128 104 Z" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state } = useGame();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen w-full">
      <BoomerangVideoBg />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col">
        <header className="sticky top-0 z-20 px-4 pt-4">
          <div className="liquid-glass flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-base tracking-tight">music ai</span>
            </div>
            <div className="flex items-center gap-1.5">
              {isPremium(state) && (
                <span className="rounded-lg bg-blue-700 px-2 py-1 text-[10px] tracking-tight">
                  Premium
                </span>
              )}
              <span className="glass-thin flex items-center gap-1 rounded-lg px-2 py-1 text-[11px]">
                <GramIcon size={12} /> {formatCrypto(state.gram)}
              </span>
              <span className="glass-thin flex items-center gap-1 rounded-lg px-2 py-1 text-[11px]">
                <UsdtIcon size={12} /> {formatCrypto(state.usdt)}
              </span>
              <span className="rounded-xl bg-white px-2.5 py-1 text-sm text-gray-900">
                {formatNumber(state.balance)}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-32 pt-4">{children}</main>

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
                  <Icon size={16} strokeWidth={2} />
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
