import { useMemo } from "react";
import { Award, GraduationCap, Target, CheckCircle2, Circle, Lock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMarket } from "@/context/MarketContext";
import {
  computeStudentScore, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS,
  BADGE_DEFINITIONS, type BadgeId, type ScoreCategory,
} from "@/lib/scoringEngine";
import { cn } from "@/lib/utils";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ScoreCategory[];

/**
 * Student-facing score card. Shows the final weighted score, breakdown by
 * category, earned badges, participation progress, and experiment status.
 * Hidden when the instructor has disabled visibility.
 */
export function StudentScoreCard() {
  const {
    portfolio, classroom, students, markets, trades, shockEvents,
    reflectionAssignments, reflectionResponses, scoringSettings,
    activeExperiment,
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

  const score = useMemo(() => computeStudentScore(portfolio, {
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
    portfolio, classMarkets, classTrades, students, classShocks,
    reflectionAssignments, reflectionResponses, classroom.startingBalance,
    scoringSettings,
  ]);

  if (!scoringSettings.visibleToStudents) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Lock className="h-3.5 w-3.5" />
          Class score is hidden during this session.
        </CardContent>
      </Card>
    );
  }

  const hasActivity = score.metrics.trades > 0
    || score.metrics.reflectionsAssigned > 0
    || (activeExperiment && activeExperiment.status === "active");

  if (!hasActivity) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-info" />
            Your class score
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-info" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No score yet</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Place your first bet or complete assigned coursework to start earning your class score.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalWeight = (Object.values(scoringSettings.weights) as number[]).reduce((a, b) => a + b, 0);
  const participationProgress = Math.min(100,
    (score.metrics.trades / Math.max(1, scoringSettings.participationGoal)) * 100,
  );
  const reflectionProgress = score.metrics.reflectionsAssigned === 0 ? 100 :
    (score.metrics.reflectionsCompleted / score.metrics.reflectionsAssigned) * 100;

  const earnedBadges = score.badges;
  const lockedBadges = scoringSettings.enabledBadges.filter((b) => !earnedBadges.includes(b));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
          <GraduationCap className="h-4 w-4 text-info" />
          Your class score
          <div className="ml-auto flex items-center gap-2">
            <span className="text-2xl font-mono font-semibold">{score.finalScore}</span>
            <Badge variant="outline" className="text-sm font-mono">{score.letter}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Participation + reflection progress */}
        <div className="grid sm:grid-cols-2 gap-2">
          <ProgressBlock
            icon={<Target className="h-3.5 w-3.5" />}
            label="Participation"
            value={participationProgress}
            hint={`${score.metrics.trades} / ${scoringSettings.participationGoal} trades`}
          />
          <ProgressBlock
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            label="Reflections"
            value={reflectionProgress}
            hint={`${score.metrics.reflectionsCompleted} / ${score.metrics.reflectionsAssigned} complete`}
          />
        </div>

        {/* Experiment completion status */}
        <div className="rounded-md border bg-muted/10 p-2 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Experiment</p>
            <p className="text-xs font-medium">
              {activeExperiment ? activeExperiment.title : "No active experiment"}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {activeExperiment?.status === "active" ? "Active" : activeExperiment?.status ?? "—"}
          </Badge>
        </div>

        {/* Category breakdown */}
        <div>
          <p className="text-xs font-medium mb-1.5">Score breakdown</p>
          <div className="space-y-1.5">
            {CATEGORIES.map((cat) => {
              const v = score.byCategory[cat];
              const w = scoringSettings.weights[cat];
              const sharePct = totalWeight > 0 ? (w / totalWeight) * 100 : 0;
              return (
                <div key={cat} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-muted-foreground/40">
                            {CATEGORY_LABELS[cat]}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">{CATEGORY_DESCRIPTIONS[cat]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-[10px] text-muted-foreground">
                      <span className="font-mono">{v}</span>
                      <span className="mx-1">·</span>
                      <span>{sharePct.toFixed(0)}% weight</span>
                    </span>
                  </div>
                  <Progress value={v} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges */}
        <div>
          <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-info" />
            Badges
            <Badge variant="outline" className="text-[10px]">
              {earnedBadges.length}/{scoringSettings.enabledBadges.length}
            </Badge>
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {earnedBadges.map((id) => (
              <BadgeChip key={id} id={id} earned />
            ))}
            {lockedBadges.map((id) => (
              <BadgeChip key={id} id={id} earned={false} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressBlock({
  icon, label, value, hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-md border p-2 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          {icon}{label}
        </span>
        <span className="font-mono text-[11px]">{Math.round(value)}%</span>
      </div>
      <Progress value={value} className="h-1.5" />
      <p className="text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function BadgeChip({ id, earned }: { id: BadgeId; earned: boolean }) {
  const def = BADGE_DEFINITIONS[id];
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "rounded-md border px-2 py-1.5 flex items-center gap-1.5 text-left cursor-help",
            earned ? "bg-info/5 border-info/40" : "opacity-60",
          )}>
            {earned
              ? <Award className="h-3.5 w-3.5 flex-none text-info" />
              : <Circle className="h-3.5 w-3.5 flex-none text-muted-foreground" />}
            <span className={cn(
              "text-[11px] font-medium truncate",
              !earned && "text-muted-foreground",
            )}>{def.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs font-medium mb-0.5">{def.label}</p>
          <p className="text-xs">{def.description}</p>
          <p className="text-[10px] text-muted-foreground italic mt-1">{def.criteria}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
