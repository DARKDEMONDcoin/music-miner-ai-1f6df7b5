import { createFileRoute } from "@tanstack/react-router";

/** Telegram bot webhook: /start deep link + /101 admin panel. */
export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["MUSIC_TELEGRAM_WEBHOOK_SECRET"];
        if (
          secret &&
          request.headers.get("x-telegram-bot-api-secret-token") !== secret
        ) {
          return new Response("Unauthorized", { status: 401 });
        }

        const {
          tg,
          isAdmin,
          getState,
          setState,
          publishNext,
          adminPanel,
          APP_URL,
        } = await import("@/lib/telegram-bot.server");

        const update = (await request.json()) as any;

        try {
          const cb = update.callback_query;
          if (cb) {
            const from = cb.from?.id as number | undefined;
            if (!isAdmin(from)) {
              await tg("answerCallbackQuery", {
                callback_query_id: cb.id,
                text: "Admins only",
                show_alert: true,
              });
              return Response.json({ ok: true });
            }

            const action = String(cb.data ?? "");
            let note = "Updated";

            if (action === "ap:on") {
              await setState({ autopost_enabled: true });
              note = "Auto-posting started";
            } else if (action === "ap:off") {
              await setState({ autopost_enabled: false });
              note = "Auto-posting stopped";
            } else if (action === "ap:now") {
              const r = await publishNext();
              note = r.ok ? "Posted to the channel" : `Failed: ${r.error}`;
            }

            const panel = adminPanel(await getState());
            await tg("answerCallbackQuery", { callback_query_id: cb.id, text: note });
            await tg("editMessageText", {
              chat_id: cb.message?.chat?.id,
              message_id: cb.message?.message_id,
              text: panel.text,
              parse_mode: "Markdown",
              reply_markup: panel.reply_markup,
            });
            return Response.json({ ok: true });
          }

          const msg = update.message;
          const text: string = msg?.text ?? "";
          const chatId = msg?.chat?.id;
          if (!chatId) return Response.json({ ok: true });

          if (text.startsWith("/101")) {
            if (!isAdmin(msg.from?.id)) {
              await tg("sendMessage", { chat_id: chatId, text: "Admins only." });
              return Response.json({ ok: true });
            }
            const panel = adminPanel(await getState());
            await tg("sendMessage", {
              chat_id: chatId,
              text: panel.text,
              parse_mode: "Markdown",
              reply_markup: panel.reply_markup,
            });
            return Response.json({ ok: true });
          }

          if (text.startsWith("/start")) {
            await tg("sendMessage", {
              chat_id: chatId,
              text: "*Music AI*\n\nMine MUSIC, GRAM and USDT from your own AI studio.",
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "Open Music AI", web_app: { url: APP_URL } }],
                ],
              },
            });
          }
        } catch (e) {
          console.error("Telegram webhook error", e);
        }

        return Response.json({ ok: true });
      },
    },
  },
});
