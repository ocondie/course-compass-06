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
        [data-rideto-embed] [data-radix-dialog-overlay] { display: none !important; }
        [data-rideto-embed] [role="dialog"][data-state] {
          position: fixed !important;
          inset: 0 !important;
          left: 0 !important;
          top: 0 !important;
          transform: none !important;
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          border: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
      `}</style>
      <CourseFinder open={open} onOpenChange={setOpen} hideTrigger />
    </main>
  );
}
