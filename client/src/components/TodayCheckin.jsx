import { useState } from "react";
import { Plus, Edit2, Sun, Moon } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PERIODS = [
  { key: "MORNING", label: "Morning", Icon: Sun, placeholder: "What are you studying and planning today?" },
  { key: "EVENING", label: "Evening", Icon: Moon, placeholder: "What did you complete today?" },
];

export default function TodayCheckin({ groupId, workspaceId, myUpdate }) {
  const [editingPeriod, setEditingPeriod] = useState<string | null>(null);
  const [draft, setDraft] = useState({ studying: "", plan: "", completed: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const updateForPeriod = (period) =>
    (myUpdate && myUpdate.period === period ? myUpdate : null);

  const handleSave = async (period) => {
    setError("");
    setSaving(true);
    try {
      await api.dailyUpdates.upsert({
        groupId,
        date: today,
        period,
        studying: period === "MORNING" ? draft.studying : undefined,
        plan: period === "MORNING" ? draft.plan : undefined,
        completed: period === "EVENING" ? draft.completed : undefined,
        workspaceId,
      });
      setEditingPeriod(null);
      setDraft({ studying: "", plan: "", completed: "" });
    } catch (err) {
      setError(err.message || "Failed to save check-in");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-0">
      <CardHeader>
        <CardTitle className="text-base">Today's check-in</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {error && (
          <div className="rounded-md border border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 p-3 text-[hsl(var(--destructive-foreground))] text-xs">
            {error}
          </div>
        )}

        {PERIODS.map((period) => {
          const existing = updateForPeriod(period.key);
          const isEditing = editingPeriod === period.key;
          const Icon = period.Icon;
          return (
            <div
              key={period.key}
              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${existing ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]"}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium">{period.label}</span>
                {existing && (
                  <span className="ml-auto text-[10px] bg-[hsl(var(--accent))] px-1.5 py-0.5 rounded text-[hsl(var(--accent-foreground))] font-medium">
                    Posted
                  </span>
                )}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPeriod(period.key);
                      setDraft({
                        studying: existing?.studying || "",
                        plan: existing?.plan || "",
                        completed: existing?.completed || "",
                      });
                    }}
                    className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
                    aria-label={`Edit ${period.label} check-in`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave(period.key);
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <Label htmlFor={`checkin-studying-${period.key}`}>
                      What are you studying?
                    </Label>
                    <Input
                      id={`checkin-studying-${period.key}`}
                      value={draft.studying}
                      onChange={(e) => setDraft({ ...draft, studying: e.target.value })}
                      placeholder={period.placeholder}
                    />
                  </div>
                  {period.key === "MORNING" && (
                    <div className="space-y-2">
                      <Label htmlFor={`checkin-plan-${period.key}`}>
                        What do you plan to do today?
                      </Label>
                      <Input
                        id={`checkin-plan-${period.key}`}
                        value={draft.plan}
                        onChange={(e) => setDraft({ ...draft, plan: e.target.value })}
                        placeholder="e.g. Finish Calculus chapter 3"
                      />
                    </div>
                  )}
                  {period.key === "EVENING" && (
                    <div className="space-y-2">
                      <Label htmlFor={`checkin-completed-${period.key}`}>
                        What did you complete?
                      </Label>
                      <Input
                        id={`checkin-completed-${period.key}`}
                        value={draft.completed}
                        onChange={(e) => setDraft({ ...draft, completed: e.target.value })}
                        placeholder="e.g. Completed 2 topics, 1 mock test"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto"
                    >
                      {saving ? "Saving…" : "Save check-in"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPeriod(null);
                        setDraft({ studying: "", plan: "", completed: "" });
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : existing ? (
                <div className="space-y-2">
                  {existing.studying && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-[hsl(var(--muted-foreground))] shrink-0 w-20">
                        Studying:
                      </span>
                      <span className="break-words">{existing.studying}</span>
                    </div>
                  )}
                  {existing.plan && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-[hsl(var(--muted-foreground))] shrink-0 w-20">
                        Plan:
                      </span>
                      <span className="break-words">{existing.plan}</span>
                    </div>
                  )}
                  {existing.completed && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-[hsl(var(--muted-foreground))] shrink-0 w-20">
                        Completed:
                      </span>
                      <span className="break-words">{existing.completed}</span>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    setEditingPeriod(period.key);
                    setDraft({ studying: "", plan: "", completed: "" });
                  }}
                  className="w-full justify-start gap-2"
                >
                  <Plus className="h-4 w-4 shrink-0" /> Add {period.label} check-in
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
