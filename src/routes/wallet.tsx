import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useState } from "react";
import { ArrowUpRight, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { useGame } from "@/hooks/useGame";
import { CoinIcon } from "@/components/CoinIcon";
import { MINERS, formatCrypto, formatNumber, minerRate } from "@/lib/game";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet | Music AI" },
      {
        name: "description",
        content: "Connect your GRAM wallet, track MUSIC, GRAM and USDT balances and withdraw.",
      },
      { property: "og:title", content: "Wallet | Music AI" },
      { property: "og:description", content: "Connect a GRAM wallet and withdraw your mining." },
    ],
  }),
  component: WalletPage,
});

const ADDRESS_RE = /^[UEuе][QqFf][A-Za-z0-9_-]{46}$/;

const TonWallet = lazy(() => import("@/components/TonWallet"));

function short(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

function WalletPage() {
  const { state, connectWallet, disconnectWallet, withdraw } = useGame();
  const [manual, setManual] = useState(false);
  const [draft, setDraft] = useState("");

  const connected = Boolean(state.walletAddress);

  const submit = () => {
    const value = draft.trim();
    if (!ADDRESS_RE.test(value)) {
      toast.error("Invalid GRAM address", { description: "Paste an address starting with UQ or EQ." });
      return;
    }
    connectWallet(value);
    setDraft("");
    setManual(false);
    toast.success("GRAM wallet connected");
  };

  return (
    <div className="space-y-6">
      <section className="animate-fade-up flex flex-col items-center pt-6 text-center">
        <p className="text-xs text-foreground/50">Total balance</p>
        <p className="mt-1 text-5xl tracking-tight">{formatNumber(state.balance)}</p>
        <p className="mt-1 text-sm text-foreground/50">MUSIC</p>

        {connected ? (
          <button
            onClick={() => {
              disconnectWallet();
              toast("Wallet disconnected");
            }}
            className="glass-thin mt-4 flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] text-foreground/70"
          >
            {short(state.walletAddress!)} <LogOut size={12} strokeWidth={2} />
          </button>
        ) : null}
      </section>

      {!connected && (
        <section className="animate-fade-up delay-1 space-y-2">
          <ClientOnly fallback={<div className="h-11" aria-hidden />}>
            <Suspense fallback={<div className="h-11" aria-hidden />}>
              <TonWallet />
            </Suspense>
          </ClientOnly>
          {manual ? (
            <div className="space-y-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="UQ… paste your wallet address"
                className="glass-thin w-full rounded-xl px-3 py-3 text-xs outline-none placeholder:text-foreground/40"
              />
              <button
                onClick={submit}
                className="w-full rounded-xl bg-white py-3 text-sm text-gray-900 transition-transform duration-200 active:scale-95"
              >
                Connect wallet
              </button>
            </div>
          ) : (
            <button
              onClick={() => setManual(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] text-foreground/50"
            >
              <Plus size={12} strokeWidth={2} /> Enter address manually
            </button>
          )}
        </section>
      )}

      <section className="animate-fade-up delay-2 space-y-2">
        {MINERS.map((m) => {
          const balance = m.id === "gram" ? state.gram : state.usdt;
          const canWithdraw = connected && balance >= m.minWithdraw;
          return (
            <div key={m.id} className="liquid-glass rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <CoinIcon id={m.id} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{m.symbol}</p>
                  <p className="text-[11px] text-foreground/50">
                    {formatCrypto(minerRate(state, m))} {m.symbol} / hr
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base tracking-tight">{formatCrypto(balance)}</p>
                  <p className="text-[10px] text-foreground/40">
                    min {m.minWithdraw} {m.symbol}
                  </p>
                </div>
              </div>
              <button
                disabled={!canWithdraw}
                onClick={() => {
                  const ok = withdraw(m.id);
                  toast[ok ? "success" : "error"](
                    ok
                      ? `Withdrawal of ${formatCrypto(balance)} ${m.symbol} requested`
                      : connected
                        ? `You need at least ${m.minWithdraw} ${m.symbol}`
                        : "Connect a wallet first",
                  );
                }}
                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm transition-transform duration-200 active:scale-95 ${
                  canWithdraw ? "bg-white text-gray-900" : "glass-thin text-foreground/40"
                }`}
              >
                <ArrowUpRight size={14} strokeWidth={2} /> Withdraw
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
