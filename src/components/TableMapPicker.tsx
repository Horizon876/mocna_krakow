import React, { useState, useEffect, useMemo } from "react";
import { TIME_SLOTS, MONTH_NAMES, WEEKDAY_NAMES } from "./TableMapConfig";

interface TableMapPickerProps {
  onConfirm: (date: string, time: string) => void;
}

function parseISODate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getLocalToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateLabel(value: string) {
  return parseISODate(value).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getEarliestBookableDateTime() {
  const t = new Date();
  t.setSeconds(0, 0);
  t.setMinutes(t.getMinutes() + 120);
  const mins = t.getMinutes();
  if (mins % 30 !== 0) {
    t.setMinutes(mins + (30 - (mins % 30)));
  }
  return t;
}

function slotToDateTime(dateISO: string, slot: string) {
  const d = parseISODate(dateISO);
  const [h, m] = slot.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

function isSlotAvailable(slot: string, dateISO: string | null) {
  if (!dateISO) return false;
  const selected = parseISODate(dateISO);
  const today = getLocalToday();

  if (selected < today) return false;
  if (selected > today) return true;

  const earliest = getEarliestBookableDateTime();
  const earliestDay = new Date(earliest.getFullYear(), earliest.getMonth(), earliest.getDate());
  if (earliestDay > selected) return false;

  return slotToDateTime(dateISO, slot) >= earliest;
}

export default function TableMapPicker({ onConfirm }: TableMapPickerProps) {
  const [step, setStep] = useState<"date" | "time">("date");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [viewYear, setViewYear] = useState(() => getLocalToday().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => getLocalToday().getMonth());

  const minDate = useMemo(() => getLocalToday(), []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const handleDayClick = (iso: string) => {
    setSelectedDate(iso);
    setSelectedTime(null);
    setStep("time");
  };

  const handlePrevMonth = () => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayOffset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    for (let i = 0; i < firstDayOffset; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const iso = toISO(date);
      const isPast = date < minDate;
      const isTooFar = date > maxDate;
      const hasSlots = TIME_SLOTS.some((slot) => isSlotAvailable(slot, iso));
      const isDisabled = isPast || isTooFar || !hasSlots;

      days.push({
        date,
        iso,
        isPast,
        isDisabled,
        isToday: isSameDay(date, minDate),
      });
    }
    return days;
  }, [viewYear, viewMonth, minDate, maxDate]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-[2.5rem] font-bold leading-none tracking-tightest sm:text-[3.5rem]" aria-label="Zarezerwuj stolik">
          <span className="text-[#2c5ea9]">Z</span><span className="text-[#de3c42]">a</span><span className="text-[#ffde00]">r</span><span className="text-[#00955e]">e</span><span className="text-[#fa8080]">z</span><span className="text-[#f39200]">e</span><span className="text-[#2c5ea9]">r</span><span className="text-[#de3c42]">w</span><span className="text-[#ffde00]">u</span><span className="text-[#00955e]">j</span>
          {" "}
          <span className="text-[#fa8080]">s</span><span className="text-[#f39200]">t</span><span className="text-[#2c5ea9]">o</span><span className="text-[#de3c42]">l</span><span className="text-[#ffde00]">i</span><span className="text-[#00955e]">k</span>
        </h2>
        <p className="mt-2 font-bold text-[#333333]">
          {step === "date" ? "Wybierz datę wizyty." : "Wybierz godzinę rezerwacji."}
        </p>
      </div>

      {step === "date" ? (
        <div className="bg-[#faf8f4] p-4 sm:p-6">
          <div className="date-calendar border border-[#dddddd] bg-white px-5 py-5 sm:px-8 sm:py-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center border border-[#dddddd] bg-white text-[#2c5ea9] transition-colors hover:border-[#2c5ea9]/40 disabled:cursor-not-allowed disabled:opacity-35"
                onClick={handlePrevMonth}
                disabled={new Date(viewYear, viewMonth, 1) <= new Date(minDate.getFullYear(), minDate.getMonth(), 1)}
                aria-label="Poprzedni miesiąc"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M10 3L5 8l5 5" />
                </svg>
              </button>
              <p className="flex-1 text-center font-display text-[1.35rem] font-bold tracking-[-0.02em] text-[#333333] sm:text-[1.5rem]">
                {MONTH_NAMES[viewMonth].charAt(0).toUpperCase() + MONTH_NAMES[viewMonth].slice(1)} {viewYear}
              </p>
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center border border-[#dddddd] bg-white text-[#2c5ea9] transition-colors hover:border-[#2c5ea9]/40 disabled:cursor-not-allowed disabled:opacity-35"
                onClick={handleNextMonth}
                disabled={new Date(viewYear, viewMonth + 1, 0) >= maxDate}
                aria-label="Następny miesiąc"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M6 3l5 5-5 5" />
                </svg>
              </button>
            </div>

            <div className="mb-3 grid grid-cols-7">
              {WEEKDAY_NAMES.map((day) => (
                <span key={day} className="text-center text-[0.75rem] font-semibold uppercase tracking-[0.04em] text-[#888888]">
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {calendarDays.map((day, idx) => {
                if (!day) return <span key={`spacer-${idx}`} className="h-10" aria-hidden="true" />;

                let baseClass = "h-10 w-full text-center text-[0.95rem] leading-10 transition-colors ";
                if (day.isDisabled) {
                  baseClass += "cursor-not-allowed pointer-events-none font-normal text-[#c8c8c8] ";
                } else {
                  baseClass += "cursor-pointer font-medium text-[#333333] hover:text-[#2c5ea9] ";
                }

                if (selectedDate === day.iso) {
                  baseClass = "h-10 w-full text-center text-[0.95rem] leading-10 font-bold text-[#2c5ea9] cursor-pointer ";
                } else if (day.isToday && !day.isDisabled) {
                  baseClass += "font-bold ";
                }

                return (
                  <button
                    key={day.iso}
                    type="button"
                    className={baseClass}
                    onClick={() => !day.isDisabled && handleDayClick(day.iso)}
                    disabled={day.isDisabled}
                    aria-label={formatDateLabel(day.iso)}
                    aria-pressed={selectedDate === day.iso}
                  >
                    {day.date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[#6b6b6b]">Wybrana data</p>
              <p className="text-lg font-bold capitalize text-[#333333]">{selectedDate && formatDateLabel(selectedDate)}</p>
            </div>
            <button
              type="button"
              className="btn btn-outline self-start text-sm sm:self-auto"
              onClick={() => {
                setStep("date");
                setSelectedTime(null);
                document.dispatchEvent(new CustomEvent("bookingReset", { bubbles: true }));
              }}
            >
              ← Zmień datę
            </button>
          </div>

          <div className="mb-8 grid grid-cols-4 gap-2 sm:grid-cols-5">
            {TIME_SLOTS.map((slot) => {
              const available = isSlotAvailable(slot, selectedDate);
              const isSelected = selectedTime === slot;

              let btnClass = "border px-2 py-2.5 text-[0.875rem] transition-colors ";
              if (!available) {
                btnClass += "cursor-not-allowed border-transparent bg-transparent font-normal text-[#8a8a8a] opacity-60";
              } else if (isSelected) {
                btnClass += "cursor-pointer border-[#2c5ea9] bg-[#2c5ea9] font-bold text-white";
              } else {
                btnClass += "cursor-pointer border-[#e7e6e4] bg-white font-bold text-[#333333] hover:border-[#2c5ea9]/35 hover:bg-[#2c5ea9]/[0.06] hover:text-[#2c5ea9]";
              }

              return (
                <button
                  key={slot}
                  type="button"
                  className={btnClass}
                  disabled={!available}
                  onClick={() => setSelectedTime(slot)}
                >
                  {slot}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-orange w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedDate || !selectedTime}
            onClick={() => onConfirm(selectedDate!, selectedTime!)}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4"/>
            </svg>
            Pokaż plan kawiarni
          </button>
        </div>
      )}
    </div>
  );
}
