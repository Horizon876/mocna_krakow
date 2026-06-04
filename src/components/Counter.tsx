import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  suffix?: string;
  label: string;
  color?: string;
};

// Animowany licznik – wyspa Astro. JS ładuje się tylko dla tego komponentu
// (client:visible), uruchamia się gdy wjedzie w viewport.
export default function Counter({ value, suffix = "", label, color = "#f39200" }: Props) {
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
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1600;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, value]);

  const formatted = display.toLocaleString("pl-PL");

  return (
    <div
      ref={ref}
      className="group relative rounded-[26px] border border-graphite-200 bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-soft"
    >
      <span
        className="absolute left-6 top-6 h-2.5 w-2.5 rounded-full transition-transform duration-500 group-hover:scale-150"
        style={{ background: color }}
      />
      <div
        className="font-display text-5xl font-bold leading-none tracking-tightest sm:text-6xl"
        style={{ color }}
      >
        {formatted}
        <span>{suffix}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-graphite-soft">{label}</p>
    </div>
  );
}
