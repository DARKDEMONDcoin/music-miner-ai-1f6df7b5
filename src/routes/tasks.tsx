import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Flame } from "lucide-react";
import { toast } from "sonner";
import { useGame } from "@/hooks/useGame";
import { TASKS, formatNumber } from "@/lib/game";
import { ReferralPanel } from "@/components/ReferralPanel";
import dailyCheckin from "@/assets/tasks/daily-checkin.jpg";
import dailyCollect from "@/assets/tasks/daily-collect.jpg";
import dailyUpgrade from "@/assets/tasks/daily-upgrade.jpg";
import dailyTrack from "@/assets/tasks/daily-track.jpg";
import joinChannel from "@/assets/tasks/join-channel.jpg";
import followX from "@/assets/tasks/follow-x.jpg";
import invite1 from "@/assets/tasks/invite-1.jpg";
import invite5 from "@/assets/tasks/invite-5.jpg";
import level10 from "@/assets/tasks/level-10.jpg";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks & Invite | Music AI" },
      {
        name: "description",
        content: "Complete daily and social tasks, and invite friends to earn free MUSIC coins.",
      },
      { property: "og:title", content: "Tasks & Invite | Music AI" },
      { property: "og:description", content: "Daily tasks, achievements and referral rewards." },
    ],
  }),
  component: TasksPage,
});

const TASK_IMAGES: Record<string, string> = {
  "daily-checkin": dailyCheckin,
  "daily-collect": dailyCollect,
  "daily-upgrade": dailyUpgrade,
  "daily-track": dailyTrack,
  "join-channel": joinChannel,
  "follow-x": followX,
  "invite-1": invite1,
  "invite-5": invite5,
  "level-10": level10,
};

const GROUPS = [
  { kind: "daily", label: "Daily" },
  { kind: "social", label: "Social" },
  { kind: "achievement", label: "Achievements" },
] as const;

function TasksPage() {
  const [tab, setTab] = useState<"tasks" | "invite">("tasks");

  return (
    <div className="space-y-3">
      <div className="liquid-glass animate-fade-up grid grid-cols-2 gap-1 rounded-2xl p-1.5">
        {(["tasks", "invite"] as const).map((t) => (
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

      {tab === "tasks" ? <TasksTab /> : <ReferralPanel />}
    </div>
  );
}

function TasksTab() {
  const { state, claimTask } = useGame();

  return (
    <div className="space-y-5">
      <section className="liquid-glass animate-fade-up delay-1 rounded-2xl p-5 text-center">
        <div className="flex items-center justify-center gap-2">
          <Flame size={18} strokeWidth={2} className="text-blue-500" />
          <p className="text-3xl tracking-tight">{state.streak}</p>
        </div>
        <p className="mt-1 text-[11px] text-foreground/60">
          Day streak — every consecutive day adds 10% to your check-in reward
        </p>
      </section>

      {GROUPS.map((g, gi) => (
        <section key={g.kind} className={`animate-fade-up space-y-2 delay-${gi + 2}`}>
          <h2 className="px-1 text-sm text-foreground/70">{g.label}</h2>
          {TASKS.filter((t) => t.kind === g.kind).map((t) => {
            const done = state.claimedTasks.includes(t.id);
            return (
              <div key={t.id} className="liquid-glass overflow-hidden rounded-2xl">
                <div className="relative h-28 w-full">
                  <img
                    src={TASK_IMAGES[t.id] ?? dailyCheckin}
                    alt={t.title}
                    width={512}
                    height={512}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="text-sm">{t.title}</p>
                    <p className="text-[11px] text-foreground/70">
                      +{formatNumber(t.reward)} MUSIC
                    </p>
                  </div>
                </div>
                <div className="p-3">
                <button
                  disabled={done}
                  onClick={() => {
                    if (t.url) window.open(t.url, "_blank");
                    claimTask(t.id, t.reward);
                    toast.success(`Claimed ${formatNumber(t.reward)} MUSIC`);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs transition-transform duration-200 active:scale-95 ${
                    done ? "glass-thin text-foreground/50" : "bg-white text-gray-900 hover:scale-105"
                  }`}
                >
                  {done ? <Check size={13} strokeWidth={2} /> : null}
                  {done ? "Done" : (t.cta ?? "Claim")}
                </button>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
