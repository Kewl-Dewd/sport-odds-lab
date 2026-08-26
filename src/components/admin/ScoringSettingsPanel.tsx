import { useMemo, useState } from "react";
import {
  Award, Trophy, Users, Sliders, GraduationCap, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMarket } from "@/context/MarketContext";
import {
  computeAllScores, fallingBehind,
  CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, BADGE_DEFINITIONS,
  type ScoreCategory, type BadgeId, type GradeBand,
} from "@/lib/scoringEngine";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ScoreCategory[];
const BADGES = Object.keys(BADGE_DEFINITIONS) as BadgeId[];

/**
 * Instructor scoring panel — weights, grade map, badge toggles, and a class
 * progress overview that flags students falling behind on participation.
 */
export function ScoringSettingsPanel() {
  const {
    classroom, students, markets, trades, shockEvents,
    reflectionAssignments, reflectionResponses,
    scoringSettings, updateScoringSettings, updateScoringWeights,
    updateGradeMap, toggleBadgeEnabled,
  } = useMarket();

  const classMarkets = useMemo(
    () => markets.filter((m) => m.classroomId === classroom.id),
    [markets, classroom.id],
  );
  const classTrades = useMemo(
    () => trades.filter((t) => classMarkets.some((m) => m.id === t.marketId)),
    [trades, classMarkets],
  );
  const classShocks = useMemo(
    () => shockEvents.filter((s) => s.classroomId === classroom.id),
    [shockEvents, classroom.id],
  );

  const allScores = useMemo(() => computeAllScores({
    markets: classMarkets,
    trades: classTrades,
    students,
    shocks: classShocks,
    reflectionAssignments,
    reflectionResponses,
    startingBalance: classroom.startingBalance,
    weights: scoringSettings.weights,
    gradeMap: scoringSettings.gradeMap,
    enabledBadges: new Set(scoringSettings.enabledBadges),
    participationGoal: scoringSettings.participationGoal,
  }), [
    classMarkets, classTrades, students, classShocks,
    reflectionAssignments, reflectionResponses, classroom.startingBalance,
    scoringSettings,
  ]);

  const behind = useMemo(
    () => fallingBehind(allScores, scoringSettings.participationGoal),
    [allScores, scoringSettings.participationGoal],
  );

  const totalWeight = (Object.values(scoringSettings.weights) as number[]).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
          <GraduationCap className="h-4 w-4 text-info" />
          Scoring &amp; achievements
          <Badge variant="outline" className="text-[10px] ml-1">
            {scoringSettings.visibleToStudents ? "Visible to students" : "Instructor only"}
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <Label htmlFor="score-visible" className="text-xs cursor-pointer">
              Show students their score
            </Label>
            <Switch
              id="score-visible"
              checked={scoringSettings.visibleToStudents}
              onCheckedChange={(v) => updateScoringSettings({ visibleToStudents: v })}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weights">
          <TabsList>
            <TabsTrigger value="weights">
              <Sliders className="h-3.5 w-3.5 mr-1.5" />Weights
            </TabsTrigger>
            <TabsTrigger value="grades">
              <GraduationCap className="h-3.5 w-3.5 mr-1.5" />Grade map
            </TabsTrigger>
            <TabsTrigger value="badges">
              <Trophy className="h-3.5 w-3.5 mr-1.5" />Badges
              <Badge variant="outline" className="text-[9px] ml-1">
                {scoringSettings.enabledBadges.length}/{BADGES.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="progress">
              <Users className="h-3.5 w-3.5 mr-1.5" />Class progress
              {behind.length > 0 && (
                <Badge variant="outline" className="text-[9px] ml-1 border-warning text-warning">
                  {behind.length} behind
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Weights ────────────────────────────────────────── */}
          <TabsContent value="weights" className="space-y-3">
            <div className="rounded-md border bg-muted/20 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Weights are normalized — they don't need to sum to 100.
                </span>
                <span className="font-mono">Total: {totalWeight}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Participation goal</Label>
                <Input
                  type="number" min={1} max={200}
                  className="h-8 w-20 text-xs"
                  value={scoringSettings.participationGoal}
                  onChange={(e) => updateScoringSettings({
                    participationGoal: Math.max(1, parseInt(e.target.value) || 10),
                  })}
                />
                <span className="text-[11px] text-muted-foreground">bets for full credit</span>
              </div>
            </div>

            <div className="space-y-2">
              {CATEGORIES.map((cat) => {
                const value = scoringSettings.weights[cat];
                const sharePct = totalWeight > 0 ? (value / totalWeight) * 100 : 0;
                return (
                  <div key={cat} className="rounded-md border p-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs font-medium cursor-help underline decoration-dotted decoration-muted-foreground/40">
                              {CATEGORY_LABELS[cat]}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">{CATEGORY_DESCRIPTIONS[cat]}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono w-12 text-right">{value}</span>
                        <Badge variant="outline" className="text-[10px] w-12 justify-center">
                          {sharePct.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <Slider
                      min={0} max={50} step={1}
                      value={[value]}
                      onValueChange={([v]) => updateScoringWeights({ [cat]: v } as Partial<typeof scoringSettings.weights>)}
                    />
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── Grade map ─────────────────────────────────────── */}
          <TabsContent value="grades" className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Letter grade thresholds. A student's letter is the highest band whose
              minimum they meet or exceed.
            </p>
            <div className="space-y-1.5">
              {scoringSettings.gradeMap.map((band, idx) => (
                <GradeBandRow
                  key={idx}
                  band={band}
                  onChange={(updated) => {
                    const next = [...scoringSettings.gradeMap];
                    next[idx] = updated;
                    updateGradeMap(next);
                  }}
                  onDelete={scoringSettings.gradeMap.length > 2 ? () => {
                    updateGradeMap(scoringSettings.gradeMap.filter((_, i) => i !== idx));
                  } : undefined}
                />
              ))}
            </div>
            <Button
              variant="outline" size="sm" className="h-7 text-xs"
              onClick={() => {
                updateGradeMap([...scoringSettings.gradeMap, { letter: "?", min: 50 }]);
              }}
            >
              + Add band
            </Button>
          </TabsContent>

          {/* ── Badges ────────────────────────────────────────── */}
          <TabsContent value="badges" className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Badges are earned from measurable trading behavior. Disable any
              that don't fit your class focus.
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {BADGES.map((id) => {
                const def = BADGE_DEFINITIONS[id];
                const enabled = scoringSettings.enabledBadges.includes(id);
                return (
                  <div key={id} className={cn(
                    "rounded-md border p-2.5 space-y-1",
                    enabled ? "bg-background" : "bg-muted/20 opacity-70",
                  )}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <Award className={cn(
                          "h-4 w-4 flex-none mt-0.5",
                          enabled ? "text-info" : "text-muted-foreground",
                        )} />
                        <p className="text-xs font-medium leading-tight">{def.label}</p>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={() => toggleBadgeEnabled(id)}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{def.description}</p>
                    <p className="text-[10px] text-muted-foreground italic">{def.criteria}</p>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── Class progress ────────────────────────────────── */}
          <TabsContent value="progress" className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Stat
                label="Average score"
                value={`${allScores.length === 0 ? 0 : Math.round(
                  allScores.reduce((s, x) => s + x.finalScore, 0) / allScores.length,
                )}`}
              />
              <Stat label="Students scored" value={`${allScores.length}`} />
              <Stat
                label="Behind on participation"
                value={`${behind.length}`}
                tone={behind.length > 0 ? "warn" : undefined}
              />
            </div>

            {behind.length > 0 && (
              <div className="rounded-md border border-warning/40 bg-warning/5 p-3 space-y-2">
                <p className="text-xs font-medium flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                  Falling behind ({behind.length})
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Less than 50% of the participation goal ({scoringSettings.participationGoal} trades).
                </p>
                <div className="flex flex-wrap gap-1">
                  {behind.map((s) => (
                    <Badge key={s.userId} variant="outline" className="text-[10px]">
                      {s.displayName} · {s.metrics.trades} trade{s.metrics.trades !== 1 ? "s" : ""}
                    </Badge>
                  ))}
                </div>
                <Button
                  size="sm" variant="outline" className="h-7 text-xs"
                  onClick={() => toast.info(`${behind.length} students need a participation nudge`)}
                >
                  Mark as nudged
                </Button>
              </div>
            )}

            <div className="rounded-md border">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-1.5 border-b text-[10px] uppercase text-muted-foreground tracking-wide">
                <span>Student</span><span>Bets</span><span>Badges</span><span>Score</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y">
                {[...allScores]
                  .sort((a, b) => b.finalScore - a.finalScore)
                  .map((s) => (
                    <div key={s.userId} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-1.5 items-center text-xs">
                      <span className="truncate">{s.displayName}</span>
                      <span className="font-mono w-10 text-right">{s.metrics.trades}</span>
                      <span className="font-mono w-10 text-right">{s.badges.length}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono w-8 text-right">{s.finalScore}</span>
                        <Badge variant="outline" className="text-[10px] w-6 justify-center">{s.letter}</Badge>
                      </div>
                    </div>
                  ))}
                {allScores.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">No students yet.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="rounded-md border bg-muted/10 p-2">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("text-lg font-mono font-medium", tone === "warn" && "text-warning")}>{value}</p>
    </div>
  );
}

function GradeBandRow({
  band, onChange, onDelete,
}: {
  band: GradeBand;
  onChange: (b: GradeBand) => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-2">
      <Input
        className="h-8 w-14 text-xs font-mono text-center"
        value={band.letter}
        maxLength={2}
        onChange={(e) => onChange({ ...band, letter: e.target.value.toUpperCase() })}
      />
      <span className="text-xs text-muted-foreground">≥</span>
      <Input
        type="number" min={0} max={100}
        className="h-8 w-20 text-xs font-mono"
        value={band.min}
        onChange={(e) => onChange({ ...band, min: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
      />
      <span className="text-xs text-muted-foreground">points</span>
      <div className="ml-auto">
        {onDelete && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={onDelete}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
