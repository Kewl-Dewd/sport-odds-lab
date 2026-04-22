import { useNavigate } from "react-router-dom";
import { BarChart3, Trophy, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMode, type AppMode, MODE_LABELS, MODE_DESCRIPTIONS } from "@/context/ModeContext";
import { useAuth } from "@/context/AuthContext";

const MODES: { id: AppMode; icon: typeof BarChart3; gradient: string }[] = [
  { id: "prediction", icon: BarChart3, gradient: "from-primary/20 to-primary/5" },
  { id: "sportsbook", icon: Zap, gradient: "from-warning/20 to-warning/5" },
  { id: "racetrack", icon: Trophy, gradient: "from-success/20 to-success/5" },
];

export default function ChooseMode() {
  const navigate = useNavigate();
  const { setMode } = useMode();
  const { user } = useAuth();

  const pick = (m: AppMode) => {
    setMode(m);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="container py-12 max-w-5xl animate-slide-up">
      <div className="text-center mb-10 space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Choose your market</h1>
        <p className="text-muted-foreground">
          {user ? `Welcome${user.email ? `, ${user.email.split("@")[0]}` : ""}.` : "Pick the simulation you want to run."}
          {" "}You can switch any time from the top nav.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {MODES.map(({ id, icon: Icon, gradient }) => (
          <Card
            key={id}
            className={`group relative overflow-hidden cursor-pointer border-2 hover:border-primary transition-all hover:shadow-lg bg-gradient-to-br ${gradient}`}
            onClick={() => pick(id)}
          >
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold">{MODE_LABELS[id]}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {MODE_DESCRIPTIONS[id]}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground -ml-2">
                Enter <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-8">
        Each mode has its own dashboard, markets, portfolio, and leaderboard.
      </p>
    </div>
  );
}
