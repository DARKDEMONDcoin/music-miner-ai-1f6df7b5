import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, DollarSign, Gem, Heart, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { useGame } from "@/hooks/useGame";
import {
  MINERS,
  activeTrack,
  fillPct,
  formatCrypto,
  formatNumber,
  isPremium,
  minerPending,
  minerRate,
  multiplier,
  pending,
  ratePerHour,
  storageHours,
} from "@/lib/game";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mine | Music AI" },
      {
        name: "description",
        content: "Collect your studio earnings in MUSIC every few hours and raise your mining rate.",
      },
      { property: "og:title", content: "Mine | Music AI" },
      { property: "og:description", content: "Mine the MUSIC coin inside your Telegram studio." },
    ],
  }),
  component: MinePage,
});

function Equalizer() {
  return (
    <div className="flex items-end gap-1">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <span
          key={i}
          className="animate-eq w-1 origin-bottom rounded-full bg-blue-700"
          style={{ height: 22, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

function MinePage() {
  const { state, now, collect } = useGame();
  const [liked, setLiked] = useState(false);

  const ready = pending(state, now);
  const fill = fillPct(state, now);
  const rate = ratePerHour(state);
  const track = activeTrack(state);

  const gramMiner = MINERS[0]!;
  const usdtMiner = MINERS[1]!;
  const gramReady = minerPending(state, gramMiner, now);
  const usdtReady = minerPending(state, usdtMiner, now);

  const onCollect = () => {
    const gained = collect();
    if (gained.music <= 0 && gained.gram <= 0 && gained.usdt <= 0) {
      toast("Nothing collected yet", { description: "Come back later or upgrade your rig." });
      return;
    }
    const extra = [
      gained.gram > 0 ? `+${formatCrypto(gained.gram)} GRAM` : null,
      gained.usdt > 0 ? `+${formatCrypto(gained.usdt)} USDT` : null,
    ].filter(Boolean);
    toast.success(`+${formatNumber(gained.music)} MUSIC`, {
      description: extra.length ? extra.join("  ·  ") : undefined,
    });
  };


  return (
    <div className="space-y-3">
      <section className="liquid-glass animate-fade-up delay-1 rounded-2xl p-5 text-center">
        <p className="text-xs text-foreground/60">Balance</p>
        <p className="mt-1 text-4xl tracking-tight">
          {formatNumber(state.balance)}
          <span className="ml-2 text-sm text-foreground/60">MUSIC</span>
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs">
          <span className="glass-thin flex items-center gap-1.5 rounded-lg px-3 py-1.5">
            <Zap size={12} strokeWidth={2} /> {formatNumber(rate)} / hr
          </span>
          <span className="glass-thin rounded-lg px-3 py-1.5">
            {multiplier(state).toFixed(2)}x multiplier
          </span>
        </div>
      </section>

      <section className="liquid-glass animate-fade-up delay-2 rounded-2xl p-5">
        <div className="flex items-center justify-between text-xs text-foreground/70">
          <span>Storage {storageHours(state)}h</span>
          <span>{fill.toFixed(0)}% full</span>
        </div>
        <div className="mt-2 h-1 rounded-full bg-white/20">
          <div className="h-1 rounded-full bg-blue-700" style={{ width: `${fill}%` }} />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-foreground/60">Ready to collect</p>
            <p className="text-2xl tracking-tight">{formatNumber(ready)}</p>
          </div>
          <Equalizer />
        </div>

        <button
          onClick={onCollect}
          className="mt-5 w-full rounded-xl bg-white px-7 py-2.5 text-sm text-gray-900 transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          Collect earnings
        </button>
      </section>

      <section className="animate-fade-up delay-3 grid grid-cols-2 gap-3">
        {[
          { m: gramMiner, icon: Gem, balance: state.gram, ready: gramReady },
          { m: usdtMiner, icon: DollarSign, balance: state.usdt, ready: usdtReady },
        ].map(({ m, icon: Icon, balance, ready: pend }) => {
          const level = state.minerLevels[m.id] ?? 0;
          return (
            <Link
              key={m.id}
              to="/studio"
              className="liquid-glass rounded-2xl p-4 transition-transform duration-200 active:scale-95"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700">
                  <Icon size={15} strokeWidth={2} />
                </div>
                <span className="text-xs text-foreground/70">{m.symbol}</span>
              </div>
              <p className="mt-3 text-xl tracking-tight">{formatCrypto(balance)}</p>
              {level > 0 ? (
                <p className="mt-1 text-[10px] text-foreground/60">
                  +{formatCrypto(pend)} ready · {formatCrypto(minerRate(state, m))}/hr
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-foreground/60">Tap to unlock mining</p>
              )}
            </Link>
          );
        })}
      </section>



      <section className="liquid-glass animate-fade-up delay-3 rounded-2xl p-2.5 pr-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700">
            <BarChart3 size={20} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">
              {track ? track.title : "No active AI track"}
            </p>
            <p className="text-[11px] text-foreground/60">
              {track ? `${track.genre} · +${track.bonusPct}% mining bonus` : "Generate one for a 24h bonus"}
            </p>
          </div>
          <button
            onClick={() => setLiked((v) => !v)}
            aria-label="Like track"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95"
          >
            <Heart size={16} className={liked ? "fill-blue-700 text-blue-700" : "text-blue-700"} />
          </button>
        </div>
      </section>

      <div className="animate-fade-up delay-4 grid grid-cols-2 gap-3">
        <Link
          to="/studio"
          className="liquid-glass rounded-xl px-7 py-2.5 text-center text-sm transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          Upgrade rig
        </Link>
        <Link
          to="/ai"
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-2.5 text-sm text-gray-900 transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <Sparkles size={14} strokeWidth={2} /> Make a track
        </Link>
      </div>

      {!isPremium(state) && (
        <Link
          to="/studio"
          className="animate-fade-up delay-5 block rounded-xl bg-blue-700 px-5 py-3 text-center text-sm transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          Get Premium — 2x mining, 24h storage
        </Link>
      )}
    </div>
  );
}
