// Which of the four major leagues appear on the live board.
//
// The setting lives on the class row (`classes.allowed_leagues`) so an
// instructor controls what their students see. Students read the setting
// from the class they're enrolled in; everyone else gets all four.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { db, unwrap, type ClassRow, type ClassMemberRow } from "@/features/db";
import { DEFAULT_BOARD_LEAGUES, MAJOR_LEAGUES } from "@/lib/liveBoard";

const MAJOR_KEYS = MAJOR_LEAGUES.map((l) => l.key);

function normalize(allowed: string[] | null | undefined): string[] {
  const majors = (allowed ?? []).filter((k) => MAJOR_KEYS.includes(k));
  // Nothing stored yet → show every major league.
  return majors.length > 0 ? majors : DEFAULT_BOARD_LEAGUES;
}

export interface BoardLeagueSettings {
  leagues: string[];
  classId: string | null;
  canEdit: boolean;
}

export function useBoardLeagues() {
  const { user, isInstructorAccount } = useAuth();

  const query = useQuery<BoardLeagueSettings>({
    queryKey: ["board-leagues", user?.id, isInstructorAccount],
    enabled: !!user,
    queryFn: async () => {
      if (isInstructorAccount) {
        const owned = unwrap<ClassRow[]>(
          await db
            .from("classes")
            .select("*")
            .eq("owner_id", user!.id)
            .eq("is_archived", false)
            .order("created_at", { ascending: true }),
        );
        const klass = owned[0] ?? null;
        return {
          leagues: normalize(klass?.allowed_leagues),
          classId: klass?.id ?? null,
          canEdit: !!klass,
        };
      }

      const seats = unwrap<ClassMemberRow[]>(
        await db
          .from("class_members")
          .select("*")
          .eq("user_id", user!.id)
          .order("joined_at", { ascending: true }),
      );
      const classId = seats[0]?.class_id ?? null;
      if (!classId) {
        return { leagues: DEFAULT_BOARD_LEAGUES, classId: null, canEdit: false };
      }
      const klass = unwrap<ClassRow>(
        await db.from("classes").select("*").eq("id", classId).single(),
      );
      return { leagues: normalize(klass?.allowed_leagues), classId, canEdit: false };
    },
  });

  return {
    leagues: query.data?.leagues ?? DEFAULT_BOARD_LEAGUES,
    classId: query.data?.classId ?? null,
    canEdit: query.data?.canEdit ?? false,
    isLoading: query.isLoading,
  };
}

export function useSetBoardLeagues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, leagues }: { classId: string; leagues: string[] }) => {
      const { error } = await db
        .from("classes")
        .update({ allowed_leagues: leagues })
        .eq("id", classId);
      if (error) throw error;
      return leagues;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["board-leagues"] });
      void qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
