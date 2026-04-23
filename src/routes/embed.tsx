import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CourseFinder } from "@/components/CourseFinder";

export const Route = createFileRoute("/embed")({
  component: EmbedPage,
  head: () => ({
    meta: [
      { title: "Course Finder" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function EmbedPage() {
  // Open immediately on mount so the dialog appears as soon as the iframe loads.
  const [open, setOpen] = useState(true);

  // When the user closes the dialog, tell the parent window to hide the iframe overlay.
  useEffect(() => {
    if (!open && typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "rideto:close" }, "*");
    }
  }, [open]);

  // Let the parent know we're ready (so it can show the iframe only after mount).
  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "rideto:ready" }, "*");
    }
    // Ensure the iframe document itself is transparent so the host page shows through.
    if (typeof document !== "undefined") {
      document.documentElement.style.background = "transparent";
      document.body.style.background = "transparent";
    }
  }, []);

  return (
    // Transparent background — the dialog overlay provides the dim backdrop.
    <main className="min-h-screen bg-transparent">
      <CourseFinder open={open} onOpenChange={setOpen} hideTrigger />
    </main>
  );
}
