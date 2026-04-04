import { useState, useMemo } from "react";
import { DEFAULT_STARTING_CASH } from "@/lib/tradingEngine";
import { Link } from "react-router-dom";
import {
  Plus, Play, Pause, StopCircle, RefreshCw, Wand2, Download,
  Users, BarChart3, Trophy, Activity, Zap, TrendingUp, TrendingDown,
  AlertTriangle, Settings, Copy, Trash2, Clock, FileText, UserPlus,
  X, DollarSign, Undo2, Calculator, MonitorPlay, ChevronRight,
  LayoutGrid, GraduationCap, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarket, type LeaderboardMode } from "@/context/MarketContext";
import { MarketCreator } from "@/components/admin/MarketCreator";
import { SettlementModal } from "@/components/admin/SettlementModal";
import { calculateMarketAnalytics } from "@/lib/marketAnalytics";
import { InstructorEducationControls } from "@/components/education/EducationToggle";
import type { Market } from "@/lib/tradingEngine";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  open: "bg-success/15 text-success",
  scheduled: "bg-info/15 text-info",
  suspended: "bg-warning/15 text-warning",
  settled: "bg-muted text-muted-foreground",
  closed: "bg-destructive/15 text-destructive",
  void: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  postponed: "bg-warning/10 text-warning",
};

