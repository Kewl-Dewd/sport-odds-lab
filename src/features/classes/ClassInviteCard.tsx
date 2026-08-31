// Everything an instructor needs to get students into a class:
// course code, invite link, projectable QR code, and email invites.
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Mail, QrCode, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useClassInvites, useRevokeInvite, useSendInvites } from "@/features/coursework/useCoursework";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ClassInviteCard({ classId, joinCode, className }: {
  classId: string;
  joinCode: string;
  className: string;
}) {
  const inviteLink = `${window.location.origin}/join/${joinCode}`;
  const { data: invites = [] } = useClassInvites(classId);
  const sendInvites = useSendInvites(classId);
  const revoke = useRevokeInvite(classId);
  const [raw, setRaw] = useState("");

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const submit = async () => {
    const emails = Array.from(
      new Set(
        raw
          .split(/[\s,;]+/)
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      ),
    );
    const bad = emails.filter((e) => !EMAIL_RE.test(e));
    if (emails.length === 0) return toast.error("Add at least one email address");
    if (bad.length > 0) return toast.error(`Not a valid email: ${bad[0]}`);
    if (emails.length > 100) return toast.error("Send at most 100 invites at a time");
    try {
      const res = await sendInvites.mutateAsync(emails);
      toast.success(`Sent ${res.sent} invite${res.sent === 1 ? "" : "s"}`);
      if (res.failed?.length) toast.error(`Could not send to ${res.failed.length} address(es)`);
      setRaw("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send invites");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Invite students</CardTitle>
        <CardDescription>Four ways in — pick whatever fits your classroom.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Course code</Label>
            <div className="flex gap-2">
              <Input readOnly value={joinCode} className="font-mono text-lg tracking-[0.3em]" />
              <Button variant="outline" size="icon" onClick={() => copy(joinCode, "Course code")} aria-label="Copy course code">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Invite link</Label>
            <div className="flex gap-2">
              <Input readOnly value={inviteLink} className="text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(inviteLink, "Invite link")} aria-label="Copy invite link">
                <Copy className="h-4 w-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Show QR code">
                    <QrCode className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>Scan to join {className}</DialogTitle></DialogHeader>
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="rounded-lg bg-background p-4 border">
                      <QRCodeSVG value={inviteLink} size={260} />
                    </div>
                    <p className="font-mono text-2xl tracking-[0.3em]">{joinCode}</p>
                    <p className="text-sm text-muted-foreground text-center">
                      Project this on day one — students scan, sign in, and land in the class.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-emails" className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" /> Invite by email
          </Label>
          <Textarea
            id="invite-emails"
            rows={3}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Paste addresses separated by commas, spaces or new lines"
          />
          <Button onClick={submit} disabled={sendInvites.isPending}>
            <Send className="mr-1.5 h-4 w-4" />
            {sendInvites.isPending ? "Sending…" : "Send invites"}
          </Button>
        </div>

        {invites.length > 0 && (
          <div className="space-y-2">
            <Label>Sent invitations ({invites.length})</Label>
            <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
              {invites.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-sm truncate">{i.email}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={i.status === "accepted" ? "default" : "outline"} className="text-xs">
                      {i.status}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => revoke.mutate(i.id)} aria-label="Remove invite">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
