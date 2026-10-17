import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Droplets,
  ExternalLink,
  Flower2,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Sprout,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import heroImage from "@/assets/bodywise-clarity-stilllife.jpg";
import {
  BODYWISE_CATALOGUE,
  CONCERNS,
  SAFETY_NOTICE,
  VERIFIED_ON,
  getProductMatches,
  getUnavailableRelatedProducts,
  getWithheldProducts,
  requiresAgeGroup,
  requiresBodyAcneSeverity,
  requiresUnderarmPigmentationSeverity,
  type AgeGroup,
  type ApplicationArea,
  type BodyAcneSeverity,
  type BreakoutPattern,
  type ConcernId,
  type FinderAnswers,
  type PigmentationLocation,
  type ProductMatch,
  type SkinProfile,
  type UnderarmPigmentationSeverity,
} from "@/lib/bodywise-catalogue";

// Page metadata (title, description, og tags) is inherited from __root.tsx.
export const Route = createFileRoute("/")({
  component: Index,
  errorComponent: () => (
    <Shell>
      <ErrorPanel onRestart={() => window.location.reload()} />
    </Shell>
  ),
});

type StepId =
  | "welcome"
  | "concerns"
  | "breakoutArea"
  | "skinProfile"
  | "breakoutPattern"
  | "bodyAcneSeverity"
  | "pigmentationLocation"
  | "underarmSeverity"
  | "ageGroup"
  | "results";

const CONCERN_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  droplets: Droplets,
  sun: Sun,
  flower: Flower2,
  sprout: Sprout,
  help: CircleHelp,
};

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

const AREA_OPTIONS: Option<ApplicationArea>[] = [
  { value: "face", label: "Face" },
  { value: "body", label: "Body" },
  { value: "both", label: "Face and body" },
  { value: "unsure", label: "Not sure" },
];
const SKIN_OPTIONS: Option<SkinProfile>[] = [
  { value: "oily", label: "Oily" },
  { value: "dry-combination", label: "Dry or combination" },
  { value: "unsure", label: "Not sure" },
];
const PATTERN_OPTIONS: Option<BreakoutPattern>[] = [
  { value: "mild-occasional", label: "Mild and occasional", hint: "A few spots now and then" },
  {
    value: "persistent-severe",
    label: "Persistent or severe",
    hint: "Frequent, painful, or not settling",
  },
  { value: "unsure", label: "Not sure" },
];
const PIGMENTATION_OPTIONS: Option<PigmentationLocation>[] = [
  { value: "body-folds", label: "Body folds", hint: "Elbows, knees, back of neck, thighs" },
  { value: "underarms", label: "Underarms" },
  { value: "face", label: "Face" },
  { value: "elsewhere", label: "Somewhere else" },
  { value: "unsure", label: "Not sure" },
];

const BODY_ACNE_OPTIONS: Option<BodyAcneSeverity>[] = [
  { value: "mild", label: "Mild body acne" },
  { value: "severe-or-marks", label: "Severe body acne or acne marks" },
  { value: "unsure", label: "Not sure" },
];
const UNDERARM_OPTIONS: Option<UnderarmPigmentationSeverity>[] = [
  { value: "mild", label: "About 1 shade darker", hint: "Than the rest of your skin tone" },
  { value: "moderate", label: "About 2 shades darker" },
  { value: "severe", label: "3 or more shades darker" },
  { value: "unsure", label: "Not sure" },
];
const AGE_OPTIONS: Option<AgeGroup>[] = [
  { value: "under-13", label: "Under 13" },
  { value: "13-17", label: "13 to 17" },
  { value: "18-plus", label: "18 or over" },
  { value: "unsure", label: "Prefer not to say" },
];

const labelOf = <T extends string>(options: Option<T>[], value: T | undefined) =>
  options.find((o) => o.value === value)?.label;

const faceRelevant = (area: ApplicationArea | undefined) => area === "face" || area === "both";

