import {
  ArrowLeft,
  Droplets,
  Flower2,
  Leaf,
  Pencil,
  RotateCcw,
  ShieldAlert,
  Sprout,
  Sun,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useMemo, type ReactNode, type RefObject } from "react";

import {
  BODYWISE_CATALOGUE,
  SAFETY_NOTICE,
  getProductMatches,
  getUnavailableRelatedProducts,
  getWithheldProducts,
  type FinderAnswers,
  type ProductMatch,
} from "@/lib/bodywise-catalogue";
import { concernLabel, summarise, type StepId } from "@/lib/finder-flow";

import { card, primaryButton, secondaryButton } from "./classes";
import { Badge, ErrorPanel, Eyebrow, SourceLink } from "./ui";

// Decorative icons only: no product photography is shown, so nothing can misrepresent a pack.
const PRODUCT_ICONS: Record<string, LucideIcon> = {
  "salicylic-face-wash": Droplets,
  "salicylic-body-wash": Waves,
  "pigmentation-repair-cream": Sun,
  "underarm-roll-on": Flower2,
  "advanced-hair-growth-serum": Sprout,
};

export function Results({
  headingRef,
  answers,
  compareIds,
  setCompareIds,
  onBack,
  onEdit,
  onRestart,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
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
      <div className="max-w-3xl">
        <Eyebrow>Your results</Eyebrow>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight outline-none sm:text-5xl"
        >
          {matches.length > 0
            ? `${matches.length} product${matches.length === 1 ? "" : "s"} listed for what you told us`
            : "No matching products right now"}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {matches.length > 0
            ? "These matches follow what each official product page lists. They are not a diagnosis or a promise of results."
            : "That’s a perfectly fine outcome — it’s better to say so than to suggest something that doesn’t fit."}
        </p>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[19rem_1fr]">
        <aside className={`p-5 lg:sticky lg:top-6 ${card}`}>
          <h2 className="font-display text-xl font-semibold">Your answers</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 lg:block lg:divide-y">
            {summarise(answers).map((row) => (
              <li
                key={row.step}
                className="flex flex-col gap-1 rounded-xl bg-cream p-3 text-sm first:col-span-2 lg:flex-row lg:items-start lg:justify-between lg:gap-3 lg:rounded-none lg:bg-transparent lg:px-0 lg:py-3 lg:first:col-span-1"
              >
                <span>
                  <span className="block text-xs text-muted-foreground">{row.label}: </span>
                  <span className="font-semibold">{row.value}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onEdit(row.step)}
                  className="inline-flex min-h-9 items-center gap-1 self-start rounded-full px-2 text-sm font-semibold text-primary transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:px-3"
                  aria-label={`Edit ${row.label.toLowerCase()}`}
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 space-y-8">
          {matches.length > 0 ? (
            <>
              <div className="grid gap-6">
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
                <div aria-live="polite">
                  {selected.length >= 2 ? (
                    <Compare matches={selected} />
                  ) : (
                    <p className="rounded-2xl border border-dashed bg-cream p-4 text-sm text-muted-foreground">
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
            <div className="rounded-[1.75rem] border bg-cream p-6">
              <h2 className="font-display text-xl font-semibold">Not matched to your answers</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                These products relate to what you selected, but your answers fall outside what the
                official page lists, or we couldn’t confirm them. We’re not suggesting a substitute.
                A pharmacist, doctor or dermatologist can advise on what suits you.
              </p>
              <ul className="mt-4 space-y-3">
                {withheld.map(({ product, issues }) => (
                  <li key={product.id} className="rounded-2xl border bg-card p-4 text-sm">
                    <p className="font-semibold">{product.name}</p>
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
            <div className="rounded-[1.75rem] border bg-cream p-6">
              <h2 className="font-display text-xl font-semibold">
                Related products we can’t recommend yet
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                The brand lists these for a concern you selected, but the safety information we need
                has not been verified, so they are not recommended here.
              </p>
              <ul className="mt-4 space-y-3">
                {unavailable.map((product) => (
                  <li key={product.id} className="rounded-2xl border bg-card p-4 text-sm">
                    <p className="font-semibold">{product.name}</p>
                    <p className="mt-1.5">
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
            className="flex gap-3 rounded-[1.75rem] border border-primary/25 bg-secondary/70 p-6"
            role="note"
          >
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="font-display text-xl font-semibold">Safety first</h2>
              <p className="mt-1.5 text-sm leading-relaxed">{SAFETY_NOTICE}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={onBack} className={secondaryButton}>
              <ArrowLeft className="size-4" aria-hidden /> Back
            </button>
            <button type="button" onClick={onRestart} className={primaryButton}>
              <RotateCcw className="size-4" aria-hidden /> Start again
            </button>
          </div>
        </div>
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
      "You answered “Not sure” to at least one question. We only match when an answer lines up with what a product page lists — you can edit your answers if that changes.",
    );
  }
  if (answers.pigmentationLocation === "face" || answers.pigmentationLocation === "elsewhere") {
    hints.push(
      "The pigmentation products we’ve verified are listed for body folds or underarms, not for the face or other areas.",
    );
  }
  return (
    <div className={`p-6 sm:p-8 ${card}`}>
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        <Leaf className="size-6" aria-hidden />
      </span>
      <h2 className="mt-4 font-display text-2xl font-semibold">What you can do next</h2>
      {hints.length > 0 && (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
        <li>Edit any of your answers, or start again with a different concern.</li>
        <li>
          Speak to a pharmacist, dermatologist or doctor — especially if a concern is persistent,
          painful, changing or worrying you.
        </li>
        <li>There’s no need to buy anything. Not finding a fit is a valid result.</li>
      </ul>
    </div>
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
  const Icon = PRODUCT_ICONS[product.id] ?? Leaf;
  return (
    <article className={`overflow-hidden ${card}`}>
      <div className="flex flex-wrap items-start gap-4 bg-gradient-to-b from-secondary/80 to-card p-5 sm:p-7">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-card text-primary shadow-soft ring-1 ring-inset ring-border"
          aria-hidden
        >
          <Icon className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{product.type}</p>
          <h2 className="font-display text-2xl font-semibold leading-tight">{product.name}</h2>
        </div>
        <Badge tone={verified ? "ok" : "warn"}>
          {verified ? `Verified from official page · ${product.verifiedOn}` : "Partially verified"}
        </Badge>
      </div>

      <div className="space-y-6 p-5 pt-2 sm:p-7 sm:pt-3">
        <div className="flex flex-wrap gap-2">
          {match.matchedConcerns.map((id) => (
            <span
              key={id}
              className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"
            >
              {concernLabel(id)}
            </span>
          ))}
        </div>

        <div className="rounded-2xl border border-primary/20 bg-secondary/60 p-4 text-sm">
          <h3 className="mb-1.5 font-semibold">Why it matched</h3>
          <ul className="list-disc space-y-1.5 pl-5">
            {match.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <Block title="What the brand says">
          <p>{product.intendedUse}</p>
          <p className="mt-2">{product.brandGuidance}</p>
        </Block>

        <div className="grid gap-6 md:grid-cols-2">
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

        <p className="-mt-2 text-sm text-muted-foreground">
          Key ingredients only — check the full ingredient list on the official page, especially if
          you have allergies.
        </p>

        <div className="rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950">
          <h3 className="font-semibold">Precautions</h3>
          <p className="mt-1">{product.precautions}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Block title="Limitations">
            <ul className="list-disc space-y-1.5 pl-5">
              {match.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </Block>
          {product.verificationNotes.notConfirmed.length > 0 && (
            <Block title="Not confirmed on the official page">
              <ul className="list-disc space-y-1.5 pl-5">
                {product.verificationNotes.notConfirmed.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </Block>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-cream px-5 py-3 sm:px-7">
        <SourceLink url={product.sourceUrl} />
        {canCompare && (
          <label className="relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border bg-card px-4 text-sm font-semibold transition hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-secondary">
            <input
              type="checkbox"
              checked={comparing}
              onChange={onToggleCompare}
              className="size-5 accent-[oklch(0.36_0.06_158)]"
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
    <div className="text-sm leading-relaxed">
      <h3 className="mb-1.5 font-semibold">{title}</h3>
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
    <section className={`p-5 sm:p-7 ${card}`}>
      <h2 className="font-display text-2xl font-semibold">Compare side by side</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Differences below reflect what each official page lists, not which is “better” for you.
      </p>
      <div className="mt-5 space-y-6 md:hidden">
        {rows.map((row) => (
          <section key={row.label}>
            <h3 className="font-semibold">{row.label}</h3>
            <dl className="mt-2 space-y-3">
              {matches.map((m) => (
                <div key={m.product.id} className="rounded-2xl bg-cream p-3.5 text-sm">
                  <dt className="font-semibold">{m.product.name}</dt>
                  <dd className="mt-1 text-muted-foreground">{row.render(m)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <div className="relative mt-5 hidden overflow-x-auto rounded-2xl border md:block">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <caption className="sr-only">Comparison of selected products</caption>
          <thead>
            <tr className="bg-secondary/70">
              <td className="w-32" />
              {matches.map((m) => (
                <th
                  key={m.product.id}
                  scope="col"
                  className="p-4 align-bottom font-display text-lg font-semibold"
                >
                  {m.product.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={`border-t align-top ${i % 2 ? "bg-cream/60" : ""}`}>
                <th scope="row" className="p-4 font-semibold">
                  {row.label}
                </th>
                {matches.map((m) => (
                  <td key={m.product.id} className="p-4 text-muted-foreground">
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