export default function InstructorDashboard() {
  const {
    markets, trades, students, classroom, classrooms, activeClassroom,
    adminActions, setActiveClassroom, createClassroom, deleteClassroom,
    suspendMarket, resumeMarket, duplicateMarket, deleteMarket,
    addStudent, removeStudent, updateStartingBalance, resetClassroom,
    updateClassroom, exportTradeHistory, exportLeaderboard, getLeaderboard,
    seedDemoData, openAllMarkets, closeAllMarkets, pauseAllTrading,
    resumeAllTrading, adjustBankroll, reverseTrade, recalculateAll,
    duplicateClassroom,
  } = useMarket();

  const [showCreator, setShowCreator] = useState(false);
  const [settlingMarket, setSettlingMarket] = useState<Market | null>(null);
  const [newStudentName, setNewStudentName] = useState("");
  const [startingBal, setStartingBal] = useState(classroom.startingBalance);
  const [className, setClassName] = useState(classroom.name);
  const [classDesc, setClassDesc] = useState(classroom.description);
  const [newClassName, setNewClassName] = useState("");
  const [bankrollUserId, setBankrollUserId] = useState("");
  const [bankrollAmount, setBankrollAmount] = useState("");
  const [bankrollReason, setBankrollReason] = useState("");

  const classMarkets = markets.filter((m) => m.classroomId === classroom.id);
  const openMarkets = classMarkets.filter((m) => m.status === "open");
  const suspendedMarkets = classMarkets.filter((m) => m.status === "suspended");
  const unsettledMarkets = classMarkets.filter((m) => m.status !== "settled");
  const totalVolume = trades.reduce((s, t) => s + t.totalCost, 0);
  const leaderboard = getLeaderboard("portfolio");
  const todayTrades = trades.filter((t) => {
    const d = new Date(t.timestamp);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  // Most volatile markets (by avg outcome volatility)
  const marketVolatility = useMemo(() => {
    return classMarkets
      .filter((m) => m.status === "open")
      .map((m) => {
        const analytics = calculateMarketAnalytics(m, trades);
        const avgVol = analytics.outcomeAnalytics.reduce((s, o) => s + o.volatility, 0) / Math.max(analytics.outcomeAnalytics.length, 1);
        return { market: m, volatility: avgVol, tradeCount: analytics.tradeCount };
      })
      .sort((a, b) => b.volatility - a.volatility);
  }, [classMarkets, trades]);

  // Biggest gains/losses
  const biggestGainers = leaderboard.filter((e) => e.returnPct > 0).slice(0, 3);
  const biggestLosers = [...leaderboard].sort((a, b) => a.returnPct - b.returnPct).filter((e) => e.returnPct < 0).slice(0, 3);

  const handleExport = (type: "trades" | "leaderboard") => {
    const csv = type === "trades" ? exportTradeHistory() : exportLeaderboard();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${type === "trades" ? "Trade history" : "Leaderboard"} exported`);
  };

  const handleBankrollAdjust = () => {
    const amt = Number(bankrollAmount);
    if (!bankrollUserId || !amt || !bankrollReason.trim()) {
      toast.error("Fill in all fields for bankroll adjustment");
      return;
    }
    adjustBankroll(bankrollUserId, amt, bankrollReason.trim());
    toast.success(`Bankroll adjusted: ${amt >= 0 ? "+" : ""}$${amt}`);
    setBankrollAmount("");
    setBankrollReason("");
  };

  return (
    <div className="container py-6 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Instructor Control Center</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={classroom.id} onValueChange={setActiveClassroom}>
              <SelectTrigger className="w-56 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs font-mono">Code: {classroom.classCode}</Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link to="/instructor/present/leaderboard"><MonitorPlay className="mr-1.5 h-4 w-4" />Present</Link>
          </Button>
          <Button variant="hero" size="sm" onClick={() => setShowCreator(true)}>
            <Plus className="mr-1.5 h-4 w-4" />New Market
          </Button>
        </div>
      </div>

      {/* Live Controls Bar */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold mr-2">Live Controls:</span>
            <Button variant="outline" size="sm" onClick={() => { openAllMarkets(); toast.success("All markets opened"); }}>
              <Play className="mr-1 h-3.5 w-3.5" />Open All
            </Button>
            <Button variant="outline" size="sm" onClick={() => { pauseAllTrading(); toast.success("All trading paused"); }}>
              <Pause className="mr-1 h-3.5 w-3.5" />Pause All
            </Button>
            <Button variant="outline" size="sm" onClick={() => { resumeAllTrading(); toast.success("Trading resumed"); }}>
              <Play className="mr-1 h-3.5 w-3.5" />Resume All
            </Button>
            <Button variant="outline" size="sm" onClick={() => { closeAllMarkets(); toast.success("All markets closed"); }}>
              <StopCircle className="mr-1 h-3.5 w-3.5" />Close All
            </Button>
            <div className="border-l h-6 mx-1" />
            <Button variant="outline" size="sm" onClick={() => { recalculateAll(); toast.success("All portfolios recalculated"); }}>
              <Calculator className="mr-1 h-3.5 w-3.5" />Recalculate
            </Button>
            <Button variant="outline" size="sm" onClick={() => { seedDemoData(8, 5); toast.success("Demo data seeded"); }}>
              <Wand2 className="mr-1 h-3.5 w-3.5" />Demo Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="stat-card !p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Students</span>
          </div>
          <p className="text-xl font-bold font-mono">{students.length}</p>
        </div>
        <div className="stat-card !p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Open Markets</span>
          </div>
          <p className="text-xl font-bold font-mono">{openMarkets.length}</p>
        </div>
        <div className="stat-card !p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Trades Today</span>
          </div>
          <p className="text-xl font-bold font-mono">{todayTrades.length}</p>
        </div>
        <div className="stat-card !p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Volume</span>
          </div>
          <p className="text-xl font-bold font-mono">${totalVolume.toFixed(0)}</p>
        </div>
        <div className="stat-card !p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Unresolved</span>
          </div>
          <p className="text-xl font-bold font-mono">{unsettledMarkets.length}</p>
        </div>
        <div className="stat-card !p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Pause className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Suspended</span>
          </div>
          <p className="text-xl font-bold font-mono">{suspendedMarkets.length}</p>
        </div>
      </div>

      {/* Quick Insights Row */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Most Volatile */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" />Most Volatile</CardTitle></CardHeader>
          <CardContent>
            {marketVolatility.filter((m) => m.tradeCount > 0).length === 0 ? (
              <p className="text-xs text-muted-foreground">No trading activity</p>
            ) : (
              <div className="space-y-1.5">
                {marketVolatility.filter((m) => m.tradeCount > 0).slice(0, 3).map(({ market: m, volatility }) => (
                  <div key={m.id} className="flex justify-between text-xs">
                    <span className="truncate">{m.title}</span>
                    <span className="font-mono text-warning">{(volatility * 100).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Most Traded */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Most Traded</CardTitle></CardHeader>
          <CardContent>
            {(() => {
              const counts = new Map<string, number>();
              for (const t of trades) counts.set(t.marketId, (counts.get(t.marketId) ?? 0) + 1);
              const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
              return sorted.length === 0 ? (
                <p className="text-xs text-muted-foreground">No trades yet</p>
              ) : (
                <div className="space-y-1.5">
                  {sorted.map(([id, count]) => {
                    const m = markets.find((mk) => mk.id === id);
                    return m ? (
                      <div key={id} className="flex justify-between text-xs">
                        <span className="truncate">{m.title}</span>
                        <span className="font-mono">{count}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
        {/* Biggest Gains */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Top Gains</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {biggestGainers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No gains yet</p>
              ) : biggestGainers.map((e) => (
                <div key={e.userId} className="flex justify-between text-xs">
                  <span className="truncate">{e.displayName}</span>
                  <span className="font-mono price-up">+{e.returnPct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Biggest Losses */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><TrendingDown className="h-3.5 w-3.5" />Top Losses</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {biggestLosers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No losses yet</p>
              ) : biggestLosers.map((e) => (
                <div key={e.userId} className="flex justify-between text-xs">
                  <span className="truncate">{e.displayName}</span>
                  <span className="font-mono price-down">{e.returnPct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="markets">
        <TabsList className="flex-wrap">
          <TabsTrigger value="markets"><BarChart3 className="h-4 w-4 mr-1.5" />Markets</TabsTrigger>
          <TabsTrigger value="students"><Users className="h-4 w-4 mr-1.5" />Students</TabsTrigger>
          <TabsTrigger value="tools"><Settings className="h-4 w-4 mr-1.5" />Tools</TabsTrigger>
          <TabsTrigger value="classes"><GraduationCap className="h-4 w-4 mr-1.5" />Classes</TabsTrigger>
          <TabsTrigger value="log"><FileText className="h-4 w-4 mr-1.5" />Log</TabsTrigger>
        </TabsList>

        {/* Markets Tab */}
        <TabsContent value="markets">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Markets ({classMarkets.length})</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExport("trades")}>
                    <Download className="mr-1 h-3.5 w-3.5" />CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Market</th>
                      <th className="pb-3 font-medium">League</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Outcomes</th>
                      <th className="pb-3 font-medium text-right">Trades</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classMarkets.map((m) => {
                      const mTrades = trades.filter((t) => t.marketId === m.id).length;
                      return (
                        <tr key={m.id} className="border-b last:border-0">
                          <td className="py-3 font-medium">
                            <Link to={`/markets/${m.id}`} className="hover:text-primary transition-colors">{m.title}</Link>
                          </td>
                          <td className="py-3">{m.league}</td>
                          <td className="py-3">
                            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", statusColor[m.status] ?? "")}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono">{m.outcomes.length}</td>
                          <td className="py-3 text-right font-mono">{mTrades}</td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1">
                              {m.status === "open" && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { suspendMarket(m.id); toast.success("Market suspended"); }} title="Suspend">
                                  <Pause className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {m.status === "suspended" && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { resumeMarket(m.id); toast.success("Market resumed"); }} title="Resume">
                                  <Play className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {(m.status === "open" || m.status === "suspended") && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSettlingMarket(m)} title="Settle">
                                  <Trophy className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { duplicateMarket(m.id); toast.success("Market duplicated"); }} title="Duplicate">
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              {m.status !== "open" && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteMarket(m.id); toast.success("Market deleted"); }} title="Delete">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg">Students ({students.length})</CardTitle>
                <div className="flex gap-2">
                  <Input placeholder="Student name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} className="w-40" onKeyDown={(e) => e.key === "Enter" && (() => { if (newStudentName.trim()) { addStudent(newStudentName.trim()); toast.success(`Added ${newStudentName.trim()}`); setNewStudentName(""); } })()} />
                  <Button variant="hero" size="sm" onClick={() => { if (newStudentName.trim()) { addStudent(newStudentName.trim()); toast.success(`Added ${newStudentName.trim()}`); setNewStudentName(""); } }}>
                    <UserPlus className="mr-1 h-3.5 w-3.5" />Add
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport("leaderboard")}>
                    <Download className="mr-1 h-3.5 w-3.5" />CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium text-right">Cash</th>
                      <th className="pb-3 font-medium text-right">Portfolio</th>
                      <th className="pb-3 font-medium text-right">Trades</th>
                      <th className="pb-3 font-medium text-right">Return</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((e) => (
                      <tr key={e.userId} className="border-b last:border-0">
                        <td className="py-3 font-medium">{e.displayName}</td>
                        <td className="py-3 text-right font-mono">${e.cash.toFixed(0)}</td>
                        <td className="py-3 text-right font-mono">${e.portfolioValue.toFixed(0)}</td>
                        <td className="py-3 text-right font-mono">{e.tradeCount}</td>
                        <td className={cn("py-3 text-right font-mono", e.returnPct >= 0 ? "price-up" : "price-down")}>
                          {e.returnPct >= 0 ? "+" : ""}{e.returnPct.toFixed(1)}%
                        </td>
                        <td className="py-3 text-right">
                          {e.userId !== "user-1" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { removeStudent(e.userId); toast.success("Student removed"); }}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Bankroll Adjustment */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><DollarSign className="h-4 w-4" />Adjust Bankroll</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={bankrollUserId} onValueChange={setBankrollUserId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => <SelectItem key={s.userId} value={s.userId}>{s.displayName}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Amount (+/-)" value={bankrollAmount} onChange={(e) => setBankrollAmount(e.target.value)} />
                  <Input placeholder="Reason" value={bankrollReason} onChange={(e) => setBankrollReason(e.target.value)} />
                </div>
                <Button size="sm" onClick={handleBankrollAdjust} className="w-full">Apply Adjustment</Button>
              </CardContent>
            </Card>

            {/* Reverse Trade */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Undo2 className="h-4 w-4" />Recent Trades</CardTitle></CardHeader>
              <CardContent>
                {trades.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No trades to reverse</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {trades.slice(0, 10).map((t) => {
                      const student = students.find((s) => s.userId === t.userId);
                      return (
                        <div key={t.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                          <div className="truncate flex-1">
                            <span className="font-medium">{student?.displayName ?? "Unknown"}</span>
                            <span className="text-muted-foreground"> {t.type} {t.quantity}× {t.outcomeName}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { reverseTrade(t.id); toast.success("Trade reversed"); }} title="Reverse">
                            <Undo2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Classroom Settings */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Settings className="h-4 w-4" />Classroom Settings</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Class name" />
                  <Input value={classDesc} onChange={(e) => setClassDesc(e.target.value)} placeholder="Description" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Starting Balance</label>
                  <Input type="number" value={startingBal} onChange={(e) => setStartingBal(Number(e.target.value))} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { updateClassroom({ name: className, description: classDesc }); updateStartingBalance(startingBal); toast.success("Settings saved"); }}>
                    Save
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => { resetClassroom(); toast.success("Classroom reset"); }}>
                    <RefreshCw className="mr-1 h-3.5 w-3.5" />Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Education Layer Controls */}
            <InstructorEducationControls />


            {/* Presentation Links */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><MonitorPlay className="h-4 w-4" />Presentation Mode</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Full-screen views optimized for classroom projection.</p>
                <div className="space-y-1.5">
                  <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                    <Link to="/instructor/present/board">Market Board<ChevronRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                    <Link to="/instructor/present/leaderboard">Live Leaderboard<ChevronRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                    <Link to="/instructor/present/heatmap">Market Heatmap<ChevronRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                    <Link to="/instructor/present/movers">Top Movers<ChevronRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                    <Link to="/instructor/review">Trade Review & Replay<ChevronRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                    <Link to="/instructor/reports">Reports & Grading<ChevronRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">All Classes</CardTitle>
                  <div className="flex gap-2">
                    <Input placeholder="New class name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="w-48" />
                    <Button size="sm" onClick={() => { if (newClassName.trim()) { createClassroom(newClassName.trim(), "", DEFAULT_STARTING_CASH); toast.success("Class created"); setNewClassName(""); } }}>
                      <Plus className="mr-1 h-3.5 w-3.5" />Create
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classrooms.map((c) => (
                    <div key={c.id} className={cn("rounded-lg border p-4 flex items-center justify-between", c.id === classroom.id && "border-primary bg-primary/5")}>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{c.name}</h3>
                          {c.id === classroom.id && <Badge>Active</Badge>}
                          <Badge variant="outline" className="text-xs font-mono">{c.classCode}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{c.description || "No description"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Starting balance: ${c.startingBalance.toLocaleString()} · Self-join: {c.allowSelfJoin ? "Yes" : "No"} · Reset: {c.resetMode}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {c.id !== classroom.id && (
                          <Button variant="outline" size="sm" onClick={() => setActiveClassroom(c.id)}>Switch</Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { duplicateClassroom(c.id); toast.success("Class duplicated"); }}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {c.id !== classroom.id && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { deleteClassroom(c.id); toast.success("Class deleted"); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Action Log Tab */}
        <TabsContent value="log">
          <Card>
            <CardContent className="pt-6">
              {adminActions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No admin actions recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {adminActions.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 py-2 border-b last:border-0 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{a.action}</p>
                        <p className="text-muted-foreground text-xs truncate">{a.detail}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(a.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showCreator && <MarketCreator onClose={() => setShowCreator(false)} />}
      {settlingMarket && <SettlementModal market={settlingMarket} onClose={() => setSettlingMarket(null)} />}
    </div>
  );
}
