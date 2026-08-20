import { createClient } from "@supabase/supabase-js";
import { getPost, PLAN_LENGTH } from "@/lib/content-plan";

export const APP_URL =
  process.env["MUSIC_APP_URL"] ??
  "https://project--dab08494-fad3-4b74-b767-83fcf82ed4fb-dev.lovable.app";

function token() {
  const t = process.env["MUSIC_TELEGRAM_BOT_TOKEN"];
  if (!t) throw new Error("MUSIC_TELEGRAM_BOT_TOKEN is not configured");
  return t;
}

export function db() {
  return createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function tg(method: string, body: unknown) {
  const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as {
    ok: boolean;
    result?: any;
    description?: string;
  };
  if (!data.ok) {
    console.error(`Telegram ${method} failed [${res.status}]: ${data.description}`);
  }
  return data;
}

export function isAdmin(userId: number | undefined) {
  if (!userId) return false;
  const ids = (process.env["MUSIC_TELEGRAM_ADMIN_IDS"] ?? "")
    .split(/[,\s]+/)
    .filter(Boolean);
  return ids.includes(String(userId));
}

export type BotState = {
  autopost_enabled: boolean;
  day_index: number;
  last_post_at: string | null;
};

export async function getState(): Promise<BotState> {
  const { data } = await db()
    .from("music_bot_state")
    .select("autopost_enabled, day_index, last_post_at")
    .eq("id", "default")
    .maybeSingle();
  return (
    (data as BotState | null) ?? {
      autopost_enabled: false,
      day_index: 0,
      last_post_at: null,
    }
  );
}

export async function setState(patch: Partial<BotState>) {
  await db()
    .from("music_bot_state")
    .upsert({ id: "default", ...patch, updated_at: new Date().toISOString() });
}

async function cover(prompt: string): Promise<string | null> {
  const key = process.env["DEEPAI_API_KEY"];
  if (!key) return null;
  try {
    const form = new FormData();
    form.set("text", `${prompt}, album cover artwork, high detail`);
    const res = await fetch("https://api.deepai.org/api/text2img", {
      method: "POST",
      headers: { "api-key": key },
      body: form,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { output_url?: string };
    return data.output_url ?? null;
  } catch (e) {
    console.error("DeepAI cover failed", e);
    return null;
  }
}

/** Publishes the next post of the 90-day plan to the channel. */
export async function publishNext() {
  const channel = process.env["MUSIC_TELEGRAM_CHANNEL_ID"];
  if (!channel) throw new Error("MUSIC_TELEGRAM_CHANNEL_ID is not configured");

  const state = await getState();
  const post = getPost(state.day_index);
  const image = await cover(post.imagePrompt);

  const reply_markup = {
    inline_keyboard: [[{ text: post.cta, url: APP_URL }]],
  };

  const sent = image
    ? await tg("sendPhoto", {
        chat_id: channel,
        photo: image,
        caption: post.caption,
        parse_mode: "Markdown",
        reply_markup,
      })
    : await tg("sendMessage", {
        chat_id: channel,
        text: post.caption,
        parse_mode: "Markdown",
        reply_markup,
      });

  if (!sent.ok) return { ok: false, error: sent.description, post };

  await db().from("music_channel_posts").insert({
    day_index: state.day_index,
    title: post.title,
    message_id: sent.result?.message_id ?? null,
    image_url: image,
  });

  await setState({
    day_index: (state.day_index + 1) % PLAN_LENGTH,
    last_post_at: new Date().toISOString(),
  });

  return { ok: true, post };
}

export function adminPanel(state: BotState) {
  const next = getPost(state.day_index);
  return {
    text:
      `*Music AI — admin panel*\n\n` +
      `Auto-posting: ${state.autopost_enabled ? "ON (every 24h)" : "OFF"}\n` +
      `Plan progress: day ${state.day_index + 1} / ${PLAN_LENGTH}\n` +
      `Last post: ${state.last_post_at ? new Date(state.last_post_at).toUTCString() : "never"}\n` +
      `Next up: ${next.title} — ${next.theme}`,
    reply_markup: {
      inline_keyboard: [
        [
          state.autopost_enabled
            ? { text: "Stop auto-posting", callback_data: "ap:off" }
            : { text: "Start auto-posting (24h)", callback_data: "ap:on" },
        ],
        [{ text: "Post now", callback_data: "ap:now" }],
        [{ text: "Refresh", callback_data: "ap:status" }],
      ],
    },
  };
}
