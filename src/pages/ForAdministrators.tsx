import { Printer, Check, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="paper-grain relative">
      <div className="container relative mx-auto max-w-5xl px-5 py-10 sm:py-14 print:max-w-none">
        <header className="mb-10 grid gap-7 border-b border-foreground/20 pb-9 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="section-kicker mb-5">Department briefing · Course-in-a-box</div>
            <h1 className="max-w-3xl font-display text-[clamp(2.8rem,6vw,5.4rem)] font-semibold leading-[0.95] tracking-[-0.055em]">
              A clearer case for the <span className="font-editorial font-normal italic text-primary">classroom.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Sports Market Lab information for department chairs and administrators—a printable summary instructors can share when proposing the app for a course.</p>
          </div>
          <Button variant="outline" onClick={() => window.print()} className="shrink-0 print:hidden"><Printer className="mr-2 h-4 w-4" />Print / save PDF</Button>
        </header>

        <div className="space-y-5">
          {sections.map((section, index) => (
            <Card key={section.title} className="break-inside-avoid overflow-hidden">
              <CardContent className="grid gap-5 p-0 sm:grid-cols-[13rem_1fr] sm:gap-0">
                <div className="flex items-center gap-4 border-b border-foreground/15 bg-muted/40 p-5 sm:block sm:border-b-0 sm:border-r sm:p-6">
                  <span className="font-editorial text-4xl italic text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <h2 className="font-display text-xl tracking-[-0.035em] sm:mt-3">{section.title}</h2>
                  <Building2 className="ml-auto h-5 w-5 text-accent sm:ml-0 sm:mt-5" strokeWidth={1.5} />
                </div>
                <ul className="space-y-3 p-5 text-sm leading-6 text-muted-foreground sm:p-6">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" />{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-8 border-t border-foreground/15 pt-5 text-sm text-muted-foreground print:hidden">See the <Link className="text-primary underline underline-offset-4" to="/support">support resources</Link> students are shown, or the <Link className="text-primary underline underline-offset-4" to="/instructors">instructor overview</Link>.</p>
      </div>
    </div>
  );
}
