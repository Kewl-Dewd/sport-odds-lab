import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Inbox, Plus, Send, Trash2, Clock, Users, Eye, CheckCheck, BarChart3, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useMarket,
  INFO_PACKET_KIND_LABELS,
  INFO_PACKET_TRUTH_LABELS,
  type InfoPacket,
} from "@/context/MarketContext";
import { PacketComposer, PacketAudienceBadge } from "@/components/admin/PacketComposer";
import { analyzePacket } from "@/lib/asymmetryAnalytics";

const truthColor: Record<string, string> = {
  true: "border-success/40 text-success",
  partial: "border-warning/40 text-warning",
  noisy: "border-destructive/40 text-destructive",
};

export function InformationPanel() {
  const {
    infoPackets, students, trades, markets, getMarket,
    releaseInfoPacket, deleteInfoPacket,
  } = useMarket();

  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const classroomPackets = useMemo(
    () => infoPackets.filter((p) => p.includeInDebrief !== false || p.releasedAt),
    [infoPackets],
  );

  const released = classroomPackets.filter((p) => p.releasedAt);
  const scheduled = classroomPackets.filter((p) => !p.releasedAt && p.scheduledFor);

  const selected = selectedId ? infoPackets.find((p) => p.id === selectedId) ?? null : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Information Asymmetry
            <Badge variant="outline" className="text-[10px]">
              {released.length} released
            </Badge>
            {scheduled.length > 0 && (
              <Badge variant="outline" className="text-[10px] border-info/40 text-info">
                {scheduled.length} scheduled
              </Badge>
            )}
          </CardTitle>
          <Button size="sm" onClick={() => setComposerOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />New packet
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Privately deliver information to selected students. See who opened it and how it
          changed trading behavior.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list"><Inbox className="h-3.5 w-3.5 mr-1.5" />Packets</TabsTrigger>
            <TabsTrigger value="analytics" disabled={!selected}>
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {classroomPackets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No packets yet. Click <strong>New packet</strong> to release information to selected students.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {classroomPackets.map((p) => {
                  const opened = p.receipts.filter((r) => r.openedAt).length;
                  const ack = p.receipts.filter((r) => r.acknowledgedAt).length;
                  const isSel = p.id === selectedId;
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "rounded-lg border p-3 cursor-pointer transition",
                        isSel ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                      )}
                      onClick={() => setSelectedId(p.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-sm truncate">{p.title}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {INFO_PACKET_KIND_LABELS[p.kind]}
                            </Badge>
                            <Badge variant="outline" className={cn("text-[10px]", truthColor[p.truthLevel])}>
                              {INFO_PACKET_TRUTH_LABELS[p.truthLevel]}
                            </Badge>
                            <PacketAudienceBadge audience={p.audience} />
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.body}</p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-2">
                            {p.releasedAt ? (
                              <span className="flex items-center gap-1">
                                <Send className="h-3 w-3" />
                                Released {new Date(p.releasedAt).toLocaleString()}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-info">
                                <Clock className="h-3 w-3" />
                                Scheduled {p.scheduledFor && new Date(p.scheduledFor).toLocaleString()}
                              </span>
                            )}
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{opened}/{p.receipts.length} opened</span>
                            <span className="flex items-center gap-1"><CheckCheck className="h-3 w-3" />{ack} ack</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {!p.releasedAt && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => { e.stopPropagation(); releaseInfoPacket(p.id); toast.success("Packet released"); }}
                              title="Release now"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={(e) => { e.stopPropagation(); deleteInfoPacket(p.id); toast.success("Packet deleted"); if (selectedId === p.id) setSelectedId(null); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            {selected ? (
              <PacketAnalyticsView packet={selected} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Select a packet to view analytics.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <PacketComposer open={composerOpen} onClose={() => setComposerOpen(false)} />
    </Card>
  );

  function PacketAnalyticsView({ packet }: { packet: InfoPacket }) {
    const market = packet.marketId ? getMarket(packet.marketId) : null;
    const analysis = useMemo(
      () => analyzePacket(packet, trades, students, market?.outcomes.map((o) => ({ id: o.id, name: o.name }))),
      [packet, trades, students, market],
    );

    if (!packet.releasedAt) {
      return (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Packet not released yet. Analytics will populate once recipients receive it.
        </div>
      );
    }

    const { totals, rows, priceImpacts, marketVolumeBefore, marketVolumeAfter } = analysis;
    const holders = rows.filter((r) => r.hasInfo);
    const nonHolders = rows.filter((r) => !r.hasInfo);

    return (
      <div className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <Stat label="Recipients" value={`${analysis.recipientCount}`} sub={`${analysis.openedCount} opened`} />
          <Stat label="Acknowledged" value={`${analysis.acknowledgedCount}`} sub={`${Math.round((analysis.acknowledgedCount / Math.max(1, analysis.recipientCount)) * 100)}%`} />
          <Stat
            label="Avg trades after"
            value={totals.holdersAvgTradesAfter.toFixed(1)}
            sub={`vs ${totals.nonHoldersAvgTradesAfter.toFixed(1)} non-holders`}
            highlight={totals.holdersAvgTradesAfter > totals.nonHoldersAvgTradesAfter}
          />
          <Stat
            label="Avg $ volume after"
            value={`$${totals.holdersAvgVolumeAfter.toFixed(0)}`}
            sub={`vs $${totals.nonHoldersAvgVolumeAfter.toFixed(0)}`}
            highlight={totals.holdersAvgVolumeAfter > totals.nonHoldersAvgVolumeAfter}
          />
        </div>

        {market && (
          <div className="rounded border p-3 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />Price impact: {market.title}
            </p>
            <div className="text-[11px] text-muted-foreground">
              Volume in 5min before: ${marketVolumeBefore.toFixed(0)} · after: <span className="text-foreground font-medium">${marketVolumeAfter.toFixed(0)}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {priceImpacts.map((p) => (
                <div key={p.outcomeId} className="flex items-center justify-between text-xs border rounded px-2 py-1.5">
                  <span className="truncate">{p.outcomeName}</span>
                  <span className="font-mono">
                    {p.priceBefore != null ? `${(p.priceBefore * 100).toFixed(0)}¢` : "—"}
                    {" → "}
                    {p.priceAfter != null ? `${(p.priceAfter * 100).toFixed(0)}¢` : "—"}
                    {p.delta != null && (
                      <Badge variant="outline" className={cn(
                        "ml-1.5 text-[10px]",
                        p.delta > 0 ? "border-success/40 text-success" : p.delta < 0 ? "border-destructive/40 text-destructive" : "",
                      )}>
                        {p.delta > 0 ? "+" : ""}{(p.delta * 100).toFixed(1)}pp
                      </Badge>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <BehaviorTable title={`Holders (${holders.length})`} rows={holders} highlight />
        <BehaviorTable title={`Non-holders (${nonHolders.length})`} rows={nonHolders} />
      </div>
    );
  }
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded border p-2", highlight && "border-primary/40 bg-primary/5")}>
      <p className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</p>
      <p className="font-mono font-semibold text-base">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function BehaviorTable({ title, rows, highlight }: { title: string; rows: ReturnType<typeof analyzePacket>["rows"]; highlight?: boolean }) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded border">
      <div className={cn("px-3 py-1.5 text-xs font-semibold bg-muted", highlight && "bg-primary/10")}>{title}</div>
      <ScrollArea className="max-h-48">
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b">
              <th className="text-left px-3 py-1.5 font-medium">Student</th>
              <th className="text-right px-3 py-1.5 font-medium">Opened</th>
              <th className="text-right px-3 py-1.5 font-medium">Trades before</th>
              <th className="text-right px-3 py-1.5 font-medium">Trades after</th>
              <th className="text-right px-3 py-1.5 font-medium">Reaction (5m)</th>
              <th className="text-right px-3 py-1.5 font-medium">Vol after</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-b last:border-0">
                <td className="px-3 py-1.5">{r.displayName}</td>
                <td className="px-3 py-1.5 text-right">
                  {r.hasInfo ? (r.openedAt ? "✓" : <span className="text-warning">unread</span>) : "—"}
                </td>
                <td className="px-3 py-1.5 text-right font-mono">{r.tradesBefore}</td>
                <td className="px-3 py-1.5 text-right font-mono">{r.tradesAfter}</td>
                <td className="px-3 py-1.5 text-right font-mono">{r.reactionTrades}</td>
                <td className="px-3 py-1.5 text-right font-mono">${r.volumeAfter.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}
