import { Link } from "react-router-dom";
import { TrendingUp, BarChart3, Users, Trophy, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: TrendingUp,
    title: "Trade Outcome Shares",
    description: "Buy and sell shares on sports outcomes using virtual currency. Prices move based on supply and demand.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Pricing",
    description: "Deterministic market-maker formulas drive prices. No AI, no randomness — pure math and strategy.",
  },
  {
    icon: Users,
    title: "Classroom Ready",
    description: "Built for educators. Manage students, reset seasons, and track learning outcomes effortlessly.",
  },
  {
    icon: Trophy,
    title: "Compete & Learn",
    description: "Climb the leaderboard, build your portfolio, and learn market dynamics through hands-on experience.",
  },
];

export default function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="badge-live mx-auto w-fit">
              <Zap className="h-3 w-3" />
              Prediction Market Simulator
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Learn Markets by{" "}
              <span className="text-gradient">Trading Sports</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              A classroom-friendly prediction exchange where you trade outcome shares with virtual money. 
              Math-driven pricing, real strategy, zero risk.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth?tab=signup">
                  Start Trading <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/how-it-works">How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16 md:py-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="stat-card space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border p-8 md:p-12 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to learn by doing?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Join your classroom market, analyze events, and make predictions backed by strategy — not luck.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/auth?tab=signup">Create Free Account</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
