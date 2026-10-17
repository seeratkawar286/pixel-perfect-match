export const INFORMATION_UNVERIFIED = "Information not verified yet.";
export const VERIFIED_ON = "2026-10-17";

export const CONCERNS = [
  { id: "acne", label: "Breakouts", note: "Face or body", icon: "sparkles" },
  { id: "oily-skin", label: "Oily skin", note: "Face care", icon: "droplets" },
  { id: "pigmentation", label: "Uneven-looking tone", note: "Body or underarms", icon: "sun" },
  { id: "body-odour", label: "Body odour", note: "Underarm care", icon: "flower" },
  { id: "hair-fall", label: "Hair fall or thinning", note: "Scalp care", icon: "sprout" },
  { id: "other", label: "Something else", note: "Explore what’s verified", icon: "help" },
] as const;

export type ConcernId = (typeof CONCERNS)[number]["id"];
export type ApplicationArea = "face" | "body" | "both" | "unsure";
export type SkinProfile = "oily" | "dry-combination" | "unsure";
export type BreakoutPattern = "mild-occasional" | "persistent-severe" | "unsure";
export type PigmentationLocation = "body-folds" | "underarms" | "face" | "elsewhere" | "unsure";

export interface FinderAnswers {
  concerns: ConcernId[];
  breakoutArea?: ApplicationArea;
  skinProfile?: SkinProfile;
  breakoutPattern?: BreakoutPattern;
  pigmentationLocation?: PigmentationLocation;
}

export interface BodywiseProduct {
  id: string;
  name: string;
  type: string;
  sourceUrl: string;
  verificationStatus: "verified" | "partially-verified";
  verifiedOn: string;
  verifiedConcerns: ConcernId[];
  intendedUse: string;
  ingredients: string[];
  directions: string;
  precautions: string;
  brandGuidance: string;
  limitations: string[];
  /** What was checked against the official page on `checkedOn`, and what could not be confirmed. */
  verificationNotes: {
    checkedOn: string;
    confirmed: string[];
    notConfirmed: string[];
  };
}

export interface ProductMatch {
  product: BodywiseProduct;
  score: number;
  matchedConcerns: ConcernId[];
  reasons: string[];
  limitations: string[];
}

const verifiedStatus = "verified" as const;

