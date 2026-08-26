import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Download, FileText, Users, BarChart3, Trophy,
  Settings, GraduationCap, TrendingUp, Activity, Shield, Brain,
  CheckCircle, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMarket } from "@/context/MarketContext";
import {
  type GradingConfig, type GradingMode, type GradingMetrics,
  DEFAULT_GRADING_CONFIG, GRADING_PRESETS,
  calculateGradingMetrics,
  exportLeaderboardCsv, exportPortfolioSummaryCsv,
  exportTradeHistoryByUserCsv, exportTradeHistoryByMarketCsv,
  exportParticipationSummaryCsv, exportSettlementReportCsv,
  exportStudentAnalyticsCsv,
} from "@/lib/exportUtils";
import { cn } from "@/lib/utils";

function GradeBar({ value, label }: { value: number; label?: string }) {
  const color = value >= 70 ? "bg-success" : value >= 40 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2 w-full">
      {label && <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>}
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="text-xs font-mono font-semibold w-8 text-right">{value}</span>
    </div>
  );
}

export default function Reports() {
  const { markets, trades, students, classroom } = useMarket();
  const [config, setConfig] = useState<GradingConfig>(DEFAULT_GRADING_CONFIG);

  const metrics = useMemo(
    () => calculateGradingMetrics(students, trades, markets, classroom.startingBalance, config)
      .sort((a, b) => b.compositeGrade - a.compositeGrade),
    [students, trades, markets, classroom.startingBalance, config],
  );

  const handleModeChange = (mode: GradingMode) => {
    if (mode === "custom") {
      setConfig((c) => ({ ...c, mode }));
    } else {
      setConfig((c) => ({ ...c, mode, weights: GRADING_PRESETS[mode] }));
    }
  };

  const updateWeight = (key: keyof typeof config.weights, val: number) => {
    setConfig((c) => ({ ...c, mode: "custom" as GradingMode, weights: { ...c.weights, [key]: val } }));
  };

  return (
    <div className="container py-8 space-y-6 animate-slide-up">
      <div>
        <Link to="/instructor" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="h-4 w-4" />Back to Instructor
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">Reports & Grading</h1>
        <p className="text-muted-foreground">{classroom.name} — Export data, configure grading, and review class performance</p>
      </div>

      <Tabs defaultValue="grading">
        <TabsList className="flex-wrap">
          <TabsTrigger value="grading"><GraduationCap className="h-3.5 w-3.5 mr-1" />Grading</TabsTrigger>
          <TabsTrigger value="exports"><Download className="h-3.5 w-3.5 mr-1" />Exports</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-3.5 w-3.5 mr-1" />Settings</TabsTrigger>
        </TabsList>

        {/* ── Grading Tab ─────────────────────────────────── */}
        <TabsContent value="grading" className="space-y-6">
          {/* Mode selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Brain className="h-4 w-4" />Grading Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {(["participation", "participation_reflection", "return_performance", "decision_quality", "custom"] as GradingMode[]).map((m) => (
                  <Button key={m} variant={config.mode === m ? "default" : "outline"} size="sm" onClick={() => handleModeChange(m)}>
                    {m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Button>
                ))}
              </div>

              {/* Custom weights */}
              {config.mode === "custom" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {(Object.entries(config.weights) as [keyof typeof config.weights, number][]).map(([key, val]) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                        <span className="text-xs font-mono">{val}%</span>
                      </div>
                      <Slider value={[val]} onValueChange={([v]) => updateWeight(key, v)} min={0} max={100} step={5} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grading table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Class Grades ({metrics.length} students)</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportParticipationSummaryCsv(students, trades, markets, classroom.startingBalance, config)}>
                  <Download className="h-3.5 w-3.5 mr-1" />Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="pb-3 font-medium">#</th>
                      <th className="pb-3 font-medium">Student</th>
                      <th className="pb-3 font-medium text-center">Participation</th>
                      <th className="pb-3 font-medium text-center">Completion</th>
                      <th className="pb-3 font-medium text-center">Decision</th>
                      <th className="pb-3 font-medium text-center">Risk</th>
                      <th className="pb-3 font-medium text-center">Return</th>
                      <th className="pb-3 font-medium text-center">Days Active</th>
                      <th className="pb-3 font-medium text-center">Grade</th>
                      <th className="pb-3 font-medium text-center">Reflection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m, i) => (
                      <tr key={m.userId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 text-muted-foreground">{i + 1}</td>
                        <td className="py-3 font-medium">
                          {config.showRealNames ? m.displayName : `Trader ${m.userId.slice(-4).toUpperCase()}`}
                        </td>
                        <td className="py-3"><GradeBar value={m.participationScore} /></td>
                        <td className="py-3"><GradeBar value={m.completionScore} /></td>
                        <td className="py-3"><GradeBar value={m.decisionScore} /></td>
                        <td className="py-3"><GradeBar value={m.riskScore} /></td>
                        <td className="py-3 text-center">
                          <span className={cn("font-mono text-xs font-semibold", m.returnPct >= 0 ? "text-success" : "text-destructive")}>
                            {m.returnPct >= 0 ? "+" : ""}{m.returnPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 text-center font-mono text-xs">{m.activeTradingDays}</td>
                        <td className="py-3">
                          <Badge variant="outline" className={cn(
                            "font-mono",
                            m.compositeGrade >= 70 ? "border-success text-success" :
                            m.compositeGrade >= 40 ? "border-warning text-warning" :
                            "border-destructive text-destructive"
                          )}>
                            {m.compositeGrade}/100
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          {m.reflectionEligible
                            ? <CheckCircle className="h-4 w-4 text-success inline" />
                            : <AlertTriangle className="h-4 w-4 text-muted-foreground inline" />}
                        </td>
                      </tr>
                    ))}
                    {metrics.length === 0 && (
                      <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">No student data. Seed demo data from the Instructor dashboard.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Exports Tab ─────────────────────────────────── */}
        <TabsContent value="exports" className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ExportCard icon={<Trophy className="h-5 w-5 text-warning" />} title="Leaderboard" desc="Portfolio value rankings with key stats"
              onClick={() => exportLeaderboardCsv(students, markets, trades, classroom.startingBalance)} />
            <ExportCard icon={<Users className="h-5 w-5 text-primary" />} title="Bankroll Summaries" desc="Cash, open bets, P&L for each student"
              onClick={() => exportPortfolioSummaryCsv(students, markets, trades, classroom.startingBalance)} />
            <ExportCard icon={<FileText className="h-5 w-5 text-accent-foreground" />} title="All Bets" desc="Complete chronological bet history"
              onClick={() => exportTradeHistoryByUserCsv(trades, students)} />
            <ExportCard icon={<Activity className="h-5 w-5 text-success" />} title="Participation Summary" desc="Grades, scores, and engagement metrics"
              onClick={() => exportParticipationSummaryCsv(students, trades, markets, classroom.startingBalance, config)} />
            <ExportCard icon={<BarChart3 className="h-5 w-5 text-info" />} title="Settlement Report" desc="Settled markets with outcomes and volume"
              onClick={() => exportSettlementReportCsv(markets, trades, students)} />
            <ExportCard icon={<Brain className="h-5 w-5 text-destructive" />} title="Student Analytics" desc="Decision quality, risk, and behavioral metrics"
              onClick={() => exportStudentAnalyticsCsv(students, trades, markets, classroom.startingBalance)} />
          </div>

          {/* Per-market export */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Export Bets by Market</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {markets.map((m) => (
                  <Button key={m.id} variant="outline" size="sm" className="justify-start gap-2 text-left h-auto py-2"
                    onClick={() => exportTradeHistoryByMarketCsv(trades, students, m.id, m.title)}>
                    <Download className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{m.title}</span>
                    <Badge variant="outline" className="ml-auto text-[10px] shrink-0">{m.status}</Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Per-student export */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Export Bets by Student</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {students.map((s) => (
                  <Button key={s.userId} variant="outline" size="sm" className="justify-start gap-2"
                    onClick={() => exportTradeHistoryByUserCsv(trades, students, s.userId)}>
                    <Download className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{s.displayName}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Settings Tab ────────────────────────────────── */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4" />Visibility & Privacy</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Public Leaderboard</Label>
                  <p className="text-xs text-muted-foreground">Students can see the class leaderboard</p>
                </div>
                <Switch checked={config.leaderboardPublic} onCheckedChange={(v) => setConfig((c) => ({ ...c, leaderboardPublic: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Show Real Names</Label>
                  <p className="text-xs text-muted-foreground">Display real names vs anonymous aliases on leaderboard</p>
                </div>
                <Switch checked={config.showRealNames} onCheckedChange={(v) => setConfig((c) => ({ ...c, showRealNames: v }))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Grading Weight Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(Object.entries(config.weights) as [string, number][]).map(([key, val]) => (
                  <GradeBar key={key} value={val} label={key.replace(/([A-Z])/g, " $1").replace(/^\w/, (c) => c.toUpperCase())} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Total weight: {Object.values(config.weights).reduce((a, b) => a + b, 0)}%.
                {Object.values(config.weights).reduce((a, b) => a + b, 0) !== 100 && " Weights are normalized during grade calculation."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExportCard({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={onClick}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <Download className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      </CardContent>
    </Card>
  );
}
