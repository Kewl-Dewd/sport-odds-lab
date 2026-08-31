// Lets a student flip between the classes they're enrolled in.
import { GraduationCap, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useActiveClass } from "@/context/ClassContext";

export function ClassSwitcher() {
  const { enrollments, activeClassId, setActiveClassId } = useActiveClass();
  const navigate = useNavigate();

  if (enrollments.length === 0) {
    return (
      <Button variant="outline" size="sm" onClick={() => navigate("/join")}>
        <Plus className="mr-1.5 h-4 w-4" /> Join a class
      </Button>
    );
  }

  return (
    <Select
      value={activeClassId ?? undefined}
      onValueChange={(v) => (v === "__join" ? navigate("/join") : setActiveClassId(v))}
    >
      <SelectTrigger className="h-9 w-[190px]">
        <GraduationCap className="mr-1.5 h-4 w-4 text-primary shrink-0" />
        <SelectValue placeholder="Select class" />
      </SelectTrigger>
      <SelectContent>
        {enrollments.map((e) => (
          <SelectItem key={e.klass.id} value={e.klass.id}>
            {e.klass.name}
          </SelectItem>
        ))}
        <SelectItem value="__join">+ Join another class…</SelectItem>
      </SelectContent>
    </Select>
  );
}
