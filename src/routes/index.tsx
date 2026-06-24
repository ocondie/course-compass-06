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
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open && typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "rideto:close" }, "*");
    }
  }, [open]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "rideto:ready" }, "*");
    }
    if (typeof document !== "undefined") {
      document.documentElement.style.background = "transparent";
      document.body.style.background = "transparent";
      document.documentElement.setAttribute("data-rideto-embed", "");
    }
  }, []);

  return (
    <main className="min-h-screen bg-transparent">
      <style>{`
        [data-rideto-embed] [data-radix-dialog-overlay],
        [data-rideto-embed] [data-state][class*="fixed inset-0"][class*="z-50"] {
          display: none !important;
          background: transparent !important;
        }
        [data-rideto-embed] [role="dialog"][data-state] {
          inset: 0 !important;
          left: 0 !important;
          top: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          margin: 0 !important;
          transform: none !important;
          translate: none !important;
          scale: none !important;
          animation: none !important;
          transition: none !important;
          border-radius: 0 !important;
        }
        /* Hide Radix's default close button in embed mode — the host page provides one. */
        [data-rideto-embed] [role="dialog"] > button[type="button"] {
          display: none !important;
        }
      `}</style>
      <CourseFinder open={open} onOpenChange={setOpen} hideTrigger embed />
    </main>
  );
}
