import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "./FeedbackModal";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className="fixed bottom-20 right-3 z-50 h-11 w-11 gap-2 rounded-full p-0 sm:w-auto sm:px-4 md:bottom-4 md:right-4"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
      >
        <MessageSquare className="h-4 w-4" />
        <span className="hidden sm:inline">Feedback</span>
      </Button>
      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
}
