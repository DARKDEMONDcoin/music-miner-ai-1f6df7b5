import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/tonconnect-manifest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        return new Response(
          JSON.stringify({
            url: origin,
            name: "Music AI",
            iconUrl: `${origin}/favicon.ico`,
          }),
          {
            headers: {
              "content-type": "application/json",
              "access-control-allow-origin": "*",
              "cache-control": "public, max-age=300",
            },
          },
        );
      },
    },
  },
});
