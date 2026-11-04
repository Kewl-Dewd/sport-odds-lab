// Module 3: the Canadian wagering industry (including Alberta law).
import { q, type LessonDesign } from "./types";

export const M3: Record<string, LessonDesign> = {
  "single-event-wagering-in-canada-after-bill-c-218": {
    objectives: ["Explain what Bill C-218 changed in the Criminal Code.", "Describe the shift from parlay-only to single-event betting."],
    task: "Find one major-league game on the board and explain why betting on it alone would have been illegal in Canada before 2021.",
    taskAnswer: "Before C-218, provincial lotteries could only offer parlays (multiple events); a single-game bet was not permitted.",
    reflection: "Who benefited most from legalising single-event betting: provinces, leagues, operators or bettors? Defend your answer.",
    quiz: [
      q("Bill C-218 legalised:", ["Online casinos", "Single-event sports betting", "Horse racing", "Lotteries"], 1, "C-218 amended the Criminal Code to allow single-event sports wagering."),
      q("Before C-218, provincial sports lotteries offered:", ["Only parlays", "Only single games", "Nothing", "Only horse racing"], 0, "Products like Sport Select required combining multiple events."),
      q("After C-218, who decides how betting is offered?", ["The federal government only", "Each province", "Sports leagues", "The United States"], 1, "Gaming remains provincially conducted and managed."),
    ],
  },
  "who-regulates-aglc-igaming-ontario-and-provincia": {
    objectives: ["Distinguish a regulator from an operator.", "Identify AGLC and iGaming Ontario's roles."],
    task: "On the Support page or AGLC's site, find what AGLC stands for and one rule it enforces.",
    taskAnswer: "Alberta Gaming, Liquor and Cannabis. Examples: age 18 rule, registration of operators, responsible-gambling tools.",
    reflection: "Is it a conflict of interest for a province to both run and regulate gambling? Why?",
    quiz: [
      q("AGLC is Alberta's:", ["Sports league", "Gaming regulator", "Private sportsbook", "Tax office"], 1, "AGLC regulates gaming in Alberta."),
      q("iGaming Ontario:", ["Regulates hockey", "Conducts and manages Ontario's private online market", "Is a betting app", "Only sells lottery tickets"], 1, "iGO contracts with private operators under AGCO standards."),
      q("A regulator's main job is to:", ["Maximise bets", "Set and enforce rules", "Set odds", "Pay winners"], 1, "Regulators license, audit and enforce standards."),
    ],
  },
  "operator-models-provincial-monopoly-private-lice": {
    objectives: ["Compare monopoly, licensed-private and grey-market models.", "Explain why grey-market sites matter for consumer protection."],
    task: "List two sportsbooks advertised during a game you watch this week and classify each by model.",
    taskAnswer: "In Alberta, PlayAlberta is the provincial site; registered private sites operate in the open market since July 2026; unregistered offshore sites are grey market.",
    reflection: "Which model best protects players? Which best raises revenue? Can one do both?",
    quiz: [
      q("A 'grey market' site is:", ["Provincially owned", "Operating without a provincial licence", "Run by a league", "Illegal everywhere"], 1, "Grey-market sites serve Canadians without being licensed by the province."),
      q("Ontario's model since 2022 is:", ["Monopoly only", "Licensed private operators", "No betting", "Federal"], 1, "Ontario opened a regulated private market in April 2022."),
      q("A key risk of grey-market sites:", ["Too many protections", "Weaker consumer protection and dispute options", "Higher payouts", "No advertising"], 1, "Unlicensed sites don't have to follow provincial protection rules."),
    ],
  },
  "leagues-teams-broadcasters-and-sportsbooks-follo": {
    objectives: ["Trace how money flows between bettors, books, leagues and media.", "Explain why leagues sign official data and sponsorship deals."],
    task: "Find one sportsbook sponsorship on a team's website or broadcast and note what the team receives.",
    taskAnswer: "Typical answers: naming rights, jersey patches, official partner status, in-broadcast odds segments.",
    reflection: "Does sportsbook sponsorship change how fans experience a game? Give an example.",
    quiz: [
      q("Leagues earn from betting through:", ["Only ticket sales", "Sponsorships and official data deals", "Taxing bettors", "Nothing"], 1, "Leagues sell official data and sponsorship rights to books."),
      q("Book revenue is called:", ["Handle", "Gross gaming revenue (GGR)", "Payout", "Vig rate"], 1, "GGR is handle minus winnings paid."),
      q("Handle means:", ["Total money wagered", "Book profit", "Taxes", "Payouts"], 0, "Handle is total amount bet."),
    ],
  },
  "assignment-map-a-sport-organization-s-wagering-p": {
    objectives: ["Research and map one organisation's wagering partnerships.", "Evaluate the ethical trade-offs of those partnerships."],
    task: "Build a one-page map (diagram or table) of one team's or league's betting partners, what each pays for, and one risk.",
    taskAnswer: "Grade with the Partnership Map rubric: accuracy, completeness, analysis of trade-offs, sources.",
    reflection: "Would you recommend the organisation renew its biggest betting deal? Why?",
    quiz: [
      q("A strong partnership map should include:", ["Only logos", "Partners, what they pay for and the risks", "Ticket prices", "Player salaries"], 1, "Maps should explain the commercial relationship and its trade-offs."),
      q("A reputational risk of betting sponsorship:", ["More fans", "Association with gambling harm", "Higher attendance", "Lower taxes"], 1, "Teams risk being seen as promoting harm to young fans."),
      q("Credible sources include:", ["Anonymous forums", "Team press releases and regulator filings", "Rumours", "Memes"], 1, "Official announcements and filings are verifiable."),
    ],
  },
  "ab-legal-basics": {
    objectives: ["State Alberta's legal betting age.", "Identify legal places to bet in Alberta."],
    task: "Find the legal gambling age and one legal online option in Alberta.",
    taskAnswer: "Age 18. PlayAlberta.ca or an AGLC-registered operator in the open market.",
    reflection: "Should the legal age for online sports betting be raised to 19 or 21? Why?",
    quiz: [
      q("Alberta's legal gambling age is:", ["16", "18", "19", "21"], 1, "Alberta's legal age is 18."),
      q("The regulator in Alberta is:", ["AGCO", "AGLC", "NCAA", "CRTC"], 1, "AGLC regulates gaming in Alberta."),
      q("Single-event betting has been legal in Canada since:", ["2008", "August 2021", "2026", "It is still illegal"], 1, "Bill C-218 came into force in August 2021."),
    ],
  },
  "ab-igaming-act": {
    objectives: ["Describe what the iGaming Alberta Act created.", "Explain the July 2026 open market launch."],
    task: "Name the body that operates Alberta's new market and the launch date.",
    taskAnswer: "The Alberta iGaming Corporation; the regulated open market launched 13 July 2026.",
    reflection: "What risks come with many new operators competing for Albertan customers?",
    quiz: [
      q("Alberta's open online market launched in:", ["2021", "July 2026", "2030", "It hasn't launched"], 1, "The regulated market went live 13 July 2026."),
      q("The Alberta iGaming Corporation:", ["Regulates hockey", "Manages the open market", "Is a sportsbook", "Sets odds"], 1, "It conducts and manages the market; AGLC regulates."),
      q("An open market means:", ["Only one provincial site", "Licensed private operators can compete", "No rules", "Only casinos"], 1, "Registered private operators can offer betting under provincial rules."),
    ],
  },
  "ab-integrity-ads": {
    objectives: ["Explain sports integrity rules and why they exist.", "List player protections operators must offer."],
    task: "Find one responsible-gambling tool (deposit limit, self-exclusion, reality check) on a licensed site's help page.",
    taskAnswer: "Any of: deposit/loss/time limits, self-exclusion, reality checks, GameSense links.",
    reflection: "Should athletes be allowed to appear in betting ads? Explain.",
    quiz: [
      q("Match-fixing threatens:", ["Only the book", "The integrity of sport", "Only fans", "Nothing"], 1, "Fixing undermines trust in the competition itself."),
      q("A self-exclusion is:", ["A bonus", "A binding block on your account", "A type of bet", "A tax"], 1, "Self-exclusion prevents access for a chosen period."),
      q("Who is barred from betting on their own games?", ["Fans", "Athletes and officials", "Journalists", "Nobody"], 1, "Insiders can't bet on events they can influence."),
    ],
  },
};
