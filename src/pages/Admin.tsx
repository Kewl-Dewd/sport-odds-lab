import { useState } from "react";
import { Plus, Settings, Users, BarChart3, RefreshCw, Eye, Edit, Pause, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockMarkets = [
  { id: "1", title: "Lakers vs Celtics", league: "NBA", status: "open", outcomes: 2, trades: 45 },
  { id: "2", title: "Super Bowl LIX", league: "NFL", status: "open", outcomes: 2, trades: 120 },
  { id: "3", title: "Man City vs Arsenal", league: "EPL", status: "suspended", outcomes: 3, trades: 67 },
  { id: "4", title: "World Series G7", league: "MLB", status: "settled", outcomes: 2, trades: 200 },
];

const mockUsers = [
  { name: "Alice Chen", email: "alice@school.edu", balance: 15200, trades: 52, joined: "Jan 15" },
  { name: "Bob Smith", email: "bob@school.edu", balance: 14100, trades: 41, joined: "Jan 16" },
  { name: "Carol Wang", email: "carol@school.edu", balance: 13800, trades: 38, joined: "Jan 16" },
];

const statusColor: Record<string, string> = {
  open: "bg-success/15 text-success",
  suspended: "bg-warning/15 text-warning",
  settled: "bg-muted text-muted-foreground",
  closed: "bg-destructive/15 text-destructive",
};

export default function Admin() {
  return (
    <div className="container py-8 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage markets, users, and settings</p>
        </div>
        <Button variant="hero" size="sm">
          <Plus className="mr-1.5 h-4 w-4" />New Market
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Active Markets</span>
          <p className="text-2xl font-bold font-mono">12</p>
        </div>
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Total Users</span>
          <p className="text-2xl font-bold font-mono">48</p>
        </div>
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Total Trades</span>
          <p className="text-2xl font-bold font-mono">1,247</p>
        </div>
        <div className="stat-card">
          <span className="text-sm text-muted-foreground">Avg. Portfolio</span>
          <p className="text-2xl font-bold font-mono">$12,340</p>
        </div>
      </div>

      <Tabs defaultValue="markets">
        <TabsList>
          <TabsTrigger value="markets"><BarChart3 className="h-4 w-4 mr-1.5" />Markets</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" />Users</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1.5" />Settings</TabsTrigger>
        </TabsList>

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
                      <th className="pb-3 font-medium text-right">Trades</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockMarkets.map((m) => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{m.title}</td>
                        <td className="py-3">{m.league}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[m.status]}`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono">{m.outcomes}</td>
                        <td className="py-3 text-right font-mono">{m.trades}</td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Pause className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Check className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium text-right">Balance</th>
                      <th className="pb-3 font-medium text-right">Trades</th>
                      <th className="pb-3 font-medium text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers.map((u) => (
                      <tr key={u.email} className="border-b last:border-0">
                        <td className="py-3 font-medium">{u.name}</td>
                        <td className="py-3 text-muted-foreground">{u.email}</td>
                        <td className="py-3 text-right font-mono">${u.balance.toLocaleString()}</td>
                        <td className="py-3 text-right font-mono">{u.trades}</td>
                        <td className="py-3 text-right">{u.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Starting Balance for New Users</label>
                <Input type="number" defaultValue={10000} className="max-w-xs" />
                <p className="text-xs text-muted-foreground">Virtual cash amount each new user starts with</p>
              </div>
              <div className="flex gap-3">
                <Button variant="hero" size="sm">Save Settings</Button>
                <Button variant="destructive" size="sm">
                  <RefreshCw className="mr-1.5 h-4 w-4" />Reset All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
