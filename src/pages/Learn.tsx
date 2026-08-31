// Full-page assigned learning view for students.
import { AssignedLearning } from "@/components/learn/AssignedLearning";

export default function Learn() {
  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Learning</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Modules your instructor assigned for this class — work through them in order and mark each
          one complete.
        </p>
      </header>
      <AssignedLearning />
    </div>
  );
}
