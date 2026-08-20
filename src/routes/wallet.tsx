import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useState } from "react";
import { ArrowUpRight, Link2, LogOut, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useGame } from "@/hooks/useGame";
import { GramIcon, UsdtIcon } from "@/components/CoinIcon";
import { MINERS, formatCrypto, formatNumber, minerRate } from "@/lib/game";
import { openExternal } from "@/lib/payments";

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

function WalletPage() {
  const { state, connectWallet, disconnectWallet, withdraw } = useGame();
  const [draft, setDraft] = useState("");

  const connected = Boolean(state.walletAddress);

  const submit = () => {
    const value = draft.trim();
    if (!ADDRESS_RE.test(value)) {
      toast.error("Invalid GRAM address", { description: "Paste a wallet address starting with UQ or EQ." });
      return;
    }
    connectWallet(value);
    setDraft("");
    toast.success("GRAM wallet connected");
  };

  return (
    <div className="space-y-3">
      <section className="liquid-glass animate-fade-up delay-1 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700">
            <Wallet size={20} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-sm">{connected ? "Wallet connected" : "Connect your GRAM wallet"}</p>
            <p className="text-[11px] text-foreground/60">
              {connected ? state.walletAddress : "Required to withdraw GRAM and USDT"}
            </p>
          </div>
        </div>

        {connected ? (
          <button
            onClick={() => {
              disconnectWallet();
              toast("Wallet disconnected");
            }}
            className="glass-thin mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm transition-transform duration-200 active:scale-95"
          >
            <LogOut size={14} strokeWidth={2} /> Disconnect
          </button>
        ) : (
          <div className="mt-3 space-y-2">
            <button
              onClick={() => openExternal("https://app.tonkeeper.com/")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-2.5 text-sm transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              <Link2 size={14} strokeWidth={2} /> Open Tonkeeper
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="UQ… paste your wallet address"
              className="glass-thin w-full rounded-xl px-3 py-2.5 text-xs outline-none placeholder:text-foreground/40"
            />
            <button
              onClick={submit}
              className="w-full rounded-xl bg-white py-2.5 text-sm text-gray-900 transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              Connect wallet
            </button>
          </div>
        )}
      </section>

      <section className="liquid-glass animate-fade-up delay-2 rounded-2xl p-5">
        <p className="text-xs text-foreground/60">MUSIC balance</p>
        <p className="text-3xl tracking-tight">{formatNumber(state.balance)}</p>
      </section>

      {MINERS.map((m, i) => {
        const balance = m.id === "gram" ? state.gram : state.usdt;
        const canWithdraw = connected && balance >= m.minWithdraw;
        return (
          <section
            key={m.id}
            className={`liquid-glass animate-fade-up rounded-2xl p-4 delay-${i + 3}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                {m.id === "gram" ? <GramIcon size={26} /> : <UsdtIcon size={26} />}
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  {formatCrypto(balance)} {m.symbol}
                </p>
                <p className="text-[11px] text-foreground/60">
                  {formatCrypto(minerRate(state, m))} {m.symbol} / hr · min withdraw{" "}
                  {m.minWithdraw} {m.symbol}
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
                canWithdraw ? "bg-white text-gray-900 hover:scale-105" : "glass-thin text-foreground/50"
              }`}
            >
              <ArrowUpRight size={14} strokeWidth={2} /> Withdraw {m.symbol}
            </button>
          </section>
        );
      })}
    </div>
  );
}