export const BODYWISE_CATALOGUE: BodywiseProduct[] = [
  {
    id: "salicylic-face-wash",
    name: "2% Salicylic Acid Face Wash",
    type: "Face cleanser",
    sourceUrl: "https://bebodywise.com/product/2-salicylic-acid-face-wash",
    verificationStatus: verifiedStatus,
    verifiedOn: VERIFIED_ON,
    verifiedConcerns: ["acne", "oily-skin"],
    intendedUse:
      "The brand lists this face wash for mild, occasional acne and the oily skin type, and says it is suitable for ages 13 and above.",
    ingredients: ["2% salicylic acid", "Allantoin"],
    directions:
      "Squeeze a small quantity into your palm, work up a lather, gently massage onto the face, rinse with water and pat dry.",
    precautions:
      "The brand recommends a patch test on a small area for 12–24 hours; do not use if redness, itching or irritation occurs during the test.",
    brandGuidance:
      "The page’s FAQ says it can be used every day, starting twice a day, and once a day if dryness occurs. This is brand guidance, not a promised result.",
    limitations: [
      "The brand distinguishes this from its 1% salicylic acid face wash for dry or combination skin.",
      "Its acne suitability is specifically described as mild and occasional; the page points to a separate product for persistent or severe acne.",
      "The page’s FAQ says people with dry skin shouldn’t use this product.",
    ],
    verificationNotes: {
      checkedOn: VERIFIED_ON,
      confirmed: [
        "Product name, URL and live product page",
        "Use for mild, occasional acne and oily skin; age 13+",
        "Key ingredients (2% salicylic acid, allantoin)",
        "Directions for use (three steps)",
        "Patch-test precaution",
        "Frequency guidance in the FAQ",
      ],
      notConfirmed: [
        "The page’s FAQ lists wider skin types (normal, oily, combination, acne-prone) than its header (oily), so exact skin-type suitability is not consistent on the page.",
      ],
    },
  },
  {
    id: "salicylic-body-wash",
    name: "1% Salicylic Acid Body Wash",
    type: "Body cleanser",
    sourceUrl: "https://bebodywise.com/product/1-salicylic-acid-body-wash",
    verificationStatus: verifiedStatus,
    verifiedOn: VERIFIED_ON,
    verifiedConcerns: ["acne"],
    intendedUse: "The brand lists this body wash for mild body acne.",
    ingredients: ["1% salicylic acid", "Chamomile extract", "Saccharide isomerate"],
    directions:
      "Take an adequate amount in your palms or on a loofah, apply on wet skin in a gentle circular motion and rinse thoroughly.",
    precautions:
      "The brand recommends a patch test on a small area for 12–24 hours; do not use if redness, itching or irritation occurs during the test.",
    brandGuidance:
      "The brand suggests using it daily for three months. This is brand guidance, not a promised result.",
    limitations: [
      "The page offers a separate product for severe body acne and acne marks.",
      "The page’s FAQ says it wouldn’t recommend this for people with very dry skin.",
      "The full ingredient list on the page includes fragrance.",
      "A product page description is not evidence of an individual result or a medical treatment.",
    ],
    verificationNotes: {
      checkedOn: VERIFIED_ON,
      confirmed: [
        "Product name, URL and live product page",
        "Use for mild body acne",
        "Key ingredients (salicylic acid, chamomile extract, Pentavitin/saccharide isomerate); full list includes fragrance",
        "Directions for use (three steps)",
        "Patch-test precaution",
        "Daily use for three months",
      ],
      notConfirmed: ["The 1% strength is stated in the product title, not in the ingredient list."],
    },
  },
  {
    id: "pigmentation-repair-cream",
    name: "Pigmentation Repair Cream",
    type: "Body cream",
    sourceUrl: "https://bebodywise.com/product/pigmentation-repair-cream-mini",
    verificationStatus: verifiedStatus,
    verifiedOn: VERIFIED_ON,
    verifiedConcerns: ["pigmentation"],
    intendedUse:
      "The brand lists this cream for dark patches and rough skin on body folds, such as elbows, knees, the back of the neck and thighs.",
    ingredients: [
      "2.5% lactic acid",
      "0.1% retinol",
      "2% urea",
      "Niacinamide",
      "Kojic acid dipalmitate",
    ],
    directions:
      "Cleanse the area and pat it dry. Apply a pea-sized amount to the pigmented area and massage gently with your fingertips. The brand suggests use twice daily.",
    precautions:
      "The brand says not to use this cream on the face, recommends a patch test, and says to follow it with a broad-spectrum sunscreen during the day.",
    brandGuidance:
      "The brand suggests consistent use for three to four months and says results are not expected in one month; that is brand guidance, not a guaranteed outcome.",
    limitations: [
      "The listed use is for body folds, not facial pigmentation.",
      "The product page does not establish the cause of the pigmentation.",
      "This page is for the 25 ml Mini pack.",
    ],
    verificationNotes: {
      checkedOn: VERIFIED_ON,
      confirmed: [
        "Product name, URL and live product page (25 ml Mini)",
        "Use on body folds; not for the face",
        "Ingredients and percentages for lactic acid, retinol and urea; niacinamide and kojic acid dipalmitate in the full list",
        "Directions and twice-daily use",
        "Patch-test and sunscreen precautions",
        "Three to four months of consistent use",
      ],
      notConfirmed: [
        "The page gives no guidance for pregnancy, breastfeeding or age limits, even though the cream contains retinol.",
      ],
    },
  },
  {
    id: "underarm-roll-on",
    name: "4% AHA BHA Underarm Roll On",
    type: "Underarm roll-on",
    sourceUrl: "https://bebodywise.com/product/4-aha-bha-underarm-roll-on",
    verificationStatus: verifiedStatus,
    verifiedOn: VERIFIED_ON,
    verifiedConcerns: ["body-odour", "pigmentation"],
    intendedUse:
      "The brand lists this roll-on for underarm body odour and mild underarm pigmentation (about one shade darker than skin tone).",
    ingredients: ["1% salicylic acid", "1% mandelic acid", "2% lactic acid", "Alpha arbutin"],
    directions:
      "Apply directly to the underarm skin, roll it on evenly and allow it to dry completely. The brand suggests daily use.",
    precautions:
      "The brand recommends a patch test on a small area for 12–24 hours; do not use if redness, itching or irritation occurs during the test. The page’s FAQ suggests waiting 6–12 hours after waxing and at least 10–15 minutes after shaving.",
    brandGuidance:
      "The brand suggests daily use for three months and says results are not expected in one month; it distinguishes this from its moderate and severe pigmentation products.",
    limitations: [
      "The listed application area is the underarms; the page does not present this as a treatment for other body areas.",
      "The main description says it is suitable for women above 18; an FAQ on the same page also mentions teenagers, so the page’s age guidance is not consistent.",
      "The ingredient list includes perfume; the page also lists a no-fragrance option.",
    ],
    verificationNotes: {
      checkedOn: VERIFIED_ON,
      confirmed: [
        "Product name, URL and live product page (50 mL, Flora)",
        "Use for odour and mild underarm pigmentation",
        "Key ingredients and percentages; alpha arbutin in the full list",
        "Directions for use",
        "Patch-test precaution and FAQ guidance after waxing or shaving",
        "Daily use for three months",
      ],
      notConfirmed: [
        "Age suitability: the page says women above 18 and also mentions teenagers.",
        "Marketing statistics on the page (bacteria reduction, consumer-study percentages) were not independently verified and are not shown here.",
      ],
    },
  },
  {
    id: "advanced-hair-growth-serum",
    name: "Advanced Hair Growth Serum",
    type: "Scalp serum",
    sourceUrl: "https://bebodywise.com/product/advanced-hair-growth-serum",
    verificationStatus: "partially-verified",
    verifiedOn: VERIFIED_ON,
    verifiedConcerns: ["hair-fall"],
    intendedUse:
      "The brand lists the serum for hair thinning and new hair regrowth and says it is suitable for women aged 18 and above.",
    ingredients: [
      "2% Aminexil",
      "3% Redensyl",
      "2% Anagain",
      "Rosemary (the page states both 1% and 3%)",
    ],
    directions:
      "The page says to use it every day; its application steps say to spray it onto the affected scalp, massage gently and leave it on.",
    precautions: INFORMATION_UNVERIFIED,
    brandGuidance:
      "The brand suggests at least three months of use. This is brand guidance, not a promised result.",
    limitations: [
      "The page lists the product for women aged 18 and above.",
      "The page lists a separate pack for hair fall together with thinning.",
      "The page gives no patch-test or other precautions for this product. It is excluded from recommendations until that safety information is verified.",
    ],
    verificationNotes: {
      checkedOn: VERIFIED_ON,
      confirmed: [
        "Product name, URL and live product page",
        "Use for hair thinning and regrowth; women 18+",
        "Directions for use",
        "Use for at least three months",
      ],
      notConfirmed: [
        "Precautions: the page shows no patch-test or safety instructions for this product.",
        "Rosemary strength: the description says 1% and the key-ingredients section says 3%.",
        "Result timelines and ‘no side effects’ claims on the page are marketing claims and were not verified.",
      ],
    },
  },
];

