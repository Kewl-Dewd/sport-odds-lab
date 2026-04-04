import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEducation, type EducationMode } from "@/context/EducationContext";
import { cn } from "@/lib/utils";

/** Small toggle for the navbar / settings */
export function EducationModeToggle() {
  const { educationEnabled, setEducationEnabled, mode, setMode } = useEducation();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Learn</span>
        <Switch checked={educationEnabled} onCheckedChange={setEducationEnabled} className="scale-75" />
      </div>

      {educationEnabled && (
        <div className="flex rounded-md border overflow-hidden text-xs">
          {(["beginner", "advanced"] as EducationMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2.5 py-1 capitalize transition-colors",
                mode === m ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Instructor panel for controlling education layer */
export function InstructorEducationControls() {
  const { educationEnabled, setEducationEnabled, mode, setMode } = useEducation();

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Education Layer</span>
        </div>
        <Switch checked={educationEnabled} onCheckedChange={setEducationEnabled} />
      </div>
      {educationEnabled && (
        <>
          <p className="text-xs text-muted-foreground">
            When enabled, students see tooltips, learning panels, and contextual nudges throughout the platform.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("beginner")}
              className={cn(
                "flex-1 rounded-lg border p-3 text-left transition-colors text-xs",
                mode === "beginner" ? "border-primary bg-primary/5" : "hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Eye className="h-3.5 w-3.5" />
                <span className="font-medium">Beginner</span>
              </div>
              <p className="text-muted-foreground">Simplified stats, more explanations, learning panels open by default.</p>
            </button>
            <button
              onClick={() => setMode("advanced")}
              className={cn(
                "flex-1 rounded-lg border p-3 text-left transition-colors text-xs",
                mode === "advanced" ? "border-primary bg-primary/5" : "hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <EyeOff className="h-3.5 w-3.5" />
                <span className="font-medium">Advanced</span>
              </div>
              <p className="text-muted-foreground">Full stats, deeper analytics, minimal hand-holding.</p>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
