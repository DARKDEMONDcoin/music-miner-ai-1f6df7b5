import { useEffect, useRef, useState } from "react";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260611_183632_c311af08-e4b7-458f-81e7-79847a49b3d3.mp4";

const MAX_WIDTH = 960;
const FPS = 30;

export function BoomerangVideoBg() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);
  const [captured, setCaptured] = useState(false);

  // Capture frames while the video plays once.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let stopped = false;
    let rafId = 0;

    const grab = () => {
      if (stopped || video.videoWidth === 0) return;
      const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);
      const frame = document.createElement("canvas");
      frame.width = w;
      frame.height = h;
      const ctx = frame.getContext("2d");
      if (!ctx) return;
      try {
        ctx.drawImage(video, 0, 0, w, h);
        framesRef.current.push(frame);
      } catch {
        stopped = true;
      }
    };

    type VideoWithRVFC = HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
    };
    const v = video as VideoWithRVFC;

    const loop = () => {
      if (stopped || video.ended) return;
      grab();
      if (typeof v.requestVideoFrameCallback === "function") {
        v.requestVideoFrameCallback(loop);
      } else {
        rafId = requestAnimationFrame(loop);
      }
    };

    const onPlay = () => loop();
    const onEnded = () => {
      stopped = true;
      if (framesRef.current.length > 1) setCaptured(true);
    };

    video.addEventListener("playing", onPlay);
    video.addEventListener("ended", onEnded);
    void video.play().catch(() => undefined);

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      video.removeEventListener("playing", onPlay);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  // Ping-pong playback of the captured frames.
  useEffect(() => {
    if (!captured) return;
    const canvas = canvasRef.current;
    const frames = framesRef.current;
    if (!canvas || frames.length < 2) return;
    const first = frames[0]!;
    canvas.width = first.width;
    canvas.height = first.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let i = 0;
    let dir = 1;
    const id = window.setInterval(() => {
      const f = frames[i];
      if (f) ctx.drawImage(f, 0, 0);
      i += dir;
      if (i >= frames.length - 1) {
        i = frames.length - 1;
        dir = -1;
      } else if (i <= 0) {
        i = 0;
        dir = 1;
      }
    }, 1000 / FPS);

    return () => window.clearInterval(id);
  }, [captured]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 origin-center scale-[1.08] overflow-hidden">
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        playsInline
        autoPlay
        crossOrigin="anonymous"
        preload="auto"
        className={`h-full w-full object-cover ${captured ? "hidden" : ""}`}
      />
      {captured && <canvas ref={canvasRef} className="h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-background/55 to-background/75" />
    </div>
  );
}
