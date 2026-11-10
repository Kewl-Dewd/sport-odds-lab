// Full-page assigned learning view for students.
import { AssignedLearning } from "@/components/learn/AssignedLearning";

export default function Learn() {
  return (
    <div className="container max-w-6xl py-8 md:py-12">
      <header className="mb-8 border-b border-foreground/15 pb-7">
        <div className="section-kicker mb-3">Assigned fieldwork</div>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.05em] md:text-5xl">Learning</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Modules your instructor assigned for this class — work through them in order and mark each
          one complete.
        </p>
      </header>
      <AssignedLearning />
    </div>
  );
}
