import { LifeBuoy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholders are intentional: every number and link must be verified
// before being filled in. Do not invent contact details.
const resources = [
  {
    name: "Alberta Addiction Helpline",
    description: "Free, confidential support for gambling, alcohol and drug concerns, available across Alberta.",
    phone: "[PHONE – VERIFY]",
    url: "[URL – VERIFY]",
  },
  {
    name: "AGLC GameSense",
    description: "Information on how gambling works, setting limits, and getting help from GameSense advisors.",
    phone: "[PHONE – VERIFY]",
    url: "[URL – VERIFY]",
  },
  {
    name: "Olds College Counselling Services",
    description: "Free, confidential counselling for Olds College students.",
    phone: "[PHONE – VERIFY]",
    url: "[URL – VERIFY]",
  },
  {
    name: "National resource",
    description: "[NATIONAL RESOURCE NAME – VERIFY] — Canada-wide support for people affected by gambling.",
    phone: "[PHONE – VERIFY]",
    url: "[URL – VERIFY]",
  },
];

export default function Support() {
  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LifeBuoy className="h-6 w-6 text-primary" /> Support Resources
        </h1>
        <p className="text-sm text-muted-foreground">
          If gambling is affecting you or someone you know, these services can help. Support is
          free and confidential.
        </p>
      </div>
      <div className="space-y-3">
        {resources.map((r) => (
          <Card key={r.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{r.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="text-muted-foreground">{r.description}</p>
              <p><span className="font-medium">Phone:</span> {r.phone}</p>
              <p><span className="font-medium">Website:</span> {r.url}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        If you or someone else is in immediate danger, call 911.
      </p>
    </div>
  );
}
