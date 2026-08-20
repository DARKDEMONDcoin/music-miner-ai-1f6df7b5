import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AudioWaveform,
  Brain,
  Drum,
  Loader2,
  Orbit,
  Piano,
  SlidersHorizontal,
  Star,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useGame } from "@/hooks/useGame";
import { GramIcon, CoinIcon } from "@/components/CoinIcon";
import { StorePanel } from "@/components/StorePanel";
import { openExternal, telegram } from "@/lib/payments";
import {
  INSTRUMENTS,
  MINERS,
  formatCrypto,
  formatNumber,
  gramForCost,
  instrumentRate,
  minerRate,
  minerUpgradeCost,
  ratePerHour,
  starsForCost,
  upgradeCost,
} from "@/lib/game";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Studio | Music AI" },
      {
        name: "description",
        content:
          "Upgrade instruments and crypto rigs with MUSIC, GRAM or Telegram Stars, and shop premium packs.",
      },
      { property: "og:title", content: "Studio | Music AI" },
      { property: "og:description", content: "Upgrades and store in one place inside Music AI." },
    ],
  }),
  component: StudioPage,
});

const ICONS: Record<string, LucideIcon> = {
  AudioWaveform,
  SlidersHorizontal,
  Drum,
  Piano,
  Brain,
  Orbit,
};

