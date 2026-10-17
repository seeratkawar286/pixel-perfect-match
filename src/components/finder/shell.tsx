import { ExternalLink, RotateCcw, Sprout } from "lucide-react";
import type { ReactNode } from "react";

import { VERIFIED_ON } from "@/lib/bodywise-catalogue";

import { ghostButton } from "./classes";

export function Shell({
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
      <div className="bg-forest-deep px-4 py-2 text-center text-xs text-white/85 sm:text-sm">
        Independent project · Not affiliated with or endorsed by Be Bodywise
      </div>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft"
            aria-hidden
          >
            <Sprout className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-xl font-semibold tracking-tight">Bodywise Clarity</p>
            <p className="text-xs text-muted-foreground">Independent guide · not official</p>
          </div>
        </div>
        {onRestart && (
          <button type="button" onClick={onRestart} className={ghostButton}>
            <RotateCcw className="size-4" aria-hidden /> Restart
          </button>
        )}
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 pb-20 pt-2 sm:px-6">
        {children}
      </main>
      <footer className="border-t bg-cream">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="font-display text-lg font-semibold">Bodywise Clarity</p>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Bodywise Clarity is an independent educational tool. It is not an official Be Bodywise
              service and is not affiliated with or endorsed by the brand. It does not diagnose or
              treat medical conditions. Product details come from the brand’s own product pages,
              last checked <span className="whitespace-nowrap">{VERIFIED_ON}</span>.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold">Good to know</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>No sign-up, no tracking of your answers</li>
              <li>Answers stay in your browser</li>
            </ul>
            <a
              href="https://bebodywise.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
            >
              Visit the brand’s own site <ExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
