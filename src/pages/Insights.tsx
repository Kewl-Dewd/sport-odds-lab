import { useQuery } from "@tanstack/react-query";
import { Clock, CreditCard, Users, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface StatRow {
  user_id: string;
  email: string;
  display_name: string | null;
  role: "instructor" | "student" | null;
  joined_at: string;
  total_actions: number;
  total_seconds_on_site: number;
  last_seen_at: string | null;
}

interface AccessRow {
  user_id: string;
  status: string;
  source: string;
  expires_at: string | null;
  amount_cents: number | null;
}

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function accessLabel(row?: AccessRow) {
  if (!row || row.status !== "active") return { label: "No access", variant: "outline" as const };
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { label: "Expired", variant: "outline" as const };
  }
  if (row.source === "paid") return { label: "Paid", variant: "default" as const };
  if (row.source === "code") return { label: "Course code", variant: "secondary" as const };
  return { label: "Comped", variant: "secondary" as const };
}

export default function Insights() {
  const { isInstructor, isPlatformAdmin } = useAuth();
  const staff = isInstructor || isPlatformAdmin;

  const stats = useQuery({
    queryKey: ["insights", "stats"],
    enabled: staff,
    queryFn: async (): Promise<StatRow[]> => {
      const { data, error } = await supabase.rpc("get_user_stats");
      if (error) throw new Error(error.message);
      return (data ?? []) as StatRow[];
    },
  });

  const access = useQuery({
    queryKey: ["insights", "access"],
    enabled: staff,
    queryFn: async (): Promise<AccessRow[]> => {
      const { data, error } = await supabase
        .from("user_access")
        .select("user_id, status, source, expires_at, amount_cents");
      if (error) throw new Error(error.message);
      return (data ?? []) as AccessRow[];
    },
  });

  const rows = stats.data ?? [];
  const accessById = new Map((access.data ?? []).map((a) => [a.user_id, a]));

  const totalSeconds = rows.reduce((sum, r) => sum + Number(r.total_seconds_on_site ?? 0), 0);
  const totalActions = rows.reduce((sum, r) => sum + Number(r.total_actions ?? 0), 0);
  const paying = (access.data ?? []).filter((a) => a.source === "paid" && a.status === "active").length;
  const revenue = (access.data ?? [])
    .filter((a) => a.source === "paid")
    .reduce((sum, a) => sum + (a.amount_cents ?? 0), 0) / 100;

  const tiles = [
    { label: "People", value: rows.length, icon: Users },
    { label: "Total time on app", value: formatDuration(totalSeconds), icon: Clock },
    { label: "Recorded actions", value: totalActions, icon: Activity },
    {
      label: isPlatformAdmin ? "Paid accounts" : "Paid students",
      value: `${paying}${isPlatformAdmin ? ` · $${revenue.toFixed(2)}` : ""}`,
      icon: CreditCard,
    },
  ];

  return (
    <div className="container py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Engagement &amp; access</h1>
        <p className="text-sm text-muted-foreground">
          {isPlatformAdmin
            ? "Every account on the platform, with time spent and payment status."
            : "Your students, how long they have been working, and whether their access is active."}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <tile.icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{tile.label}</p>
                <p className="text-lg font-semibold">{tile.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">People</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access</TableHead>
                <TableHead className="text-right">Time on app</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                <TableHead className="text-right">Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const staffRow = row.role === "instructor";
                const badge = staffRow
                  ? { label: "Staff — free", variant: "secondary" as const }
                  : accessLabel(accessById.get(row.user_id));
                return (
                  <TableRow key={row.user_id}>

                    <TableCell>
                      <div className="font-medium">{row.display_name ?? row.email}</div>
                      <div className="text-xs text-muted-foreground">{row.email}</div>
                    </TableCell>
                    <TableCell className="capitalize">{row.role ?? "student"}</TableCell>
                    <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      {formatDuration(Number(row.total_seconds_on_site ?? 0))}
                    </TableCell>
                    <TableCell className="text-right">{row.total_actions ?? 0}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {row.last_seen_at ? new Date(row.last_seen_at).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    {stats.isLoading ? "Loading…" : "No people to show yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
