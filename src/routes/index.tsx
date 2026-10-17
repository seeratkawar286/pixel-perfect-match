import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { ConcernPicker, ProgressBar, Question, RadioQuestion } from "@/components/finder/question";
import { Results } from "@/components/finder/results";
import { Shell } from "@/components/finder/shell";
import { ErrorPanel } from "@/components/finder/ui";
import { Welcome } from "@/components/finder/welcome";
import type { FinderAnswers } from "@/lib/bodywise-catalogue";
import {
  AGE_OPTIONS,
  AREA_OPTIONS,
  BODY_ACNE_OPTIONS,
  PATTERN_OPTIONS,
  PIGMENTATION_OPTIONS,
  SKIN_OPTIONS,
  UNDERARM_OPTIONS,
  normaliseAnswers,
  questionSteps,
  type StepId,
} from "@/lib/finder-flow";

// Page metadata (title, description, og tags) is inherited from __root.tsx.
export const Route = createFileRoute("/")({
  component: Index,
  errorComponent: () => (
    <Shell>
      <ErrorPanel onRestart={() => window.location.reload()} />
    </Shell>
  ),
});

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
        <ProgressBar
          label={step === "results" ? "Your results" : `Question ${position}`}
          progress={progress}
        />
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
          <ConcernPicker
            selected={answers.concerns}
            onChange={(concerns) => update({ concerns })}
          />
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
