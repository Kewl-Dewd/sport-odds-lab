import { Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  { title: "What it is", items: [
    "A classroom simulation where students study how sportsbooks set prices, using live odds from real games.",
    "Every dollar is simulated. Students cannot deposit, withdraw or win real money, and nothing links to a real sportsbook.",
  ]},
  { title: "Learning outcomes", items: [
    "Convert odds into probabilities and explain the bookmaker's margin (vig/overround).",
    "Explain why the house earns a predictable profit over many bets, and why parlays and props raise the house edge.",
    "Make and record probability forecasts, and judge them with accuracy measures (Brier score, calibration, closing line value).",
    "Describe how sports betting is regulated in Canada and Alberta and how money flows between leagues, broadcasters and operators.",
    "Recognize thinking traps, advertising tactics and warning signs of gambling harm, and know where to get help.",
  ]},
  { title: "Built-in safeguards", items: [
    "Students must finish two responsible-play lessons on real-world risks before they can place a first simulated bet.",
    "Grades and contests reward forecast accuracy and written analysis, not winnings. Profit scoring is off by default and labelled as a demonstration of variance.",
    "Every page carries an educational notice and a link to support resources.",
    "Students sign up with their own account and must be 18 or older, matching Alberta's legal gambling age.",
    "Instructors see every bet in their class and can remove students or reset a class at any time.",
  ]},
  { title: "Privacy and cost", items: [
    "Only a name and email are collected. No payment details are stored in the app; payments are handled by Stripe.",
    "Students pay $10 for one year, or the instructor provides a course code. No purchase order is needed from the institution.",
  ]},
];

export default function ForAdministrators() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 print:max-w-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sports Market Lab — information for department chairs and administrators</h1>
          <p className="text-muted-foreground text-sm mt-1">A one-page summary instructors can share when proposing the app for a course.</p>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="print:hidden shrink-0"><Printer className="h-4 w-4 mr-2" />Print / save PDF</Button>
      </div>
      {sections.map((s) => (
        <Card key={s.title} className="break-inside-avoid">
          <CardHeader className="pb-2"><CardTitle className="text-base">{s.title}</CardTitle></CardHeader>
          <CardContent><ul className="list-disc pl-5 space-y-1.5 text-sm">{s.items.map((i) => <li key={i}>{i}</li>)}</ul></CardContent>
        </Card>
      ))}
      <p className="text-sm text-muted-foreground print:hidden">See the <Link className="underline" to="/support">support resources</Link> students are shown, or the <Link className="underline" to="/instructors">instructor overview</Link>.</p>
    </div>
  );
}
