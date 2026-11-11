import { useMemo } from "react";
import { Calendar } from "lucide-react";

const WEEKS_TO_SHOW = 26; // ~6 months

// GitHub-style contribution levels mapped to our neutral + accent palette.
function levelColor(count) {
  if (count === 0) return "bg-[hsl(var(--muted))]";
  if (count === 1) return "bg-[hsl(var(--accent))]";
  if (count === 2) return "bg-[hsl(var(--primary))]/50";
  if (count === 3) return "bg-[hsl(var(--primary))]";
  return "bg-[hsl(var(--primary-hover))]";
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function ymd(date) {
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate())
  );
}

export default function ContributionGraph({ activityByDate, today }) {
  const end = today ? new Date(today) : new Date();
  end.setHours(0, 0, 0, 0);

  // Build weeks: each week starts on Sunday, going back WEEKS_TO_SHOW weeks.
  const weeks = useMemo(() => {
    const weeks = [];
    const current = new Date(end);
    current.setDate(current.getDate() - current.getDay()); // Sunday of this week

    for (let i = 0; i < WEEKS_TO_SHOW; i++) {
      const week = [];
      const weekStart = new Date(current);
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + d);
        week.push(dayDate);
      }
      weeks.unshift(week);
      current.setDate(current.getDate() - 7);
    }
    return weeks;
  }, [end]);

  const total = Object.values(activityByDate).reduce((sum, c) => sum + c, 0);

  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
        <Calendar className="h-4 w-4" />
        <span>Your activity</span>
        {total > 0 && <span>· {total} contributions</span>}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex items-end gap-1.5">
          {/* Day labels */}
          <div className="flex flex-col gap-1 shrink-0 text-[10px] text-[hsl(var(--muted-foreground))]">
            {daysOfWeek.map((d) => (
              <div key={d} className="text-center w-4">
                {d}
              </div>
            ))}
          </div>

          {/* Grid: weeks as columns */}
          <div className="flex gap-1.5">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col-reverse gap-1.5">
                {week.map((dayDate) => {
                  const dateStr = ymd(dayDate);
                  const count = activityByDate[dateStr] || 0;
                  const isToday = today ? dateStr === today : false;
                  const level = Math.min(count, 4);
                  return (
                    <div
                      key={dateStr}
                      className={`w-3 h-3 rounded-md ${levelColor(level)} ${
                        isToday
                          ? "ring-2 ring-[hsl(var(--ring))] ring-offset-1 ring-offset-[hsl(var(--background))]"
                          : ""
                      }`}
                      title={`${dateStr}: ${count} ${
                        count === 1 ? "activity" : "activities"
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 text-[10px] text-[hsl(var(--muted-foreground))]">
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-md ${levelColor(level)}`} />
            <span>{level === 0 ? "None" : String(level)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
