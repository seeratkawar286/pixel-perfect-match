import {
  ArrowRight,
  BadgeCheck,
  Check,
  Leaf,
  Lock,
  ShieldCheck,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import type { RefObject } from "react";

import heroImage from "@/assets/bodywise-clarity-stilllife.jpg";
import { VERIFIED_ON } from "@/lib/bodywise-catalogue";

import { lightButton, primaryButton } from "./classes";
import { Eyebrow } from "./ui";

const TRUST: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Lock,
    title: "Independent and private",
    body: "No sign-up, no shopping basket and nothing stored. Answers stay in your browser and links go to the brand’s own pages.",
  },
  {
    icon: BadgeCheck,
    title: "Checked against official pages",
    body: "Ingredients, directions and precautions come from each product’s official page. Anything we couldn’t confirm is labelled.",
  },
  {
    icon: ShieldCheck,
    title: "Cautious on purpose",
    body: "If an age or severity answer falls outside what a page lists, or can’t be confirmed, we explain why and don’t suggest a substitute.",
  },
];

const STEPS = [
  {
    title: "Choose what you’d like to explore",
    body: "Pick one or more concerns, from breakouts to body odour.",
  },
  {
    title: "Answer only what matters",
    body: "A few short follow-ups, such as area, severity or age group, only where an official page makes them relevant.",
  },
  {
    title: "See what the official pages list",
    body: "Compare matches side by side, edit any answer, or start again whenever you like.",
  },
];

const EVERY_MATCH = [
  "Why it matched your answers",
  "Key ingredients as listed",
  "Directions from the brand",
  "Precautions and patch-test guidance",
  "Limitations of the listing",
  "What we couldn’t confirm",
  "A link to the official product page",
];

export function Welcome({
  headingRef,
  onStart,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  onStart: () => void;
}) {
  return (
    <div className="space-y-20 sm:space-y-28">
      <section className="grid items-center gap-10 pt-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground shadow-soft">
            <Sprout className="size-3.5 text-primary" aria-hidden /> Independent product guide
          </p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-5 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight outline-none sm:text-6xl"
          >
            Find your way around Be Bodywise products
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Bodywise Clarity is an independent product discovery and education tool. Tell us what
            you would like to explore and we’ll show Be Bodywise products whose official pages list
            that use — with the ingredients, directions, precautions and limits that are verified.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <button type="button" onClick={onStart} className={primaryButton}>
              Start <ArrowRight className="size-4" aria-hidden />
            </button>
            <a
              href="#how-it-works"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              How it works
            </a>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            A few short questions · No sign-up · Nothing is stored
          </p>

          <div className="mt-8 rounded-2xl border bg-cream p-5 text-sm" role="note">
            <p className="font-semibold">Please note</p>
            <ul className="mt-2 space-y-1.5 text-muted-foreground">
              {[
                "This is not an official Be Bodywise service.",
                "It does not diagnose or treat medical conditions.",
                "Results reflect what the brand lists, not a promise of how your skin will respond.",
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative">
          <div
            className="absolute -inset-3 -z-10 rounded-[2.5rem] bg-gradient-to-br from-secondary to-cream"
            aria-hidden
          />
          <img
            src={heroImage}
            alt="Unbranded white skincare bottles, a dropper and a jar on a stone ledge beside green leaves"
            width={1440}
            height={1120}
            className="aspect-[4/3.4] w-full rounded-[2rem] object-cover shadow-soft lg:aspect-[4/4.4]"
          />
          <p className="absolute bottom-4 left-4 right-4 flex items-center gap-2 rounded-2xl bg-card/95 px-4 py-3 text-xs font-medium text-secondary-foreground shadow-soft backdrop-blur sm:right-auto sm:max-w-xs">
            <Leaf className="size-4 shrink-0 text-primary" aria-hidden />
            Facts checked against official product pages on{" "}
            <span className="whitespace-nowrap">{VERIFIED_ON}</span>
          </p>
        </div>
      </section>

      <section aria-labelledby="trust-heading">
        <h2 id="trust-heading" className="sr-only">
          Why you can rely on this guide
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {TRUST.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-[1.75rem] border bg-card p-6 shadow-soft">
              <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-8">
        <Eyebrow>How it works</Eyebrow>
        <h2
          id="how-heading"
          className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Three calm steps, no pressure to buy
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-[1.75rem] border bg-card p-6">
              <span
                className="font-display text-5xl font-semibold leading-none text-primary/25"
                aria-hidden
              >
                {i + 1}
              </span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="every-match-heading"
        className="grid items-center gap-8 overflow-hidden rounded-[2rem] border bg-cream md:grid-cols-[1fr_1.1fr]"
      >
        <img
          src={heroImage}
          alt=""
          width={1440}
          height={1120}
          className="h-56 w-full object-cover object-[75%_50%] md:h-full md:min-h-[22rem]"
        />
        <div className="p-6 sm:p-10 md:pl-2">
          <Eyebrow>What you’ll see</Eyebrow>
          <h2
            id="every-match-heading"
            className="mt-2 font-display text-3xl font-semibold tracking-tight"
          >
            Plain-language detail for every match
          </h2>
          <ul className="mt-5 grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
            {EVERY_MATCH.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-[2rem] bg-forest-deep px-6 py-12 text-center text-white sm:px-12">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready when you are
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/80">
          It takes a few short questions. You can go back, edit any answer or restart at any point.
        </p>
        <button type="button" onClick={onStart} className={`${lightButton} mt-7`}>
          Begin the guide <ArrowRight className="size-4" aria-hidden />
        </button>
      </section>
    </div>
  );
}
