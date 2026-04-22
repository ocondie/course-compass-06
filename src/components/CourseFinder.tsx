import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCcw, CheckCircle2, Sparkles } from "lucide-react";

type CourseId = "cbt" | "cbt-renewal" | "full-licence" | "itm" | "gear-conversion";

type Course = {
  id: CourseId;
  name: string;
  duration: string;
  summary: string;
  highlights: string[];
};

const COURSES: Record<CourseId, Course> = {
  cbt: {
    id: "cbt",
    name: "CBT Training",
    duration: "1 day (6–8 hours)",
    summary:
      "The standard entry course that lets you legally ride a 125cc motorcycle or scooter on UK roads for 2 years.",
    highlights: [
      "Bike, fuel and online pre-training included",
      "145+ UK locations, flexible cancellation",
      "L-plates required, no passengers, no motorways",
    ],
  },
  "cbt-renewal": {
    id: "cbt-renewal",
    name: "CBT Renewal",
    duration: "1 day",
    summary:
      "The same 5-element CBT course, often delivered at a faster pace for riders renewing an expired or expiring certificate.",
    highlights: [
      "Extends your 125cc entitlement for another 2 years",
      "Faster pace if you can demonstrate confidence",
      "Same conditions apply: L-plates, no passengers, no motorways",
    ],
  },
  "full-licence": {
    id: "full-licence",
    name: "Full Licence Training (A1 / A2 / A)",
    duration: "Multi-day (2–5 sessions)",
    summary:
      "Training plus Module 1 and Module 2 tests for a full UK motorcycle licence — ride without L-plates, carry passengers, use motorways.",
    highlights: [
      "Choose 2, 3, 4 or 5-session packages based on experience",
      "Bike category (A1 / A2 / A) is set by your age",
      "Requires a current CBT and motorcycle theory certificate",
    ],
  },
  itm: {
    id: "itm",
    name: "Introduction to Motorcycling",
    duration: "2 hours, off-road",
    summary:
      "A relaxed, no-pressure 2-hour taster session for complete beginners — try riding before committing to a CBT.",
    highlights: [
      "Entirely off-road, no road riding",
      "Covers controls, balance, clutch, gears and braking",
      "Does not qualify you to ride on the road",
    ],
  },
  "gear-conversion": {
    id: "gear-conversion",
    name: "Gear Conversion Course",
    duration: "2 hours",
    summary:
      "A skills course for CBT holders who trained on an automatic and want to ride a manual/geared motorcycle confidently.",
    highlights: [
      "Clutch control, smooth pull-away, gear changes",
      "Max 2 students per instructor",
      "Does not replace your CBT or grant new entitlement",
    ],
  },
};

type Option = { label: string; next: string };
type Step =
  | { id: string; type: "question"; question: string; help?: string; options: Option[] }
  | { id: string; type: "result"; course: CourseId; reason: string };

