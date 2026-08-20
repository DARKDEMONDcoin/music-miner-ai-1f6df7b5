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

  const PayRow = ({
    kind,
    id,
    cost,
    name,
    level,
    label,
    affordable,
    onMusic,
  }: {
    kind: "instrument" | "miner";
    id: string;
    cost: number;
    name: string;
    level: number;
    label: string;
    affordable: boolean;
    onMusic: () => void;
  }) => (
    <div className="mt-3 flex items-center gap-1.5">
      <button
        onClick={onMusic}
        disabled={!affordable}
        className={`flex-1 rounded-xl py-2.5 text-xs transition-transform duration-200 active:scale-95 ${
          affordable ? "bg-white text-gray-900" : "glass-thin text-foreground/40"
        }`}
      >
        {label} · {formatNumber(cost)}
      </button>
      <button
        onClick={() => buyWithGram(kind, id, cost, name)}
        className="glass-thin flex items-center gap-1 rounded-xl px-3 py-2.5 text-xs transition-transform duration-200 active:scale-95"
      >
        <GramIcon size={13} /> {gramForCost(cost)}
      </button>
      <button
        disabled={busy === `${id}-stars`}
        onClick={() => buyWithStars(kind, id, cost, name, level)}
        className="glass-thin flex items-center gap-1 rounded-xl px-3 py-2.5 text-xs transition-transform duration-200 active:scale-95 disabled:opacity-50"
      >
        {busy === `${id}-stars` ? (
          <Loader2 size={13} className="animate-spin text-blue-400" />
        ) : (
          <Star size={13} className="fill-blue-400 text-blue-400" />
        )}
        {starsForCost(cost)}
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <section className="animate-fade-up delay-1 text-center">
        <p className="text-xs text-foreground/50">Mining rate</p>
        <p className="mt-1 text-4xl tracking-tight">{formatNumber(ratePerHour(state))}</p>
        <p className="text-xs text-foreground/50">MUSIC / hour</p>
        <div className="mt-3 flex items-center justify-center gap-2 text-[11px]">
          <span className="glass-thin flex items-center gap-1.5 rounded-full px-3 py-1">
            <GramIcon size={13} /> {formatCrypto(state.gram)}
          </span>
          <span className="glass-thin flex items-center gap-1.5 rounded-full px-3 py-1">
            <Star size={11} className="fill-blue-400 text-blue-400" /> Stars
          </span>
        </div>
      </section>

      <section className="animate-fade-up delay-2 space-y-2">
        <h2 className="px-1 text-xs uppercase tracking-widest text-foreground/40">Instruments</h2>
        {INSTRUMENTS.map((inst) => {
          const level = state.levels[inst.id] ?? 0;
          const cost = upgradeCost(inst, level);
          const current = instrumentRate(inst, level);
          const next = instrumentRate(inst, level + 1);
          const affordable = state.balance >= cost;
          const Icon = ICONS[inst.icon] ?? AudioWaveform;

          return (
            <div key={inst.id} className="liquid-glass rounded-2xl p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{inst.name}</p>
                  <p className="text-[11px] text-foreground/50">
                    {formatNumber(current)} → {formatNumber(next)} / hr
                  </p>
                </div>
                <span className="glass-thin shrink-0 rounded-lg px-2 py-0.5 text-[11px] text-foreground/70">
                  Lv {level}
                </span>
              </div>

              <PayRow
                kind="instrument"
                id={inst.id}
                cost={cost}
                name={inst.name}
                level={level}
                label="Upgrade"
                affordable={affordable}
                onMusic={() => {
                  const ok = upgrade(inst.id);
                  toast[ok ? "success" : "error"](
                    ok ? `${inst.name} upgraded to level ${level + 1}` : "Not enough MUSIC",
                  );
                }}
              />
            </div>
          );
        })}
      </section>

      <section className="animate-fade-up delay-3 space-y-2">
        <h2 className="px-1 text-xs uppercase tracking-widest text-foreground/40">Crypto rigs</h2>
        {MINERS.map((m) => {
          const level = state.minerLevels[m.id] ?? 0;
          const cost = minerUpgradeCost(m, level);
          const affordable = state.balance >= cost;
          const nextLevelState = {
            ...state,
            minerLevels: { ...state.minerLevels, [m.id]: level + 1 },
          };
          return (
            <div key={m.id} className="liquid-glass rounded-2xl p-3.5">
              <div className="flex items-center gap-3">
                <CoinIcon id={m.id} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{m.name}</p>
                  <p className="text-[11px] text-foreground/50">
                    {formatCrypto(minerRate(state, m))} → {formatCrypto(minerRate(nextLevelState, m))}{" "}
                    {m.symbol} / hr
                  </p>
                </div>
                <span className="glass-thin shrink-0 rounded-lg px-2 py-0.5 text-[11px] text-foreground/70">
                  Lv {level}
                </span>
              </div>

              <PayRow
                kind="miner"
                id={m.id}
                cost={cost}
                name={m.name}
                level={level}
                label={level === 0 ? "Unlock" : "Upgrade"}
                affordable={affordable}
                onMusic={() => {
                  const ok = upgradeMiner(m.id);
                  toast[ok ? "success" : "error"](
                    ok ? `${m.name} is now level ${level + 1}` : "Not enough MUSIC",
                  );
                }}
              />
            </div>
          );
        })}
      </section>
    </div>
  );
}

