<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Bodywise Clarity: catalogue and matching

The app is a client-side, deterministic product finder. There is no AI, backend or storage. All
product data and matching rules live in `src/lib/bodywise-catalogue.ts`. The questionnaire flow
(which questions apply, answer normalisation, option labels, summary rows) lives in
`src/lib/finder-flow.ts`. The UI only asks questions and renders results: `src/routes/index.tsx`
wires state and navigation, and the presentational components are in `src/components/finder/`
(`welcome`, `question`, `results`, `shell`, `ui`, `classes`). Design changes belong in those
components and `src/styles.css`; they must not change matching, eligibility or flow behaviour.

## Design system

Warm off-white and white surfaces, forest-green (`primary`, `forest-deep`) and sage (`secondary`,
`accent`) accents, system serif display headings (`font-display`, no web fonts), rounded cards,
subtle borders and the `shadow-soft` shadow. Tokens are defined in `src/styles.css`. Imagery is the
single unbranded still-life in `src/assets`; product cards use decorative icons, never pack shots or
invented product imagery. Keep the independent-project disclaimer visible on the landing page and
in the footer.

## Catalogue structure

`BODYWISE_CATALOGUE` is a typed array of `BodywiseProduct`: `id`, `name`, `type`, `sourceUrl`
(must be `https://bebodywise.com/product/...`), `verificationStatus` (`verified` or
`partially-verified`), `verifiedOn`, `verifiedConcerns`, `intendedUse`, `ingredients` (key actives
only), `directions`, `precautions`, `brandGuidance`, `limitations`, and `verificationNotes`
(`checkedOn`, `confirmed`, `notConfirmed`). Answers are typed as `FinderAnswers`.

## Matching rules (do not weaken)

- Three outcomes, never mixed: a **verified match** (`getProductMatches`), a **potential match,
  verification incomplete** (`getPotentialMatches`) and **not a match** (not shown).
- `getProductMatches` recommends a product only if `getVerificationGaps` returns nothing (verified
  status, official `https://bebodywise.com/product/` URL, verification date, a recorded concern,
  intended use, ingredients, directions, and real precautions that are not `INFORMATION_UNVERIFIED`)
  **and** `assess()` finds it in scope with no issues. `getVerificationGaps` is the single explicit
  safety gate; missing source information never bypasses it.
- A product whose official page supports a selected concern and whose scope fits the answers, but
  which has verification gaps, is a potential match. It is shown separately, with the gaps listed,
  and is never a confirmed recommendation. A product with no recorded supported concern is not even
  a potential match.
- Products that are in scope but fail an age or severity rule are returned by `getWithheldProducts`
  with the reasons. They are explanations, never recommendations or substitutes.
- Current rules:
  - Face wash: face scope, oily skin, mild and occasional breakouts, age 13–17 or 18 or over.
  - Body wash: body scope and **mild** body acne only.
  - Pigmentation cream: body-fold location only; no age or severity gate (none on the page).
  - Underarm roll-on: age 18 or over only, because the page's age guidance is inconsistent (main
    description says women above 18, an FAQ mentions teenagers). Underarm pigmentation must be about
    1 shade darker; odour alone needs no shade answer.
  - Hair fall or thinning: asks the age group, because the official pages list the hair serums for
    women aged 18 years and above. Folli Advanced+ Hair Growth Serum Roll On is a verified match
    (its FAQ gives precautions) for 18 or over only; its page lists it for advanced hair thinning
    and improved volume and routes hair fall alone to another product. The Advanced Hair Growth
    Serum and the Keratin Shampoo for Hair Fall have no precautions on their pages, so they are
    potential matches only. Hair-loss professional-assessment guidance (`HAIR_LOSS_GUIDANCE`) is
    always shown for this concern. A hair product listed for another concern (for example the Hair
    Strengthening Serum, for frizz and dry hair) is not a match.
- "Not sure", "Prefer not to say" and unanswered mean the requirement cannot be confirmed, so the
  product is withheld.
- Ask a severity or age question only where an official page draws that distinction. The helpers
  `requiresBodyAcneSeverity`, `requiresUnderarmPigmentationSeverity` and `requiresAgeGroup` are the
  single source of truth for that, used by both matching and the UI. Never collect a date of birth.

## Content rules

- Never invent product facts, efficacy claims, ingredients, ages or medical advice. If something
  cannot be confirmed on the official page, record it in `verificationNotes.notConfirmed` or label it
  "Information not verified yet". Do not repeat marketing statistics from product pages.
- Keep `getUnsupportedProductClaims` returning an empty list for the shipped catalogue (no
  cure, guarantee or diagnosis wording), and show `SAFETY_NOTICE` on every results screen.
- When changing a rule, update `src/lib/bodywise-catalogue.test.ts` (including the exhaustive check
  that withheld products are never recommended) and the journey tests in `src/test/`.
- Re-verify product pages and bump `VERIFIED_ON` and each `verificationNotes.checkedOn` together.
