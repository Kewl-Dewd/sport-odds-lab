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
        className="fixed bottom-20 right-3 z-50 gap-2 rounded-full px-4 md:bottom-4 md:right-4"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="h-4 w-4" />
        Feedback
      </Button>
      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
}
