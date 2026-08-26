import { useLocation, useNavigate } from "react-router-dom";
import { Building2, GraduationCap, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth, type ViewAs } from "@/context/AuthContext";

const VIEW_META: Record<ViewAs, { label: string; icon: typeof User; home: string }> = {
  student: { label: "Student view", icon: User, home: "/dashboard" },
  instructor: { label: "Instructor view", icon: GraduationCap, home: "/instructor" },
  admin: { label: "Administrator view", icon: Building2, home: "/admin/platform" },
};

export function ViewSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { isPlatformAdminAccount, viewAs, setViewAs } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only platform administrators can switch consoles.
  // Students and instructors each have exactly one console.
  if (!isPlatformAdminAccount) return null;

  const options: ViewAs[] = ["student", "instructor", "admin"];

  const current = VIEW_META[viewAs];
  const CurrentIcon = current.icon;

  const choose = (v: ViewAs) => {
    setViewAs(v);
    onNavigate?.();
    const leavingRestricted =
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/instructor") ||
      location.pathname.startsWith("/experiments");
    if (v !== viewAs && (leavingRestricted || v !== "student")) {
      navigate(VIEW_META[v].home);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden lg:inline">{current.label}</span>
          <span className="lg:hidden">View</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-popover z-50">
        <DropdownMenuLabel>Switch console</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => {
          const meta = VIEW_META[option];
          const Icon = meta.icon;
          return (
            <DropdownMenuItem
              key={option}
              onSelect={() => choose(option)}
              className={option === viewAs ? "bg-primary/10 font-medium" : ""}
            >
              <Icon className="h-4 w-4 mr-2" />
              {meta.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
