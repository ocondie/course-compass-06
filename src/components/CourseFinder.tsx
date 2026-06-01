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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Lock,
  Circle,
  IdCard,
  Bike,
  GraduationCap,
  Loader2,
  Compass,
  ArrowUpRight,
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
  maxBikeNow: BikeSize;
  passengerNow: boolean;
  motorwaysNow: boolean;
  summary: string;
  chips: string[];
};

const AGE_OPTIONS: { value: AgeBand; label: string; help?: string }[] = [
  { value: "16", label: "16 years old" },
  { value: "17-18", label: "17–18 years old" },
  { value: "19-23", label: "19–23 years old" },
  { value: "24+", label: "24 or older" },
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
  { value: "moped", label: "A 50cc moped", help: "A small scooter, 28mph max" },
  { value: "125", label: "A 125cc commuter", help: "An entry level bike, up to 11kW" },
  { value: "midweight", label: "A midweight bike (up to 35kW)", help: "A2 friendly bikes" },
  { value: "unrestricted", label: "Anything I like — no restrictions", help: "Any bike, no power cap" },
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

// URLs the outcome CTAs send the user to.
const CTA_URL: Record<CtaKind, string | null> = {
  provisional: "https://www.gov.uk/apply-first-provisional-driving-licence",
  convert: "https://www.gov.uk/exchange-nongb-driving-licence",
  cbt: null, // "Book CBT" just closes the dialog — user is already on the booking page.
};

// What each age band can do RIGHT NOW (today, after a CBT). The licence ladder
// (A1/A2/A) belongs in the refine/roadmap step, not here.
function eligibilityFor(age: AgeBand): EligibilityCap {
  switch (age) {
    case "16":
      return {
        maxBikeNow: "moped",
        passengerNow: false,
        motorwaysNow: false,
        summary: "Today, a CBT lets you ride a 50cc moped on the road with L-plates.",
        chips: ["CBT", "50cc moped", "L-plates"],
      };
    case "17-18":
      return {
        maxBikeNow: "125",
        passengerNow: false,
        motorwaysNow: false,
        summary: "Today, a CBT lets you ride a 125cc (up to 11kW) on the road with L-plates.",
        chips: ["CBT", "125cc", "L-plates"],
      };
    case "19-23":
      return {
        maxBikeNow: "125",
        passengerNow: false,
        motorwaysNow: false,
        summary: "Today, a CBT lets you ride a 125cc (up to 11kW) on the road with L-plates.",
        chips: ["CBT", "125cc", "L-plates"],
      };
    case "24+":
      return {
        maxBikeNow: "125",
        passengerNow: false,
        motorwaysNow: false,
        summary: "Today, a CBT lets you ride a 125cc (up to 11kW) on the road with L-plates.",
        chips: ["CBT", "125cc", "L-plates"],
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
    body: "Your UK provisional covers you to take a CBT. One day of training and you can ride a 50cc on the road with L-plates.",
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
      "Ride up to 125cc (11kW) with L-plates",
      "Valid for 2 years — then renew or take a full licence",
    ],
  },
  G: {
    id: "G",
    cta: "cbt",
    title: "You're ready to book your CBT",
    body: "A CBT is your entry point — it acts like a provisional for motorcycles and lets you ride a 125cc straight after.",
    bullets: [
      "1-day CBT course, bike and fuel included",
      "Ride up to 125cc (11kW) with L-plates",
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
      "Valid for 2 years on a 125cc with L-plates",
    ],
  },
  K: {
    id: "K",
    cta: "cbt",
    title: "You're ready to book your CBT",
    body: "A CBT is your entry point — it acts like a provisional for motorcycles and gets you on a 125cc, with the A2 licence as your next step.",
    bullets: [
      "1-day CBT course, bike and fuel included",
      "Ride up to 125cc (11kW) with L-plates",
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
      "Valid for 2 years on a 125cc with L-plates",
    ],
  },
  O: {
    id: "O",
    cta: "cbt",
    title: "You're ready to book your CBT",
    body: "A CBT is your starting point — it acts like a provisional for motorcycles. At 24+ you can also work towards a full A licence with no power restrictions.",
    bullets: [
      "1-day CBT course, bike and fuel included",
      "Ride up to 125cc (11kW) with L-plates",
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

// --- Journey stages (the visual roadmap shown on the result screen) ---
type JourneyStatus = "done" | "now" | "locked";
type JourneyStage = {
  key: string;
  title: string;
  description: string;
  status: JourneyStatus;
  icon: "licence" | "cbt" | "bike" | "fullLicence";
  blockedBy?: string;
};

function journeyFor(
  age: AgeBand,
  licence: Licence,
  aspirations: Aspirations | null,
): JourneyStage[] {
  const stages: JourneyStage[] = [];
  const cap = eligibilityFor(age);

  // --- Stage 1: UK provisional licence ---
  const hasUkEntitlement = licence === "uk-provisional" || licence === "uk-driving";
  if (licence === "uk-driving") {
    stages.push({
      key: "licence",
      title: "UK driving licence",
      description: "Your full UK car licence covers the provisional entitlement you need to train.",
      status: "done",
      icon: "licence",
    });
  } else if (licence === "uk-provisional") {
    stages.push({
      key: "licence",
      title: "UK provisional licence",
      description: "You already have the provisional entitlement needed to book a CBT.",
      status: "done",
      icon: "licence",
    });
  } else if (licence === "non-uk") {
    stages.push({
      key: "licence",
      title: "Exchange your non-UK licence",
      description: "You need to swap your overseas licence for a UK one before you can train. Check the rules for your country on GOV.UK.",
      status: "now",
      icon: "licence",
    });
  } else {
    stages.push({
      key: "licence",
      title: "Get a UK provisional licence",
      description: "Apply via GOV.UK — usually a couple of weeks. You can't book any motorcycle training without it.",
      status: "now",
      icon: "licence",
    });
  }

  // --- Stage 2: CBT ---
  const cbtStatus: JourneyStatus = hasUkEntitlement ? "now" : "locked";
  stages.push({
    key: "cbt",
    title: "Compulsory Basic Training (CBT)",
    description:
      age === "16"
        ? "One day of training. Lets you ride a 50cc moped on the road with L-plates — no passengers, no motorways. Valid 2 years. Required before any A1, A2 or full A licence."
        : "One day of training. Lets you ride up to 125cc (14.8HP) on the road with L-plates — no passengers, no motorways. Valid 2 years. Required before any A1, A2 or full A licence.",
    status: cbtStatus,
    icon: "cbt",
    blockedBy: cbtStatus === "locked" ? "UK provisional licence" : undefined,
  });

  // --- Stage 3: Full licence tiers — only show what's relevant to aspirations ---
  const wantsBigger =
    aspirations &&
    BIKE_RANK[aspirations.bikeSize] > BIKE_RANK[cap.maxBikeNow];
  const wantsPassenger = aspirations?.passenger === "yes";
  const wantsMotorways = aspirations?.motorways === "yes";
  const wantsFullLicence =
    !aspirations || wantsBigger || wantsPassenger || wantsMotorways;

  if (wantsFullLicence) {
    const target = aspirations?.bikeSize ?? "midweight";

    // Motorcycle theory test — required before any A1/A2/A licence
    stages.push({
      key: "theory",
      title: "Motorcycle theory test",
      description:
        "A separate motorcycle theory test (multiple choice + hazard perception). You must pass this before booking Mod 1 / Mod 2 for any A1, A2 or full A licence.",
      status: "locked",
      icon: "fullLicence",
      blockedBy: hasUkEntitlement ? "Pass your CBT first" : "Get your UK provisional first",
    });


    if (age === "16") {
      stages.push({
        key: "a1",
        title: "Restricted A1 licence (from 17)",
        description: "125cc / 14.8HP. No L-plates, passengers allowed, motorways allowed. Needs motorcycle theory + Mod 1 + Mod 2.",
        status: "locked",
        icon: "fullLicence",
        blockedBy: "Turn 17 and pass your CBT first",
      });
    } else if (age === "17-18") {
      stages.push({
        key: "a1",
        title: "Restricted A1 licence",
        description: "125cc / 14.8HP. No L-plates, passengers allowed, motorways allowed. Needs motorcycle theory + Mod 1 + Mod 2.",
        status: "locked",
        icon: "fullLicence",
        blockedBy: "Pass your CBT first",
      });
      if (BIKE_RANK[target] >= BIKE_RANK["midweight"]) {
        stages.push({
          key: "a2",
          title: "Restricted A2 licence (from 19)",
          description: "Medium motorcycle — no engine cap, restricted to 47HP. No L-plates, passengers and motorways allowed.",
          status: "locked",
          icon: "fullLicence",
          blockedBy: "Turn 19 and pass your CBT first",
        });
      }
    } else if (age === "19-23") {
      stages.push({
        key: "a2",
        title: "Restricted A2 licence",
        description: "Medium motorcycle — no engine cap, restricted to 47HP. No L-plates, passengers and motorways allowed. Needs motorcycle theory + Mod 1 + Mod 2.",
        status: "locked",
        icon: "fullLicence",
        blockedBy: "Pass your CBT first",
      });
      if (target === "unrestricted") {
        stages.push({
          key: "a",
          title: "Full A licence (from 24 direct, or 21 with 2 years on A2)",
          description: "Any bike, any power — no restrictions on engine size or HP. No L-plates, passengers and motorways allowed.",
          status: "locked",
          icon: "fullLicence",
          blockedBy: "Turn 24, or hold A2 for 2 years (from 21)",
        });
      }
    } else if (age === "24+") {
      stages.push({
        key: "a",
        title: "Full A licence (Direct Access)",
        description: "Any bike, any power — no restrictions. No L-plates, passengers and motorways allowed. Needs motorcycle theory + Mod 1 + Mod 2.",
        status: "locked",
        icon: "fullLicence",
        blockedBy: "Pass your CBT first",
      });
    }
  }

  return stages;
}

// Capture form sits between the licence question and the eligibility summary.
type Stage = "intro" | "age" | "licence" | "capture" | "eligibility" | "bikeSize" | "passenger" | "motorways" | "result";

const STAGE_ORDER: Stage[] = ["intro", "age", "licence", "capture", "eligibility", "bikeSize", "passenger", "motorways", "result"];

// --- HubSpot Forms API plumbing ---------------------------------------------

const HUBSPOT_PORTAL_ID = "4630320";
const HUBSPOT_FORM_GUID = "0a690e83-b872-4202-9f5d-86e7acd632fe";
const HUBSPOT_SUBMIT_URL = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`;

type HsField = { name: string; value: string };

async function submitToHubspot(fields: HsField[]): Promise<void> {
  const res = await fetch(HUBSPOT_SUBMIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields,
      context: {
        pageUri: typeof window !== "undefined" ? window.location.href : "",
        pageName: "RideTo Licence Finder",
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`HubSpot Forms API ${res.status}: ${await res.text()}`);
  }
}

async function submitCaptureToHubspot(
  values: { email: string },
  age: AgeBand,
  licence: Licence,
): Promise<void> {
  await submitToHubspot([
    { name: "email", value: values.email },
    { name: "getting_started_age_bracket", value: age },
    { name: "current_licence", value: licence },
  ]);
}

async function submitPersonalisationToHubspot(
  email: string,
  answers: {
    bikeSize: BikeSize | null;
    passenger: YesNoUnsure | null;
    motorways: YesNoUnsure | null;
  },
): Promise<void> {
  const fields: HsField[] = [{ name: "email", value: email }];
  if (answers.bikeSize)
    fields.push({ name: "getting_started_bike_size_want", value: answers.bikeSize });
  if (answers.passenger)
    fields.push({ name: "getting_started_passengers_need", value: answers.passenger });
  if (answers.motorways)
    fields.push({ name: "getting_started_motorways", value: answers.motorways });
  // Only fire if we have something to update beyond the email.
  if (fields.length > 1) {
    await submitToHubspot(fields);
  }
}

// ----------------------------------------------------------------------------

type CourseFinderProps = {
  /** Controlled open state. If provided, parent owns open/close. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the built-in "Find my course" trigger button (for embed/external trigger). */
  hideTrigger?: boolean;
};

export function CourseFinder({
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: CourseFinderProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const [stage, setStage] = useState<Stage>("intro");
  const [age, setAge] = useState<AgeBand | null>(null);
  const [licence, setLicence] = useState<Licence | null>(null);
  const [bikeSize, setBikeSize] = useState<BikeSize | null>(null);
  const [passenger, setPassenger] = useState<YesNoUnsure | null>(null);
  const [motorways, setMotorways] = useState<YesNoUnsure | null>(null);
  const [contact, setContact] = useState<{
    email: string;
  } | null>(null);

  const reset = () => {
    setStage("intro");
    setAge(null);
    setLicence(null);
    setBikeSize(null);
    setPassenger(null);
    setMotorways(null);
    setContact(null);
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
    setStage("capture");
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
    // Fire-and-forget update of personalisation answers — user moves
    // straight to the recommendation, no waiting, no loader.
    if (contact) {
      void submitPersonalisationToHubspot(contact.email, {
        bikeSize,
        passenger,
        motorways: value,
      }).catch((err) => {
        console.error("HubSpot personalisation update failed", err);
      });
    }
    setStage("result");
  };

  const ending: Ending | null =
    age && licence ? ENDINGS[ENDING_MAP[`${age}|${licence}`]] : null;

  // Outcome CTA — closes the dialog, and for provisional/convert also
  // opens the relevant GOV.UK page in a new tab.
  const handleCtaClick = () => {
    if (!ending) return;
    const url = CTA_URL[ending.cta];
    if (url && typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setOpen(false);
  };

  const progress = ((STAGE_ORDER.indexOf(stage) + 1) / STAGE_ORDER.length) * 100;

  const eligibility = age ? eligibilityFor(age) : null;

  const aspirations: Aspirations | null =
    bikeSize && passenger && motorways
      ? { bikeSize, passenger, motorways }
      : null;

  const roadmap =
    age && aspirations ? roadmapFor(age, aspirations) : [];

  const journey =
    age && licence ? journeyFor(age, licence, aspirations) : [];

  // Module labels shown above the question
  const moduleLabel =
    stage === "age" || stage === "licence"
      ? "Step 1 of 2 · Eligibility"
      : stage === "capture"
      ? "Almost there"
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
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button size="lg" className="gap-2">
            <Sparkles className="size-4" />
            Find my course
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="overflow-y-auto px-6 py-6">
        <DialogHeader className="sr-only">
          <DialogTitle>Licence Finder</DialogTitle>
          <DialogDescription>
            A few quick questions and we'll point you to the right training.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1 space-y-2">
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

        {stage === "capture" && age && licence && (
          <LeadCapturePanel
            age={age}
            licence={licence}
            onSubmitted={(values) => {
              setContact(values);
              setStage("eligibility");
            }}
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
            onCtaClick={handleCtaClick}
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
            question="Will you ever need to carry a passenger on your bike?"
            help="Not all licence types allow you to have a pillion."
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
            question="Do you want to ride on motorways?"
            help="Motorways are often the quickest route somewhere, but not all licence types allow you to ride on them."
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
            journey={journey}
            onCtaClick={handleCtaClick}
            onBack={back}
            onReset={reset}
          />
        )}
        </div>
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

// --- Lead-capture panel (first HubSpot submission) --------------------------

const captureSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

type CaptureValues = z.infer<typeof captureSchema>;

function LeadCapturePanel({
  age,
  licence,
  onSubmitted,
  onBack,
  onReset,
}: {
  age: AgeBand;
  licence: Licence;
  onSubmitted: (values: CaptureValues) => void;
  onBack: () => void;
  onReset: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CaptureValues>({
    resolver: zodResolver(captureSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await submitCaptureToHubspot(values, age, licence);
    } catch (err) {
      // Per spec: log but never block the user.
      console.error("HubSpot lead capture failed", err);
    }
    onSubmitted(values);
  });

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          Where should we send your recommendation?
        </h2>
        <p className="text-sm text-muted-foreground">
          We'll save your answers so you can pick up where you left off.
        </p>
      </div>

      <div className="space-y-3">

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            disabled={isSubmitting}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={isSubmitting}
            className="gap-1"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={isSubmitting}
            className="gap-1"
          >
            <RotateCcw className="size-4" />
            Start again
          </Button>
        </div>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Saving…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------

function EligibilityPanel({
  eligibility,
  ending,
  onContinue,
  onSkip,
  onCtaClick,
  onBack,
  onReset,
}: {
  eligibility: EligibilityCap;
  ending: Ending;
  onContinue: () => void;
  onSkip: () => void;
  onCtaClick: () => void;
  onBack: () => void;
  onReset: () => void;
}) {
  const isBlocked = ending.cta !== "cbt";
  const blockerHeading =
    ending.cta === "provisional"
      ? "You'll need a UK provisional first"
      : "Your non-UK licence won't cover you here";
  const blockerIntro =
    ending.cta === "provisional"
      ? "We can't book you onto any motorcycle training until you hold a UK provisional driving licence."
      : "A non-UK licence doesn't give you motorcycle entitlement in the UK, so you can't book any training yet. You can easily convert your licence using the gov.uk tool.";
  const blockerSteps =
    ending.cta === "provisional"
      ? [
          "Apply for a UK provisional licence on GOV.UK (you'll need ID and proof of address)",
          "It usually arrives within 1–3 weeks",
          "Once it's in your hand, come back and book your CBT",
        ]
      : [];

  return (
    <div className="space-y-5 py-2">
      {isBlocked && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            Before you can book
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-destructive">
            {blockerHeading}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/80">
            {blockerIntro}
          </p>
          {blockerSteps.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm leading-relaxed text-foreground/80">
              {blockerSteps.map((step) => (
                <li key={step} className="flex gap-2">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-destructive/60" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          )}
          {ending.cta === "convert" && (
            <div className="mt-4">
              <Button variant="outline" onClick={onCtaClick} className="w-full gap-2 sm:w-auto">
                Convert licence
                <ArrowUpRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {ending.cta !== "convert" && (
      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 shrink-0 text-primary" />
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {isBlocked ? "Here's what you could book" : "Here's what you can do"}
          </p>
        </div>
        <p className="mt-2 text-base leading-relaxed">
          {ending.cta === "cbt" ? (
            <>
              You're in the right place — <strong>you're ready to book your CBT</strong>. Finish your booking to ride up to a 125cc.
            </>
          ) : (
            eligibility.summary
          )}
        </p>
        <div className="mt-4">
          {ending.cta === "cbt" ? (
            <Button onClick={onCtaClick} className="w-full sm:w-auto">
              Continue with booking
            </Button>
          ) : (
            <Button variant="outline" onClick={onCtaClick} className="w-full gap-2 sm:w-auto">
              Apply for provisional
              <ArrowUpRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
      )}


      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
          Want a fully refined plan?
        </p>
        <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
          Three more questions about the bike you actually want to ride and we'll match you to the right course — and show you the roadmap if you're aiming higher than your age allows today.
        </p>
        <div className="mt-3">
          <Button
            onClick={onContinue}
            variant={ending.cta === "cbt" ? "outline" : "default"}
            className="w-full gap-2 sm:w-auto"
          >
            <Compass className="size-4" />
            Yes, refine for me
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
  journey,
  onCtaClick,
  onBack,
  onReset,
}: {
  ending: Ending;
  aspirations: Aspirations | null;
  eligibility: EligibilityCap;
  roadmap: string[];
  journey: JourneyStage[];
  onCtaClick: () => void;
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
      {aspirations && hasGap && (
        <div className="rounded-lg border border-accent/40 bg-accent/10 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
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

      {journey.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-secondary" />
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Your journey, step by step
            </p>
          </div>
          <JourneyStages stages={journey} />
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
        <Button size="lg" className="sm:min-w-44" onClick={onCtaClick}>
          {CTA_LABEL[ending.cta]}
        </Button>
      </div>
    </div>
  );
}

const JOURNEY_ICON: Record<JourneyStage["icon"], typeof IdCard> = {
  licence: IdCard,
  cbt: GraduationCap,
  bike: Bike,
  fullLicence: GraduationCap,
};

function JourneyStages({ stages }: { stages: JourneyStage[] }) {
  return (
    <ol className="mt-4 space-y-3">
      {stages.map((s, i) => {
        const Icon = JOURNEY_ICON[s.icon];
        const isDone = s.status === "done";
        const isNow = s.status === "now";
        const isLocked = s.status === "locked";

        const containerClasses = isNow
          ? "border-primary/40 bg-primary/5"
          : isDone
          ? "border-border bg-muted/40"
          : "border-dashed border-border bg-background opacity-75";

        const badge = isDone ? (
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="size-4" />
          </span>
        ) : isNow ? (
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            {i + 1}
          </span>
        ) : (
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
            <Lock className="size-3.5" />
          </span>
        );

        const statusPill = isDone ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary" style={{ fontFamily: "var(--font-body)" }}>
            <CheckCircle2 className="size-3" /> Done
          </span>
        ) : isNow ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground" style={{ fontFamily: "var(--font-body)" }}>
            <Circle className="size-2 fill-current" /> Do this now
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
            <Lock className="size-3" /> Locked
          </span>
        );

        return (
          <li key={s.key} className="relative">
            {i < stages.length - 1 && (
              <span
                aria-hidden
                className={`absolute left-[26px] top-[44px] h-[calc(100%-20px)] w-px ${
                  isDone ? "bg-primary/30" : "bg-border"
                }`}
              />
            )}
            <div className={`flex gap-3 rounded-lg border p-3 ${containerClasses}`}>
              {badge}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Icon className={`size-4 shrink-0 ${isLocked ? "text-muted-foreground" : "text-primary"}`} />
                  <h4 className={`text-sm font-semibold ${isLocked ? "text-muted-foreground" : ""}`}>
                    Step {i + 1}: {s.title}
                  </h4>
                  {statusPill}
                </div>
                <p className={`mt-1 text-xs leading-relaxed ${isLocked ? "text-muted-foreground" : "text-foreground/80"}`} style={{ fontFamily: "var(--font-body)" }}>
                  {s.description}
                </p>
                {isLocked && s.blockedBy && (
                  <p className="mt-1.5 text-[11px] font-medium text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                    🔒 Unlocks after: {s.blockedBy}
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
