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
import { GramIcon, CoinIcon, MusicIcon } from "@/components/CoinIcon";
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
    <div className="space-y-4 pt-4">
      <div className="glass-thin animate-fade-up mx-auto flex w-full max-w-xs rounded-full p-1">
        {(["upgrades", "store"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-xs capitalize transition-all duration-200 active:scale-95 ${
              tab === t ? "bg-white text-gray-900 shadow-lg" : "text-foreground/60"
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

  const UpgradeCard = ({
    kind,
    id,
    name,
    cost,
    level,
    label,
    from,
    to,
    unit,
    icon,
    onMusic,
  }: {
    kind: "instrument" | "miner";
    id: string;
    name: string;
    cost: number;
    level: number;
    label: string;
    from: string;
    to: string;
    unit: string;
    icon: React.ReactNode;
    onMusic: () => void;
  }) => {
    const affordable = state.balance >= cost;
    return (
      <div className="liquid-glass overflow-hidden rounded-3xl">
        <div className="flex items-center gap-3 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm">{name}</p>
              <span className="glass-thin shrink-0 rounded-md px-1.5 py-0.5 text-[10px] text-foreground/60">
                Lv {level}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-foreground/50">
              {from} <span className="text-foreground/30">→</span>{" "}
              <span className="text-foreground/80">{to}</span> {unit}
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 p-2.5">
          <button
            onClick={onMusic}
            disabled={!affordable}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm transition-transform duration-200 active:scale-95 ${
              affordable ? "bg-white text-gray-900" : "glass-thin text-foreground/40"
            }`}
          >
            <MusicIcon size={16} /> {label} · {formatNumber(cost)}
          </button>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => buyWithGram(kind, id, cost, name)}
              className="glass-thin flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs transition-transform duration-200 active:scale-95"
            >
              <GramIcon size={14} /> {gramForCost(cost)} GRAM
            </button>
            <button
              disabled={busy === `${id}-stars`}
              onClick={() => buyWithStars(kind, id, cost, name, level)}
              className="glass-thin flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs transition-transform duration-200 active:scale-95 disabled:opacity-50"
            >
              {busy === `${id}-stars` ? (
                <Loader2 size={14} className="animate-spin text-blue-400" />
              ) : (
                <Star size={14} className="fill-blue-400 text-blue-400" />
              )}
              {starsForCost(cost)} Stars
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <section className="liquid-glass animate-fade-up delay-1 rounded-3xl p-5 text-center">
        <p className="text-[11px] uppercase tracking-widest text-foreground/40">Mining rate</p>
        <p className="mt-1 text-4xl tracking-tight">{formatNumber(ratePerHour(state))}</p>
        <p className="text-xs text-foreground/50">MUSIC / hour</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
          <span className="glass-thin flex items-center justify-center gap-1.5 rounded-xl py-2">
            <MusicIcon size={14} /> {formatNumber(state.balance)}
          </span>
          <span className="glass-thin flex items-center justify-center gap-1.5 rounded-xl py-2">
            <GramIcon size={14} /> {formatCrypto(state.gram)}
          </span>
          <span className="glass-thin flex items-center justify-center gap-1.5 rounded-xl py-2">
            <CoinIcon id="usdt" size={14} /> {formatCrypto(state.usdt)}
          </span>
        </div>
      </section>

      <section className="animate-fade-up delay-2 space-y-2.5">
        <h2 className="px-1 text-xs uppercase tracking-widest text-foreground/40">Instruments</h2>
        {INSTRUMENTS.map((inst) => {
          const level = state.levels[inst.id] ?? 0;
          const cost = upgradeCost(inst, level);
          const Icon = ICONS[inst.icon] ?? AudioWaveform;
          return (
            <UpgradeCard
              key={inst.id}
              kind="instrument"
              id={inst.id}
              name={inst.name}
              cost={cost}
              level={level}
              label="Upgrade"
              from={formatNumber(instrumentRate(inst, level))}
              to={formatNumber(instrumentRate(inst, level + 1))}
              unit="MUSIC / hr"
              icon={<Icon size={20} strokeWidth={1.8} />}
              onMusic={() => {
                const ok = upgrade(inst.id);
                toast[ok ? "success" : "error"](
                  ok ? `${inst.name} upgraded to level ${level + 1}` : "Not enough MUSIC",
                );
              }}
            />
          );
        })}
      </section>

      <section className="animate-fade-up delay-3 space-y-2.5">
        <h2 className="px-1 text-xs uppercase tracking-widest text-foreground/40">Crypto rigs</h2>
        {MINERS.map((m) => {
          const level = state.minerLevels[m.id] ?? 0;
          const cost = minerUpgradeCost(m, level);
          const nextLevelState = {
            ...state,
            minerLevels: { ...state.minerLevels, [m.id]: level + 1 },
          };
          return (
            <UpgradeCard
              key={m.id}
              kind="miner"
              id={m.id}
              name={m.name}
              cost={cost}
              level={level}
              label={level === 0 ? "Unlock" : "Upgrade"}
              from={formatCrypto(minerRate(state, m))}
              to={formatCrypto(minerRate(nextLevelState, m))}
              unit={`${m.symbol} / hr`}
              icon={<CoinIcon id={m.id} size={36} />}
              onMusic={() => {
                const ok = upgradeMiner(m.id);
                toast[ok ? "success" : "error"](
                  ok ? `${m.name} is now level ${level + 1}` : "Not enough MUSIC",
                );
              }}
            />
          );
        })}
      </section>
    </div>
  );
}
