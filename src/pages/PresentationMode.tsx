import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useMarket } from "@/context/MarketContext";
import {
  PresentationToolbar,
  VIEW_META,
  type PresentView,
  type PresentationSettings,
} from "@/components/presentation/PresentationToolbar";
import { PresentLeaderboard } from "@/components/presentation/views/PresentLeaderboard";
import { PresentMarketBoard } from "@/components/presentation/views/PresentMarketBoard";
import { PresentTopMovers } from "@/components/presentation/views/PresentTopMovers";
import { PresentHeatmap } from "@/components/presentation/views/PresentHeatmap";
import { PresentSettlement } from "@/components/presentation/views/PresentSettlement";
import { PresentReplay } from "@/components/presentation/views/PresentReplay";

const DEFAULT_SETTINGS: PresentationSettings = {
  mode: "public",
  useAliases: false,
  showProbabilities: true,
  showVolume: true,
  showTradeStats: true,
  highlightSettlements: true,
  autoRefreshSec: 10,
  autoCycleSec: 0,
};

export default function PresentationMode() {
  const { view } = useParams<{ view: string }>();
  const [currentView, setCurrentView] = useState<PresentView>((view as PresentView) || "board");
  const [settings, setSettings] = useState<PresentationSettings>(DEFAULT_SETTINGS);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCycling, setIsCycling] = useState(false);
  const [, setTick] = useState(0); // force re-render for auto-refresh
  const containerRef = useRef<HTMLDivElement>(null);
  const { classroom } = useMarket();

  // Sync URL param
  useEffect(() => {
    if (view && VIEW_META.some((v) => v.id === view)) {
      setCurrentView(view as PresentView);
    }
  }, [view]);

  // Auto-refresh
  useEffect(() => {
    if (settings.autoRefreshSec <= 0) return;
    const i = setInterval(() => setTick((t) => t + 1), settings.autoRefreshSec * 1000);
    return () => clearInterval(i);
  }, [settings.autoRefreshSec]);

  // Auto-cycle views
  useEffect(() => {
    if (!isCycling || settings.autoCycleSec <= 0) return;
    const cyclable = VIEW_META.filter((v) => v.id !== "replay"); // skip replay in auto-cycle
    const i = setInterval(() => {
      setCurrentView((prev) => {
        const idx = cyclable.findIndex((v) => v.id === prev);
        return cyclable[(idx + 1) % cyclable.length].id;
      });
    }, settings.autoCycleSec * 1000);
    return () => clearInterval(i);
  }, [isCycling, settings.autoCycleSec]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentView((prev) => {
          const idx = VIEW_META.findIndex((v) => v.id === prev);
          return VIEW_META[(idx + 1) % VIEW_META.length].id;
        });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentView((prev) => {
          const idx = VIEW_META.findIndex((v) => v.id === prev);
          return VIEW_META[(idx - 1 + VIEW_META.length) % VIEW_META.length].id;
        });
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleFullscreen]);

  const toggleCycle = () => {
    if (!isCycling && settings.autoCycleSec === 0) {
      setSettings((s) => ({ ...s, autoCycleSec: 15 }));
    }
    setIsCycling((prev) => !prev);
  };

  const renderView = () => {
    switch (currentView) {
      case "leaderboard": return <PresentLeaderboard settings={settings} />;
      case "board": return <PresentMarketBoard settings={settings} />;
      case "movers": return <PresentTopMovers settings={settings} />;
      case "heatmap": return <PresentHeatmap settings={settings} />;
      case "settlement": return <PresentSettlement settings={settings} />;
      case "replay": return <PresentReplay settings={settings} />;
      default: return <PresentMarketBoard settings={settings} />;
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background flex flex-col"
    >
      <PresentationToolbar
        currentView={currentView}
        onViewChange={setCurrentView}
        settings={settings}
        onSettingsChange={setSettings}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isCycling={isCycling}
        onToggleCycle={toggleCycle}
        classroomName={classroom.name}
      />
      {/* Spacer for fixed toolbar */}
      <div className="h-14" />
      {renderView()}
    </div>
  );
}
