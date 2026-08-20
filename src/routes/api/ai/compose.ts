import { createFileRoute } from "@tanstack/react-router";

const SYSTEM = `أنت ملحّن ذكي داخل تطبيق Music AI. من وصف المستخدم أنتج مقطوعة قصيرة.
أعد JSON فقط بالشكل:
{"title":"اسم عربي قصير","genre":"...","mood":"...","bpm":90,"key":"A minor","chords":["Am","F","C","G"],"melody":[69,72,76,74,0,72,69,67],"description":"جملة واحدة"}
قواعد: من 4 إلى 8 كوردات، من 8 إلى 32 نوتة MIDI بين 55 و 88 (استخدم 0 للسكتة)، bpm بين 70 و 150. لا تكتب أي نص خارج JSON.`;

export const Route = createFileRoute("/api/ai/compose")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { prompt } = (await request.json()) as { prompt?: string };
        if (!prompt || prompt.length > 400) {
          return Response.json({ error: "وصف غير صالح" }, { status: 400 });
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          return Response.json({ error: body }, { status: res.status });
        }

        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const raw = json.choices?.[0]?.message?.content ?? "";
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) return Response.json({ error: "تعذر توليد المقطوعة" }, { status: 502 });

        try {
          const comp = JSON.parse(match[0]) as Record<string, unknown>;
          return Response.json({
            title: String(comp["title"] ?? "تراك بدون اسم").slice(0, 60),
            genre: String(comp["genre"] ?? "Lo-Fi").slice(0, 40),
            mood: String(comp["mood"] ?? "هادئ").slice(0, 40),
            bpm: Math.min(180, Math.max(60, Number(comp["bpm"]) || 90)),
            key: String(comp["key"] ?? "A minor").slice(0, 20),
            chords: (Array.isArray(comp["chords"]) ? comp["chords"] : ["Am", "F", "C", "G"])
              .slice(0, 8)
              .map((c) => String(c).slice(0, 8)),
            melody: (Array.isArray(comp["melody"]) ? comp["melody"] : [69, 72, 76, 74])
              .slice(0, 32)
              .map((n) => {
                const v = Number(n) || 0;
                return v === 0 ? 0 : Math.min(96, Math.max(48, Math.round(v)));
              }),
            description: String(comp["description"] ?? "").slice(0, 160),
          });
        } catch {
          return Response.json({ error: "تعذر قراءة المقطوعة" }, { status: 502 });
        }
      },
    },
  },
});
