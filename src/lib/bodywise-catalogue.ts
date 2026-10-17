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
    intendedUse: "The brand describes this face wash for oily skin and mild, occasional acne.",
    ingredients: ["2% salicylic acid", "Allantoin"],
    directions:
      "Squeeze a small quantity into your palm, work up a lather, gently massage onto the face, rinse with water and pat dry.",
    precautions:
      "The brand recommends a patch test on a small area for 12–24 hours; do not use if redness, itching or irritation occurs during the test.",
    brandGuidance:
      "The page describes suitability for oily skin and mild, occasional acne; it does not specify how often to use this cleanser.",
    limitations: [
      "The brand distinguishes this from its face wash for dry or combination skin.",
      "Its acne suitability is specifically described as mild and occasional, not persistent or severe.",
    ],
  },
  {
    id: "salicylic-body-wash",
    name: "1% Salicylic Acid Body Wash",
    type: "Body cleanser",
    sourceUrl: "https://bebodywise.com/product/1-salicylic-acid-body-wash",
    verificationStatus: verifiedStatus,
    verifiedOn: VERIFIED_ON,
    verifiedConcerns: ["acne"],
    intendedUse: "The brand presents this body wash for body acne.",
    ingredients: ["1% salicylic acid", "Chamomile extract", "Saccharide isomerate"],
    directions:
      "Use an adequate amount on wet skin with your palms or a loofah, rub gently in a circular motion and rinse thoroughly.",
    precautions:
      "The brand recommends a patch test on a small area for 12–24 hours; do not use if redness, itching or irritation occurs during the test.",
    brandGuidance: "The brand suggests daily use for three months.",
    limitations: [
      "This is a body wash, not a face cleanser.",
      "A product page description is not evidence of an individual result or a medical treatment.",
    ],
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
      "The brand positions this cream for uneven-looking tone on body folds, such as elbows, knees, the back of the neck and thighs.",
    ingredients: [
      "2.5% lactic acid",
      "0.1% retinol",
      "2% urea",
      "Niacinamide",
      "Kojic acid dipalmitate",
    ],
    directions:
      "Cleanse the area and pat it dry. Apply a pea-sized amount to the area and gently massage. The brand suggests use twice daily.",
    precautions:
      "The brand says not to use this cream on the face, recommends a patch test, and recommends broad-spectrum sunscreen during the day.",
    brandGuidance:
      "The brand suggests consistent use for three to four months; that is brand guidance, not a guaranteed outcome.",
    limitations: [
      "The listed use is for body folds, not facial pigmentation.",
      "The product page does not establish the cause of uneven-looking tone.",
    ],
  },
  {
    id: "underarm-roll-on",
    name: "4% AHA BHA Underarm Roll On",
    type: "Underarm roll-on",
    sourceUrl: "https://bebodywise.com/product/4-aha-bha-underarm-roll-on",
    verificationStatus: verifiedStatus,
    verifiedOn: VERIFIED_ON,
    verifiedConcerns: ["body-odour", "pigmentation"],
    intendedUse: "The brand presents this roll-on for body odour and mild underarm pigmentation.",
    ingredients: ["1% salicylic acid", "1% mandelic acid", "2% lactic acid", "Alpha arbutin"],
    directions:
      "Apply directly to the underarm skin, roll it on evenly and allow it to dry. The brand suggests daily use.",
    precautions:
      "The brand recommends a patch test on a small area for 12–24 hours; do not use if redness, itching or irritation occurs during the test.",
    brandGuidance:
      "The brand lists mild underarm pigmentation as a use and suggests daily use for three months; it distinguishes this from its severe-pigmentation kit.",
    limitations: [
      "The listed application area is the underarms; the page does not present this as a treatment for other body areas.",
      "The brand lists the product for women aged 18 and above.",
    ],
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
      "The brand markets the serum for hair fall and thinning and lists it for women aged 18 and above.",
    ingredients: ["2% Aminexil", "1% rosemary", "3% Redensyl", "2% Anagain"],
    directions:
      "The page says to use it every day; its scalp application section says to spray it onto the affected scalp, gently massage it in and leave it on.",
    precautions: INFORMATION_UNVERIFIED,
    brandGuidance:
      "The brand suggests at least three months of use. This is brand guidance, not a promised result.",
    limitations: [
      "The page lists the product for women aged 18 and above.",
      "Product-specific precautions were not verified. It is excluded from recommendations until that safety information is verified.",
    ],
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