/** The questions that apply to the current answers, in order. */
function questionSteps(answers: FinderAnswers): StepId[] {
  const n = normaliseAnswers(answers);
  const steps: StepId[] = ["concerns"];
  if (n.concerns.includes("acne")) {
    steps.push("breakoutArea");
    if (faceRelevant(n.breakoutArea)) steps.push("skinProfile", "breakoutPattern");
    if (requiresBodyAcneSeverity(n)) steps.push("bodyAcneSeverity");
  }
  if (n.concerns.includes("pigmentation")) {
    steps.push("pigmentationLocation");
    if (requiresUnderarmPigmentationSeverity(n)) steps.push("underarmSeverity");
  }
  if (requiresAgeGroup(n)) steps.push("ageGroup");
  return steps;
}

/** Drops answers to questions that no longer apply, so stale edits can't affect matching. */
function normaliseAnswers(answers: FinderAnswers): FinderAnswers {
  const out: FinderAnswers = { concerns: answers.concerns };
  if (answers.concerns.includes("acne")) {
    if (answers.breakoutArea) out.breakoutArea = answers.breakoutArea;
    if (faceRelevant(answers.breakoutArea)) {
      if (answers.skinProfile) out.skinProfile = answers.skinProfile;
      if (answers.breakoutPattern) out.breakoutPattern = answers.breakoutPattern;
    }
  } else if (answers.concerns.includes("oily-skin")) {
    // Oily skin is a face-care concern in the catalogue, so no separate question is asked.
    out.breakoutArea = "face";
  }
  if (answers.concerns.includes("pigmentation") && answers.pigmentationLocation) {
    out.pigmentationLocation = answers.pigmentationLocation;
  }
  // Severity and age are only kept where an official product page draws that distinction.
  if (requiresBodyAcneSeverity(out) && answers.bodyAcneSeverity) {
    out.bodyAcneSeverity = answers.bodyAcneSeverity;
  }
  if (requiresUnderarmPigmentationSeverity(out) && answers.underarmPigmentationSeverity) {
    out.underarmPigmentationSeverity = answers.underarmPigmentationSeverity;
  }
  if (requiresAgeGroup(out) && answers.ageGroup) out.ageGroup = answers.ageGroup;
  return out;
}

const concernLabel = (id: ConcernId) => CONCERNS.find((c) => c.id === id)?.label ?? id;

