// Instructor-side "course in a box" builder: assign built-in lessons or
// post your own content, links and assignments for a class.
import { useMemo, useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useRgLessons } from "@/features/rg/useRg";
import { useRoster } from "@/features/classes/useClasses";
import {
  useClassCourseworkProgress, useClassLessons, useCreateLesson, useDeleteLesson, useUpdateLesson,
} from "@/features/coursework/useCoursework";
import type { CourseworkKind } from "@/features/db";

export function ClassCourseworkTab({ classId }: { classId: string }) {
  const { data: lessons = [] } = useClassLessons(classId);
  const { data: library = [] } = useRgLessons();
  const { data: roster = [] } = useRoster(classId);
  const { data: progress = [] } = useClassCourseworkProgress(classId);
  const createLesson = useCreateLesson(classId);
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const [kind, setKind] = useState<CourseworkKind>("lesson");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [requiresAck, setRequiresAck] = useState(false);

  const assignedRgIds = useMemo(
    () => new Set(lessons.map((l) => l.source_rg_lesson_id).filter(Boolean) as string[]),
    [lessons],
  );

  const completionsByLesson = useMemo(() => {
    const m = new Map<string, number>();
    progress.forEach((p) => m.set(p.lesson_id, (m.get(p.lesson_id) ?? 0) + 1));
    return m;
  }, [progress]);

  const addCustom = async () => {
    if (title.trim().length < 2) {
      toast.error("Give the item a title");
      return;
    }
    if (kind === "link" && !/^https?:\/\//i.test(url.trim())) {
      toast.error("Enter a full link starting with http:// or https://");
      return;
    }
    try {
      await createLesson.mutateAsync({
        kind,
        title: title.trim().slice(0, 200),
        body_md: body.trim().slice(0, 20000),
        url: url.trim() ? url.trim().slice(0, 2000) : null,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        requires_ack: requiresAck,
        sort_order: lessons.length,
      });
      setTitle(""); setBody(""); setUrl(""); setDueAt(""); setRequiresAck(false);
      toast.success("Added to the course");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add item");
    }
  };

  const assignFromLibrary = async (id: string) => {
    const lesson = library.find((l) => l.id === id);
    if (!lesson) return;
    try {
      await createLesson.mutateAsync({
        kind: "rg",
        title: lesson.title,
        body_md: lesson.body_md,
        source_rg_lesson_id: lesson.id,
        requires_ack: lesson.requires_ack,
        sort_order: lessons.length,
      });
      toast.success(`Assigned "${lesson.title}"`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not assign lesson");
    }
  };

  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= lessons.length) return;
    const a = lessons[index];
    const b = lessons[target];
    await updateLesson.mutateAsync({ id: a.id, sort_order: b.sort_order });
    await updateLesson.mutateAsync({ id: b.id, sort_order: a.sort_order });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Course outline</CardTitle>
          <CardDescription>
            Everything here shows in the Coursework panel on your students&apos; dashboards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nothing assigned yet. Add your own content or pull a lesson from the library.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Item</TableHead>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead className="w-28">Completed</TableHead>
                  <TableHead className="w-24">Visible</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map((l, i) => (
                  <TableRow key={l.id}>
                    <TableCell className="align-middle">
                      <div className="flex flex-col">
                        <button className="text-muted-foreground hover:text-foreground text-xs" onClick={() => move(i, -1)} aria-label="Move up">▲</button>
                        <button className="text-muted-foreground hover:text-foreground text-xs" onClick={() => move(i, 1)} aria-label="Move down">▼</button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{l.title}</div>
                      {l.due_at && (
                        <div className="text-xs text-muted-foreground">
                          Due {new Date(l.due_at).toLocaleDateString()}
                        </div>
                      )}
                      {l.requires_ack && <Badge variant="outline" className="mt-1 text-xs">Acknowledgment required</Badge>}
                    </TableCell>
                    <TableCell className="text-xs capitalize text-muted-foreground">{l.kind}</TableCell>
                    <TableCell className="text-sm font-mono">
                      {completionsByLesson.get(l.id) ?? 0}/{roster.length}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={l.is_published}
                        onCheckedChange={(v) => updateLesson.mutate({ id: l.id, is_published: v })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLesson.mutate(l.id)}
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add coursework</CardTitle>
            <CardDescription>Your own lesson, a link, or an assignment prompt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as CourseworkKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lesson">Lesson (text)</SelectItem>
                  <SelectItem value="link">Link / video</SelectItem>
                  <SelectItem value="assignment">Assignment prompt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cw-title">Title</Label>
              <Input id="cw-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="Reading the moneyline" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cw-body">Content</Label>
              <Textarea id="cw-body" value={body} maxLength={20000} rows={5} onChange={(e) => setBody(e.target.value)} placeholder="Markdown-friendly text your students will read." />
            </div>
            {kind === "link" && (
              <div className="space-y-1.5">
                <Label htmlFor="cw-url">Link</Label>
                <Input id="cw-url" value={url} maxLength={2000} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="cw-due">Due (optional)</Label>
              <Input id="cw-due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="text-sm">Require acknowledgment</Label>
                <p className="text-xs text-muted-foreground">Student must confirm they read it.</p>
              </div>
              <Switch checked={requiresAck} onCheckedChange={setRequiresAck} />
            </div>
            <Button onClick={addCustom} disabled={createLesson.isPending} className="w-full">
              <Plus className="mr-1.5 h-4 w-4" /> Add to course
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lesson library</CardTitle>
            <CardDescription>Built-in responsible-play and market-literacy modules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {library.length === 0 && (
              <p className="text-sm text-muted-foreground">No library lessons available.</p>
            )}
            {library.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 rounded-md border p-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{l.title}</p>
                  {l.requires_ack && <p className="text-xs text-muted-foreground">Acknowledgment required</p>}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={assignedRgIds.has(l.id) || createLesson.isPending}
                  onClick={() => assignFromLibrary(l.id)}
                >
                  {assignedRgIds.has(l.id) ? "Assigned" : "Assign"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
