export type InstrumentId =
  | "lofi-pad"
  | "synth"
  | "drum-machine"
  | "grand-piano"
  | "neural-mixer"
  | "quantum-sampler";

export type Instrument = {

  id: InstrumentId;
  name: string;
  icon: string;
  desc: string;
  baseRate: number; // MUSIC per hour at level 1
  baseCost: number;
};

export const INSTRUMENTS: Instrument[] = [
  {
    id: "lofi-pad",
    name: "Lo-Fi Pad",
    icon: "AudioWaveform",
    desc: "Studio foundation. Steady, quiet income.",
    baseRate: 10,
    baseCost: 100,
  },
  {
    id: "synth",
    name: "Synthesizer",
    icon: "SlidersHorizontal",
    desc: "Electric waves that lift production.",
    baseRate: 26,
    baseCost: 450,
  },
  {
    id: "drum-machine",
    name: "Drum Machine",
    icon: "Drum",
    desc: "Faster rhythm means faster mining.",
    baseRate: 60,
    baseCost: 1800,
  },
  {
    id: "grand-piano",
    name: "Grand Piano",
    icon: "Piano",
    desc: "A premium piece with high yield.",
    baseRate: 145,
    baseCost: 7200,
  },
  {
    id: "neural-mixer",
    name: "Neural Mixer",
    icon: "Brain",
    desc: "AI balances every frequency for you.",
    baseRate: 340,
    baseCost: 26000,
  },
  {
    id: "quantum-sampler",
    name: "Quantum Sampler",
    icon: "Orbit",
    desc: "The most powerful rig in the studio.",
    baseRate: 820,
    baseCost: 95000,
  },
];

export const COST_GROWTH = 1.6;
export const RATE_GROWTH = 1.35;
export const BASE_STORAGE_HOURS = 6;
export const PREMIUM_STORAGE_HOURS = 24;

export function upgradeCost(inst: Instrument, level: number) {
  return Math.round(inst.baseCost * Math.pow(COST_GROWTH, level));
}

export function instrumentRate(inst: Instrument, level: number) {
  if (level <= 0) return 0;
  return inst.baseRate * Math.pow(RATE_GROWTH, level - 1);
}

export type TaskDef = {
  id: string;
  title: string;
  reward: number;
  kind: "daily" | "social" | "achievement";
  cta?: string;
  url?: string;
};

export const TASKS: TaskDef[] = [
  { id: "daily-checkin", title: "Daily check-in", reward: 250, kind: "daily" },
  { id: "daily-collect", title: "Collect earnings 3 times today", reward: 400, kind: "daily" },
  { id: "daily-upgrade", title: "Upgrade any instrument today", reward: 600, kind: "daily" },
  { id: "daily-track", title: "Generate an AI track", reward: 750, kind: "daily" },
  {
    id: "join-channel",
    title: "Join the Music AI channel",
    reward: 2000,
    kind: "social",
    cta: "Join",
    url: "https://t.me/",
  },
  {
    id: "follow-x",
    title: "Follow us on X",
    reward: 1500,
    kind: "social",
    cta: "Follow",
    url: "https://x.com/",
  },
  { id: "invite-1", title: "Invite your first friend", reward: 3000, kind: "achievement" },
  { id: "invite-5", title: "Invite 5 friends", reward: 12000, kind: "achievement" },
  { id: "level-10", title: "Reach level 10 on any instrument", reward: 20000, kind: "achievement" },
];

export type Track = {
  id: string;
  title: string;
  genre: string;
  mood: string;
  coverUrl: string | null;
  audioUrl: string | null;
  bonusPct: number;
  createdAt: number;
  expiresAt: number;
};

export type GameState = {
  balance: number;
  gram: number;
  usdt: number;
  minerLevels: Record<string, number>;
  levels: Record<string, number>;
  lastCollectAt: number;
  collectsToday: number;
  dayStamp: string;
  streak: number;
  claimedTasks: string[];
  tracks: Track[];
  premiumUntil: number;
  boosterUntil: number;
  referrals: number;
  refCode: string;
  walletAddress: string | null;
};

export const STORAGE_KEY = "music-ai-state-v1";

