import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "./FeedbackModal";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="fixed bottom-20 md:bottom-4 right-4 z-50 rounded-full shadow-lg gap-2"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="h-4 w-4" />
        Feedback
      </Button>
      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
}
