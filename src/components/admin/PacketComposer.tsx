import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  useMarket,
  type InfoAudience,
  type InfoAudienceMode,
  type InfoPacketKind,
  type InfoPacketTruthLevel,
  INFO_PACKET_KIND_LABELS,
  INFO_PACKET_TRUTH_LABELS,
} from "@/context/MarketContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

const KINDS: InfoPacketKind[] = [
  "text-note",
  "team-update",
  "injury-update",
  "weather-update",
  "probability-hint",
  "strategic-clue",
];

const TRUTH_LEVELS: InfoPacketTruthLevel[] = ["true", "partial", "noisy"];

export function PacketComposer({ open, onClose }: Props) {
  const { students, markets, experiments, createInfoPacket } = useMarket();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<InfoPacketKind>("text-note");
  const [truthLevel, setTruthLevel] = useState<InfoPacketTruthLevel>("true");
  const [marketId, setMarketId] = useState<string>("none");
  const [experimentId, setExperimentId] = useState<string>("none");

  const [audienceMode, setAudienceMode] = useState<InfoAudienceMode>("everyone");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [randomCount, setRandomCount] = useState<number>(2);

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleAt, setScheduleAt] = useState<string>(""); // datetime-local

  const [disclosureToClass, setDisclosureToClass] = useState(false);
  const [includeInDebrief, setIncludeInDebrief] = useState(true);

  const eligibleStudents = useMemo(() => students, [students]);

  const handleCreate = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required.");
      return;
    }
    if ((audienceMode === "subgroup" || audienceMode === "single") && selectedUserIds.length === 0) {
      toast.error("Pick at least one student for this audience.");
      return;
    }

    const audience: InfoAudience = {
      mode: audienceMode,
      userIds: audienceMode === "subgroup" || audienceMode === "single" ? selectedUserIds : undefined,
      randomCount: audienceMode === "random" ? randomCount : undefined,
    };

    const scheduledFor =
      scheduleEnabled && scheduleAt ? new Date(scheduleAt).toISOString() : null;

    createInfoPacket({
      title: title.trim(),
      body: body.trim(),
      kind,
      truthLevel,
      audience,
      marketId: marketId === "none" ? null : marketId,
      experimentId: experimentId === "none" ? null : experimentId,
      scheduledFor,
      disclosureToClass,
      includeInDebrief,
    });

    toast.success(scheduledFor ? "Packet scheduled" : "Packet released");
    reset();
    onClose();
  };

  const reset = () => {
    setTitle(""); setBody(""); setKind("text-note"); setTruthLevel("true");
    setMarketId("none"); setExperimentId("none");
    setAudienceMode("everyone"); setSelectedUserIds([]); setRandomCount(2);
    setScheduleEnabled(false); setScheduleAt("");
    setDisclosureToClass(false); setIncludeInDebrief(true);
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) => {
      if (audienceMode === "single") return [id];
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && (reset(), onClose())}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New information packet</DialogTitle>
          <DialogDescription>
            Privately deliver information to selected students. Use this to demonstrate
            how uneven information moves prices and trading behavior.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Star QB ruled out" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as InfoPacketKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k} value={k}>{INFO_PACKET_KIND_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reliability</Label>
            <Select value={truthLevel} onValueChange={(v) => setTruthLevel(v as InfoPacketTruthLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRUTH_LEVELS.map((t) => (
                  <SelectItem key={t} value={t}>{INFO_PACKET_TRUTH_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Source close to the team confirms ankle sprain. Day-to-day."
            />
          </div>

          <div>
            <Label>Linked market (optional)</Label>
            <Select value={marketId} onValueChange={setMarketId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {markets.slice(0, 50).map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Linked experiment (optional)</Label>
            <Select value={experimentId} onValueChange={setExperimentId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {experiments.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Audience */}
        <div className="space-y-2 border-t pt-3">
          <Label className="text-sm font-semibold">Audience</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["everyone", "subgroup", "single", "random"] as InfoAudienceMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setAudienceMode(m); setSelectedUserIds([]); }}
                className={`rounded-md border px-3 py-2 text-sm capitalize transition ${
                  audienceMode === m ? "border-primary bg-primary/10" : "border-muted hover:bg-muted/50"
                }`}
              >
                {m === "subgroup" ? "Subgroup" : m === "single" ? "One student" : m === "random" ? "Random" : "Everyone"}
              </button>
            ))}
          </div>

          {audienceMode === "random" && (
            <div className="flex items-center gap-2">
              <Label className="text-xs">How many students?</Label>
              <Input
                type="number"
                min={1}
                max={eligibleStudents.length}
                value={randomCount}
                onChange={(e) => setRandomCount(Math.max(1, Math.min(eligibleStudents.length, Number(e.target.value) || 1)))}
                className="w-20 h-8"
              />
              <span className="text-xs text-muted-foreground">of {eligibleStudents.length}</span>
            </div>
          )}

          {(audienceMode === "subgroup" || audienceMode === "single") && (
            <ScrollArea className="h-44 rounded border">
              <div className="p-2 space-y-1">
                {eligibleStudents.map((s) => (
                  <label key={s.userId} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/40 cursor-pointer">
                    <Checkbox
                      checked={selectedUserIds.includes(s.userId)}
                      onCheckedChange={() => toggleUser(s.userId)}
                    />
                    <span className="text-sm">{s.displayName}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Schedule + meta */}
        <div className="space-y-2 border-t pt-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={scheduleEnabled} onCheckedChange={(v) => setScheduleEnabled(!!v)} />
            Schedule for later
          </label>
          {scheduleEnabled && (
            <Input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
            />
          )}

          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={disclosureToClass}
              onCheckedChange={(v) => setDisclosureToClass(!!v)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Disclose asymmetry to class</span>
              <span className="block text-xs text-muted-foreground">
                Tell students that some of them have received private information.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={includeInDebrief}
              onCheckedChange={(v) => setIncludeInDebrief(!!v)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Include in debrief reports</span>
              <span className="block text-xs text-muted-foreground">
                Show this packet in post-experiment instructor analytics.
              </span>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={handleCreate}>
            {scheduleEnabled && scheduleAt ? "Schedule packet" : "Release now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PacketAudienceBadge({ audience }: { audience: InfoAudience }) {
  const label =
    audience.mode === "everyone" ? "Everyone" :
    audience.mode === "subgroup" ? `Subgroup (${audience.userIds?.length ?? 0})` :
    audience.mode === "single" ? "1 student" :
    `${audience.randomCount ?? 0} random`;
  return <Badge variant="outline" className="text-[10px]">{label}</Badge>;
}
