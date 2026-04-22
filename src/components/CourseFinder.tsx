import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCcw, CheckCircle2, Sparkles } from "lucide-react";

type AgeBand = "16" | "17-18" | "19-23" | "24+";
type Licence = "none" | "uk-provisional" | "non-uk" | "uk-driving";

type EndingId =
  | "A" | "B" | "C"
  | "D" | "E" | "F" | "G"
  | "H" | "I" | "J" | "K"
  | "L" | "M" | "N" | "O";

type CtaKind = "provisional" | "cbt" | "convert";

type Ending = {
  id: EndingId;
  cta: CtaKind;
  title: string;
  body: string;
  bullets: string[];
};

const AGE_OPTIONS: { value: AgeBand; label: string; help?: string }[] = [
  { value: "16", label: "16", help: "Moped only — 50cc / 28mph on a CBT" },
  { value: "17-18", label: "17–18", help: "Up to 125cc (11kW) on a CBT — A1 licence possible after CBT" },
  { value: "19-23", label: "19–23", help: "Up to 125cc (11kW) on a CBT — A2 licence possible after CBT" },
  { value: "24+", label: "24 or older", help: "Up to 125cc (11kW) on a CBT — full A licence (any power) possible after CBT" },
];

// Per-age licence options (16-year-olds can't yet hold a UK driving licence)
const LICENCE_OPTIONS: Record<
  AgeBand,
  { value: Licence; label: string; help?: string }[]
> = {
  "16": [
    { value: "none", label: "I don't have any kind of driving licence" },
    { value: "uk-provisional", label: "UK provisional driving licence" },
    { value: "non-uk", label: "Non-UK driving licence" },
  ],
  "17-18": [
    { value: "none", label: "I don't have any kind of driving licence" },
    { value: "uk-provisional", label: "UK provisional driving licence" },
    { value: "non-uk", label: "Non-UK driving licence" },
    { value: "uk-driving", label: "UK full car driving licence" },
  ],
  "19-23": [
    { value: "none", label: "I don't have any kind of driving licence" },
    { value: "uk-provisional", label: "UK provisional driving licence" },
    { value: "non-uk", label: "Non-UK driving licence" },
    { value: "uk-driving", label: "UK full car driving licence" },
  ],
  "24+": [
    { value: "none", label: "I don't have any kind of driving licence" },
    { value: "uk-provisional", label: "UK provisional driving licence" },
    { value: "non-uk", label: "Non-UK driving licence" },
    { value: "uk-driving", label: "UK full car driving licence" },
  ],
};

// Ending lookup keyed by `${age}|${licence}`
const ENDING_MAP: Record<string, EndingId> = {
  "16|none": "A",
  "16|uk-provisional": "B",
  "16|non-uk": "C",
  "17-18|none": "D",
  "17-18|uk-provisional": "E",
  "17-18|non-uk": "F",
  "17-18|uk-driving": "G",
  "19-23|none": "H",
  "19-23|uk-provisional": "I",
  "19-23|non-uk": "J",
  "19-23|uk-driving": "K",
  "24+|none": "L",
  "24+|uk-provisional": "M",
  "24+|non-uk": "N",
  "24+|uk-driving": "O",
};

const CTA_LABEL: Record<CtaKind, string> = {
  provisional: "Apply for provisional",
  cbt: "Book CBT",
  convert: "Convert licence",
};

