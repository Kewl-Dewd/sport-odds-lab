import { ExternalLink, LifeBuoy, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const resources = [
  {
    name: "Alberta Addiction Helpline",
    description:
      "Free, confidential 24/7 support, information and referrals for Albertans concerned about their own or someone else's gambling.",
    phone: "1-866-332-2322",
    phoneHref: "tel:+18663322322",
    url: "https://www.albertahealthservices.ca/findhealth/Service.aspx?id=1008399",
    urlLabel: "Alberta Health Services",
  },
  {
    name: "GameSense by AGLC",
    description:
      "Speak with a GameSense advisor about gambling habits, safer play and Alberta's Self-Exclusion Program. Info Line hours: Tuesday–Wednesday 10 a.m.–5 p.m.; Thursday–Saturday 1–8 p.m.",
    phone: "1-833-447-7523",
    phoneHref: "tel:+18334477523",
    url: "https://gamesenseab.ca/responsible-gambling-support/community-resources",
    urlLabel: "GameSense Alberta",
  },
  {
    name: "211 Alberta",
    description:
      "Information and referrals to community, social, government and health services across Alberta, including local addiction and mental-health support.",
    phone: "Call 211",
    phoneHref: "tel:211",
    url: "https://ab.211.ca/",
    urlLabel: "211 Alberta",
  },
  {
    name: "Responsible Gambling Council",
    description:
      "Canada-wide gambling information, support resources and a directory of free, confidential counselling and provincial helplines.",
    phone: "Find your provincial helpline online",
    url: "https://responsiblegambling.org/for-the-public/problem-gambling-help/help-for-canadians/",
    urlLabel: "Help for Canadians",
  },
  {
    name: "9-8-8 Suicide Crisis Helpline",
    description:
      "Free, confidential 24/7 support anywhere in Canada if you are thinking about suicide or are worried about someone else. Call or text 9-8-8 in English or French.",
    phone: "Call or text 988",
    phoneHref: "tel:988",
    url: "https://988.ca/",
    urlLabel: "9-8-8 Canada",
  },
];

export default function Support() {
  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <LifeBuoy className="h-6 w-6 text-primary" /> Support Resources
        </h1>
        <p className="text-sm text-muted-foreground">
          If gambling is affecting you or someone you know, these Alberta and Canada-wide services
          can help.
        </p>
      </div>
      <div className="space-y-3">
        {resources.map((resource) => (
          <Card key={resource.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{resource.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{resource.description}</p>
              <p className="flex flex-wrap items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {resource.phoneHref ? (
                  <a className="font-medium text-primary underline-offset-4 hover:underline" href={resource.phoneHref}>
                    {resource.phone}
                  </a>
                ) : (
                  <span className="font-medium">{resource.phone}</span>
                )}
              </p>
              <a
                className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
                href={resource.url}
                target="_blank"
                rel="noreferrer"
              >
                {resource.urlLabel}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        If you or someone else is in immediate danger, call 911. For suicide crisis support in
        Canada, call or text 988 any time.
      </p>
    </div>
  );
}