export const SAFETY_NOTICE =
  "This independent guide does not diagnose conditions or offer personalised medical advice. Product-page information does not guarantee results. If you experience a concerning reaction, stop using the product and seek advice from a qualified healthcare professional. If a reaction is severe or rapidly worsening, seek urgent care.";

const hasUsableSafetyInformation = (product: BodywiseProduct): boolean =>
  product.verificationStatus === "verified" &&
  product.sourceUrl.startsWith("https://bebodywise.com/product/") &&
  product.verifiedOn.length > 0 &&
  product.verifiedConcerns.length > 0 &&
  product.ingredients.length > 0 &&
  product.intendedUse.trim().length > 0 &&
  product.directions.trim().length > 0 &&
  product.precautions.trim().length > 0 &&
  product.precautions !== INFORMATION_UNVERIFIED;

const hasFaceApplication = (area: ApplicationArea | undefined): boolean =>
  area === "face" || area === "both";

const hasBodyApplication = (area: ApplicationArea | undefined): boolean =>
  area === "body" || area === "both";

function productReasons(product: BodywiseProduct, answers: FinderAnswers): string[] {
  if (product.id === "salicylic-face-wash") {
    if (answers.concerns.includes("acne")) {
      return [
        "You selected face breakouts and described them as mild and occasional, with oily skin. The official page lists that same use.",
      ];
    }
    return [
      "You selected oily skin for the face. The official page lists the cleanser for oily skin.",
    ];
  }

  if (product.id === "salicylic-body-wash") {
    return ["You selected body breakouts. The official page presents this cleanser for body acne."];
  }

  if (product.id === "pigmentation-repair-cream") {
    return [
      "You selected body-fold pigmentation. The official page lists body folds such as elbows, knees, the back of the neck and thighs.",
    ];
  }

  if (product.id === "underarm-roll-on") {
    return answers.concerns.includes("body-odour")
      ? ["You selected underarm body odour. The official page lists underarm use for body odour."]
      : ["You selected mild underarm pigmentation. The official page lists that use."];
  }

  return [];
}

