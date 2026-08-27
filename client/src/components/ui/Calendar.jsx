import { useState } from "react";
import "./Calendar.css";

/**
 * Month-view calendar for browsing dated history.
 *
 *   <Calendar
 *     selectedDate="2026-08-23"
 *     onSelectDate={(dateStr) => ...}
 *     markedDates={{ "2026-08-05": { calories: 1200, mealCount: 2 } }}
 *     onMonthChange={(monthStr) => ...}   // "2026-08" — fetch that month's markedDates
 *   />
 *
 * Dates are plain "YYYY-MM-DD" strings throughout — no date libraries,
 * no timezone conversion, matching the UTC-day convention used by the
 * nutrition API this feeds.
 */

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const pad2 = (n) => String(n).padStart(2, "0");
const daysInMonth = (year, monthIdx) => new Date(year, monthIdx + 1, 0).getDate();
const firstWeekday = (year, monthIdx) => new Date(year, monthIdx, 1).getDay();

export default function Calendar({ selectedDate, onSelectDate, markedDates = {}, onMonthChange }) {
  const initial = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth()); // 0-indexed

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const isAtCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const changeMonth = (delta) => {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    if (newMonth < 0) { newMonth = 11; newYear -= 1; }
    if (newMonth > 11) { newMonth = 0; newYear += 1; }
    setViewMonth(newMonth);
    setViewYear(newYear);
    onMonthChange?.(`${newYear}-${pad2(newMonth + 1)}`);
  };

  const dateStr = (day) => `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`;
  const numDays = daysInMonth(viewYear, viewMonth);
  const leadingBlanks = firstWeekday(viewYear, viewMonth);

  const cells = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="kk-calendar">
      <div className="kk-calendar__header">
        <button className="kk-calendar__nav" onClick={() => changeMonth(-1)} aria-label="Previous month">
          ‹
        </button>
        <span className="kk-calendar__label">{monthLabel}</span>
        <button
          className="kk-calendar__nav"
          onClick={() => changeMonth(1)}
          disabled={isAtCurrentMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="kk-calendar__weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="kk-calendar__grid">
        {cells.map((day, i) => {
          if (day === null) {
            return <span key={`blank-${i}`} className="kk-calendar__cell kk-calendar__cell--empty" />;
          }
          const ds = dateStr(day);
          const isFuture = ds > todayStr;
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDate;
          const marked = markedDates[ds];

          return (
            <button
              key={ds}
              className={[
                "kk-calendar__cell",
                isToday && "kk-calendar__cell--today",
                isSelected && "kk-calendar__cell--selected",
                isFuture && "kk-calendar__cell--disabled",
              ].filter(Boolean).join(" ")}
              disabled={isFuture}
              onClick={() => onSelectDate(ds)}
              title={marked ? `${marked.mealCount} meal(s), ${Math.round(marked.calories)} kcal` : undefined}
            >
              <span className="kk-calendar__day-num">{day}</span>
              {marked && <span className="kk-calendar__dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
