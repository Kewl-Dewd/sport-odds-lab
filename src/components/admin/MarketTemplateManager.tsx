import { useState, useMemo } from "react";
import {
  Search, Plus, Copy, Trash2, Archive, Filter, Zap, BookOpen,
  Trophy, Target, Users as UsersIcon, Star, X, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarket, type SavedTemplate } from "@/context/MarketContext";
import type { MarketCategory, DifficultyLevel } from "@/lib/tradingEngine";
import { toast } from "sonner";

// ── Built-in templates ────────────────────────────────────────────

export interface BuiltInTemplate {
  id: string;
  name: string;
  category: MarketCategory;
  description: string;
  sport: string;
  league: string;
  outcomes: string[];
  liquidity: number;
  difficultyLevel: DifficultyLevel;
  settlementRules: string;
  instructionalNotes: string;
}

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  {
    id: "game-winner", name: "Game Winner", category: "game-winner",
    description: "Which team wins the game?",
    sport: "", league: "", outcomes: ["Home Team", "Away Team"], liquidity: 100,
    difficultyLevel: "beginner",
    settlementRules: "Settles to the team with the higher final score. Overtime counts.",
    instructionalNotes: "Binary market — great intro to prediction markets. Simple win/lose outcome.",
  },
  {
    id: "series-winner", name: "Playoff Series Winner", category: "series-winner",
    description: "Which team wins the best-of series?",
    sport: "", league: "", outcomes: ["Team A", "Team B"], liquidity: 150,
    difficultyLevel: "beginner",
    settlementRules: "Settles when one team clinches the series (e.g. 4 wins in best-of-7).",
    instructionalNotes: "Good for tracking how probabilities shift across multiple games.",
  },
  {
    id: "tournament-winner", name: "Tournament Winner", category: "tournament-winner",
    description: "Who will win the tournament or championship?",
    sport: "", league: "", outcomes: ["Team 1", "Team 2", "Team 3", "Team 4", "Field"], liquidity: 200,
    difficultyLevel: "intermediate",
    settlementRules: "Settles to the champion. 'Field' covers any team not explicitly listed.",
    instructionalNotes: "Multi-outcome market. Shows how probability is distributed across many options.",
  },
  {
    id: "division-winner", name: "Division Winner", category: "division-winner",
    description: "Which team wins the division title?",
    sport: "", league: "", outcomes: ["Team 1", "Team 2", "Team 3", "Team 4"], liquidity: 160,
    difficultyLevel: "intermediate",
    settlementRules: "Settles to the team with the best division record at season end.",
    instructionalNotes: "Season-long market. Great for demonstrating how prices evolve over weeks.",
  },
  {
    id: "award-winner", name: "Season Award Winner", category: "award-winner",
    description: "Who wins the award (MVP, Cy Young, etc.)?",
    sport: "", league: "",
    outcomes: ["Candidate 1", "Candidate 2", "Candidate 3", "Candidate 4", "Candidate 5"], liquidity: 180,
    difficultyLevel: "intermediate",
    settlementRules: "Settles to the official award winner as announced by the league.",
    instructionalNotes: "5+ outcomes. Useful for discussing how new information (stats, injuries) moves prices.",
  },
  {
    id: "first-scorer", name: "First Goal Scorer", category: "first-scorer",
    description: "Which player scores first in the game?",
    sport: "Soccer", league: "",
    outcomes: ["Player A", "Player B", "Player C", "Other"], liquidity: 120,
    difficultyLevel: "advanced",
    settlementRules: "Settles to the player who scores the first goal. Own goals do not count.",
    instructionalNotes: "Player-level prop. Many outcomes with low individual probabilities.",
  },
  {
    id: "first-td-scorer", name: "First Touchdown Scorer", category: "first-td-scorer",
    description: "Which player scores the first touchdown?",
    sport: "Football", league: "NFL",
    outcomes: ["Player A", "Player B", "Player C", "Other"], liquidity: 120,
    difficultyLevel: "advanced",
    settlementRules: "Settles to the player who scores the first offensive or defensive TD.",
    instructionalNotes: "Similar to first goal scorer but in American football context.",
  },
  {
    id: "playoff-qual", name: "Make Playoffs (Yes/No)", category: "playoff-qualification",
    description: "Will this team make the playoffs?",
    sport: "", league: "", outcomes: ["Yes", "No"], liquidity: 100,
    difficultyLevel: "beginner",
    settlementRules: "Settles Yes if the team qualifies for postseason play.",
    instructionalNotes: "Simple binary. Great for discussing base rates and season-long probability.",
  },
  {
    id: "over-under", name: "Over/Under", category: "over-under",
    description: "Will the total be over or under the line?",
    sport: "", league: "", outcomes: ["Over", "Under"], liquidity: 100,
    difficultyLevel: "intermediate",
    settlementRules: "Settles based on whether the actual total exceeds the set line.",
    instructionalNotes: "Introduces the concept of a 'line' — explain how the number is chosen.",
  },
  {
    id: "head-to-head", name: "Head-to-Head Player Performance", category: "head-to-head",
    description: "Which player performs better in a head-to-head stat matchup?",
    sport: "", league: "", outcomes: ["Player A", "Player B"], liquidity: 100,
    difficultyLevel: "advanced",
    settlementRules: "Settles to the player with the higher stat (e.g., more points, more yards).",
    instructionalNotes: "Compare two players directly. Great for discussing relative skill assessment.",
  },
  {
    id: "prop-custom", name: "Custom Prop Market", category: "prop",
    description: "Create a custom proposition market",
    sport: "", league: "", outcomes: ["Yes", "No"], liquidity: 100,
    difficultyLevel: "beginner",
    settlementRules: "Instructor defines settlement criteria.",
    instructionalNotes: "Fully customizable — use for any classroom scenario.",
  },
];

