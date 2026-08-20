import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Play, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import { useGame } from "@/hooks/useGame";
import { TrackPlayer, type Composition } from "@/lib/synth";
import { formatNumber, isPremium, type Track } from "@/lib/game";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "AI Studio | Music AI" },
      {
        name: "description",
        content: "Generate a track and cover art with AI and unlock a temporary mining bonus.",
      },
      { property: "og:title", content: "AI Studio | Music AI" },
      { property: "og:description", content: "AI music and cover generation inside Telegram." },
    ],
  }),
  component: AiPage,
});

const IDEAS = [
  "Calm lo-fi for rainy nights",
  "Hard-hitting trap beat",
  "80s synthwave drive",
  "Sad piano with strings",
  "Modern folk groove",
  "Ambient space focus",
];

function AiPage() {
  const { state, addTrack, grant } = useGame();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [comp, setComp] = useState<Composition | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<TrackPlayer | null>(null);

  const premium = isPremium(state);
  const todayCount = state.tracks.filter(
    (t) => new Date(t.createdAt).toDateString() === new Date().toDateString(),
  ).length;
  const dailyLimit = premium ? 5 : 1;
  const remaining = Math.max(0, dailyLimit - todayCount);

  async function generate() {
    if (!prompt.trim()) {
      toast.error("Describe the track first");
      return;
    }
    if (remaining <= 0) {
      toast.error("Daily generation limit reached", {
        description: "Premium unlocks 5 tracks per day.",
      });
      return;
    }

    setLoading(true);
    setComp(null);
    setCover(null);
    try {
      setStep("Composing...");
      const res = await fetch("/api/ai/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `Generation failed (${res.status})`);
      }
      const composition = (await res.json()) as Composition;
      setComp(composition);

      setStep("Painting the cover...");
      let coverUrl: string | null = null;
      try {
        const coverRes = await fetch("/api/ai/cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: `${composition.genre}, ${composition.mood}, ${prompt}` }),
        });
        if (coverRes.ok) {
          coverUrl = ((await coverRes.json()) as { url?: string }).url ?? null;
        } else {
          toast.message("Track created without a cover", {
            description: "The image service is unavailable right now.",
          });
        }
      } catch {
        /* cover is optional */
      }
      setCover(coverUrl);

      const bonusPct = 10 + Math.floor(Math.random() * 26);
      const track: Track = {
        id: String(Date.now()),
        title: composition.title,
        genre: composition.genre,
        mood: composition.mood,
        coverUrl,
        audioUrl: null,
        bonusPct,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 3_600_000,
      };
      addTrack(track);
      grant(500);
      toast.success(`"${composition.title}" created · +${bonusPct}% bonus for 24h`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  async function togglePlay() {
    if (!comp) return;
    if (playing) {
      playerRef.current?.stop();
      setPlaying(false);
      return;
    }
    playerRef.current = new TrackPlayer();
    setPlaying(true);
    await playerRef.current.play(comp, () => setPlaying(false));
  }

  return (
    <div className="space-y-3">
      <section className="liquid-glass animate-fade-up delay-1 rounded-2xl p-5">
        <h1 className="text-lg tracking-tight">AI Studio</h1>
        <p className="mt-1 text-xs text-foreground/60">
          Describe a genre and mood. The AI composes the track and paints the cover — each track adds a
          24-hour mining bonus.
        </p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="e.g. calm lo-fi with soft piano and light drums"
          className="glass-thin mt-3 w-full resize-none rounded-xl p-3 text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-blue-700"
        />

        <div className="mt-2 flex flex-wrap gap-1.5">
          {IDEAS.map((i) => (
            <button
              key={i}
              onClick={() => setPrompt(i)}
              className="glass-thin rounded-lg px-3 py-1 text-[11px] text-foreground/70 transition-transform duration-200 active:scale-95"
            >
              {i}
            </button>
          ))}
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm text-gray-900 transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-60"
        >
          <Sparkles size={14} strokeWidth={2} />
          {loading ? step || "Generating..." : "Generate track"}
        </button>
        <p className="mt-2 text-center text-[11px] text-foreground/60">
          {remaining} of {dailyLimit} left today
          {!premium && " · Premium gives 5 per day"}
        </p>
      </section>

      {comp && (
        <section className="liquid-glass animate-fade-up overflow-hidden rounded-2xl">
          <div
            className="aspect-square w-full bg-blue-700 bg-cover bg-center"
            style={cover ? { backgroundImage: `url(${cover})` } : undefined}
          />
          <div className="p-4">
            <p className="text-base tracking-tight">{comp.title}</p>
            <p className="text-[11px] text-foreground/60">
              {comp.genre} · {comp.mood} · {comp.bpm} BPM · {comp.key}
            </p>
            {comp.description && <p className="mt-2 text-xs text-foreground/80">{comp.description}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {comp.chords.map((c, i) => (
                <span key={`${c}-${i}`} className="glass-thin rounded-lg px-2 py-1 text-[11px]">
                  {c}
                </span>
              ))}
            </div>
            <button
              onClick={togglePlay}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-2.5 text-sm transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              {playing ? <Square size={14} strokeWidth={2} /> : <Play size={14} strokeWidth={2} />}
              {playing ? "Stop" : "Play track"}
            </button>
          </div>
        </section>
      )}

      {state.tracks.length > 0 && (
        <section className="space-y-2">
          <h2 className="px-1 text-sm text-foreground/70">Your library</h2>
          {state.tracks.map((t) => (
            <div key={t.id} className="liquid-glass flex items-center gap-3 rounded-2xl p-3">
              <div
                className="h-12 w-12 shrink-0 rounded-xl bg-blue-700 bg-cover bg-center"
                style={t.coverUrl ? { backgroundImage: `url(${t.coverUrl})` } : undefined}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{t.title}</p>
                <p className="text-[11px] text-foreground/60">
                  {t.genre} · +{t.bonusPct}% bonus
                </p>
              </div>
              <span className="text-[11px] text-foreground/60">
                {t.expiresAt > Date.now() ? "Active" : "Expired"}
              </span>
            </div>
          ))}
        </section>
      )}

      <p className="pb-2 text-center text-[11px] text-foreground/60">
        Balance: {formatNumber(state.balance)} MUSIC
      </p>
    </div>
  );
}
