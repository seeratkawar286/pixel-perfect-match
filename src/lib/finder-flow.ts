import {
  CONCERNS,
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
  type SkinProfile,
  type UnderarmPigmentationSeverity,
} from "@/lib/bodywise-catalogue";

// Questionnaire flow: which questions apply, how answers are normalised, and how they are summarised.
// Moved verbatim from the route file; the UI in src/components/finder only renders this.

export type StepId =
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

export interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export const AREA_OPTIONS: Option<ApplicationArea>[] = [
  { value: "face", label: "Face" },
  { value: "body", label: "Body" },
  { value: "both", label: "Face and body" },
  { value: "unsure", label: "Not sure" },
];
export const SKIN_OPTIONS: Option<SkinProfile>[] = [
  { value: "oily", label: "Oily" },
  { value: "dry-combination", label: "Dry or combination" },
  { value: "unsure", label: "Not sure" },
];
export const PATTERN_OPTIONS: Option<BreakoutPattern>[] = [
  { value: "mild-occasional", label: "Mild and occasional", hint: "A few spots now and then" },
  {
    value: "persistent-severe",
    label: "Persistent or severe",
    hint: "Frequent, painful, or not settling",
  },
  { value: "unsure", label: "Not sure" },
];
export const PIGMENTATION_OPTIONS: Option<PigmentationLocation>[] = [
  { value: "body-folds", label: "Body folds", hint: "Elbows, knees, back of neck, thighs" },
  { value: "underarms", label: "Underarms" },
  { value: "face", label: "Face" },
  { value: "elsewhere", label: "Somewhere else" },
  { value: "unsure", label: "Not sure" },
];

export const BODY_ACNE_OPTIONS: Option<BodyAcneSeverity>[] = [
  { value: "mild", label: "Mild body acne" },
  { value: "severe-or-marks", label: "Severe body acne or acne marks" },
  { value: "unsure", label: "Not sure" },
];
export const UNDERARM_OPTIONS: Option<UnderarmPigmentationSeverity>[] = [
  { value: "mild", label: "About 1 shade darker", hint: "Than the rest of your skin tone" },
  { value: "moderate", label: "About 2 shades darker" },
  { value: "severe", label: "3 or more shades darker" },
  { value: "unsure", label: "Not sure" },
];
export const AGE_OPTIONS: Option<AgeGroup>[] = [
  { value: "under-13", label: "Under 13" },
  { value: "13-17", label: "13 to 17" },
  { value: "18-plus", label: "18 or over" },
  { value: "unsure", label: "Prefer not to say" },
];

export const labelOf = <T extends string>(options: Option<T>[], value: T | undefined) =>
  options.find((o) => o.value === value)?.label;

export const faceRelevant = (area: ApplicationArea | undefined) =>
  area === "face" || area === "both";

/** The questions that apply to the current answers, in order. */
export function questionSteps(answers: FinderAnswers): StepId[] {
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
export function normaliseAnswers(answers: FinderAnswers): FinderAnswers {
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

export const concernLabel = (id: ConcernId) => CONCERNS.find((c) => c.id === id)?.label ?? id;

export function summarise(
  answers: FinderAnswers,
): { step: StepId; label: string; value: string }[] {
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
