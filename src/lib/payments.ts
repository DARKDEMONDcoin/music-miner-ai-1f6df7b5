import type { LucideIcon } from "lucide-react";
import { Coins, Crown, DollarSign, Gem, Music4, Rocket } from "lucide-react";

/** Project TON wallet that receives every on-chain payment. */
export const TON_WALLET = "UQAp1QxnLJ2z44IooUovvtVShw7hJBEdxCRV3RlbCYC3D8qj";

export type ShopItemId =
  | "premium"
  | "booster"
  | "tracks10"
  | "coins"
  | "gram-rig"
  | "usdt-rig"
  | "mega";

export type ShopItem = {
  id: ShopItemId;
  title: string;
  desc: string;
  stars: number;
  ton: number; // priced in GRAM (TON network coin)
  icon: LucideIcon;
  highlight?: boolean;
};

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "premium",
    title: "Premium Pass — 30 days",
    desc: "2x mining, 24h storage, 5 AI tracks per day, no ads.",
    stars: 250,
    ton: 1.2,
    icon: Crown,
    highlight: true,
  },
  {
    id: "booster",
    title: "3x Booster — 8 hours",
    desc: "Triple your mining rate instantly.",
    stars: 75,
    ton: 0.4,
    icon: Rocket,
  },
  {
    id: "tracks10",
    title: "10 AI track pack",
    desc: "Extra generations beyond your daily limit.",
    stars: 100,
    ton: 0.5,
    icon: Music4,
  },
  {
    id: "coins",
    title: "250,000 MUSIC bag",
    desc: "Instant coins to upgrade your instruments.",
    stars: 400,
    ton: 1.9,
    icon: Coins,
  },
  {
    id: "gram-rig",
    title: "GRAM Extractor — 5 levels",
    desc: "Instantly jump 5 levels of GRAM mining.",
    stars: 900,
    ton: 4.2,
    icon: Gem,
  },
  {
    id: "usdt-rig",
    title: "USDT Rig — 5 levels",
    desc: "Instantly jump 5 levels of stable USDT mining.",
    stars: 1400,
    ton: 6.5,
    icon: DollarSign,
  },
  {
    id: "mega",
    title: "Seasonal Mega Bundle",
    desc: "Premium + week booster + 1,000,000 MUSIC + 3 GRAM rig levels.",
    stars: 2500,
    ton: 11.5,
    icon: Gem,
  },
];

/** Short unique memo the wallet sends as a transfer comment so we can match it. */
export function makeMemo(itemId: ShopItemId) {
  return `MA-${itemId}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function tonTransferLink(amountTon: number, memo: string) {
  const nano = Math.round(amountTon * 1e9);
  return `ton://transfer/${TON_WALLET}?amount=${nano}&text=${encodeURIComponent(memo)}`;
}

export function tonkeeperLink(amountTon: number, memo: string) {
  const nano = Math.round(amountTon * 1e9);
  return `https://app.tonkeeper.com/transfer/${TON_WALLET}?amount=${nano}&text=${encodeURIComponent(memo)}`;
}

type TelegramWebApp = {
  openLink?: (url: string, opts?: { try_instant_view?: boolean }) => void;
  openTelegramLink?: (url: string) => void;
  openInvoice?: (url: string, cb: (status: string) => void) => void;
  initData?: string;
  initDataUnsafe?: { user?: { id: number; username?: string; first_name?: string } };
  HapticFeedback?: { notificationOccurred?: (t: "success" | "error" | "warning") => void };
};

export function telegram(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp ?? null;
}

export function openExternal(url: string) {
  const tg = telegram();
  if (tg?.openLink) tg.openLink(url);
  else window.open(url, "_blank", "noopener,noreferrer");
}