const categoryIcons: Record<string, React.ReactNode> = {
  "game-winner": <Target className="h-4 w-4" />,
  "series-winner": <Trophy className="h-4 w-4" />,
  "tournament-winner": <Trophy className="h-4 w-4" />,
  "division-winner": <Star className="h-4 w-4" />,
  "award-winner": <Star className="h-4 w-4" />,
  "first-scorer": <Zap className="h-4 w-4" />,
  "first-td-scorer": <Zap className="h-4 w-4" />,
  "playoff-qualification": <Target className="h-4 w-4" />,
  "over-under": <BookOpen className="h-4 w-4" />,
  "head-to-head": <UsersIcon className="h-4 w-4" />,
  "prop": <BookOpen className="h-4 w-4" />,
  "custom": <BookOpen className="h-4 w-4" />,
};

const difficultyColor: Record<DifficultyLevel, string> = {
  beginner: "bg-success/15 text-success",
  intermediate: "bg-warning/15 text-warning",
  advanced: "bg-destructive/15 text-destructive",
};

interface Props {
  onSelectTemplate: (template: BuiltInTemplate | SavedTemplate) => void;
  onBulkImport: () => void;
  onClose: () => void;
}

export function MarketTemplateManager({ onSelectTemplate, onBulkImport, onClose }: Props) {
  const { savedTemplates, saveTemplate, deleteTemplate } = useMarket();
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const allTemplates = useMemo(() => {
    const builtin = BUILT_IN_TEMPLATES.map((t) => ({ ...t, isBuiltIn: true, isArchived: false, createdAt: "" }));
    const custom = savedTemplates.map((t) => ({ ...t, isBuiltIn: false }));
    return [...builtin, ...custom];
  }, [savedTemplates]);

  const filtered = useMemo(() => {
    return allTemplates.filter((t) => {
      if (!showArchived && t.isArchived) return false;
      if (sportFilter !== "all" && t.sport && t.sport !== sportFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q) &&
            !t.sport.toLowerCase().includes(q) && !t.league.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allTemplates, search, sportFilter, categoryFilter, showArchived]);

  const sports = useMemo(() => [...new Set(allTemplates.map((t) => t.sport).filter(Boolean))].sort(), [allTemplates]);
  const categories = useMemo(() => [...new Set(allTemplates.map((t) => t.category))].sort(), [allTemplates]);

  const handleArchive = (id: string) => {
    const t = savedTemplates.find((t) => t.id === id);
    if (t) {
      saveTemplate({ ...t, isArchived: !t.isArchived });
      toast.success(t.isArchived ? "Template unarchived" : "Template archived");
    }
  };

  const handleDuplicate = (template: typeof allTemplates[0]) => {
    const newTemplate: SavedTemplate = {
      id: `tpl-${crypto.randomUUID().slice(0, 8)}`,
      name: `${template.name} (Copy)`,
      category: template.category,
      sport: template.sport,
      league: template.league,
      description: template.description,
      outcomes: [...template.outcomes],
      liquidity: template.liquidity,
      difficultyLevel: template.difficultyLevel,
      settlementRules: template.settlementRules,
      instructionalNotes: template.instructionalNotes,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };
    saveTemplate(newTemplate);
    toast.success("Template duplicated");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-3xl max-h-[85vh] flex flex-col animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between shrink-0">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />Market Templates
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBulkImport}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />Bulk Import
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="h-5 w-5" /></button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="Sport" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {sports.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="builtin">
            <TabsList>
              <TabsTrigger value="builtin">Built-in ({BUILT_IN_TEMPLATES.length})</TabsTrigger>
              <TabsTrigger value="custom">My Templates ({savedTemplates.filter((t) => !t.isArchived).length})</TabsTrigger>
              {savedTemplates.some((t) => t.isArchived) && (
                <TabsTrigger value="archived">Archived</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="builtin" className="mt-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.filter((t) => t.isBuiltIn).map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onSelect={() => onSelectTemplate(t)}
                    onDuplicate={() => handleDuplicate(t)}
                  />
                ))}
              </div>
              {filtered.filter((t) => t.isBuiltIn).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No templates match your filters</p>
              )}
            </TabsContent>

            <TabsContent value="custom" className="mt-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.filter((t) => !t.isBuiltIn && !t.isArchived).map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onSelect={() => onSelectTemplate(t)}
                    onDuplicate={() => handleDuplicate(t)}
                    onArchive={() => handleArchive(t.id)}
                    onDelete={() => { deleteTemplate(t.id); toast.success("Template deleted"); }}
                  />
                ))}
              </div>
              {savedTemplates.filter((t) => !t.isArchived).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No custom templates yet. Create a market and save it as a template.
                </p>
              )}
            </TabsContent>

            <TabsContent value="archived" className="mt-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {savedTemplates.filter((t) => t.isArchived).map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={{ ...t, isBuiltIn: false }}
                    onSelect={() => onSelectTemplate(t)}
                    onDuplicate={() => handleDuplicate({ ...t, isBuiltIn: false })}
                    onArchive={() => handleArchive(t.id)}
                    onDelete={() => { deleteTemplate(t.id); toast.success("Template deleted"); }}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function TemplateCard({ template, onSelect, onDuplicate, onArchive, onDelete }: {
  template: { id: string; name: string; category: MarketCategory; description: string; sport: string; league: string; outcomes: string[]; difficultyLevel: DifficultyLevel; isBuiltIn: boolean; settlementRules?: string; instructionalNotes?: string };
  onSelect: () => void;
  onDuplicate: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border p-4 hover:border-primary/50 transition-colors space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-primary">{categoryIcons[template.category] ?? <BookOpen className="h-4 w-4" />}</span>
          <h4 className="font-semibold text-sm">{template.name}</h4>
        </div>
        <Badge className={`text-[10px] ${difficultyColor[template.difficultyLevel]}`}>
          {template.difficultyLevel}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">{template.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {template.sport && <Badge variant="outline" className="text-[10px]">{template.sport}</Badge>}
        {template.league && <Badge variant="outline" className="text-[10px]">{template.league}</Badge>}
        <Badge variant="secondary" className="text-[10px]">{template.outcomes.length} outcomes</Badge>
      </div>

      {expanded && (
        <div className="space-y-2 pt-2 border-t">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Outcomes</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {template.outcomes.map((o, i) => (
                <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{o}</span>
              ))}
            </div>
          </div>
          {template.settlementRules && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Settlement</p>
              <p className="text-xs">{template.settlementRules}</p>
            </div>
          )}
          {template.instructionalNotes && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Teaching Notes</p>
              <p className="text-xs">{template.instructionalNotes}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 pt-1">
        <Button variant="default" size="sm" className="text-xs flex-1" onClick={onSelect}>
          <Plus className="mr-1 h-3 w-3" />Use Template
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Less" : "Details"}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate} title="Duplicate">
          <Copy className="h-3 w-3" />
        </Button>
        {onArchive && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onArchive} title="Archive">
            <Archive className="h-3 w-3" />
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete} title="Delete">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
