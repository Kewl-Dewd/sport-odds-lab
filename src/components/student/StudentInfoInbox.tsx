import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox, AlertTriangle, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useMarket,
  INFO_PACKET_KIND_LABELS,
  INFO_PACKET_TRUTH_LABELS,
  type InfoPacket,
} from "@/context/MarketContext";

interface Props {
  /** The user whose inbox to show. Defaults to the demo "user-1". */
  userId?: string;
}

const truthColor: Record<string, string> = {
  true: "border-success/40 text-success",
  partial: "border-warning/40 text-warning",
  noisy: "border-destructive/40 text-destructive",
};

/**
 * Private information inbox for students. Shows only packets released to this user.
 * Tracks read receipts and supports an optional acknowledgment.
 */
export function StudentInfoInbox({ userId = "user-1" }: Props) {
  const { getPacketsForUser, openInfoPacket, acknowledgeInfoPacket } = useMarket();

  const packets = getPacketsForUser(userId);
  const sorted = useMemo(
    () => [...packets].sort((a, b) => (b.releasedAt ?? "").localeCompare(a.releasedAt ?? "")),
    [packets],
  );
  const anyDisclosure = sorted.some((p) => p.disclosureToClass);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = activeId ? sorted.find((p) => p.id === activeId) ?? null : null;

  // Mark as opened when expanded
  useEffect(() => {
    if (active) openInfoPacket(active.id, userId);
  }, [active, userId, openInfoPacket]);

  if (sorted.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Inbox className="h-4 w-4" />Information inbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">No messages yet.</p>
        </CardContent>
      </Card>
    );
  }

  const unread = sorted.filter((p) => {
    const r = p.receipts.find((x) => x.userId === userId);
    return r && !r.openedAt;
  }).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Inbox className="h-4 w-4" />Information inbox
            {unread > 0 && <Badge className="text-[10px] h-4">{unread} new</Badge>}
          </span>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Experiment notice</Badge>
        </CardTitle>
        {anyDisclosure && (
          <p className="text-[11px] text-warning flex items-center gap-1 mt-1">
            <AlertTriangle className="h-3 w-3" />
            Some students may have received different information than you.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <ScrollArea className="max-h-72">
          <div className="space-y-1.5 pr-2">
            {sorted.map((p) => {
              const r = p.receipts.find((x) => x.userId === userId);
              const isUnread = r && !r.openedAt;
              const isActive = p.id === activeId;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveId(isActive ? null : p.id)}
                  className={cn(
                    "w-full text-left rounded-md border p-2 transition",
                    isActive ? "border-primary bg-primary/5" : isUnread ? "border-info/40 bg-info/5 hover:bg-info/10" : "hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-sm truncate", isUnread && "font-semibold")}>{p.title}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {p.releasedAt && new Date(p.releasedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[9px]">{INFO_PACKET_KIND_LABELS[p.kind]}</Badge>
                    <Badge variant="outline" className={cn("text-[9px]", truthColor[p.truthLevel])}>
                      {INFO_PACKET_TRUTH_LABELS[p.truthLevel]}
                    </Badge>
                  </div>
                  {isActive && (
                    <ActiveBody packet={p} userId={userId} onAck={() => acknowledgeInfoPacket(p.id, userId)} />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ActiveBody({ packet, userId, onAck }: { packet: InfoPacket; userId: string; onAck: () => void }) {
  const r = packet.receipts.find((x) => x.userId === userId);
  const acked = !!r?.acknowledgedAt;
  return (
    <div className="mt-2 pt-2 border-t space-y-2" onClick={(e) => e.stopPropagation()}>
      <p className="text-sm whitespace-pre-wrap">{packet.body}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          For your eyes only. Use this however you like.
        </span>
        <Button
          size="sm"
          variant={acked ? "outline" : "default"}
          className="h-7 text-xs"
          disabled={acked}
          onClick={onAck}
        >
          <CheckCheck className="h-3 w-3 mr-1" />
          {acked ? "Acknowledged" : "Acknowledge"}
        </Button>
      </div>
    </div>
  );
}
