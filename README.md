# Bodywise Clarity

An independent, sign-up-free guide that helps people explore [Be Bodywise](https://bebodywise.com)
products by concern. It is **not** an official Be Bodywise service and is not affiliated with or
endorsed by the brand. It does not diagnose or treat medical conditions, and it never claims a
product will cure anything.

Answers stay in the browser: nothing is stored or sent anywhere, and no date of birth or other
personal details are collected.

## How it works

1. Choose one or more concerns (breakouts, oily skin, uneven-looking tone, body odour, hair fall,
   something else).
2. Answer only the follow-up questions that an official product page makes relevant: area, skin
   type, severity, and age group.
3. See the products whose official pages list that use, with the reasons for each match, verified
   ingredients and directions, precautions, limitations, what could not be confirmed, and a link to
   the official page. Compare matches side by side, edit answers, go back, or restart.
4. If an age or severity answer falls outside what a page lists (or can't be confirmed), the product
   is **withheld** and explained, never replaced by a substitute.

Product facts were checked against the official pages on 2026-10-17 (see
`verificationNotes` in the catalogue). Pages can change, so re-verify before relying on them.

## Tech stack

TanStack Start and TanStack Router, React 19, TypeScript, Vite, Tailwind CSS 4 (shadcn/Radix UI
components), Vitest and Testing Library. The app is client-side only: no backend or database.

## Development

Requires Node.js and npm.

```sh
npm install
npm run dev        # start the dev server
npm test           # run the test suite
npx tsc --noEmit   # type check
npm run lint       # ESLint + Prettier
npm run build      # production build
```

## Project structure

- `src/routes/index.tsx` – state and navigation for the finder
- `src/components/finder/` – landing page, questionnaire, results and comparison components
- `src/routes/__root.tsx` – app shell and page metadata
- `src/styles.css` – design tokens (white and warm off-white, forest green and sage)
- `src/lib/bodywise-catalogue.ts` – product catalogue and matching rules (see `AGENTS.md`)
- `src/lib/finder-flow.ts` – which questions apply, answer normalisation and summaries
- `src/lib/bodywise-catalogue.test.ts`, `src/test/` – matching and journey tests

## Lovable

This project is connected to [Lovable](https://lovable.dev/projects/a1922e53-8cfd-4eb9-a7e0-b64bfdb57b65).
Commits pushed to the connected branch sync to the Lovable editor, so avoid rewriting published git
history.
