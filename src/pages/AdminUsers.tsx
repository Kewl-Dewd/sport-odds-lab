import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, UserPlus, Shield, RefreshCw, Activity, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface UserStat {
  user_id: string;
  email: string;
  display_name: string | null;
  role: "instructor" | "student" | null;
  joined_at: string;
  total_actions: number;
  total_seconds_on_site: number;
  last_seen_at: string | null;
}

interface ActivityRow {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h < 24) return `${h}h ${remM}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function AdminUsers() {
  const { user, isInstructor, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"student" | "instructor">("student");
  const [activityFor, setActivityFor] = useState<UserStat | null>(null);
  const [activityRows, setActivityRows] = useState<ActivityRow[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_user_stats");
    if (error) {
      toast.error(error.message);
    } else {
      setStats((data ?? []) as UserStat[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isInstructor) fetchStats();
  }, [isInstructor]);

  const fetchActivity = async (u: UserStat) => {
    setActivityFor(u);
    setActivityLoading(true);
    const { data, error } = await supabase
      .from("user_activity")
      .select("id, action, details, created_at")
      .eq("user_id", u.user_id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setActivityRows((data ?? []) as ActivityRow[]);
    setActivityLoading(false);
  };

  const createUser = async () => {
    if (!newEmail || !newPassword) {
      toast.error("Email and password are required");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "create", email: newEmail, password: newPassword, displayName: newName, role: newRole },
    });
    setCreating(false);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Failed to create user");
      return;
    }
    toast.success(`Created ${newEmail}`);
    setCreateOpen(false);
    setNewEmail(""); setNewPassword(""); setNewName(""); setNewRole("student");
    fetchStats();
  };

  const deleteUser = async (u: UserStat) => {
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "delete", userId: u.user_id },
    });
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Failed to delete user");
      return;
    }
    toast.success(`Deleted ${u.email}`);
    fetchStats();
  };

  const setRole = async (u: UserStat, role: "student" | "instructor") => {
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "set_role", userId: u.user_id, role },
    });
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Failed to update role");
      return;
    }
    toast.success(`Updated role for ${u.email}`);
    fetchStats();
  };

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="p-6">Please <Link to="/auth" className="text-primary underline">sign in</Link>.</CardContent>
        </Card>
      </div>
    );
  }
  if (!isInstructor) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="p-6">You don't have access to this page.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm">Manage accounts, roles, and view activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><UserPlus className="h-4 w-4 mr-2" /> Add user</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create user</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Display name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Input placeholder="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                <Input placeholder="Temporary password" type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <Select value={newRole} onValueChange={(v) => setNewRole(v as "student" | "instructor")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={createUser} disabled={creating}>{creating ? "Creating…" : "Create"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total users</div><div className="text-2xl font-bold">{stats.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total actions</div><div className="text-2xl font-bold">{stats.reduce((a, s) => a + Number(s.total_actions), 0).toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total active time</div><div className="text-2xl font-bold">{formatDuration(stats.reduce((a, s) => a + Number(s.total_seconds_on_site), 0))}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Users</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                  <TableHead className="text-right">Active time</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
                )}
                {!loading && stats.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No users yet.</TableCell></TableRow>
                )}
                {stats.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell>
                      <div className="font-medium">{u.display_name ?? u.email.split("@")[0]}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === "instructor" ? "default" : "secondary"}>
                        {u.role === "instructor" ? <><Shield className="h-3 w-3 mr-1" /> Instructor</> : "Student"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{Number(u.total_actions).toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatDuration(Number(u.total_seconds_on_site))}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatRelative(u.last_seen_at)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(u.joined_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => fetchActivity(u)}>
                          <Activity className="h-4 w-4" />
                        </Button>
                        <Select value={u.role ?? "student"} onValueChange={(v) => setRole(u, v as "student" | "instructor")}>
                          <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="instructor">Instructor</SelectItem>
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={u.user_id === user.id} title={u.user_id === user.id ? "Can't delete yourself" : "Delete user"}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {u.email}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This permanently removes the account, profile, role, sessions, and activity. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUser(u)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!activityFor} onOpenChange={(o) => !o && setActivityFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Activity — {activityFor?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {activityFor && (
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded border p-2"><div className="text-xs text-muted-foreground">Total actions</div><div className="font-semibold">{Number(activityFor.total_actions).toLocaleString()}</div></div>
                <div className="rounded border p-2"><div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Active time</div><div className="font-semibold">{formatDuration(Number(activityFor.total_seconds_on_site))}</div></div>
                <div className="rounded border p-2"><div className="text-xs text-muted-foreground">Last seen</div><div className="font-semibold">{formatRelative(activityFor.last_seen_at)}</div></div>
              </div>
            )}
            {activityLoading && <div className="text-center text-muted-foreground py-6">Loading…</div>}
            {!activityLoading && activityRows.length === 0 && <div className="text-center text-muted-foreground py-6">No activity recorded.</div>}
            {!activityLoading && activityRows.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>When</TableHead><TableHead>Action</TableHead><TableHead>Details</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {activityRows.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-sm font-medium">{a.action}</TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[260px]">{a.details ? JSON.stringify(a.details) : ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
