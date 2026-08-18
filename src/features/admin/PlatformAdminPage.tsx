import { useMemo, useState } from "react";
import { Building2, GraduationCap, Layers, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import {
  usePlatformClasses, usePlatformDirectory, useSetUserAccess,
  type DirectoryRow,
} from "@/features/admin/usePlatformAdmin";

export default function PlatformAdminPage() {
  const { isPlatformAdmin } = useAuth();
  const { data: directory = [], isLoading } = usePlatformDirectory();
  const { data: classes = [] } = usePlatformClasses();
  const [search, setSearch] = useState("");

  const instructors = directory.filter((u) => u.role === "instructor");
  const students = directory.filter((u) => u.role !== "instructor");
  const totalBets = directory.reduce((sum, u) => sum + Number(u.bets_placed), 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return directory;
    return directory.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.display_name ?? "").toLowerCase().includes(q),
    );
  }, [directory, search]);

  if (!isPlatformAdmin) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="flex items-center gap-3 py-10">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Platform administrator access is required for this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" /> Platform Administration
        </h1>
        <p className="text-sm text-muted-foreground">
          Every instructor, class section, and student across all institutions.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard icon={GraduationCap} label="Instructors" value={instructors.length} />
        <StatCard icon={Users} label="Students" value={students.length} />
        <StatCard icon={Layers} label="Class sections" value={classes.length} />
        <StatCard icon={Building2} label="Bets recorded" value={totalBets} />
      </div>

      <Tabs defaultValue="people">
        <TabsList>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="classes">All classes</TabsTrigger>
        </TabsList>

        <TabsContent value="people" className="mt-4 space-y-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="max-w-sm"
          />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading directory…</p>
          ) : (
            <Card>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead className="text-right">Teaching</TableHead>
                      <TableHead className="text-right">Enrolled</TableHead>
                      <TableHead className="text-right">Bets</TableHead>
                      <TableHead>Change access</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => <PersonRow key={u.user_id} user={u} />)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="classes" className="mt-4">
          {classes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No class sections have been created yet.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Join code</TableHead>
                      <TableHead className="text-right">Students</TableHead>
                      <TableHead className="text-right">Bets</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((c) => (
                      <TableRow key={c.class_id}>
                        <TableCell>
                          <div className="font-medium">
                            {c.name}
                            {c.is_archived && (
                              <Badge variant="outline" className="ml-2">Archived</Badge>
                            )}
                          </div>
                          {c.term && <div className="text-xs text-muted-foreground">{c.term}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{c.owner_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{c.owner_email}</div>
                        </TableCell>
                        <TableCell className="font-mono text-sm tracking-widest">{c.join_code}</TableCell>
                        <TableCell className="text-right">{c.student_count}</TableCell>
                        <TableCell className="text-right">{c.bet_count}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PersonRow({ user }: { user: DirectoryRow }) {
  const setAccess = useSetUserAccess();
  const [pending, setPending] = useState<string>("");

  const currentValue = user.is_admin
    ? "admin"
    : user.role === "instructor"
      ? "instructor"
      : "student";

  const apply = (value: string) => {
    setPending(value);
    setAccess.mutate(
      {
        userId: user.user_id,
        role: value === "student" ? "student" : "instructor",
        platformAdmin: value === "admin",
      },
      {
        onSuccess: () => toast.success(`${user.email} is now ${LABELS[value]}`),
        onError: (e) => toast.error(e.message),
        onSettled: () => setPending(""),
      },
    );
  };

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{user.display_name ?? "—"}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </TableCell>
      <TableCell>
        <Badge variant={user.is_admin ? "default" : user.role === "instructor" ? "secondary" : "outline"}>
          {LABELS[currentValue]}
        </Badge>
      </TableCell>
      <TableCell className="text-right">{user.classes_owned}</TableCell>
      <TableCell className="text-right">{user.classes_joined}</TableCell>
      <TableCell className="text-right">{user.bets_placed}</TableCell>
      <TableCell>
        <Select
          value={currentValue}
          onValueChange={apply}
          disabled={setAccess.isPending && pending !== ""}
        >
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="instructor">Instructor</SelectItem>
            <SelectItem value="admin">Platform admin</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}

const LABELS: Record<string, string> = {
  student: "Student",
  instructor: "Instructor",
  admin: "Platform admin",
};

function StatCard({ icon: Icon, label, value }: {
  icon: typeof Users; label: string; value: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardDescription className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" /> {label}
        </CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