const ENDINGS: Record<EndingId, Ending> = {
  // --- Apply for provisional ---
  A: {
    id: "A",
    cta: "provisional",
    title: "Apply for your UK provisional licence",
    body: "At 16 you can apply for a provisional moped licence. Once you have it, your next step is a CBT — then you can ride a 50cc on the road.",
    bullets: [
      "Apply via GOV.UK (you'll need ID and proof of address)",
      "Then book a CBT to start riding",
      "At 16 you're limited to 50cc / 28mph",
    ],
  },
  D: {
    id: "D",
    cta: "provisional",
    title: "Apply for your UK provisional licence",
    body: "You'll need a UK provisional before you can book a CBT. Once it arrives, a CBT lets you ride a 125cc on the road.",
    bullets: [
      "Apply via GOV.UK",
      "Then book a CBT to ride a 125cc (up to 11kW)",
      "A1 licence available from 17",
    ],
  },
  H: {
    id: "H",
    cta: "provisional",
    title: "Apply for your UK provisional licence",
    body: "At 19+ you'll need a UK provisional to start. After that, a CBT gets you on a 125cc, and you can progress to a full A2 licence (up to 35kW).",
    bullets: [
      "Apply via GOV.UK",
      "Then book a CBT to start riding",
      "A2 licence available — bikes up to 35kW",
    ],
  },
  L: {
    id: "L",
    cta: "provisional",
    title: "Apply for your UK provisional licence",
    body: "At 24+ you can go straight to a full A licence with no power restrictions — but you'll need a provisional first, then a CBT to start training.",
    bullets: [
      "Apply via GOV.UK",
      "Then book a CBT to start riding",
      "Full A licence route available — any power",
    ],
  },

  // --- Book CBT ---
  B: {
    id: "B",
    cta: "cbt",
    title: "You're ready to book your CBT",
    body: "Your UK provisional covers you to take a CBT. One day of training and you can ride a 50cc on the road under L-plates.",
    bullets: [
      "1-day course (6–8 hours), bike and fuel included",
      "At 16 you're restricted to 50cc / 28mph",
      "Valid for 2 years — no passengers, no motorways",
    ],
  },
  E: {
    id: "E",
    cta: "cbt",
    title: "You're ready to book your CBT",
    body: "Your UK provisional covers you for a CBT. After one day of training you can ride a 125cc on the road.",
    bullets: [
      "1-day course (6–8 hours), bike and fuel included",
      "Ride up to 125cc (11kW) under L-plates",
      "Valid for 2 years — then renew or take a full licence",
    ],
  },
  G: {
    id: "G",
    cta: "cbt",
    title: "You're ready to book your CBT",
    body: "Your full UK car licence acts as your provisional for motorcycles. A CBT lets you ride a 125cc straight away.",
    bullets: [
      "No separate provisional needed",
      "Ride up to 125cc (11kW) under L-plates",
      "A1 licence available — removes L-plates and restrictions",
    ],
  },
  I: {
    id: "I",
    cta: "cbt",
    title: "You're ready to book your CBT",
    body: "Your UK provisional covers you for a CBT. After training you can ride a 125cc — and you're eligible for a full A2 licence.",
    bullets: [
      "1-day CBT course, bike and fuel included",
      "A2 licence route available — bikes up to 35kW",
      "Valid for 2 years on a 125cc under L-plates",
    ],
  },
  K: {
    id: "K",
    cta: "cbt",
    title: "You're ready to book your CBT",
    body: "Your UK car licence acts as your provisional for motorcycles. A CBT gets you on a 125cc, with the A2 licence as your next step.",
    bullets: [
      "No separate provisional needed",
      "Ride up to 125cc (11kW) under L-plates",
      "A2 licence available — bikes up to 35kW",
    ],
  },
  M: {
    id: "M",
    cta: "cbt",
    title: "You're ready to book your CBT",
    body: "Your UK provisional covers you for a CBT. At 24+ you can also work towards a full A licence with no power restrictions.",
    bullets: [
      "1-day CBT course, bike and fuel included",
      "Full A licence route available — any power",
      "Valid for 2 years on a 125cc under L-plates",
    ],
  },
  O: {
    id: "O",
    cta: "cbt",
    title: "You're ready to book your CBT",
    body: "Your UK car licence acts as your provisional for motorcycles. At 24+ you can also work towards a full A licence with no power restrictions — but a CBT is your starting point.",
    bullets: [
      "No separate provisional needed",
      "Ride up to 125cc (11kW) under L-plates",
      "Full A licence route available — any power",
    ],
  },

  // --- Convert licence ---
  C: {
    id: "C",
    cta: "convert",
    title: "Convert your non-UK licence",
    body: "You'll need to exchange or convert your non-UK licence before you can train or ride here. Once that's done, the standard CBT route applies.",
    bullets: [
      "Check exchange rules on GOV.UK for your country",
      "Then book a CBT to start riding (50cc at 16)",
      "Some licences allow direct exchange, others require a UK test",
    ],
  },
  F: {
    id: "F",
    cta: "convert",
    title: "Convert your non-UK licence",
    body: "You'll need to exchange or convert your non-UK licence before booking a CBT. After that you can ride a 125cc on the road.",
    bullets: [
      "Check exchange rules on GOV.UK for your country",
      "Then book a CBT to ride a 125cc",
      "A1 licence available from 17",
    ],
  },
  J: {
    id: "J",
    cta: "convert",
    title: "Convert your non-UK licence",
    body: "Convert your non-UK licence first, then take a CBT. At 19+ you're also eligible for the full A2 licence route.",
    bullets: [
      "Check exchange rules on GOV.UK",
      "Then book a CBT to start riding",
      "A2 licence available — bikes up to 35kW",
    ],
  },
  N: {
    id: "N",
    cta: "convert",
    title: "Convert your non-UK licence",
    body: "Convert your non-UK licence first, then take a CBT. At 24+ you can also work towards a full A licence with no power restrictions.",
    bullets: [
      "Check exchange rules on GOV.UK",
      "Then book a CBT to start riding",
      "Full A licence route available — any power",
    ],
  },
};

