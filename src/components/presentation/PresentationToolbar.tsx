import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Maximize, Minimize, Play, Pause, Eye, EyeOff,
  ChevronLeft, ChevronRight, Settings, Monitor, Shield,
  BarChart3, Trophy, TrendingUp, Zap, CheckCircle2, Grid3X3,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type PresentView = "leaderboard" | "board" | "movers" | "heatmap" | "settlement" | "replay";

export interface PresentationSettings {
  mode: "public" | "instructor";
  useAliases: boolean;
  showProbabilities: boolean;
  showVolume: boolean;
  showTradeStats: boolean;
  highlightSettlements: boolean;
  autoRefreshSec: number;
  autoCycleSec: number; // 0 = off
}

const VIEW_META: { id: PresentView; label: string; icon: React.ReactNode }[] = [
  { id: "board", label: "Market Board", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "leaderboard", label: "Leaderboard", icon: <Trophy className="h-4 w-4" /> },
  { id: "movers", label: "Top Movers", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "heatmap", label: "Heatmap", icon: <Grid3X3 className="h-4 w-4" /> },
  { id: "settlement", label: "Settlements", icon: <CheckCircle2 className="h-4 w-4" /> },
  { id: "replay", label: "Replay", icon: <Zap className="h-4 w-4" /> },
];

interface Props {
  currentView: PresentView;
  onViewChange: (v: PresentView) => void;
  settings: PresentationSettings;
  onSettingsChange: (s: PresentationSettings) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isCycling: boolean;
  onToggleCycle: () => void;
  classroomName: string;
}

export function PresentationToolbar({
  currentView, onViewChange, settings, onSettingsChange,
  isFullscreen, onToggleFullscreen, isCycling, onToggleCycle,
  classroomName,
}: Props) {
  const [visible, setVisible] = useState(true);
  const [hideTimer, setHideTimer] = useState<NodeJS.Timeout | null>(null);

  const scheduleHide = useCallback(() => {
    if (hideTimer) clearTimeout(hideTimer);
    const t = setTimeout(() => setVisible(false), 4000);
    setHideTimer(t);
  }, [hideTimer]);

  useEffect(() => {
    const handleMove = () => {
      setVisible(true);
      scheduleHide();
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [scheduleHide]);

  const update = (partial: Partial<PresentationSettings>) =>
    onSettingsChange({ ...settings, ...partial });

  const viewIdx = VIEW_META.findIndex((v) => v.id === currentView);
  const prevView = VIEW_META[(viewIdx - 1 + VIEW_META.length) % VIEW_META.length].id;
  const nextView = VIEW_META[(viewIdx + 1) % VIEW_META.length].id;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      )}
      onMouseEnter={() => { setVisible(true); if (hideTimer) clearTimeout(hideTimer); }}
    >
      <div className="bg-card/95 backdrop-blur-md border-b shadow-lg">
        <div className="flex items-center justify-between px-4 py-2 gap-3">
          {/* Left: back + class name */}
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link to="/instructor"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-bold truncate">{classroomName}</span>
              <Badge variant={settings.mode === "instructor" ? "default" : "secondary"} className="text-[10px]">
                {settings.mode === "instructor" ? <><Shield className="h-3 w-3 mr-1" />Instructor</> : <><Monitor className="h-3 w-3 mr-1" />Public</>}
              </Badge>
            </div>
          </div>

          {/* Center: view tabs */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onViewChange(prevView)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="hidden md:flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
              {VIEW_META.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onViewChange(v.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    currentView === v.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v.icon}
                  <span className="hidden lg:inline">{v.label}</span>
                </button>
              ))}
            </div>
            <div className="md:hidden text-sm font-semibold">
              {VIEW_META.find((v) => v.id === currentView)?.label}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onViewChange(nextView)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Auto-cycle */}
            <Button
              variant={isCycling ? "default" : "ghost"}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={onToggleCycle}
            >
              {isCycling ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isCycling ? "Stop" : "Cycle"}</span>
            </Button>

            {/* Settings popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Settings className="h-4 w-4" /></Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 space-y-4">
                <h4 className="font-semibold text-sm">Display Settings</h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mode</span>
                    <Select value={settings.mode} onValueChange={(v: "public" | "instructor") => update({ mode: v })}>
                      <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Use Aliases</span>
                    <Switch checked={settings.useAliases} onCheckedChange={(v) => update({ useAliases: v })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show Probabilities</span>
                    <Switch checked={settings.showProbabilities} onCheckedChange={(v) => update({ showProbabilities: v })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show Volume</span>
                    <Switch checked={settings.showVolume} onCheckedChange={(v) => update({ showVolume: v })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show Trade Stats</span>
                    <Switch checked={settings.showTradeStats} onCheckedChange={(v) => update({ showTradeStats: v })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Flash Settlements</span>
                    <Switch checked={settings.highlightSettlements} onCheckedChange={(v) => update({ highlightSettlements: v })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-refresh</span>
                    <Select value={String(settings.autoRefreshSec)} onValueChange={(v) => update({ autoRefreshSec: Number(v) })}>
                      <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5s</SelectItem>
                        <SelectItem value="10">10s</SelectItem>
                        <SelectItem value="30">30s</SelectItem>
                        <SelectItem value="60">60s</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cycle Interval</span>
                    <Select value={String(settings.autoCycleSec)} onValueChange={(v) => update({ autoCycleSec: Number(v) })}>
                      <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Off</SelectItem>
                        <SelectItem value="10">10s</SelectItem>
                        <SelectItem value="15">15s</SelectItem>
                        <SelectItem value="30">30s</SelectItem>
                        <SelectItem value="60">60s</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Fullscreen */}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleFullscreen}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>

            {/* Clock */}
            <LiveClock />
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <span className="text-xs font-mono text-muted-foreground hidden sm:block w-14 text-right tabular-nums">
      {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

export { VIEW_META };
