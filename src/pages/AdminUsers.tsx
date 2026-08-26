import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, UserPlus, Shield, RefreshCw, Activity, Clock, CheckCircle2, XCircle } from "lucide-react";
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

interface AccessRow {
  user_id: string;
  status: string;
  source: string;
  expires_at: string | null;
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

const SOURCE_LABEL: Record<string, string> = {
  stripe: "Paid",
  code: "Course code",
  comp: "Comped",
  none: "—",
};

function accessInfo(a: AccessRow | undefined) {
  const active =
    !!a && a.status === "active" && (!a.expires_at || new Date(a.expires_at).getTime() > Date.now());
  return {
    active,
    label: active ? SOURCE_LABEL[a!.source] ?? "Active" : "Unpaid",
    expires: a?.expires_at ?? null,
  };
}

export default function AdminUsers() {
  const { user, isInstructor, isPlatformAdmin, loading: authLoading } = useAuth();
  const canManage = isPlatformAdmin; // full CRUD only in the administrator view
  const [stats, setStats] = useState<UserStat[]>([]);
  const [access, setAccess] = useState<Record<string, AccessRow>>({});
  const [classesByUser, setClassesByUser] = useState<Record<string, string[]>>({});
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
  const [search, setSearch] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    const [statsRes, accessRes, memberRes] = await Promise.all([
      supabase.rpc("get_user_stats"),
      supabase.from("user_access").select("user_id, status, source, expires_at"),
      supabase.from("class_members").select("user_id, classes(name)"),
    ]);
    if (statsRes.error) toast.error(statsRes.error.message);
    setStats((statsRes.data ?? []) as UserStat[]);

    const accMap: Record<string, AccessRow> = {};
    for (const row of (accessRes.data ?? []) as AccessRow[]) accMap[row.user_id] = row;
    setAccess(accMap);

    const clsMap: Record<string, string[]> = {};
    for (const row of (memberRes.data ?? []) as Array<{ user_id: string; classes: { name: string } | null }>) {
      const name = row.classes?.name;
      if (!name) continue;
      clsMap[row.user_id] = [...(clsMap[row.user_id] ?? []), name];
    }
    setClassesByUser(clsMap);
    setLoading(false);
  };

  useEffect(() => {
    if (isInstructor || isPlatformAdmin) fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstructor, isPlatformAdmin]);

  const visible = useMemo(() => {
    // Instructors only ever see their own students (enforced server-side too).
    const base = canManage ? stats : stats.filter((s) => s.user_id !== user?.id);
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (s) =>
        s.email.toLowerCase().includes(q) ||
        (s.display_name ?? "").toLowerCase().includes(q) ||
        (classesByUser[s.user_id] ?? []).join(" ").toLowerCase().includes(q)
    );
  }, [stats, search, canManage, user?.id, classesByUser]);

  const paidCount = visible.filter((s) => accessInfo(access[s.user_id]).active).length;

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
  if (!isInstructor && !isPlatformAdmin) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="p-6">You don't have access to this page.</CardContent>
        </Card>
      </div>
    );
  }

  const colCount = canManage ? 8 : 6;

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{canManage ? "User Management" : "My Students"}</h1>
          <p className="text-muted-foreground text-sm">
            {canManage
              ? "Every account on the platform — roles, access, and activity."
              : "Students enrolled in your classes, with their access status and activity."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search name, email or class…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-[220px]"
          />
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          {canManage && (
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
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">{canManage ? "Total users" : "Students"}</div><div className="text-2xl font-bold">{visible.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Paid / active access</div><div className="text-2xl font-bold">{paidCount}<span className="text-sm font-normal text-muted-foreground"> / {visible.length}</span></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total actions</div><div className="text-2xl font-bold">{visible.reduce((a, s) => a + Number(s.total_actions), 0).toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total active time</div><div className="text-2xl font-bold">{formatDuration(visible.reduce((a, s) => a + Number(s.total_seconds_on_site), 0))}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{canManage ? "Users" : "Enrolled students"}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  {canManage ? <TableHead>Role</TableHead> : <TableHead>Class</TableHead>}
                  <TableHead>Access</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                  <TableHead className="text-right">Active time</TableHead>
                  <TableHead>Last seen</TableHead>
                  {canManage && <TableHead>Joined</TableHead>}
                  {canManage && <TableHead className="text-right">Manage</TableHead>}
                  {!canManage && <TableHead className="text-right"> </TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow><TableCell colSpan={colCount} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
                )}
                {!loading && visible.length === 0 && (
                  <TableRow><TableCell colSpan={colCount} className="text-center text-muted-foreground py-8">
                    {canManage ? "No users yet." : "No students have joined your classes yet — share your class join code."}
                  </TableCell></TableRow>
                )}
                {visible.map((u) => {
                  const acc = accessInfo(access[u.user_id]);
                  return (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div className="font-medium">{u.display_name ?? u.email.split("@")[0]}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      {canManage ? (
                        <TableCell>
                          <Badge variant={u.role === "instructor" ? "default" : "secondary"}>
                            {u.role === "instructor" ? <><Shield className="h-3 w-3 mr-1" /> Instructor</> : "Student"}
                          </Badge>
                        </TableCell>
                      ) : (
                        <TableCell className="text-sm text-muted-foreground">
                          {(classesByUser[u.user_id] ?? []).join(", ") || "—"}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant={acc.active ? "default" : "outline"} className={acc.active ? "" : "text-muted-foreground"}>
                          {acc.active ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                          {acc.label}
                        </Badge>
                        {acc.active && acc.expires && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            until {new Date(acc.expires).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{Number(u.total_actions).toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatDuration(Number(u.total_seconds_on_site))}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatRelative(u.last_seen_at)}</TableCell>
                      {canManage && (
                        <TableCell className="text-muted-foreground text-sm">{new Date(u.joined_at).toLocaleDateString()}</TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => fetchActivity(u)} title="View activity">
                            <Activity className="h-4 w-4" />
                          </Button>
                          {canManage && (
                            <>
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
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
