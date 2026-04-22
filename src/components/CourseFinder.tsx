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
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  MapPin,
} from "lucide-react";

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

// --- Aspirations ---
type BikeSize = "moped" | "125" | "midweight" | "unrestricted";
type YesNoUnsure = "yes" | "no" | "unsure";

type Aspirations = {
  bikeSize: BikeSize;
  passenger: YesNoUnsure;
  motorways: YesNoUnsure;
};

// What an age/licence combo currently unlocks
type EligibilityCap = {
  // highest engine/power they can ride right now (after CBT etc.)
  maxBikeNow: BikeSize;
  // can they carry a passenger now?
  passengerNow: boolean;
  // can they use motorways now?
  motorwaysNow: boolean;
  // short summary line for the interim eligibility card
  summary: string;
  // what's eligible for them as a list of chips
  chips: string[];
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

const BIKE_SIZE_OPTIONS: { value: BikeSize; label: string; help: string }[] = [
  { value: "moped", label: "Just a 50cc moped", help: "City runabout, 28mph max" },
  { value: "125", label: "A 125cc commuter", help: "Up to 11kW — typical learner bike" },
  { value: "midweight", label: "A midweight bike (up to 35kW)", help: "A2 territory — most popular roadbikes restricted" },
  { value: "unrestricted", label: "Anything I like — no restrictions", help: "Full A — sportbikes, big tourers, no power cap" },
];

const YES_NO_UNSURE: { value: YesNoUnsure; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure yet" },
];

const BIKE_RANK: Record<BikeSize, number> = {
  moped: 0,
  "125": 1,
  midweight: 2,
  unrestricted: 3,
};

const BIKE_LABEL: Record<BikeSize, string> = {
  moped: "50cc moped",
  "125": "125cc bike",
  midweight: "midweight bike (up to 35kW)",
  unrestricted: "any bike, no restrictions",
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

// What each age band unlocks at the top of the licence ladder (after training)
function eligibilityFor(age: AgeBand): EligibilityCap {
  switch (age) {
    case "16":
      return {
        maxBikeNow: "moped",
        passengerNow: false,
        motorwaysNow: false,
        summary: "At 16 you can ride a 50cc moped on a CBT — no passengers, no motorways.",
        chips: ["CBT", "50cc moped"],
      };
    case "17-18":
      return {
        maxBikeNow: "125",
        passengerNow: false,
        motorwaysNow: false,
        summary: "At 17–18 you can CBT onto a 125cc, then take a full A1 licence to drop the L-plates.",
        chips: ["CBT", "125cc (11kW)", "A1 licence"],
      };
    case "19-23":
      return {
        maxBikeNow: "midweight",
        passengerNow: false,
        motorwaysNow: false,
        summary: "At 19–23 you can CBT onto a 125cc, then take a full A2 licence — bikes up to 35kW.",
        chips: ["CBT", "125cc (11kW)", "A2 licence (up to 35kW)"],
      };
    case "24+":
      return {
        maxBikeNow: "unrestricted",
        passengerNow: false,
        motorwaysNow: false,
        summary: "At 24+ you can CBT onto a 125cc, then go straight to a full A licence — any bike, no power cap.",
        chips: ["CBT", "125cc (11kW)", "Full A licence (any power)"],
      };
  }
}

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

// Build a roadmap for users whose aspirations exceed what they can do today
function roadmapFor(age: AgeBand, aspirations: Aspirations): string[] {
  const steps: string[] = [];
  const cap = eligibilityFor(age);
  const wantsBigger = BIKE_RANK[aspirations.bikeSize] > BIKE_RANK[cap.maxBikeNow];
  const wantsPassenger = aspirations.passenger === "yes";
  const wantsMotorways = aspirations.motorways === "yes";

  if (!wantsBigger && !wantsPassenger && !wantsMotorways) return steps;

  if (age === "16" && (wantsBigger || wantsPassenger || wantsMotorways)) {
    steps.push("At 17 you can CBT onto a 125cc and start working towards a full A1 licence.");
  }
  if (
    (age === "16" || age === "17-18") &&
    (BIKE_RANK[aspirations.bikeSize] >= BIKE_RANK["midweight"])
  ) {
    steps.push("From 19 you can take a full A2 licence — bikes up to 35kW.");
  }
  if (aspirations.bikeSize === "unrestricted" && age !== "24+") {
    steps.push("From 24 (or 2 years after passing A2) you can take a full A licence — any power, no restrictions.");
  }
  if ((wantsPassenger || wantsMotorways) && age !== "16") {
    steps.push("Passing a full A1, A2 or A licence removes L-plates — you can then carry passengers and use motorways.");
  }
  if (wantsPassenger && age === "16") {
    steps.push("Carrying passengers and using motorways needs a full licence — earliest at 17 with A1.");
  }

  return steps;
}

type Stage = "age" | "licence" | "eligibility" | "bikeSize" | "passenger" | "motorways" | "result";

const STAGE_ORDER: Stage[] = ["age", "licence", "eligibility", "bikeSize", "passenger", "motorways", "result"];

export function CourseFinder() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("age");
  const [age, setAge] = useState<AgeBand | null>(null);
  const [licence, setLicence] = useState<Licence | null>(null);
  const [bikeSize, setBikeSize] = useState<BikeSize | null>(null);
  const [passenger, setPassenger] = useState<YesNoUnsure | null>(null);
  const [motorways, setMotorways] = useState<YesNoUnsure | null>(null);

  const reset = () => {
    setStage("age");
    setAge(null);
    setLicence(null);
    setBikeSize(null);
    setPassenger(null);
    setMotorways(null);
  };

  const back = () => {
    const idx = STAGE_ORDER.indexOf(stage);
    if (idx <= 0) return;
    setStage(STAGE_ORDER[idx - 1]);
  };

  const skipAspirations = () => {
    setBikeSize(null);
    setPassenger(null);
    setMotorways(null);
    setStage("result");
  };

  const handleAge = (value: AgeBand) => {
    setAge(value);
    setStage("licence");
  };

  const handleLicence = (value: Licence) => {
    setLicence(value);
    setStage("eligibility");
  };

  const handleBikeSize = (value: BikeSize) => {
    setBikeSize(value);
    setStage("passenger");
  };

  const handlePassenger = (value: YesNoUnsure) => {
    setPassenger(value);
    setStage("motorways");
  };

  const handleMotorways = (value: YesNoUnsure) => {
    setMotorways(value);
    setStage("result");
  };

  const progress = ((STAGE_ORDER.indexOf(stage) + 1) / STAGE_ORDER.length) * 100;

  const ending: Ending | null =
    age && licence ? ENDINGS[ENDING_MAP[`${age}|${licence}`]] : null;

  const eligibility = age ? eligibilityFor(age) : null;

  const aspirations: Aspirations | null =
    bikeSize && passenger && motorways
      ? { bikeSize, passenger, motorways }
      : null;

  const roadmap =
    age && aspirations ? roadmapFor(age, aspirations) : [];

  // Module labels shown above the question
  const moduleLabel =
    stage === "age" || stage === "licence"
      ? "Step 1 of 2 · Eligibility"
      : stage === "eligibility"
      ? "Eligibility check"
      : stage === "bikeSize" || stage === "passenger" || stage === "motorways"
      ? "Step 2 of 2 · What you want"
      : "Your recommendation";

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
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Course Finder</DialogTitle>
          <DialogDescription>
            A few quick questions and we'll point you to the right training.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
            {moduleLabel}
          </p>
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

        {stage === "eligibility" && eligibility && ending && (
          <EligibilityPanel
            eligibility={eligibility}
            ending={ending}
            onContinue={() => setStage("bikeSize")}
            onSkip={skipAspirations}
            onBack={back}
            onReset={reset}
          />
        )}

        {stage === "bikeSize" && (
          <QuestionPanel
            question="What kind of bike do you actually want to ride?"
            help="Pick your aspiration — we'll tell you if you can do it now, or what the path looks like."
            options={BIKE_SIZE_OPTIONS.map((o) => ({
              key: o.value,
              label: o.label,
              help: o.help,
              onSelect: () => handleBikeSize(o.value),
            }))}
            onBack={back}
            onReset={reset}
          />
        )}

        {stage === "passenger" && (
          <QuestionPanel
            question="Do you want to carry a passenger?"
            help="Pillion riding needs a full licence — not allowed on a CBT."
            options={YES_NO_UNSURE.map((o) => ({
              key: o.value,
              label: o.label,
              onSelect: () => handlePassenger(o.value),
            }))}
            onBack={back}
            onReset={reset}
          />
        )}

        {stage === "motorways" && (
          <QuestionPanel
            question="Do you want to use motorways?"
            help="Motorways need a full licence — CBT-only riders can't use them."
            options={YES_NO_UNSURE.map((o) => ({
              key: o.value,
              label: o.label,
              onSelect: () => handleMotorways(o.value),
            }))}
            onBack={back}
            onReset={reset}
          />
        )}

        {stage === "result" && ending && eligibility && (
          <ResultPanel
            ending={ending}
            aspirations={aspirations}
            eligibility={eligibility}
            roadmap={roadmap}
            onBack={back}
            onReset={reset}
          />
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

function EligibilityPanel({
  eligibility,
  ending,
  onContinue,
  onSkip,
  onBack,
  onReset,
}: {
  eligibility: EligibilityCap;
  ending: Ending;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-5 py-2">
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Here's what you can do
          </p>
          <p className="mt-1 text-sm leading-relaxed">{eligibility.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {eligibility.chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full border border-primary/30 bg-background px-2.5 py-0.5 text-xs font-medium text-primary"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
          Want a tailored recommendation?
        </p>
        <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
          Three more questions about the bike you actually want to ride and we'll match you to the right course — and show you the roadmap if you're aiming higher than your age allows today.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button onClick={onContinue} className="sm:flex-1">
            Yes, refine for me
          </Button>
          <Button variant="outline" onClick={onSkip} className="sm:flex-1">
            Just show me {CTA_LABEL[ending.cta].toLowerCase()}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <button
          onClick={onReset}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Start over
        </button>
      </div>
    </div>
  );
}

function ResultPanel({
  ending,
  aspirations,
  eligibility,
  roadmap,
  onBack,
  onReset,
}: {
  ending: Ending;
  aspirations: Aspirations | null;
  eligibility: EligibilityCap;
  roadmap: string[];
  onBack: () => void;
  onReset: () => void;
}) {
  const wantsBigger =
    aspirations &&
    BIKE_RANK[aspirations.bikeSize] > BIKE_RANK[eligibility.maxBikeNow];
  const wantsPassenger = aspirations?.passenger === "yes";
  const wantsMotorways = aspirations?.motorways === "yes";
  const hasGap = roadmap.length > 0 && (wantsBigger || wantsPassenger || wantsMotorways);

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

      {aspirations && hasGap && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                You're aiming higher than today allows
              </p>
              <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-body)" }}>
                You want a {BIKE_LABEL[aspirations.bikeSize]}
                {wantsPassenger ? ", with a passenger" : ""}
                {wantsMotorways ? ", on motorways" : ""}.
                Right now you're capped at a {BIKE_LABEL[eligibility.maxBikeNow]} on L-plates.
              </p>
            </div>
          </div>
        </div>
      )}

      {roadmap.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-secondary" />
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Your roadmap
            </p>
          </div>
          <ol className="mt-3 space-y-2">
            {roadmap.map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-sm" style={{ fontFamily: "var(--font-body)" }}>
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-semibold text-secondary">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

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