function StudioPage() {
  const [tab, setTab] = useState<"upgrades" | "store">("upgrades");

  return (
    <div className="space-y-3">
      <div className="liquid-glass animate-fade-up grid grid-cols-2 gap-1 rounded-2xl p-1.5">
        {(["upgrades", "store"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl py-2 text-xs capitalize transition-transform duration-200 active:scale-95 ${
              tab === t ? "bg-white text-gray-900" : "text-foreground/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "upgrades" ? <UpgradesTab /> : <StorePanel />}
    </div>
  );
}

function UpgradesTab() {
  const { state, upgrade, upgradeMiner, grant, payWithGram } = useGame();
  const [busy, setBusy] = useState<string | null>(null);

  const applyUpgrade = (kind: "instrument" | "miner", id: string, cost: number) => {
    grant(cost);
    setTimeout(() => {
      if (kind === "instrument") upgrade(id);
      else upgradeMiner(id as "gram" | "usdt");
    }, 0);
  };

  const buyWithGram = (kind: "instrument" | "miner", id: string, cost: number, name: string) => {
    const price = gramForCost(cost);
    if (!payWithGram(price)) {
      toast.error(`Not enough GRAM — need ${price} GRAM`);
      return;
    }
    applyUpgrade(kind, id, cost);
    toast.success(`${name} upgraded with ${price} GRAM`);
  };

  const buyWithStars = async (
    kind: "instrument" | "miner",
    id: string,
    cost: number,
    name: string,
    level: number,
  ) => {
    setBusy(`${id}-stars`);
    try {
      const res = await fetch("/api/telegram/invoice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId: "upgrade", upgradeKind: kind, upgradeId: id, level }),
      });
      const data = (await res.json()) as { link?: string; error?: string };
      if (!res.ok || !data.link) {
        toast.error("Stars checkout unavailable", { description: data.error ?? "Try again later." });
        return;
      }
      const tg = telegram();
      if (tg?.openInvoice) {
        tg.openInvoice(data.link, (status) => {
          if (status === "paid") {
            applyUpgrade(kind, id, cost);
            toast.success(`${name} upgraded`);
          } else if (status === "failed") toast.error("Payment failed");
        });
      } else {
        openExternal(data.link);
      }
    } catch {
      toast.error("Could not start the Stars checkout");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <section className="liquid-glass animate-fade-up delay-1 rounded-2xl p-5">
        <p className="text-xs text-foreground/60">Current mining rate</p>
        <p className="text-3xl tracking-tight">{formatNumber(ratePerHour(state))} / hr</p>
        <p className="mt-1 text-[11px] text-foreground/60">
          Every upgrade can be paid with MUSIC, GRAM or Telegram Stars.
        </p>
      </section>

      {INSTRUMENTS.map((inst, idx) => {
        const level = state.levels[inst.id] ?? 0;
        const cost = upgradeCost(inst, level);
        const current = instrumentRate(inst, level);
        const next = instrumentRate(inst, level + 1);
        const affordable = state.balance >= cost;
        const Icon = ICONS[inst.icon] ?? AudioWaveform;

        return (
          <div
            key={inst.id}
            className={`liquid-glass animate-fade-up rounded-2xl p-4 ${idx < 4 ? `delay-${idx + 1}` : ""}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700">
                <Icon size={20} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm">{inst.name}</p>
                  <span className="glass-thin rounded-lg px-2 py-0.5 text-[11px]">Lv {level}</span>
                </div>
                <p className="text-[11px] text-foreground/60">{inst.desc}</p>
                <p className="mt-1 text-[11px] text-foreground/80">
                  {formatNumber(current)} / hr → {formatNumber(next)} / hr
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const ok = upgrade(inst.id);
                toast[ok ? "success" : "error"](
                  ok ? `${inst.name} upgraded to level ${level + 1}` : "Not enough MUSIC",
                );
              }}
              disabled={!affordable}
              className={`mt-3 w-full rounded-xl py-2.5 text-sm transition-transform duration-200 active:scale-95 ${
                affordable ? "bg-white text-gray-900 hover:scale-105" : "glass-thin text-foreground/50"
              }`}
            >
              Upgrade · {formatNumber(cost)} MUSIC
            </button>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => buyWithGram("instrument", inst.id, cost, inst.name)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-700 py-2 text-xs transition-transform duration-200 active:scale-95"
              >
                <GramIcon size={13} /> {gramForCost(cost)} GRAM
              </button>
              <button
                disabled={busy === `${inst.id}-stars`}
                onClick={() => buyWithStars("instrument", inst.id, cost, inst.name, level)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white py-2 text-xs text-gray-900 transition-transform duration-200 active:scale-95 disabled:opacity-50"
              >
                {busy === `${inst.id}-stars` ? (
                  <Loader2 size={13} className="animate-spin text-blue-700" />
                ) : (
                  <Star size={13} className="text-blue-700" />
                )}
                {starsForCost(cost)} Stars
              </button>
            </div>
          </div>
        );
      })}

      <section className="liquid-glass animate-fade-up rounded-2xl p-5">
        <p className="text-sm">Crypto rigs</p>
        <p className="mt-1 text-[11px] text-foreground/60">
          Convert studio power into GRAM and USDT. Premium doubles every rig.
        </p>
      </section>

      {MINERS.map((m) => {
        const level = state.minerLevels[m.id] ?? 0;
        const cost = minerUpgradeCost(m, level);
        const affordable = state.balance >= cost;
        const nextLevelState = {
          ...state,
          minerLevels: { ...state.minerLevels, [m.id]: level + 1 },
        };
        return (
          <div key={m.id} className="liquid-glass animate-fade-up rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <CoinIcon id={m.id} size={26} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm">{m.name}</p>
                  <span className="glass-thin rounded-lg px-2 py-0.5 text-[11px]">Lv {level}</span>
                </div>
                <p className="text-[11px] text-foreground/60">{m.desc}</p>
                <p className="mt-1 text-[11px] text-foreground/80">
                  {formatCrypto(minerRate(state, m))} → {formatCrypto(minerRate(nextLevelState, m))}{" "}
                  {m.symbol} / hr
                </p>
                <p className="mt-0.5 text-[10px] text-foreground/50">
                  Wallet {formatCrypto(m.id === "gram" ? state.gram : state.usdt)} {m.symbol} · min
                  withdraw {m.minWithdraw} {m.symbol}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const ok = upgradeMiner(m.id);
                toast[ok ? "success" : "error"](
                  ok ? `${m.name} is now level ${level + 1}` : "Not enough MUSIC",
                );
              }}
              disabled={!affordable}
              className={`mt-3 w-full rounded-xl py-2.5 text-sm transition-transform duration-200 active:scale-95 ${
                affordable ? "bg-white text-gray-900 hover:scale-105" : "glass-thin text-foreground/50"
              }`}
            >
              {level === 0 ? "Unlock" : "Upgrade"} · {formatNumber(cost)} MUSIC
            </button>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => buyWithGram("miner", m.id, cost, m.name)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-700 py-2 text-xs transition-transform duration-200 active:scale-95"
              >
                <GramIcon size={13} /> {gramForCost(cost)} GRAM
              </button>
              <button
                disabled={busy === `${m.id}-stars`}
                onClick={() => buyWithStars("miner", m.id, cost, m.name, level)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white py-2 text-xs text-gray-900 transition-transform duration-200 active:scale-95 disabled:opacity-50"
              >
                {busy === `${m.id}-stars` ? (
                  <Loader2 size={13} className="animate-spin text-blue-700" />
                ) : (
                  <Star size={13} className="text-blue-700" />
                )}
                {starsForCost(cost)} Stars
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
