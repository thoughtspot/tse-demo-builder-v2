import { useState } from "react";

interface MeetingSchedulerViewProps {
  accountManager: string;
  durationMinutes: number;
  onSchedule: () => void;
  onBack?: () => void;
  compact?: boolean;
}

export default function MeetingSchedulerView({
  accountManager,
  durationMinutes,
  onSchedule,
  onBack,
  compact = false,
}: MeetingSchedulerViewProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < t;
  };
  const isWeekend = (day: number) => {
    const dow = new Date(viewYear, viewMonth, day).getDay();
    return dow === 0 || dow === 6;
  };
  const isSelected = (day: number) =>
    selectedDate !== null &&
    selectedDate.getFullYear() === viewYear &&
    selectedDate.getMonth() === viewMonth &&
    selectedDate.getDate() === day;
  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // 30-min slots 9 AM – 5 PM
  const timeSlots: string[] = [];
  for (let h = 9; h <= 17; h++) {
    const h12 = h > 12 ? h - 12 : h;
    const ampm = h < 12 ? "AM" : "PM";
    if (h < 17) {
      timeSlots.push(`${h12}:00 ${ampm}`);
      timeSlots.push(`${h12}:30 ${ampm}`);
    } else {
      timeSlots.push("5:00 PM");
    }
  }

  const handleSchedule = () => {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      onSchedule();
    }, 1500);
  };

  const canSchedule = selectedDate !== null && selectedTime !== null && !confirming;
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const cellPad = compact ? "4px 1px" : "6px 2px";
  const baseFontSize = compact ? "10px" : "11px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? "10px" : "14px" }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: compact ? "24px" : "32px", marginBottom: "4px" }}>📅</div>
        <div style={{ fontSize: compact ? "13px" : "14px", fontWeight: "700", color: "#111827" }}>
          Schedule with {accountManager}
        </div>
        <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
          {durationMinutes} min · Account Manager
        </div>
      </div>

      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={goToPrevMonth}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#6b7280", padding: "0 8px", lineHeight: 1 }}
        >
          ‹
        </button>
        <span style={{ fontSize: compact ? "11px" : "12px", fontWeight: "600", color: "#374151" }}>
          {monthLabel}
        </span>
        <button
          onClick={goToNextMonth}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#6b7280", padding: "0 8px", lineHeight: 1 }}
        >
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center" }}>
        {dayNames.map(d => (
          <div key={d} style={{ fontSize: "9px", color: "#9ca3af", fontWeight: "600", paddingBottom: "4px" }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`pad-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const disabled = isPast(day) || isWeekend(day);
          const selected = isSelected(day);
          const todayDay = isToday(day);
          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => {
                if (!disabled) {
                  setSelectedDate(new Date(viewYear, viewMonth, day));
                  setSelectedTime(null);
                }
              }}
              style={{
                padding: cellPad,
                border: "none",
                borderRadius: "50%",
                fontSize: baseFontSize,
                fontWeight: selected || todayDay ? "700" : "400",
                cursor: disabled ? "default" : "pointer",
                backgroundColor: selected ? "#2563eb" : "transparent",
                color: disabled ? "#d1d5db" : selected ? "#ffffff" : todayDay ? "#2563eb" : "#374151",
                outline: todayDay && !selected ? "1.5px solid #bfdbfe" : "none",
                outlineOffset: "-1px",
                transition: "background-color 0.15s",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <div style={{ fontSize: "11px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
            {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", maxHeight: "84px", overflowY: "auto" }}>
            {timeSlots.map(slot => (
              <button
                key={slot}
                onClick={() => setSelectedTime(slot)}
                style={{
                  padding: compact ? "4px 2px" : "5px 4px",
                  border: `1px solid ${selectedTime === slot ? "#2563eb" : "#d1d5db"}`,
                  borderRadius: "5px",
                  fontSize: compact ? "9px" : "10px",
                  fontWeight: selectedTime === slot ? "600" : "400",
                  cursor: "pointer",
                  backgroundColor: selectedTime === slot ? "#eff6ff" : "#ffffff",
                  color: selectedTime === slot ? "#2563eb" : "#374151",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleSchedule}
        disabled={!canSchedule}
        style={{
          padding: compact ? "10px" : "12px",
          backgroundColor: canSchedule ? "#2563eb" : "#e5e7eb",
          color: canSchedule ? "#ffffff" : "#9ca3af",
          border: "none",
          borderRadius: "8px",
          fontSize: compact ? "12px" : "13px",
          fontWeight: "600",
          cursor: canSchedule ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          transition: "background-color 0.2s",
        }}
      >
        {confirming
          ? "⏳ Scheduling..."
          : canSchedule
          ? `Confirm — ${selectedDate!.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${selectedTime}`
          : "Select a date & time"}
      </button>

      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "11px",
            color: "#6b7280",
            textAlign: "center",
            padding: 0,
          }}
        >
          ← Back to payment options
        </button>
      )}
    </div>
  );
}