const STEPS: Record<string, Step> = {
  start: {
    id: "start",
    type: "question",
    question: "Where are you in your motorcycling journey?",
    help: "Pick the option that best describes you right now.",
    options: [
      { label: "Complete beginner — I've never ridden", next: "beginner-sure" },
      { label: "I want my first CBT to ride a 125cc", next: "first-cbt-bike" },
      { label: "I already have a CBT", next: "have-cbt" },
      { label: "I want a full motorcycle licence", next: "full-have-cbt" },
    ],
  },

  // Beginner branch
  "beginner-sure": {
    id: "beginner-sure",
    type: "question",
    question: "Are you ready to commit to a full day of riding?",
    help: "A CBT is a 6–8 hour course. A taster session is just 2 hours, off-road.",
    options: [
      { label: "I'd like a short taster first", next: "result-itm" },
      { label: "Yes, I want to get on the road", next: "first-cbt-bike" },
      { label: "Not sure — I want low pressure", next: "result-itm" },
    ],
  },

  // First CBT branch — bike type
  "first-cbt-bike": {
    id: "first-cbt-bike",
    type: "question",
    question: "Which bike do you want to ride?",
    help: "This decides whether you train on an automatic scooter or a manual/geared motorcycle.",
    options: [
      { label: "Automatic scooter", next: "result-cbt" },
      { label: "Manual / geared motorcycle", next: "first-cbt-manual-exp" },
      { label: "I'm not sure yet", next: "result-cbt" },
    ],
  },
  "first-cbt-manual-exp": {
    id: "first-cbt-manual-exp",
    type: "question",
    question: "Have you ridden a manual/geared motorcycle before?",
    options: [
      { label: "Yes, I'm comfortable with gears", next: "result-cbt" },
      { label: "No — I've never used a clutch on a bike", next: "result-itm-then-cbt" },
    ],
  },

  // Have CBT branch
  "have-cbt": {
    id: "have-cbt",
    type: "question",
    question: "What's the status of your CBT certificate?",
    help: "CBT certificates are valid for 2 years.",
    options: [
      { label: "Expired or expiring soon", next: "result-renewal" },
      { label: "Still valid — I want more skills", next: "have-cbt-skills" },
      { label: "Still valid — I want a full licence", next: "full-have-cbt" },
    ],
  },
  "have-cbt-skills": {
    id: "have-cbt-skills",
    type: "question",
    question: "Did you take your CBT on an automatic or manual bike?",
    options: [
      { label: "Automatic — I want to ride a manual", next: "result-gear" },
      { label: "Manual — I want more practice", next: "result-gear" },
      { label: "Manual — I'm confident already", next: "full-have-cbt" },
    ],
  },

  // Full licence branch
  "full-have-cbt": {
    id: "full-have-cbt",
    type: "question",
    question: "Do you already have a CBT and motorcycle theory certificate?",
    help: "Both are required before booking full licence training.",
    options: [
      { label: "Yes, I have both", next: "full-experience" },
      { label: "I have CBT, not theory", next: "full-experience" },
      { label: "I have neither", next: "result-cbt-first" },
    ],
  },
  "full-experience": {
    id: "full-experience",
    type: "question",
    question: "How experienced are you on a manual motorcycle on UK roads?",
    help: "This decides which training package suits you best.",
    options: [
      { label: "Very experienced — fast-track me", next: "result-full-3" },
      { label: "Some real-road manual experience", next: "result-full-4" },
      { label: "CBT-level rider, any experience", next: "result-full-5" },
      { label: "Not confident — train me first, no test yet", next: "result-full-2" },
    ],
  },

  // Results
  "result-cbt": { id: "result-cbt", type: "result", course: "cbt", reason: "You're ready to get on the road and earn your 125cc entitlement." },
  "result-renewal": { id: "result-renewal", type: "result", course: "cbt-renewal", reason: "Your existing CBT means you just need to renew to keep riding." },
  "result-itm": { id: "result-itm", type: "result", course: "itm", reason: "A 2-hour off-road taster is the lowest-pressure way to try riding." },
  "result-itm-then-cbt": {
    id: "result-itm-then-cbt",
    type: "result",
    course: "itm",
    reason: "Start with an Introduction to Motorcycling to learn clutch and gears off-road, then progress to a CBT on a manual.",
  },
  "result-gear": {
    id: "result-gear",
    type: "result",
    course: "gear-conversion",
    reason: "A Gear Conversion course builds manual riding skills under your existing CBT — strongly recommended before riding a geared bike.",
  },
  "result-cbt-first": {
    id: "result-cbt-first",
    type: "result",
    course: "cbt",
    reason: "You'll need a CBT (and motorcycle theory) before you can start full licence training.",
  },
  "result-full-3": {
    id: "result-full-3",
    type: "result",
    course: "full-licence",
    reason: "Recommended package: 3 sessions including both tests — fast-track for very experienced manual riders.",
  },
  "result-full-4": {
    id: "result-full-4",
    type: "result",
    course: "full-licence",
    reason: "Recommended package: 4 sessions including both tests — for riders with real-road manual experience.",
  },
  "result-full-5": {
    id: "result-full-5",
    type: "result",
    course: "full-licence",
    reason: "Recommended package: 5 sessions including both tests — full training and test prep from CBT level.",
  },
  "result-full-2": {
    id: "result-full-2",
    type: "result",
    course: "full-licence",
    reason: "Recommended package: 2 sessions, training only — build skills and get an instructor assessment before booking tests.",
  },
};

// Approximate progress based on typical depth (3–4 questions)
const MAX_DEPTH = 4;

export function CourseFinder() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<string[]>(["start"]);

  const currentId = history[history.length - 1];
  const current = STEPS[currentId];

  const reset = () => setHistory(["start"]);
  const back = () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));

  const handleSelect = (next: string) => {
    setHistory((h) => [...h, next]);
  };

  const progress =
    current.type === "result"
      ? 100
      : Math.min(95, ((history.length - 1) / MAX_DEPTH) * 100 + 10);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTimeout(reset, 200);
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Sparkles className="size-4" />
          Find my course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Course Finder</DialogTitle>
          <DialogDescription>
            Answer a few quick questions and we'll recommend the right course for you.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <Progress value={progress} className="h-1.5" />
        </div>

        {current.type === "question" ? (
          <div className="space-y-5 py-2">
            <div>
              <h3 className="text-lg font-semibold leading-snug">{current.question}</h3>
              {current.help && (
                <p className="mt-1 text-sm text-muted-foreground">{current.help}</p>
              )}
            </div>

            <div className="grid gap-2">
              {current.options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleSelect(opt.next)}
                  className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium transition-all hover:border-primary hover:bg-accent hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span>{opt.label}</span>
                  <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
                    →
                  </span>
                </button>
              ))}
            </div>

            {history.length > 1 && (
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={back} className="gap-1.5">
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                <button
                  onClick={reset}
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  Start over
                </button>
              </div>
            )}
          </div>
        ) : (
          <ResultPanel
            course={COURSES[current.course]}
            reason={current.reason}
            onBack={back}
            onReset={reset}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResultPanel({
  course,
  reason,
  onBack,
  onReset,
}: {
  course: Course;
  reason: string;
  onBack: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-5 py-2">
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Recommended for you
          </p>
          <h3 className="mt-1 text-xl font-semibold">{course.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{course.duration}</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed">{reason}</p>

      <div>
        <p className="text-sm font-medium">About this course</p>
        <p className="mt-1 text-sm text-muted-foreground">{course.summary}</p>
        <ul className="mt-3 space-y-1.5">
          {course.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5">
            <RotateCcw className="size-4" />
            Start over
          </Button>
        </div>
        <Button size="lg" className="sm:min-w-40">
          Book {course.name.split(" ")[0]}
        </Button>
      </div>
    </div>
  );
}
