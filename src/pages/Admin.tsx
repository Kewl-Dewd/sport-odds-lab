import { useState } from "react";
import {
  Plus, Settings, Users, BarChart3, RefreshCw, Pause, Play,
  Trophy, Copy, Trash2, Download, Clock, UserPlus, X, FileText, Wand2
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarket } from "@/context/MarketContext";
import { NewClassDialog } from "@/features/classes/NewClassDialog";
import { SettlementModal } from "@/components/admin/SettlementModal";
import type { Market } from "@/lib/tradingEngine";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  open: "bg-success/15 text-success",
  suspended: "bg-warning/15 text-warning",
  settled: "bg-muted text-muted-foreground",
  closed: "bg-destructive/15 text-destructive",
};

export default function Admin() {
  const {
    markets, trades, students, classroom, adminActions,
    suspendMarket, resumeMarket, duplicateMarket, deleteMarket,
    addStudent, removeStudent, updateStartingBalance, resetClassroom,
    updateClassroom, exportTradeHistory, exportLeaderboard, getLeaderboard,
    seedDemoData,
  } = useMarket();

  const [showCreator, setShowCreator] = useState(false);
  const [settlingMarket, setSettlingMarket] = useState<Market | null>(null);
  const [newStudentName, setNewStudentName] = useState("");
  const [startingBal, setStartingBal] = useState(classroom.startingBalance);
  const [className, setClassName] = useState(classroom.name);
  const [classDesc, setClassDesc] = useState(classroom.description);

  const activeMarkets = markets.filter((m) => m.status === "open").length;
  const totalVolume = trades.reduce((s, t) => s + t.totalCost, 0);
  const leaderboard = getLeaderboard("portfolio");

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

  const handleSeedDemo = () => {
    seedDemoData(8, 5);
    toast.success("Demo data seeded!", { description: "8 sample students with 5 bets each have been added." });
  };

  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    addStudent(newStudentName.trim());
    toast.success(`Student "${newStudentName.trim()}" added`);
    setNewStudentName("");
  };

  // Most traded markets
  const tradeCounts = new Map<string, number>();
  for (const t of trades) {
    tradeCounts.set(t.marketId, (tradeCounts.get(t.marketId) ?? 0) + 1);
  }
  const mostTraded = [...tradeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({ market: markets.find((m) => m.id === id), count }));

  return (
    <div className="container py-8 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">{classroom.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Demo data button removed — production-ready empty state. */}
          <Button variant="outline" size="sm" onClick={() => handleExport("trades")}>
            <Download className="mr-1.5 h-4 w-4" />Trades CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("leaderboard")}>
            <Download className="mr-1.5 h-4 w-4" />Leaderboard CSV
          </Button>
          <Button variant="hero" size="sm" onClick={() => setShowCreator(true)}>
            <Plus className="mr-1.5 h-4 w-4" />New Class
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Students</span>
          <p className="text-2xl font-bold font-mono">{students.length}</p>
        </div>
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Active Markets</span>
          <p className="text-2xl font-bold font-mono">{activeMarkets}</p>
        </div>
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Total Bets</span>
          <p className="text-2xl font-bold font-mono">{trades.length}</p>
        </div>
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Bet Volume</span>
          <p className="text-2xl font-bold font-mono">${totalVolume.toFixed(0)}</p>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Most Traded */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Most Bet</CardTitle></CardHeader>
          <CardContent>
            {mostTraded.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bets yet</p>
            ) : (
              <div className="space-y-2">
                {mostTraded.map(({ market: m, count }) => m && (
                  <div key={m.id} className="flex justify-between text-sm">
                    <span className="truncate">{m.title}</span>
                    <span className="font-mono text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Top Gainers */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Top Gainers</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.slice(0, 3).map((e, i) => (
                <div key={e.userId} className="flex justify-between text-sm">
                  <span className="truncate">{i + 1}. {e.displayName}</span>
                  <span className={`font-mono ${e.returnPct >= 0 ? "price-up" : "price-down"}`}>
                    {e.returnPct >= 0 ? "+" : ""}{e.returnPct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Settlement Status */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Market Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Open</span>
                <span className="font-mono">{markets.filter((m) => m.status === "open").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Suspended</span>
                <span className="font-mono">{markets.filter((m) => m.status === "suspended").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Settled</span>
                <span className="font-mono">{markets.filter((m) => m.status === "settled").length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="markets">
        <TabsList className="flex-wrap">
          <TabsTrigger value="markets"><BarChart3 className="h-4 w-4 mr-1.5" />Markets</TabsTrigger>
          <TabsTrigger value="students"><Users className="h-4 w-4 mr-1.5" />Students</TabsTrigger>
          <TabsTrigger value="classroom"><Settings className="h-4 w-4 mr-1.5" />Classroom</TabsTrigger>
          <TabsTrigger value="log"><FileText className="h-4 w-4 mr-1.5" />Action Log</TabsTrigger>
        </TabsList>

        {/* Markets Tab */}
        <TabsContent value="markets">
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Market</th>
                      <th className="pb-3 font-medium">League</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Outcomes</th>
                      <th className="pb-3 font-medium text-right">Bets</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {markets.map((m) => {
                      const mTrades = trades.filter((t) => t.marketId === m.id).length;
                      return (
                        <tr key={m.id} className="border-b last:border-0">
                          <td className="py-3 font-medium">
                            <Link to={`/markets/${m.id}`} className="hover:text-primary transition-colors">{m.title}</Link>
                          </td>
                          <td className="py-3">{m.league}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[m.status] ?? ""}`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono">{m.outcomes.length}</td>
                          <td className="py-3 text-right font-mono">{mTrades}</td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1">
                              {m.status === "open" && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => suspendMarket(m.id)} title="Suspend">
                                  <Pause className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {m.status === "suspended" && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resumeMarket(m.id)} title="Resume">
                                  <Play className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {(m.status === "open" || m.status === "suspended") && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSettlingMarket(m)} title="Settle">
                                  <Trophy className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateMarket(m.id)} title="Duplicate">
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              {m.status !== "open" && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMarket(m.id)} title="Delete">
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Students ({students.length})</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Student name"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-48"
                    onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
                  />
                  <Button variant="hero" size="sm" onClick={handleAddStudent}>
                    <UserPlus className="mr-1.5 h-4 w-4" />Add
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
                      <th className="pb-3 font-medium text-right">Open Bets</th>
                      <th className="pb-3 font-medium text-right">Bets</th>
                      <th className="pb-3 font-medium text-right">Return</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((e) => (
                      <tr key={e.userId} className="border-b last:border-0">
                        <td className="py-3 font-medium">{e.displayName}</td>
                        <td className="py-3 text-right font-mono">${e.cash.toFixed(0)}</td>
                        <td className="py-3 text-right font-mono">${(e.portfolioValue - e.cash).toFixed(0)}</td>
                        <td className="py-3 text-right font-mono">{e.tradeCount}</td>
                        <td className={`py-3 text-right font-mono ${e.returnPct >= 0 ? "price-up" : "price-down"}`}>
                          {e.returnPct >= 0 ? "+" : ""}{e.returnPct.toFixed(1)}%
                        </td>
                        <td className="py-3 text-right">
                          {e.userId !== "user-1" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeStudent(e.userId)}>
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

        {/* Classroom Settings Tab */}
        <TabsContent value="classroom">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class Name</label>
                  <Input value={className} onChange={(e) => setClassName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input value={classDesc} onChange={(e) => setClassDesc(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Starting Balance for New Students</label>
                <Input
                  type="number"
                  value={startingBal}
                  onChange={(e) => setStartingBal(Number(e.target.value))}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">Virtual cash each student starts with</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => {
                    updateClassroom({ name: className, description: classDesc });
                    updateStartingBalance(startingBal);
                  }}
                >
                  Save Settings
                </Button>
                <Button variant="destructive" size="sm" onClick={resetClassroom}>
                  <RefreshCw className="mr-1.5 h-4 w-4" />Reset Simulation
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Reset will restore all student balances, clear trade history, and reset open market prices to even.
                Settled markets and templates are preserved.
              </p>
            </CardContent>
          </Card>
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

      <NewClassDialog open={showCreator} onOpenChange={setShowCreator} />
      {settlingMarket && <SettlementModal market={settlingMarket} onClose={() => setSettlingMarket(null)} />}
    </div>
  );
}
