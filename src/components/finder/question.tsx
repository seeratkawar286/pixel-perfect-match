import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Droplets,
  Flower2,
  Sparkles,
  Sprout,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode, RefObject } from "react";

import { CONCERNS, type ConcernId } from "@/lib/bodywise-catalogue";
import type { Option } from "@/lib/finder-flow";

import { card, primaryButton, secondaryButton } from "./classes";

const CONCERN_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  droplets: Droplets,
  sun: Sun,
  flower: Flower2,
  sprout: Sprout,
  help: CircleHelp,
};

export function ProgressBar({ label, progress }: { label: string; progress: number }) {
  return (
    <div className="mx-auto mb-6 max-w-2xl sm:mb-8">
      <div className="mb-2.5 flex items-center justify-between text-sm font-medium text-muted-foreground">
        <span>{label}</span>
        <span className="text-xs">No personal details collected</span>
      </div>
      <div
        role="progressbar"
        aria-label="Questionnaire progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-2.5 overflow-hidden rounded-full bg-secondary"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.max(progress, 6)}%` }}
        />
      </div>
    </div>
  );
}

export function Question({
  headingRef,
  title,
  description,
  children,
  canContinue,
  onBack,
  onContinue,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <section className={`mx-auto max-w-2xl p-5 sm:p-9 ${card}`}>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-3xl font-semibold leading-tight tracking-tight outline-none sm:text-4xl"
      >
        {title}
      </h1>
      {description && <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>}
      <div className="mt-7">{children}</div>
      <div className="mt-8 flex items-center justify-between gap-3 border-t pt-6">
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

export function RadioQuestion<T extends string>({
  headingRef,
  title,
  description,
  options,
  value,
  onSelect,
  onBack,
  onContinue,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
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

export function ConcernPicker({
  selected,
  onChange,
}: {
  selected: ConcernId[];
  onChange: (next: ConcernId[]) => void;
}) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="sr-only">Concerns</legend>
      {CONCERNS.map((concern) => {
        const Icon = CONCERN_ICONS[concern.icon] ?? CircleHelp;
        const checked = selected.includes(concern.id);
        return (
          <ChoiceCard
            key={concern.id}
            type="checkbox"
            name="concerns"
            checked={checked}
            onChange={() =>
              onChange(
                checked ? selected.filter((c) => c !== concern.id) : [...selected, concern.id],
              )
            }
            icon={<Icon className="size-5" aria-hidden />}
            label={concern.label}
            hint={concern.note}
          />
        );
      })}
    </fieldset>
  );
}

export function ChoiceCard({
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
      <span className="flex min-h-[4.25rem] items-center gap-4 rounded-2xl border bg-card px-4 py-3.5 transition hover:border-primary/40 hover:bg-secondary/50 peer-checked:border-primary peer-checked:bg-secondary peer-checked:shadow-[0_0_0_1px_var(--primary)] peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
        {icon && (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cream text-primary ring-1 ring-inset ring-border">
            {icon}
          </span>
        )}
        <span className="flex-1">
          <span className="block font-semibold">{label}</span>
          {hint && <span className="mt-0.5 block text-sm text-muted-foreground">{hint}</span>}
        </span>
        <span
          aria-hidden
          className={`flex size-6 shrink-0 items-center justify-center border transition ${
            type === "radio" ? "rounded-full" : "rounded-md"
          } ${checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`}
        >
          {checked && <Check className="size-4" />}
        </span>
      </span>
    </label>
  );
}
