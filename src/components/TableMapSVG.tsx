import React, { useState, useEffect } from "react";
import { TABLE_META } from "./TableMapConfig";

interface TableMapSVGProps {
  selectedTableId: string | null;
  occupiedTables: Set<string>;
  onTableSelect: (id: string) => void;
}

export default function TableMapSVG({
  selectedTableId,
  occupiedTables,
  onTableSelect,
}: TableMapSVGProps) {
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false });

  const getTableColor = (id: string) => {
    if (selectedTableId === id) return "#de3c42"; // selected
    if (occupiedTables.has(id)) return "#9ca3af"; // occupied
    return "#2c5ea9"; // free
  };

  const getCursor = (id: string) => {
    return occupiedTables.has(id) ? "not-allowed" : "pointer";
  };

  const handleMouseEnter = (id: string, e: React.MouseEvent<SVGGElement>) => {
    if (selectedTableId === id) return;
    setHoveredTable(id);
    updateTooltipPos(e.currentTarget);
  };

  const handleMouseMove = (id: string, e: React.MouseEvent<SVGGElement>) => {
    if (selectedTableId === id) return;
    updateTooltipPos(e.currentTarget);
  };

  const handleMouseLeave = () => {
    setHoveredTable(null);
    setTooltipPos((prev) => ({ ...prev, visible: false }));
  };

  const handleClick = (id: string) => {
    if (occupiedTables.has(id)) return;
    setHoveredTable(null);
    setTooltipPos((prev) => ({ ...prev, visible: false }));
    onTableSelect(selectedTableId === id ? "" : id);
  };

  const updateTooltipPos = (groupElement: Element) => {
    const rect = groupElement.getBoundingClientRect();
    const gap = 10;
    const tipW = 180;
    const tipH = 80; // approximate

    let left = rect.left + rect.width / 2 - tipW / 2;
    let top = rect.top - tipH - gap;

    if (top < 8) top = rect.bottom + gap;
    left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - tipH - 8));

    setTooltipPos({ x: left, y: top, visible: true });
  };

  useEffect(() => {
    const handleScroll = () => {
      setTooltipPos((p) => ({ ...p, visible: false }));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const meta = hoveredTable ? TABLE_META[hoveredTable] : null;

  return (
    <>
      <div className="w-full overflow-x-auto rounded-none border border-[#e7e6e4] bg-white shadow-sm">
        <svg
          viewBox="0 0 920 480"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto min-w-[850px] md:min-w-0"
          role="img"
          aria-label="Plan kawiarni MOCna! ze stolikami"
        >
          <defs>
            <filter id="tshadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodColor="#1e3a5f"
                floodOpacity="0.22"
              />
            </filter>
            <pattern
              id="parquet"
              patternUnits="userSpaceOnUse"
              width="24"
              height="24"
            >
              <rect width="24" height="24" fill="#fdf6ee" />
              <rect
                x="0"
                y="0"
                width="12"
                height="12"
                fill="#f7eedd"
                opacity="0.7"
              />
              <rect
                x="12"
                y="12"
                width="12"
                height="12"
                fill="#f7eedd"
                opacity="0.7"
              />
            </pattern>
            <pattern
              id="grass"
              patternUnits="userSpaceOnUse"
              width="14"
              height="14"
            >
              <rect width="14" height="14" fill="#dcfce7" />
              <path
                d="M3 12 Q4.5 7 6 12"
                stroke="#86efac"
                strokeWidth="1.2"
                fill="none"
              />
              <path
                d="M8 12 Q9.5 8 11 12"
                stroke="#86efac"
                strokeWidth="1.2"
                fill="none"
              />
            </pattern>
          </defs>

          {/* TŁO */}
          <rect x="22" y="22" width="588" height="436" fill="url(#parquet)" />
          <rect x="630" y="22" width="268" height="436" fill="url(#grass)" />
          <rect
            x="610"
            y="22"
            width="20"
            height="436"
            fill="#bfdbfe"
            opacity="0.22"
          />
          <line
            x1="617"
            y1="22"
            x2="617"
            y2="458"
            stroke="#93c5fd"
            strokeWidth="1"
            opacity="0.6"
          />
          <line
            x1="623"
            y1="22"
            x2="623"
            y2="458"
            stroke="#93c5fd"
            strokeWidth="1"
            opacity="0.6"
          />
          <line
            x1="610"
            y1="130"
            x2="630"
            y2="130"
            stroke="#6b7280"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="610"
            y1="240"
            x2="630"
            y2="240"
            stroke="#6b7280"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="610"
            y1="350"
            x2="630"
            y2="350"
            stroke="#6b7280"
            strokeWidth="1"
            opacity="0.4"
          />

          {/* DEKORACYJNE ROŚLINY */}
          <circle cx="644" cy="38" r="9" fill="#4ade80" opacity="0.45" />
          <circle cx="657" cy="46" r="6" fill="#22c55e" opacity="0.40" />
          <circle cx="886" cy="38" r="9" fill="#4ade80" opacity="0.45" />
          <circle cx="874" cy="46" r="6" fill="#22c55e" opacity="0.40" />
          <circle cx="644" cy="450" r="9" fill="#4ade80" opacity="0.45" />
          <circle cx="657" cy="442" r="6" fill="#22c55e" opacity="0.40" />
          <circle cx="886" cy="450" r="9" fill="#4ade80" opacity="0.45" />
          <circle cx="874" cy="442" r="6" fill="#22c55e" opacity="0.40" />

          {/* KRZESŁA */}
          {[103, 203, 303, 403, 503].map((x) => (
            <React.Fragment key={`chair-top-${x}`}>
              <rect
                x={x}
                y="68"
                width="14"
                height="8"
                rx="2"
                fill="#ffde00"
                opacity="0.95"
              />
              <rect
                x={x}
                y="124"
                width="14"
                height="8"
                rx="2"
                fill="#ffde00"
                opacity="0.95"
              />
            </React.Fragment>
          ))}
          {[78, 165, 368].map((x) => (
            <React.Fragment key={`chair-bot-${x}`}>
              <rect
                x={x}
                y="358"
                width="14"
                height="8"
                rx="2"
                fill="#ffde00"
                opacity="0.95"
              />
              <rect
                x={x}
                y="414"
                width="14"
                height="8"
                rx="2"
                fill="#ffde00"
                opacity="0.95"
              />
            </React.Fragment>
          ))}
          <rect
            x="281"
            y="358"
            width="14"
            height="8"
            rx="2"
            fill="#ffde00"
            opacity="0.95"
          />

          {/* OGRÓD KRZESŁA */}
          {[
            { x: 672, y: 415 },
            { x: 840, y: 415 },
            { x: 672, y: 320 },
            { x: 840, y: 320 },
            { x: 756, y: 225 },
            { x: 756, y: 130 },
          ].map((c, i) => (
            <React.Fragment key={`garden-chair-${i}`}>
              <rect
                x={c.x - 32}
                y={c.y - 7}
                width="8"
                height="14"
                rx="2"
                fill="#d1d5db"
                opacity="0.95"
              />
              <rect
                x={c.x + 24}
                y={c.y - 7}
                width="8"
                height="14"
                rx="2"
                fill="#d1d5db"
                opacity="0.95"
              />
              <rect
                x={c.x - 7}
                y={c.y + 24}
                width="14"
                height="8"
                rx="2"
                fill="#d1d5db"
                opacity="0.95"
              />
            </React.Fragment>
          ))}

          {/* LOUNGE TŁO i KRZESŁA */}
          <rect
            x="450"
            y="342"
            width="144"
            height="104"
            rx="8"
            fill="#fff1f2"
            opacity="0.8"
          />
          <rect
            x="469"
            y="342"
            width="14"
            height="8"
            rx="2"
            fill="#de3c42"
            opacity="0.7"
          />
          <rect
            x="443"
            y="363"
            width="8"
            height="14"
            rx="2"
            fill="#de3c42"
            opacity="0.7"
          />
          <rect
            x="543"
            y="342"
            width="14"
            height="8"
            rx="2"
            fill="#de3c42"
            opacity="0.7"
          />
          <rect
            x="572"
            y="363"
            width="8"
            height="14"
            rx="2"
            fill="#de3c42"
            opacity="0.7"
          />

          {/* STOLIKI */}
          {[1, 2, 3, 4, 5].map((i) => {
            const id = `T${i}`;
            const isHovered = hoveredTable === id && !occupiedTables.has(id);
            return (
              <g
                key={id}
                className={`transition-opacity duration-150 ${occupiedTables.has(id) ? "opacity-65" : "hover:opacity-100"}`}
                style={{ cursor: getCursor(id) }}
                onMouseEnter={(e) => handleMouseEnter(id, e)}
                onMouseMove={(e) => handleMouseMove(id, e)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(id)}
              >
                <circle
                  cx={10 + i * 100}
                  cy="100"
                  r="22"
                  fill={isHovered ? "#3b73c8" : getTableColor(id)}
                  filter="url(#tshadow)"
                  className="transition-colors duration-200"
                />
                <text
                  x={10 + i * 100}
                  y="104"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="white"
                  fontFamily="sans-serif"
                >
                  {i}
                </text>
              </g>
            );
          })}

          {[
            { id: "T6", cx: 85, cy: 390 },
            { id: "T7", cx: 172, cy: 390 },
            { id: "T8", cx: 288, cy: 390 },
            { id: "T9", cx: 375, cy: 390 },
          ].map(({ id, cx, cy }, i) => {
            const isHovered = hoveredTable === id && !occupiedTables.has(id);
            return (
              <g
                key={id}
                className={`transition-opacity duration-150 ${occupiedTables.has(id) ? "opacity-65" : "hover:opacity-100"}`}
                style={{ cursor: getCursor(id) }}
                onMouseEnter={(e) => handleMouseEnter(id, e)}
                onMouseMove={(e) => handleMouseMove(id, e)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(id)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r="22"
                  fill={isHovered ? "#3b73c8" : getTableColor(id)}
                  filter="url(#tshadow)"
                  className="transition-colors duration-200"
                />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="white"
                  fontFamily="sans-serif"
                >
                  {i + 6}
                </text>
              </g>
            );
          })}

          <g
            className={`transition-opacity duration-150 ${occupiedTables.has("T10") ? "opacity-65" : "hover:opacity-100"}`}
            style={{ cursor: getCursor("T10") }}
            onMouseEnter={(e) => handleMouseEnter("T10", e)}
            onMouseMove={(e) => handleMouseMove("T10", e)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick("T10")}
          >
            <circle
              cx="476"
              cy="370"
              r="22"
              fill={
                hoveredTable === "T10" && !occupiedTables.has("T10")
                  ? "#3b73c8"
                  : getTableColor("T10")
              }
              filter="url(#tshadow)"
              className="transition-colors duration-200"
            />
            <circle
              cx="550"
              cy="370"
              r="22"
              fill={
                hoveredTable === "T10" && !occupiedTables.has("T10")
                  ? "#3b73c8"
                  : getTableColor("T10")
              }
              filter="url(#tshadow)"
              className="transition-colors duration-200"
            />
            <rect
              x="453"
              y="402"
              width="120"
              height="30"
              rx="9"
              fill={
                hoveredTable === "T10" && !occupiedTables.has("T10")
                  ? "#3b73c8"
                  : getTableColor("T10")
              }
              filter="url(#tshadow)"
              className="transition-colors duration-200"
            />
            <line
              x1="513"
              y1="406"
              x2="513"
              y2="428"
              stroke="white"
              strokeWidth="1.5"
              opacity="0.4"
            />
            <text
              x="513"
              y="378"
              textAnchor="middle"
              fontSize="16"
              fontWeight="700"
              fill="#333333"
              fontFamily="sans-serif"
            >
              10
            </text>
          </g>

          {[
            { id: "G1", cx: 672, cy: 415, label: "O1" },
            { id: "G2", cx: 840, cy: 415, label: "O2" },
            { id: "G3", cx: 672, cy: 320, label: "O3" },
            { id: "G4", cx: 840, cy: 320, label: "O4" },
            { id: "G5", cx: 756, cy: 225, label: "O5" },
            { id: "G6", cx: 756, cy: 130, label: "O6" },
          ].map(({ id, cx, cy, label }) => {
            const isHovered = hoveredTable === id && !occupiedTables.has(id);
            return (
              <g
                key={id}
                className={`transition-opacity duration-150 ${occupiedTables.has(id) ? "opacity-65" : "hover:opacity-100"}`}
                style={{ cursor: getCursor(id) }}
                onMouseEnter={(e) => handleMouseEnter(id, e)}
                onMouseMove={(e) => handleMouseMove(id, e)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(id)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r="22"
                  fill={isHovered ? "#3b73c8" : getTableColor(id)}
                  filter="url(#tshadow)"
                  className="transition-colors duration-200"
                />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="white"
                  fontFamily="sans-serif"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* ŚCIANY I DRZWI */}
          <line
            x1="22"
            y1="22"
            x2="898"
            y2="22"
            stroke="#374151"
            strokeWidth="4.5"
            strokeLinecap="square"
          />
          <line
            x1="22"
            y1="458"
            x2="898"
            y2="458"
            stroke="#374151"
            strokeWidth="4.5"
            strokeLinecap="square"
          />
          <line
            x1="898"
            y1="22"
            x2="898"
            y2="458"
            stroke="#374151"
            strokeWidth="4.5"
            strokeLinecap="square"
          />
          <line
            x1="22"
            y1="22"
            x2="22"
            y2="158"
            stroke="#374151"
            strokeWidth="4.5"
            strokeLinecap="square"
          />
          <rect
            x="10"
            y="158"
            width="24"
            height="142"
            fill="#bfdbfe"
            opacity="0.30"
            rx="1"
          />
          <line
            x1="17"
            y1="158"
            x2="17"
            y2="300"
            stroke="#93c5fd"
            strokeWidth="1"
            opacity="0.7"
          />
          <line
            x1="23"
            y1="158"
            x2="23"
            y2="300"
            stroke="#93c5fd"
            strokeWidth="1"
            opacity="0.7"
          />
          <path
            d="M 22 300 A 100 100 0 0 0 122 300"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="1"
            strokeDasharray="5,4"
            opacity="0.8"
          />
          <line
            x1="22"
            y1="300"
            x2="22"
            y2="458"
            stroke="#374151"
            strokeWidth="4.5"
            strokeLinecap="square"
          />
          <line
            x1="610"
            y1="22"
            x2="610"
            y2="458"
            stroke="#374151"
            strokeWidth="3"
            strokeLinecap="square"
          />
          <line
            x1="630"
            y1="22"
            x2="630"
            y2="458"
            stroke="#374151"
            strokeWidth="3"
            strokeLinecap="square"
          />

          {/* ETYKIETY */}
          <text
            transform="rotate(-90 16 228)"
            x="16"
            y="228"
            textAnchor="middle"
            fontSize="8.5"
            fill="#6b7280"
            fontFamily="sans-serif"
            opacity="0.9"
          >
            Wejście
          </text>
          <text
            x="620"
            y="15"
            textAnchor="middle"
            fontSize="8"
            fill="#6b7280"
            fontFamily="sans-serif"
            opacity="0.9"
          >
            Taras
          </text>
          <rect
            x="268"
            y="228"
            width="96"
            height="26"
            rx="5"
            fill="white"
            opacity="0.55"
          />
          <text
            x="316"
            y="246"
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="#374151"
            fontFamily="sans-serif"
            opacity="0.65"
          >
            WNĘTRZE
          </text>
          <text
            x="513"
            y="338"
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill="#be123c"
            fontFamily="sans-serif"
            opacity="0.85"
          >
            Strefa lounge
          </text>
          <rect
            x="706"
            y="298"
            width="96"
            height="26"
            rx="5"
            fill="white"
            opacity="0.55"
          />
          <text
            x="754"
            y="316"
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="#15803d"
            fontFamily="sans-serif"
            opacity="0.8"
          >
            OGRÓD
          </text>
          <text
            x="892"
            y="473"
            textAnchor="end"
            fontSize="7.5"
            fill="#9ca3af"
            fontFamily="sans-serif"
          >
            MOCna! Plan sali
          </text>
        </svg>
      </div>

      {meta && tooltipPos.visible && (
        <div
          className="fixed z-[9999] pointer-events-none max-w-[180px] border border-[#e7e6e4] bg-[#333333] px-3 py-2 shadow-sm transition-opacity duration-100"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <p className="text-sm font-bold text-white m-0">{meta.label}</p>
          <p className="text-xs text-white/70 m-0">{meta.zone}</p>
          <p className="text-xs text-white/70 m-0">
            {meta.cap} {meta.cap === 1 ? "osoba" : "osoby"}
          </p>
          <p
            className="mt-1 text-xs font-semibold m-0"
            style={{
              color:
                selectedTableId === hoveredTable
                  ? "#fa8080"
                  : occupiedTables.has(hoveredTable!)
                    ? "#d1d5db"
                    : "#86efac",
            }}
          >
            {selectedTableId === hoveredTable
              ? "✓ Wybrany"
              : occupiedTables.has(hoveredTable!)
                ? "Zajęty"
                : "Wolny"}
          </p>
        </div>
      )}
    </>
  );
}
