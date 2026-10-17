// Shared class strings for the Bodywise Clarity interface.

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const primaryButton = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/90 active:translate-y-px ${focusRing} disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none`;

export const secondaryButton = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-input bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-secondary ${focusRing}`;

export const ghostButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground ${focusRing}`;

export const lightButton = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cream px-7 py-3 text-sm font-semibold text-forest-deep transition hover:bg-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-forest-deep`;

export const card = "rounded-[1.75rem] border bg-card shadow-soft";