function isRelevantForAnswers(product: BodywiseProduct, answers: FinderAnswers): boolean {
  switch (product.id) {
    case "salicylic-face-wash": {
      const pickedAcne = answers.concerns.includes("acne");
      const pickedOilySkin = answers.concerns.includes("oily-skin");
      if ((!pickedAcne && !pickedOilySkin) || !hasFaceApplication(answers.breakoutArea))
        return false;
      if (!pickedAcne) return pickedOilySkin;
      return answers.skinProfile === "oily" && answers.breakoutPattern === "mild-occasional";
    }
    case "salicylic-body-wash":
      return answers.concerns.includes("acne") && hasBodyApplication(answers.breakoutArea);
    case "pigmentation-repair-cream":
      return (
        answers.concerns.includes("pigmentation") && answers.pigmentationLocation === "body-folds"
      );
    case "underarm-roll-on":
      return (
        answers.concerns.includes("body-odour") ||
        (answers.concerns.includes("pigmentation") && answers.pigmentationLocation === "underarms")
      );
    case "advanced-hair-growth-serum":
      return answers.concerns.includes("hair-fall");
    default:
      return false;
  }
}

export function getProductMatches(
  products: readonly BodywiseProduct[],
  answers: FinderAnswers,
): ProductMatch[] {
  if (answers.concerns.length === 0) return [];

  return products
    .filter(
      (product) => hasUsableSafetyInformation(product) && isRelevantForAnswers(product, answers),
    )
    .map((product) => {
      const matchedConcerns = product.verifiedConcerns.filter((concern) =>
        answers.concerns.includes(concern),
      );
      return {
        product,
        score: matchedConcerns.length,
        matchedConcerns,
        reasons: productReasons(product, answers),
        limitations: [...product.limitations],
      };
    })
    .filter((match) => match.score > 0 && match.reasons.length > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));
}

export function getUnavailableRelatedProducts(
  products: readonly BodywiseProduct[],
  answers: FinderAnswers,
): BodywiseProduct[] {
  return products.filter(
    (product) =>
      product.verifiedConcerns.some((concern) => answers.concerns.includes(concern)) &&
      !hasUsableSafetyInformation(product),
  );
}

const UNSUPPORTED_CLAIM_PATTERNS = [
  /\bcures?\b/i,
  /\bguarantees?\b/i,
  /\bwill\s+(?:cure|clear|fix|treat)\b/i,
  /\bdiagnos(?:e|es|ed|ing|is)\b/i,
];

export function getUnsupportedProductClaims(products: readonly BodywiseProduct[]): string[] {
  return products.flatMap((product) =>
    [product.name, product.type, product.intendedUse, ...product.ingredients].flatMap((text) =>
      UNSUPPORTED_CLAIM_PATTERNS.some((pattern) => pattern.test(text))
        ? [`${product.id}: ${text}`]
        : [],
    ),
  );
}