type Stage = "age" | "licence" | "result";

export function CourseFinder() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("age");
  const [age, setAge] = useState<AgeBand | null>(null);
  const [licence, setLicence] = useState<Licence | null>(null);

  const reset = () => {
    setStage("age");
    setAge(null);
    setLicence(null);
  };

  const back = () => {
    if (stage === "result") setStage("licence");
    else if (stage === "licence") {
      setStage("age");
      setLicence(null);
    }
  };

  const handleAge = (value: AgeBand) => {
    setAge(value);
    setStage("licence");
  };

  const handleLicence = (value: Licence) => {
    setLicence(value);
    setStage("result");
  };

  const progress =
    stage === "age" ? 33 : stage === "licence" ? 66 : 100;

  const ending: Ending | null =
    stage === "result" && age && licence
      ? ENDINGS[ENDING_MAP[`${age}|${licence}`]]
      : null;

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
            Two quick questions and we'll tell you exactly what to do next.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <Progress value={progress} className="h-1.5" />
        </div>

        {stage === "age" && (
          <QuestionPanel
            question="How old are you?"
            help="Age sets the highest licence you can work towards — you'll still need a CBT (and motorcycle theory for a full A1/A2/A licence) to actually get there."
            options={AGE_OPTIONS.map((o) => ({
              key: o.value,
              label: o.label,
              help: o.help,
              onSelect: () => handleAge(o.value),
            }))}
          />
        )}

        {stage === "licence" && age && (
          <QuestionPanel
            question="What driving licence do you currently hold?"
            help="We mean a car driving licence (UK or overseas) — pick whichever best describes you today."
            options={LICENCE_OPTIONS[age].map((o) => ({
              key: o.value,
              label: o.label,
              help: o.help,
              onSelect: () => handleLicence(o.value),
            }))}
            onBack={back}
            onReset={reset}
          />
        )}

        {stage === "result" && ending && (
          <ResultPanel ending={ending} onBack={back} onReset={reset} />
        )}
      </DialogContent>
    </Dialog>
  );
}

type OptionItem = {
  key: string;
  label: string;
  help?: string;
  onSelect: () => void;
};

function QuestionPanel({
  question,
  help,
  options,
  onBack,
  onReset,
}: {
  question: string;
  help?: string;
  options: OptionItem[];
  onBack?: () => void;
  onReset?: () => void;
}) {
  return (
    <div className="space-y-5 py-2">
      <div>
        <h3 className="text-lg font-semibold leading-snug">{question}</h3>
        {help && <p className="mt-1 text-sm text-muted-foreground">{help}</p>}
      </div>

      <div className="grid gap-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={opt.onSelect}
            className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-all hover:border-primary hover:bg-accent hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex flex-col">
              <span className="text-sm font-medium">{opt.label}</span>
              {opt.help && (
                <span className="mt-0.5 text-xs font-normal normal-case tracking-normal text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                  {opt.help}
                </span>
              )}
            </span>
            <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
              →
            </span>
          </button>
        ))}
      </div>

      {(onBack || onReset) && (
        <div className="flex items-center justify-between pt-2">
          {onBack ? (
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
              <ArrowLeft className="size-4" />
              Back
            </Button>
          ) : (
            <span />
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Start over
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ResultPanel({
  ending,
  onBack,
  onReset,
}: {
  ending: Ending;
  onBack: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-5 py-2">
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Your next step
          </p>
          <h3 className="mt-1 text-xl font-semibold">{ending.title}</h3>
        </div>
      </div>

      <p className="text-sm leading-relaxed">{ending.body}</p>

      <ul className="space-y-1.5">
        {ending.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

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
        <Button size="lg" className="sm:min-w-44">
          {CTA_LABEL[ending.cta]}
        </Button>
      </div>
    </div>
  );
}
