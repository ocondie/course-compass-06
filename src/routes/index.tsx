import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CourseFinder } from "@/components/CourseFinder";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Licence Finder" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function Index() {
  // Popup-only embed: dialog opens immediately when the iframe loads.
  const [open, setOpen] = useState(true);

  // Tell the parent window to hide the iframe overlay when the user closes the popup.
  useEffect(() => {
    if (!open && typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "rideto:close" }, "*");
    }
  }, [open]);

  // Signal readiness to the parent and keep the iframe transparent so the host page shows through.
  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "rideto:ready" }, "*");
    }
    if (typeof document !== "undefined") {
      document.documentElement.style.background = "transparent";
      document.body.style.background = "transparent";
    }
  }, []);

  return (
    <main className="min-h-screen bg-transparent">
      <CourseFinder open={open} onOpenChange={setOpen} hideTrigger />
    </main>
  );
}
