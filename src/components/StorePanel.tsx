import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { useGame } from "@/hooks/useGame";
import { isPremium } from "@/lib/game";
import { GramIcon } from "@/components/CoinIcon";
import {
  SHOP_ITEMS,
  makeMemo,
  openExternal,
  telegram,
  tonkeeperLink,
  type ShopItem,
} from "@/lib/payments";
import { verifyTonPayment } from "@/lib/ton.functions";

export function StorePanel() {
  const { state, buy } = useGame();
  const verify = useServerFn(verifyTonPayment);
  const [busy, setBusy] = useState<string | null>(null);
  const cancelled = useRef(false);

  const applyItem = (id: ShopItem["id"]) => {
    if (id === "premium") buy("premium");
    else if (id === "booster") buy("booster");
    else if (id === "coins") buy("coins", 250_000);
    else if (id === "tracks10") buy("coins", 0);
    else if (id === "gram-rig") buy("gram", 5);
    else if (id === "usdt-rig") buy("usdt", 5);
    else if (id === "mega") {
      buy("premium");
      buy("booster");
      buy("coins", 1_000_000);
      buy("gram", 3);
    }
    telegram()?.HapticFeedback?.notificationOccurred?.("success");
    toast.success("Purchase unlocked", { description: "Your studio has been upgraded." });
  };

  const payWithStars = async (item: ShopItem) => {
    setBusy(`${item.id}-stars`);
    try {
      const res = await fetch("/api/telegram/invoice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const data = (await res.json()) as { link?: string; error?: string };
      if (!res.ok || !data.link) {
        toast.error("Stars checkout unavailable", {
          description: data.error ?? "Connect the Telegram bot token to enable Stars payments.",
        });
        return;
      }
      const tg = telegram();
      if (tg?.openInvoice) {
        tg.openInvoice(data.link, (status) => {
          if (status === "paid") applyItem(item.id);
          else if (status === "failed") toast.error("Payment failed");
        });
      } else {
        openExternal(data.link);
        toast("Invoice opened", { description: "Complete the payment inside Telegram." });
      }
    } catch {
      toast.error("Could not start the Stars checkout");
    } finally {
      setBusy(null);
    }
  };

  const payWithGram = async (item: ShopItem) => {
    const memo = makeMemo(item.id);
    openExternal(tonkeeperLink(item.ton, memo));
    setBusy(`${item.id}-ton`);
    cancelled.current = false;
    toast("Waiting for your GRAM transfer", {
      description: `Send ${item.ton} GRAM with comment ${memo}`,
    });

    for (let i = 0; i < 40; i++) {
      if (cancelled.current) break;
      await new Promise((r) => setTimeout(r, 6000));
      try {
        const res = await verify({ data: { memo, minTon: item.ton } });
        if (res.paid) {
          setBusy(null);
          applyItem(item.id);
          return;
        }
      } catch {
        /* keep polling */
      }
    }
    setBusy(null);
    toast("Payment not detected yet", {
      description: "If you already sent it, reopen the store in a minute.",
    });
  };

  return (
    <div className="space-y-3">
      <section className="liquid-glass animate-fade-up delay-1 rounded-2xl p-4 text-center">
        <p className="text-sm">
          {isPremium(state) ? "Premium is active" : "Level up your studio faster"}
        </p>
        <p className="mt-1 text-[11px] text-foreground/60">Pay with Telegram Stars or GRAM</p>
      </section>

      {SHOP_ITEMS.map((item, i) => {
        const Icon = item.icon;
        const starsBusy = busy === `${item.id}-stars`;
        const gramBusy = busy === `${item.id}-ton`;
        return (
          <div
            key={item.id}
            className={`liquid-glass animate-fade-up rounded-2xl p-4 ${i < 4 ? `delay-${i + 2}` : ""}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  item.highlight ? "bg-white text-blue-700" : "bg-blue-700"
                }`}
              >
                <Icon size={20} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-sm">{item.title}</p>
                <p className="text-[11px] text-foreground/60">{item.desc}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                disabled={Boolean(busy)}
                onClick={() => payWithStars(item)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-xs text-gray-900 transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {starsBusy ? (
                  <Loader2 size={13} className="animate-spin text-blue-700" />
                ) : (
                  <Star size={13} strokeWidth={2} className="text-blue-700" />
                )}
                {item.stars} Stars
              </button>
              <button
                disabled={Boolean(busy)}
                onClick={() => payWithGram(item)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-700 py-2.5 text-xs transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {gramBusy ? <Loader2 size={13} className="animate-spin" /> : <GramIcon size={14} />}
                {item.ton} GRAM
              </button>
            </div>
            {gramBusy && (
              <p className="mt-2 flex items-center gap-1.5 text-[10px] text-foreground/60">
                <Check size={11} /> Checking the blockchain for your transfer…
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