export function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function makeRefCode() {
  return "MUS" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function initialState(): GameState {
  return {
    balance: 500,
    gram: 0,
    usdt: 0,
    minerLevels: {},
    levels: { "lofi-pad": 1 },
    lastCollectAt: Date.now(),
    collectsToday: 0,
    dayStamp: todayStamp(),
    streak: 1,
    claimedTasks: [],
    tracks: [],
    premiumUntil: 0,
    boosterUntil: 0,
    referrals: 0,
    refCode: makeRefCode(),
    walletAddress: null,
  };
}


export function isPremium(s: GameState) {
  return s.premiumUntil > Date.now();
}

export function baseRatePerHour(s: GameState) {
  return INSTRUMENTS.reduce(
    (sum, i) => sum + instrumentRate(i, s.levels[i.id] ?? 0),
    0,
  );
}

export function activeTrack(s: GameState): Track | null {
  const now = Date.now();
  return s.tracks.find((t) => t.expiresAt > now) ?? null;
}

export function multiplier(s: GameState) {
  let m = 1;
  if (isPremium(s)) m *= 2;
  if (s.boosterUntil > Date.now()) m *= 3;
  const t = activeTrack(s);
  if (t) m *= 1 + t.bonusPct / 100;
  m *= 1 + s.referrals * 0.1;
  return m;
}

export function ratePerHour(s: GameState) {
  return baseRatePerHour(s) * multiplier(s);
}

export function storageHours(s: GameState) {
  return isPremium(s) ? PREMIUM_STORAGE_HOURS : BASE_STORAGE_HOURS;
}

export function pending(s: GameState, now = Date.now()) {
  const hours = Math.min((now - s.lastCollectAt) / 3_600_000, storageHours(s));
  return Math.max(0, hours * ratePerHour(s));
}

export function fillPct(s: GameState, now = Date.now()) {
  const hours = (now - s.lastCollectAt) / 3_600_000;
  return Math.min(100, (hours / storageHours(s)) * 100);
}

/* ---------------- Crypto miners: GRAM & USDT ---------------- */

export type MinerId = "gram" | "usdt";

export type Miner = {
  id: MinerId;
  name: string;
  symbol: string;
  desc: string;
  icon: string;
  baseRate: number; // coins per hour at level 1
  baseCost: number; // MUSIC cost for level 1
  minWithdraw: number;
};

export const MINERS: Miner[] = [
  {
    id: "gram",
    name: "GRAM Extractor",
    symbol: "GRAM",
    desc: "Mines GRAM, the TON network coin, straight into your wallet.",
    icon: "Gem",
    baseRate: 0.0025,
    baseCost: 250_000,
    minWithdraw: 1,
  },
  {
    id: "usdt",
    name: "USDT Rig",
    symbol: "USDT",
    desc: "Converts studio output into stable USDT every hour.",
    icon: "DollarSign",
    baseRate: 0.0009,
    baseCost: 600_000,
    minWithdraw: 5,
  },
];

export const MINER_COST_GROWTH = 1.75;
export const MINER_RATE_GROWTH = 1.4;

export function minerUpgradeCost(m: Miner, level: number) {
  return Math.round(m.baseCost * Math.pow(MINER_COST_GROWTH, level));
}

export function minerRate(s: GameState, m: Miner) {
  const level = s.minerLevels[m.id] ?? 0;
  if (level <= 0) return 0;
  const raw = m.baseRate * Math.pow(MINER_RATE_GROWTH, level - 1);
  return raw * (isPremium(s) ? 2 : 1) * (s.boosterUntil > Date.now() ? 1.5 : 1);
}

export function minerPending(s: GameState, m: Miner, now = Date.now()) {
  const hours = Math.min((now - s.lastCollectAt) / 3_600_000, storageHours(s));
  return Math.max(0, hours * minerRate(s, m));
}

export function formatCrypto(n: number) {
  if (n >= 1000) return n.toFixed(2);
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(5);
}

export function formatNumber(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(2) + "K";
  return n.toFixed(n < 100 ? 2 : 0);
}


/* ---------------- Alternative payment pricing ---------------- */

/** GRAM price for a MUSIC-denominated upgrade cost. */
export function gramForCost(musicCost: number) {
  return Math.max(0.05, Math.round((musicCost / 400_000) * 100) / 100);
}

/** Telegram Stars price for a MUSIC-denominated upgrade cost. */
export function starsForCost(musicCost: number) {
  return Math.max(15, Math.ceil(musicCost / 1500));
}
