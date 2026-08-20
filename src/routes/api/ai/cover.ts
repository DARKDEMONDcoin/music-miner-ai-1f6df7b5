import { createFileRoute } from "@tanstack/react-router";

/**
 * توليد غلاف التراك عبر DeepAI (text2img).
 * يحتاج السر: DEEPAI_API_KEY
 */
export const Route = createFileRoute("/api/ai/cover")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["DEEPAI_API_KEY"];
        if (!key) {
          return Response.json({ error: "DEEPAI_API_KEY غير مضبوط" }, { status: 500 });
        }

        const { prompt } = (await request.json()) as { prompt?: string };
        if (!prompt || prompt.length > 400) {
          return Response.json({ error: "وصف غير صالح" }, { status: 400 });
        }

        const form = new FormData();
        form.set(
          "text",
          `square album cover artwork, ${prompt}, neon purple and cyan, futuristic music studio, high detail, no text`,
        );

        const res = await fetch("https://api.deepai.org/api/text2img", {
          method: "POST",
          headers: { "api-key": key },
          body: form,
        });

        const body = await res.text();
        if (!res.ok) {
          console.error(`DeepAI failed [${res.status}]: ${body}`);
          return Response.json({ error: body }, { status: res.status });
        }

        try {
          const data = JSON.parse(body) as { output_url?: string; err?: string };
          if (data.err || !data.output_url) {
            return Response.json({ error: data.err ?? "لا يوجد ناتج" }, { status: 502 });
          }
          return Response.json({ url: data.output_url });
        } catch {
          return Response.json({ error: "رد غير متوقع من DeepAI" }, { status: 502 });
        }
      },
    },
  },
});
