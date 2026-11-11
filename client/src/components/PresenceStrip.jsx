import { Circle, Clock, User } from "lucide-react";

export default function PresenceStrip({ members }) {
  const online = members.filter((m) => m.onlineNow);
  const today = members.filter((m) => m.activeToday && !m.onlineNow);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
        <User className="h-3 w-3" />
        <span>Group presence</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Online now */}
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[hsl(var(--foreground))]">
              Online now
            </span>
            <span className="text-[10px] font-medium text-[hsl(var(--primary))]">
              {online.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {online.length ? (
              online.map((m) => (
                <span
                  key={m.userId}
                  className="flex items-center gap-1.5 rounded-md bg-[hsl(var(--accent))] px-2 py-1 text-[10px] font-medium text-[hsl(var(--accent-foreground))]"
                >
                  <Circle className="h-2.5 w-2.5 fill-[hsl(var(--accent-foreground))]" />
                  {m.fullName}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                No one online
              </span>
            )}
          </div>
        </div>

        {/* Active today */}
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[hsl(var(--foreground))]">
              Active today
            </span>
            <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
              {today.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {today.length ? (
              today.map((m) => (
                <span
                  key={m.userId}
                  className="flex items-center gap-1.5 rounded-md border border-[hsl(var(--border))] px-2 py-1 text-[10px] text-[hsl(var(--muted-foreground))]"
                >
                  <Clock className="h-2.5 w-2.5" />
                  {m.fullName}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                No activity today
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
