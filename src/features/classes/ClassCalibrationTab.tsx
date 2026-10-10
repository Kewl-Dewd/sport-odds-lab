// Instructor: class-wide calibration chart, with a per-student filter.
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalibrationChart } from "@/components/analysis/CalibrationChart";
import type { BetRow } from "@/features/db";

interface RosterLike {
  user_id: string;
  profile?: { display_name?: string | null; email?: string | null } | null;
}

export function ClassCalibrationTab({ bets, roster }: { bets: BetRow[]; roster: RosterLike[] }) {
  const [who, setWho] = useState("all");
  const filtered = who === "all" ? bets : bets.filter((b) => b.user_id === who);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Calibration</CardTitle>
          <CardDescription>Forecast ranges vs. actual win rate, across the class or for one student.</CardDescription>
        </div>
        <Select value={who} onValueChange={setWho}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Whole class</SelectItem>
            {roster.map((r) => (
              <SelectItem key={r.user_id} value={r.user_id}>
                {r.profile?.display_name || r.profile?.email || r.user_id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <CalibrationChart bets={filtered} />
      </CardContent>
    </Card>
  );
}
