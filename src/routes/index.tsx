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
        [data-rideto-embed] [data-radix-dialog-overlay] {
          display: none !important;
          background: transparent !important;
        }
      `}</style>
      <CourseFinder open={open} onOpenChange={setOpen} hideTrigger embed />
    </main>
  );
}
