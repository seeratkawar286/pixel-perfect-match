import { ExternalLink, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { primaryButton } from "./classes";

export function Badge({ children, tone }: { children: ReactNode; tone: "ok" | "warn" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        tone === "ok"
          ? "bg-secondary text-secondary-foreground ring-1 ring-inset ring-primary/15"
          : "bg-amber-100 text-amber-950 ring-1 ring-inset ring-amber-300/60"
      }`}
    >
      {children}
    </span>
  );
}

export function SourceLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      Official product page <ExternalLink className="size-3.5" aria-hidden />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">{children}</p>
  );
}

export function ErrorPanel({ onRestart }: { onRestart: () => void }) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-xl rounded-[1.75rem] border bg-card p-8 text-center shadow-soft"
    >
      <h1 className="font-display text-2xl">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn’t show your results. Please start again.
      </p>
      <button type="button" onClick={onRestart} className={`${primaryButton} mt-5`}>
        <RotateCcw className="size-4" aria-hidden /> Start again
      </button>
    </div>
  );
}