function Index() {
  const [step, setStep] = useState<StepId>("welcome");
  const [answers, setAnswers] = useState<FinderAnswers>({ concerns: [] });
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Move focus to the new step's heading so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    headingRef.current?.focus();
  }, [step]);

  const questions = questionSteps(answers);
  const flow: StepId[] = ["welcome", ...questions, "results"];
  const position = flow.indexOf(step);

  const goBack = () => setStep(flow[Math.max(0, position - 1)] ?? "welcome");
  const goNext = (next: FinderAnswers = answers) => {
    const nextFlow: StepId[] = ["welcome", ...questionSteps(next), "results"];
    setStep(nextFlow[Math.min(nextFlow.length - 1, nextFlow.indexOf(step) + 1)] ?? "results");
  };
  const restart = () => {
    setAnswers({ concerns: [] });
    setCompareIds([]);
    setStep("welcome");
  };
  const update = (patch: Partial<FinderAnswers>) => setAnswers((a) => ({ ...a, ...patch }));

  const progress = step === "welcome" ? 0 : Math.round((position / (flow.length - 1)) * 100);

  return (
    <Shell onRestart={step === "welcome" ? undefined : restart}>
      {step !== "welcome" && (
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>{step === "results" ? "Your results" : `Question ${position}`}</span>
          </div>
          <div
            role="progressbar"
            aria-label="Questionnaire progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-2 overflow-hidden rounded-full bg-secondary"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {step === "welcome" && <Welcome headingRef={headingRef} onStart={() => goNext()} />}

      {step === "concerns" && (
        <Question
          headingRef={headingRef}
          title="What would you like to explore?"
          description="Choose one or more. We only ask what we need to match products — no personal details."
          canContinue={answers.concerns.length > 0}
          onBack={goBack}
          onContinue={() => goNext()}
        >
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">Concerns</legend>
            {CONCERNS.map((concern) => {
              const Icon = CONCERN_ICONS[concern.icon] ?? CircleHelp;
              const checked = answers.concerns.includes(concern.id);
              return (
                <ChoiceCard
                  key={concern.id}
                  type="checkbox"
                  name="concerns"
                  checked={checked}
                  onChange={() =>
                    update({
                      concerns: checked
                        ? answers.concerns.filter((c) => c !== concern.id)
                        : [...answers.concerns, concern.id],
                    })
                  }
                  icon={<Icon className="size-5" aria-hidden />}
                  label={concern.label}
                  hint={concern.note}
                />
              );
            })}
          </fieldset>
        </Question>
      )}

      {step === "breakoutArea" && (
        <RadioQuestion
          headingRef={headingRef}
          title="Where do you get breakouts?"
          options={AREA_OPTIONS}
          value={answers.breakoutArea}
          onSelect={(breakoutArea) => update({ breakoutArea })}
          onBack={goBack}
          onContinue={() => goNext()}
        />
      )}

      {step === "skinProfile" && (
        <RadioQuestion
          headingRef={headingRef}
          title="How would you describe your face skin?"
          description="This only helps us pick the cleanser the brand lists for that skin type."
          options={SKIN_OPTIONS}
          value={answers.skinProfile}
          onSelect={(skinProfile) => update({ skinProfile })}
          onBack={goBack}
          onContinue={() => goNext()}
        />
      )}

      {step === "breakoutPattern" && (
        <RadioQuestion
          headingRef={headingRef}
          title="How would you describe your face breakouts?"
          description="If they are persistent, painful or severe, a dermatologist or doctor is the right person to ask."
          options={PATTERN_OPTIONS}
          value={answers.breakoutPattern}
          onSelect={(breakoutPattern) => update({ breakoutPattern })}
          onBack={goBack}
          onContinue={() => goNext()}
        />
      )}

      {step === "pigmentationLocation" && (
        <RadioQuestion
          headingRef={headingRef}
          title="Where is the uneven-looking tone?"
          options={PIGMENTATION_OPTIONS}
          value={answers.pigmentationLocation}
          onSelect={(pigmentationLocation) => update({ pigmentationLocation })}
          onBack={goBack}
          onContinue={() => goNext()}
        />
      )}

      {step === "bodyAcneSeverity" && (
        <RadioQuestion
          headingRef={headingRef}
          title="How would you describe your body breakouts?"
          description="The brand’s pages list different products for mild body acne and for severe body acne or acne marks."
          options={BODY_ACNE_OPTIONS}
          value={answers.bodyAcneSeverity}
          onSelect={(bodyAcneSeverity) => update({ bodyAcneSeverity })}
          onBack={goBack}
          onContinue={() => goNext()}
        />
      )}

      {step === "underarmSeverity" && (
        <RadioQuestion
          headingRef={headingRef}
          title="How dark is your underarm skin?"
          description="The brand’s pages group underarm products by how many shades darker the skin is than your skin tone."
          options={UNDERARM_OPTIONS}
          value={answers.underarmPigmentationSeverity}
          onSelect={(underarmPigmentationSeverity) => update({ underarmPigmentationSeverity })}
          onBack={goBack}
          onContinue={() => goNext()}
        />
      )}

      {step === "ageGroup" && (
        <RadioQuestion
          headingRef={headingRef}
          title="Which age group are you in?"
          description="Some product pages state a minimum age. We don’t ask for a date of birth, and your answer isn’t stored."
          options={AGE_OPTIONS}
          value={answers.ageGroup}
          onSelect={(ageGroup) => update({ ageGroup })}
          onBack={goBack}
          onContinue={() => goNext()}
        />
      )}

      {step === "results" && (
        <Results
          headingRef={headingRef}
          answers={normaliseAnswers(answers)}
          compareIds={compareIds}
          setCompareIds={setCompareIds}
          onBack={goBack}
          onEdit={setStep}
          onRestart={restart}
        />
      )}
    </Shell>
  );
}

function Shell({
  children,
  onRestart,
}: {
  children: ReactNode;
  onRestart?: (() => void) | undefined;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-hidden
          >
            <Sprout className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="font-semibold">Bodywise Clarity</p>
            <p className="text-xs text-muted-foreground">Independent guide · not official</p>
          </div>
        </div>
        {onRestart && (
          <button type="button" onClick={onRestart} className={ghostButton}>
            <RotateCcw className="size-4" aria-hidden /> Restart
          </button>
        )}
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 pb-16 pt-4 sm:px-6">
        {children}
      </main>
      <footer className="border-t bg-muted/60">
        <p className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
          Bodywise Clarity is an independent educational tool. It is not an official Be Bodywise
          service and is not affiliated with or endorsed by the brand. It does not diagnose or treat
          medical conditions. Product details come from the brand’s own product pages, last checked{" "}
          {VERIFIED_ON}.
        </p>
      </footer>
    </div>
  );
}

const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-input bg-card px-6 py-2.5 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const ghostButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Welcome({
  headingRef,
  onStart,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onStart: () => void;
}) {
  return (
    <section className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
      <div>
        <p className="mb-3 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Independent · No sign-up · Nothing is stored
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-4xl font-semibold leading-tight tracking-tight outline-none sm:text-5xl"
        >
          Find your way around Be Bodywise products
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Bodywise Clarity is an independent product discovery and education tool. Tell us what you
          would like to explore and we’ll show Be Bodywise products whose official pages list that
          use — with the ingredients, directions, precautions and limits that are verified.
        </p>
        <div className="mt-6 rounded-2xl border bg-card p-4 text-sm" role="note">
          <p className="font-medium">Please note</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>This is not an official Be Bodywise service.</li>
            <li>It does not diagnose or treat medical conditions.</li>
            <li>
              Results reflect what the brand lists, not a promise of how your skin will respond.
            </li>
          </ul>
        </div>
        <button type="button" onClick={onStart} className={`${primaryButton} mt-8`}>
          Start <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
      <img
        src={heroImage}
        alt="Unbranded white skincare bottles, a dropper and a jar on a stone ledge beside green leaves"
        width={1440}
        height={1120}
        className="order-first w-full rounded-3xl object-cover shadow-sm md:order-last"
      />
    </section>
  );
}

function Question({
  headingRef,
  title,
  description,
  children,
  canContinue,
  onBack,
  onContinue,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <section className="mx-auto max-w-2xl">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl font-semibold tracking-tight outline-none"
      >
        {title}
      </h1>
      {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      <div className="mt-6">{children}</div>
      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className={secondaryButton}>
          <ArrowLeft className="size-4" aria-hidden /> Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className={primaryButton}
        >
          Continue <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}

function RadioQuestion<T extends string>({
  headingRef,
  title,
  description,
  options,
  value,
  onSelect,
  onBack,
  onContinue,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  title: string;
  description?: string | undefined;
  options: Option<T>[];
  value: T | undefined;
  onSelect: (value: T) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <Question
      headingRef={headingRef}
      title={title}
      description={description}
      canContinue={value !== undefined}
      onBack={onBack}
      onContinue={onContinue}
    >
      <fieldset className="grid gap-3">
        <legend className="sr-only">{title}</legend>
        {options.map((option) => (
          <ChoiceCard
            key={option.value}
            type="radio"
            name={title}
            checked={value === option.value}
            onChange={() => onSelect(option.value)}
            label={option.label}
            hint={option.hint}
          />
        ))}
      </fieldset>
    </Question>
  );
}

function ChoiceCard({
  type,
  name,
  checked,
  onChange,
  icon,
  label,
  hint,
}: {
  type: "checkbox" | "radio";
  name: string;
  checked: boolean;
  onChange: () => void;
  icon?: ReactNode;
  label: string;
  hint?: string | undefined;
}) {
  return (
    <label className="relative block cursor-pointer">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className="flex min-h-16 items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:bg-secondary/60 peer-checked:border-primary peer-checked:bg-secondary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
        {icon && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
            {icon}
          </span>
        )}
        <span className="flex-1">
          <span className="block font-medium">{label}</span>
          {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
        </span>
        <span
          aria-hidden
          className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
            checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
          }`}
        >
          {checked && <Check className="size-4" />}
        </span>
      </span>
    </label>
  );
}

function summarise(answers: FinderAnswers): { step: StepId; label: string; value: string }[] {
  const rows: { step: StepId; label: string; value: string }[] = [
    {
      step: "concerns",
      label: "Concerns",
      value: answers.concerns.map(concernLabel).join(", "),
    },
  ];
  if (answers.concerns.includes("acne")) {
    rows.push({
      step: "breakoutArea",
      label: "Breakout area",
      value: labelOf(AREA_OPTIONS, answers.breakoutArea) ?? "—",
    });
    if (faceRelevant(answers.breakoutArea)) {
      rows.push(
        {
          step: "skinProfile",
          label: "Face skin",
          value: labelOf(SKIN_OPTIONS, answers.skinProfile) ?? "—",
        },
        {
          step: "breakoutPattern",
          label: "Face breakouts",
          value: labelOf(PATTERN_OPTIONS, answers.breakoutPattern) ?? "—",
        },
      );
    }
  }
  if (requiresBodyAcneSeverity(answers)) {
    rows.push({
      step: "bodyAcneSeverity",
      label: "Body breakouts",
      value: labelOf(BODY_ACNE_OPTIONS, answers.bodyAcneSeverity) ?? "—",
    });
  }
  if (answers.concerns.includes("pigmentation")) {
    rows.push({
      step: "pigmentationLocation",
      label: "Uneven-looking tone",
      value: labelOf(PIGMENTATION_OPTIONS, answers.pigmentationLocation) ?? "—",
    });
  }
  if (requiresUnderarmPigmentationSeverity(answers)) {
    rows.push({
      step: "underarmSeverity",
      label: "Underarm skin",
      value: labelOf(UNDERARM_OPTIONS, answers.underarmPigmentationSeverity) ?? "—",
    });
  }
  if (requiresAgeGroup(answers)) {
    rows.push({
      step: "ageGroup",
      label: "Age group",
      value: labelOf(AGE_OPTIONS, answers.ageGroup) ?? "—",
    });
  }
  return rows;
}

function Results({
  headingRef,
  answers,
  compareIds,
  setCompareIds,
  onBack,
  onEdit,
  onRestart,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  answers: FinderAnswers;
  compareIds: string[];
  setCompareIds: (ids: string[]) => void;
  onBack: () => void;
  onEdit: (step: StepId) => void;
  onRestart: () => void;
}) {
  const result = useMemo(() => {
    try {
      return {
        matches: getProductMatches(BODYWISE_CATALOGUE, answers),
        unavailable: getUnavailableRelatedProducts(BODYWISE_CATALOGUE, answers),
        withheld: getWithheldProducts(BODYWISE_CATALOGUE, answers),
        error: false,
      };
    } catch {
      return { matches: [], unavailable: [], withheld: [], error: true };
    }
  }, [answers]);

  if (result.error) return <ErrorPanel onRestart={onRestart} />;

  const { matches, unavailable, withheld } = result;
  const selected = matches.filter((m) => compareIds.includes(m.product.id));
  const toggleCompare = (id: string) =>
    setCompareIds(
      compareIds.includes(id) ? compareIds.filter((c) => c !== id) : [...compareIds, id],
    );

  return (
    <section>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl font-semibold tracking-tight outline-none sm:text-4xl"
      >
        {matches.length > 0
          ? `${matches.length} product${matches.length === 1 ? "" : "s"} listed for what you told us`
          : "No matching products right now"}
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {matches.length > 0
          ? "These matches follow what each official product page lists. They are not a diagnosis or a promise of results."
          : "That’s a perfectly fine outcome — it’s better to say so than to suggest something that doesn’t fit."}
      </p>

      <div className="mt-6 rounded-2xl border bg-card p-4">
        <h2 className="text-sm font-semibold">Your answers</h2>
        <ul className="mt-2 divide-y">
          {summarise(answers).map((row) => (
            <li key={row.step} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>
                <span className="text-muted-foreground">{row.label}: </span>
                <span className="font-medium">{row.value}</span>
              </span>
              <button
                type="button"
                onClick={() => onEdit(row.step)}
                className="rounded-full px-3 py-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Edit ${row.label.toLowerCase()}`}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      </div>

      {matches.length > 0 ? (
        <>
          <div className="mt-8 grid gap-6">
            {matches.map((match) => (
              <ProductCard
                key={match.product.id}
                match={match}
                comparing={compareIds.includes(match.product.id)}
                onToggleCompare={() => toggleCompare(match.product.id)}
                canCompare={matches.length > 1}
              />
            ))}
          </div>

          {matches.length > 1 && (
            <div className="mt-8" aria-live="polite">
              {selected.length >= 2 ? (
                <Compare matches={selected} />
              ) : (
                <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                  Tick “Compare” on at least two products to see them side by side.
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <NoMatches answers={answers} />
      )}

      {withheld.length > 0 && (
        <div className="mt-8 rounded-2xl border bg-muted/60 p-5">
          <h2 className="font-semibold">Not matched to your answers</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These products relate to what you selected, but your answers fall outside what the
            official page lists, or we couldn’t confirm them. We’re not suggesting a substitute. A
            pharmacist, doctor or dermatologist can advise on what suits you.
          </p>
          <ul className="mt-3 space-y-3">
            {withheld.map(({ product, issues }) => (
              <li key={product.id} className="rounded-xl bg-card p-4 text-sm">
                <p className="font-medium">{product.name}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
                <SourceLink url={product.sourceUrl} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {unavailable.length > 0 && (
        <div className="mt-8 rounded-2xl border bg-muted/60 p-5">
          <h2 className="font-semibold">Related products we can’t recommend yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The brand lists these for a concern you selected, but the safety information we need has
            not been verified, so they are not recommended here.
          </p>
          <ul className="mt-3 space-y-3">
            {unavailable.map((product) => (
              <li key={product.id} className="rounded-xl bg-card p-4 text-sm">
                <p className="font-medium">{product.name}</p>
                <p className="mt-1">
                  <Badge tone="warn">
                    {product.verificationStatus === "partially-verified"
                      ? "Partially verified"
                      : "Not verified"}
                  </Badge>{" "}
                  Precautions: Information not verified yet.
                </p>
                <SourceLink url={product.sourceUrl} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className="mt-8 flex gap-3 rounded-2xl border border-primary/30 bg-secondary/60 p-5"
        role="note"
      >
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div>
          <h2 className="font-semibold">Safety first</h2>
          <p className="mt-1 text-sm">{SAFETY_NOTICE}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className={secondaryButton}>
          <ArrowLeft className="size-4" aria-hidden /> Back
        </button>
        <button type="button" onClick={onRestart} className={primaryButton}>
          <RotateCcw className="size-4" aria-hidden /> Start again
        </button>
      </div>
    </section>
  );
}

function NoMatches({ answers }: { answers: FinderAnswers }) {
  const hints: string[] = [];
  if (answers.concerns.includes("other") && answers.concerns.length === 1) {
    hints.push(
      "“Something else” isn’t covered by the products we’ve verified so far, so we have nothing to suggest.",
    );
  }
  if (
    answers.breakoutArea === "unsure" ||
    answers.skinProfile === "unsure" ||
    answers.breakoutPattern === "unsure" ||
    answers.pigmentationLocation === "unsure" ||
    answers.bodyAcneSeverity === "unsure" ||
    answers.underarmPigmentationSeverity === "unsure" ||
    answers.ageGroup === "unsure"
  ) {
    hints.push(
      "You answered “Not sure” to at least one question. We only match when an answer lines up with what a product page lists — you can edit your answers above if that changes.",
    );
  }
  if (answers.pigmentationLocation === "face" || answers.pigmentationLocation === "elsewhere") {
    hints.push(
      "The pigmentation products we’ve verified are listed for body folds or underarms, not for the face or other areas.",
    );
  }
  return (
    <div className="mt-8 rounded-2xl border bg-card p-6">
      <h2 className="text-lg font-semibold">What you can do next</h2>
      {hints.length > 0 && (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
        <li>Edit your answers above, or start again with a different concern.</li>
        <li>
          Speak to a pharmacist, dermatologist or doctor — especially if a concern is persistent,
          painful, changing or worrying you.
        </li>
        <li>There’s no need to buy anything. Not finding a fit is a valid result.</li>
      </ul>
    </div>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: "ok" | "warn" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        tone === "ok" ? "bg-secondary text-secondary-foreground" : "bg-amber-100 text-amber-950"
      }`}
    >
      {children}
    </span>
  );
}

function SourceLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      Official product page <ExternalLink className="size-3.5" aria-hidden />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function ProductCard({
  match,
  comparing,
  canCompare,
  onToggleCompare,
}: {
  match: ProductMatch;
  comparing: boolean;
  canCompare: boolean;
  onToggleCompare: () => void;
}) {
  const { product } = match;
  const verified = product.verificationStatus === "verified";
  return (
    <article className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{product.type}</p>
          <h2 className="text-xl font-semibold">{product.name}</h2>
        </div>
        <Badge tone={verified ? "ok" : "warn"}>
          {verified ? `Verified from official page · ${product.verifiedOn}` : "Partially verified"}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {match.matchedConcerns.map((id) => (
          <span key={id} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {concernLabel(id)}
          </span>
        ))}
      </div>

      <Block title="Why it matched">
        <ul className="list-disc space-y-1 pl-5">
          {match.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Block>
      <Block title="What the brand says">
        <p>{product.intendedUse}</p>
        <p className="mt-2">{product.brandGuidance}</p>
      </Block>

      <div className="grid gap-x-8 sm:grid-cols-2">
        <Block title="Key ingredients">
          <ul className="list-disc space-y-1 pl-5">
            {product.ingredients.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </Block>
        <Block title="Directions (brand guidance)">
          <p>{product.directions}</p>
        </Block>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Key ingredients only — check the full ingredient list on the official page, especially if
        you have allergies.
      </p>

      <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">
        <h3 className="font-semibold">Precautions</h3>
        <p className="mt-1">{product.precautions}</p>
      </div>

      <Block title="Limitations">
        <ul className="list-disc space-y-1 pl-5">
          {match.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Block>

      {product.verificationNotes.notConfirmed.length > 0 && (
        <Block title="Not confirmed on the official page">
          <ul className="list-disc space-y-1 pl-5">
            {product.verificationNotes.notConfirmed.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Block>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <SourceLink url={product.sourceUrl} />
        {canCompare && (
          <label className="relative inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={comparing}
              onChange={onToggleCompare}
              className="size-5 accent-[oklch(0.42_0.045_150)]"
            />
            Compare<span className="sr-only"> {product.name}</span>
          </label>
        )}
      </div>
    </article>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5 text-sm">
      <h3 className="mb-1 font-semibold">{title}</h3>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}

function Compare({ matches }: { matches: ProductMatch[] }) {
  const rows: { label: string; render: (m: ProductMatch) => ReactNode }[] = [
    { label: "Type", render: (m) => m.product.type },
    { label: "Why it matched", render: (m) => m.reasons.join(" ") },
    { label: "Ingredients", render: (m) => m.product.ingredients.join(", ") },
    { label: "Directions", render: (m) => m.product.directions },
    { label: "Brand guidance", render: (m) => m.product.brandGuidance },
    { label: "Precautions", render: (m) => m.product.precautions },
    {
      label: "Limitations",
      render: (m) => (
        <ul className="list-disc space-y-1 pl-4">
          {m.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      ),
    },
    {
      label: "Verification",
      render: (m) =>
        m.product.verificationStatus === "verified"
          ? `Verified from official page (${m.product.verifiedOn})`
          : "Partially verified",
    },
    { label: "Source", render: (m) => <SourceLink url={m.product.sourceUrl} /> },
  ];
  return (
    <section className="rounded-3xl border bg-card p-5 sm:p-7">
      <h2 className="text-xl font-semibold">Compare side by side</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Differences below reflect what each official page lists, not which is “better” for you.
      </p>
      <div className="mt-4 space-y-6 md:hidden">
        {rows.map((row) => (
          <section key={row.label}>
            <h3 className="font-semibold">{row.label}</h3>
            <dl className="mt-2 space-y-3">
              {matches.map((m) => (
                <div key={m.product.id} className="rounded-xl bg-muted/60 p-3 text-sm">
                  <dt className="font-medium">{m.product.name}</dt>
                  <dd className="mt-1 text-muted-foreground">{row.render(m)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <div className="relative mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <caption className="sr-only">Comparison of selected products</caption>
          <thead>
            <tr>
              <td className="w-32" />
              {matches.map((m) => (
                <th
                  key={m.product.id}
                  scope="col"
                  className="p-3 align-bottom text-base font-semibold"
                >
                  {m.product.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t align-top">
                <th scope="row" className="p-3 font-medium">
                  {row.label}
                </th>
                {matches.map((m) => (
                  <td key={m.product.id} className="p-3 text-muted-foreground">
                    {row.render(m)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ErrorPanel({ onRestart }: { onRestart: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-xl rounded-2xl border bg-card p-6 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn’t show your results. Please start again.
      </p>
      <button type="button" onClick={onRestart} className={`${primaryButton} mt-4`}>
        <RotateCcw className="size-4" aria-hidden /> Start again
      </button>
    </div>
  );
}
