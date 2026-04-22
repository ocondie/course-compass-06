import { createFileRoute } from "@tanstack/react-router";
import { CourseFinder } from "@/components/CourseFinder";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Find Your Motorcycle Course | RideTo" },
      {
        name: "description",
        content:
          "Not sure which motorcycle course you need? Answer a few quick questions and we'll recommend the right course — CBT, Renewal, Full Licence, ITM or Gear Conversion.",
      },
    ],
  }),
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-3 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          Course Finder
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Not sure which course you need?
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          Answer a few quick questions and we'll point you to the right motorcycle
          course — from your first CBT to a full UK licence.
        </p>
        <div className="mt-8">
          <CourseFinder />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Takes under a minute · 5 courses · UK-wide
        </p>
      </section>
    </main>
  );
}
