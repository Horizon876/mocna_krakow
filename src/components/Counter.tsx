import { useEffect, useRef, useState } from "react";
import type { StatAccent, StatTileSize } from "@data/site";

const tileAccent = {
  orange: {
    btn: "border-orange bg-orange",
    value: "text-white",
    label: "text-white",
  },
  yellow: {
    btn: "border-yellow bg-yellow",
    value: "text-graphite",
    label: "text-graphite",
  },
  red: {
    btn: "border-red bg-red",
    value: "text-white",
    label: "text-white",
  },
  green: {
    btn: "border-green bg-green",
    value: "text-white",
    label: "text-white",
  },
  blue: {
    btn: "border-blue bg-blue",
    value: "text-white",
    label: "text-white",
  },
} as const;

type Props = {
  value: number;
  suffix?: string;
  label: string;
  accent?: StatAccent;
  tileSize?: StatTileSize;
  variant?: "card" | "tile";
};

export default function Counter({
  value,
  suffix = "",
  label,
  accent = "orange",
  tileSize = "wide",
  variant = "card",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1800;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, value]);

  const formatted = display.toLocaleString("pl-PL");
  const tone = tileAccent[accent];

  if (variant === "tile") {
    const compact = tileSize === "compact";
    const valueSize = value >= 1000
      ? "text-[clamp(1.1rem,2.2vw,1.65rem)]"
      : compact
        ? "text-[clamp(1.45rem,2.8vw,1.9rem)]"
        : "text-[clamp(1.65rem,3.8vw,2.35rem)]";

    return (
      <div
        ref={ref}
        className={`flex flex-col items-center justify-center border text-center ${
          compact
            ? "w-[calc(50%-0.25rem)] gap-1.5 px-2 py-3.5 sm:w-auto sm:flex-[0.78] sm:gap-2 sm:px-2 sm:py-4"
            : "w-[calc(50%-0.25rem)] gap-2 px-2.5 py-4 sm:w-auto sm:flex-[1.35] sm:py-4.5"
        } ${tone.btn}`}
      >
        <div
          className={`font-display font-bold leading-none tracking-tightest ${valueSize} ${tone.value}`}
        >
          {formatted}
          {suffix && <span className="text-[0.85em]">{suffix}</span>}
        </div>
        <p
          className={`font-semibold leading-snug ${
            compact
              ? "max-w-[11rem] text-[12.5px] sm:max-w-[10rem] sm:text-[13.5px]"
              : "text-[14px] sm:text-[15px]"
          } ${tone.label}`}
        >
          {label}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="group relative rounded-[26px] border border-graphite-200 bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-soft"
    >
      <div className="font-display text-5xl font-bold leading-none tracking-tightest sm:text-6xl">
        {formatted}
        <span>{suffix}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-graphite-soft">{label}</p>
    </div>
  );
}
