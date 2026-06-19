import React, { useState, useEffect } from "react";
import TableMapPicker from "./TableMapPicker";
import TableMapSVG from "./TableMapSVG";
import { TABLE_META } from "./TableMapConfig";

interface TableMapRootProps {
  initialOccupiedTables?: string[];
}

function parseISODate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateLabel(value: string) {
  return parseISODate(value).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function TableMapRoot({ initialOccupiedTables = [] }: TableMapRootProps) {
  const [step, setStep] = useState<"picker" | "map">("picker");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [occupiedTables, setOccupiedTables] = useState<Set<string>>(new Set(initialOccupiedTables));

  useEffect(() => {
    if (step === "map" && selectedDate && selectedTime) {
      fetch(`/api/occupied-tables?date=${encodeURIComponent(selectedDate)}&time=${encodeURIComponent(selectedTime)}`)
        .then((r) => r.json())
        .then((ids) => {
          setOccupiedTables(new Set(ids));
        })
        .catch(() => {});
    }
  }, [step, selectedDate, selectedTime]);

  const handleConfirmDateTime = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep("map");
  };

  const handleBackToPicker = () => {
    setStep("picker");
    setSelectedTableId(null);
    document.dispatchEvent(new CustomEvent("bookingReset", { bubbles: true }));
  };

  const handleTableSelect = (id: string) => {
    setSelectedTableId(id || null);
    if (id) {
      const meta = TABLE_META[id];
      document.dispatchEvent(
        new CustomEvent("tableSelected", {
          detail: { tableId: id, label: meta?.label, zone: meta?.zone, cap: meta?.cap, date: selectedDate, time: selectedTime },
          bubbles: true,
        })
      );
    }
  };

  return (
    <div className="w-full">
      <input type="hidden" id="selected-table-input" name="tableId" value={selectedTableId || ""} />
      <input type="hidden" id="selected-time-input" name="reservationTime" value={selectedTime || ""} />
      <input type="hidden" id="selected-date-input" name="reservationDate" value={selectedDate || ""} />

      {step === "picker" ? (
        <TableMapPicker onConfirm={handleConfirmDateTime} />
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[#6b6b6b]">Rezerwacja na</p>
              <p className="text-lg font-bold text-[#333333]">
                {selectedDate && selectedTime ? `${formatDateLabel(selectedDate)}, godz. ${selectedTime}` : "— —"}
              </p>
            </div>
            <button type="button" className="btn btn-outline self-start text-sm sm:self-auto" onClick={handleBackToPicker}>
              ← Zmień godzinę
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-4 text-sm font-medium text-[#4b4b4b]">
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-full bg-[#2c5ea9] shadow-sm"></span>Wolny
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-full bg-[#9ca3af] shadow-sm"></span>Zajęty
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-full bg-[#de3c42] shadow-sm"></span>Wybrany
            </span>
          </div>

          <TableMapSVG
            selectedTableId={selectedTableId}
            occupiedTables={occupiedTables}
            onTableSelect={handleTableSelect}
          />

          {selectedTableId && TABLE_META[selectedTableId] && (
            <div className="mt-6 border border-[#e7e6e4] bg-white p-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="mb-1 text-sm text-[#6b6b6b]">Wybrany stolik</p>
              <p className="text-lg font-bold text-[#333333]">{TABLE_META[selectedTableId].label}</p>
              <p className="text-sm text-[#6b6b6b]">
                {TABLE_META[selectedTableId].zone} · {TABLE_META[selectedTableId].cap} {TABLE_META[selectedTableId].cap === 1 ? "osoba" : "osoby"}
              </p>
              <p className="mt-1 text-sm font-semibold capitalize text-[#2c5ea9]">
                {formatDateLabel(selectedDate!)}, godz. {selectedTime}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
