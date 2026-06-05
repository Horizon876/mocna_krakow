import { useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Story = {
  slug: string;
  name: string;
  role: string;
  accent: string; // hex
  teaser: string;
  quote: string;
  body: string;
};

type Props = { stories: Story[] };

// Showstopper: poziomy scroll artystycznych portretów (czarno-białe ->
// pełny kolor na hover). Klik rozwija pełną historię (Framer Motion).
// Wyspa Astro: JS tylko tutaj (client:visible).
export default function StoriesShowstopper({ stories }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Story | null>(null);

  const scrollBy = useCallback((dir: number) => {
    trackRef.current?.scrollBy({ left: dir * 420, behavior: "smooth" });
  }, []);

  // Kółko myszy w pionie -> przewijanie w poziomie
  const onWheel = useCallback((e: React.WheelEvent) => {
    const el = trackRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const max = el.scrollWidth - el.clientWidth;
      if ((el.scrollLeft > 0 && el.scrollLeft < max) || (el.scrollLeft === 0 && e.deltaY > 0) || (el.scrollLeft >= max && e.deltaY < 0)) {
        el.scrollLeft += e.deltaY;
        if (el.scrollLeft > 0 && el.scrollLeft < max) e.preventDefault();
      }
    }
  }, []);

  return (
    <div className="relative">
      {/* Sterowanie */}
      <div className="shell mb-6 flex items-center justify-end gap-2">
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Poprzednie historie"
          className="grid h-12 w-12 place-items-center rounded-full border border-graphite/15 bg-white text-graphite transition-colors hover:border-orange hover:text-orange"
        >
          ←
        </button>
        <button
          onClick={() => scrollBy(1)}
          aria-label="Następne historie"
          className="grid h-12 w-12 place-items-center rounded-full border border-graphite/15 bg-white text-graphite transition-colors hover:border-orange hover:text-orange"
        >
          →
        </button>
      </div>

      {/* Tor poziomy */}
      <div
        ref={trackRef}
        onWheel={onWheel}
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-6 pb-6 sm:px-[max(2rem,calc((100vw-1320px)/2+3rem))]"
        style={{ scrollbarWidth: "none" }}
      >
        {stories.map((s, i) => (
          <button
            key={s.slug}
            onClick={() => setActive(s)}
            className="story-card group relative aspect-[3/4] w-[78vw] max-w-[360px] shrink-0 animate-rise-in snap-center overflow-hidden rounded-[30px] text-left sm:w-[340px]"
            style={{ ["--accent" as string]: s.accent, animationDelay: `${(i % 3) * 90}ms` }}
          >
            {/* „Portret” – placeholder w masce; B&W -> kolor na hover */}
            <div
              className="absolute inset-0 grid place-items-center grayscale transition-all duration-700 ease-out group-hover:grayscale-0 group-hover:scale-[1.04]"
              style={{
                background: `radial-gradient(120% 120% at 30% 20%, ${s.accent}40, transparent 60%), radial-gradient(120% 120% at 80% 90%, ${s.accent}66, transparent 55%), ${s.accent}26`,
              }}
            >
              <span className="text-7xl opacity-80 transition-transform duration-700 group-hover:scale-110">👤</span>
            </div>

            {/* Gradient czytelności */}
            <div className="absolute inset-0 bg-gradient-to-t from-graphite/85 via-graphite/10 to-transparent" />

            {/* Opis */}
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <span
                className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: s.accent }}
              >
                {s.role}
              </span>
              <h3 className="font-display text-3xl font-bold tracking-tightest">{s.name}</h3>
              <p className="mt-1 max-w-[18rem] text-sm leading-relaxed text-white/80 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                {s.teaser}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
                Poznaj historię <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Rozwinięta historia */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[80] grid place-items-end sm:place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <div className="absolute inset-0 bg-graphite/55 backdrop-blur-sm" />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Historia: ${active.name}`}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 60, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-[34px] bg-white p-7 sm:rounded-[34px] sm:p-10"
            >
              <button
                onClick={() => setActive(null)}
                aria-label="Zamknij"
                className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-graphite/15 text-graphite transition-colors hover:border-orange hover:text-orange"
              >
                ✕
              </button>
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ background: active.accent }}
              >
                {active.role}
              </span>
              <h3 className="mt-4 font-display text-5xl font-bold tracking-tightest text-graphite">
                {active.name}
              </h3>
              <p
                className="mt-5 border-l-4 pl-4 font-display text-2xl font-bold leading-tight tracking-tightest"
                style={{ borderColor: active.accent, color: active.accent }}
              >
                „{active.quote}”
              </p>
              <p className="mt-5 text-lg leading-relaxed text-graphite-soft">{active.body}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/#wesprzyj-nas" className="btn-orange">Wesprzyj takie historie</a>
                <a href="/ludziemocnej" className="btn-outline">Poznaj cały zespół</a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
