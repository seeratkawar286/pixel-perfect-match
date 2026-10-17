import { describe, expect, it } from "vitest";

import {
  BODYWISE_CATALOGUE,
  CONCERNS,
  INFORMATION_UNVERIFIED,
  SAFETY_NOTICE,
  getProductMatches,
  HAIR_LOSS_GUIDANCE,
  getPotentialMatches,
  getVerificationGaps,
  getUnsupportedProductClaims,
  getWithheldProducts,
  requiresAgeGroup,
  requiresBodyAcneSeverity,
  requiresUnderarmPigmentationSeverity,
  type AgeGroup,
  type ApplicationArea,
  type BodyAcneSeverity,
  type BodywiseProduct,
  type BreakoutPattern,
  type ConcernId,
  type FinderAnswers,
  type PigmentationLocation,
  type SkinProfile,
  type UnderarmPigmentationSeverity,
} from "@/lib/bodywise-catalogue";

const ids = (answers: FinderAnswers, products: readonly BodywiseProduct[] = BODYWISE_CATALOGUE) =>
  getProductMatches(products, answers).map((m) => m.product.id);

const withheldIds = (answers: FinderAnswers) =>
  getWithheldProducts(BODYWISE_CATALOGUE, answers).map((w) => w.product.id);

const product = (id: string): BodywiseProduct => {
  const found = BODYWISE_CATALOGUE.find((p) => p.id === id);
  if (!found) throw new Error(`Missing catalogue product ${id}`);
  return found;
};

const faceAcne: FinderAnswers = {
  concerns: ["acne"],
  breakoutArea: "face",
  skinProfile: "oily",
  breakoutPattern: "mild-occasional",
  ageGroup: "18-plus",
};

describe("deterministic matching and reasons", () => {
  it("matches mild, occasional face breakouts on oily skin to the face wash, with a reason", () => {
    const [match, ...rest] = getProductMatches(BODYWISE_CATALOGUE, faceAcne);
    expect(rest).toHaveLength(0);
    expect(match?.product.id).toBe("salicylic-face-wash");
    expect(match?.matchedConcerns).toEqual(["acne"]);
    expect(match?.reasons.join(" ")).toMatch(/mild and occasional/);
  });

  it("matches body breakouts to the body wash only", () => {
    expect(ids({ concerns: ["acne"], breakoutArea: "body", bodyAcneSeverity: "mild" })).toEqual([
      "salicylic-body-wash",
    ]);
  });

  it("matches face and body breakouts to both washes, ordered by score then name", () => {
    expect(ids({ ...faceAcne, breakoutArea: "both", bodyAcneSeverity: "mild" })).toEqual([
      "salicylic-body-wash",
      "salicylic-face-wash",
    ]);
  });

  it("matches oily skin on the face to the face wash", () => {
    const [match] = getProductMatches(BODYWISE_CATALOGUE, {
      concerns: ["oily-skin"],
      breakoutArea: "face",
      ageGroup: "13-17",
    });
    expect(match?.product.id).toBe("salicylic-face-wash");
    expect(match?.reasons[0]).toMatch(/oily skin/i);
  });

  it("matches body-fold pigmentation to the cream and underarm pigmentation to the roll-on", () => {
    expect(ids({ concerns: ["pigmentation"], pigmentationLocation: "body-folds" })).toEqual([
      "pigmentation-repair-cream",
    ]);
    expect(
      ids({
        concerns: ["pigmentation"],
        pigmentationLocation: "underarms",
        underarmPigmentationSeverity: "mild",
        ageGroup: "18-plus",
      }),
    ).toEqual(["underarm-roll-on"]);
  });

  it("matches body odour to the underarm roll-on", () => {
    const [match] = getProductMatches(BODYWISE_CATALOGUE, {
      concerns: ["body-odour"],
      ageGroup: "18-plus",
    });
    expect(match?.product.id).toBe("underarm-roll-on");
    expect(match?.reasons[0]).toMatch(/body odour/i);
  });

  it("scores a product higher when it covers more selected concerns", () => {
    const [match] = getProductMatches(BODYWISE_CATALOGUE, {
      concerns: ["body-odour", "pigmentation"],
      pigmentationLocation: "underarms",
      underarmPigmentationSeverity: "mild",
      ageGroup: "18-plus",
    });
    expect(match?.product.id).toBe("underarm-roll-on");
    expect(match?.score).toBe(2);
    expect(match?.matchedConcerns).toEqual(["body-odour", "pigmentation"]);
  });

  it("gives every match at least one reason and only concerns the user selected", () => {
    const answers: FinderAnswers = {
      concerns: ["acne", "body-odour", "pigmentation"],
      breakoutArea: "both",
      skinProfile: "oily",
      breakoutPattern: "mild-occasional",
      pigmentationLocation: "body-folds",
      bodyAcneSeverity: "mild",
      ageGroup: "18-plus",
    };
    const matches = getProductMatches(BODYWISE_CATALOGUE, answers);
    expect(matches.length).toBeGreaterThan(1);
    for (const match of matches) {
      expect(match.reasons.length).toBeGreaterThan(0);
      expect(match.score).toBe(match.matchedConcerns.length);
      for (const concern of match.matchedConcerns) expect(answers.concerns).toContain(concern);
    }
  });

  it("returns identical results for identical input and does not mutate it", () => {
    const answers: FinderAnswers = { ...faceAcne, breakoutArea: "both", bodyAcneSeverity: "mild" };
    const snapshot = structuredClone(answers);
    const catalogueSnapshot = structuredClone(BODYWISE_CATALOGUE);

    const first = getProductMatches(BODYWISE_CATALOGUE, answers);
    const second = getProductMatches(BODYWISE_CATALOGUE, answers);

    expect(second).toEqual(first);
    expect(answers).toEqual(snapshot);
    expect(BODYWISE_CATALOGUE).toEqual(catalogueSnapshot);
  });

  it("does not depend on the order of selected concerns", () => {
    const rest: FinderAnswers = {
      concerns: [],
      pigmentationLocation: "underarms",
      underarmPigmentationSeverity: "mild",
      ageGroup: "18-plus",
    };
    const a = ids({ ...rest, concerns: ["body-odour", "pigmentation"] });
    const b = ids({ ...rest, concerns: ["pigmentation", "body-odour"] });
    expect(a).toEqual(b);
  });

  it("returns copies of limitations so callers cannot alter the catalogue", () => {
    const [match] = getProductMatches(BODYWISE_CATALOGUE, faceAcne);
    match?.limitations.push("extra");
    expect(product("salicylic-face-wash").limitations).not.toContain("extra");
  });
});

describe("answers that must not produce a match", () => {
  it("does not offer the face wash for persistent or severe breakouts, dry/combination skin or unsure answers", () => {
    expect(ids({ ...faceAcne, breakoutPattern: "persistent-severe" })).toEqual([]);
    expect(ids({ ...faceAcne, skinProfile: "dry-combination" })).toEqual([]);
    expect(ids({ ...faceAcne, skinProfile: "unsure" })).toEqual([]);
    expect(ids({ ...faceAcne, breakoutPattern: "unsure" })).toEqual([]);
    expect(ids({ ...faceAcne, breakoutArea: "unsure" })).toEqual([]);
  });

  it("does not offer face-only products for body-only answers", () => {
    expect(ids({ concerns: ["oily-skin"], breakoutArea: "body" })).toEqual([]);
  });

  it("does not offer the pigmentation cream or roll-on for facial or unsure locations", () => {
    for (const pigmentationLocation of ["face", "elsewhere", "unsure"] as const) {
      expect(ids({ concerns: ["pigmentation"], pigmentationLocation })).toEqual([]);
    }
  });
});

describe("empty results", () => {
  it("returns no matches when nothing is selected", () => {
    expect(getProductMatches(BODYWISE_CATALOGUE, { concerns: [] })).toEqual([]);
  });

  it("returns no matches for 'Something else'", () => {
    expect(getProductMatches(BODYWISE_CATALOGUE, { concerns: ["other"] })).toEqual([]);
  });

  it("returns no matches for an empty catalogue", () => {
    expect(getProductMatches([], faceAcne)).toEqual([]);
    expect(getPotentialMatches([], faceAcne)).toEqual([]);
  });
});

describe("incomplete or partially verified product data", () => {
  const faceWash = product("salicylic-face-wash");
  const broken: [string, Partial<BodywiseProduct>][] = [
    ["partially verified", { verificationStatus: "partially-verified" }],
    ["unverified precautions", { precautions: INFORMATION_UNVERIFIED }],
    ["blank precautions", { precautions: "  " }],
    ["no ingredients", { ingredients: [] }],
    ["blank directions", { directions: "" }],
    ["blank intended use", { intendedUse: "" }],
    ["no verification date", { verifiedOn: "" }],
    ["no verified concerns", { verifiedConcerns: [] }],
    ["a non-official source URL", { sourceUrl: "https://example.com/product/face-wash" }],
  ];

  it("recommends the unmodified product (control)", () => {
    expect(ids(faceAcne, [faceWash])).toEqual(["salicylic-face-wash"]);
  });

  it.each(broken)("never recommends a product with %s", (_label, override) => {
    expect(ids(faceAcne, [{ ...faceWash, ...override }])).toEqual([]);
  });

  it("lists the unusable product as a potential match instead, when it relates to a selected concern", () => {
    const partial: BodywiseProduct = { ...faceWash, verificationStatus: "partially-verified" };
    const [item] = getPotentialMatches([partial], faceAcne);
    expect(item?.product).toEqual(partial);
    expect(item?.verificationGaps.join(" ")).toMatch(/partially verified/i);
    expect(getPotentialMatches([faceWash], faceAcne)).toEqual([]);
    expect(getPotentialMatches([partial], { concerns: ["hair-fall"] })).toEqual([]);
  });

  it("excludes the catalogue's partially verified hair serum from recommendations but reports it as a potential match", () => {
    const serum = product("advanced-hair-growth-serum");
    expect(serum.verificationStatus).toBe("partially-verified");
    expect(serum.precautions).toBe(INFORMATION_UNVERIFIED);

    const answers: FinderAnswers = { concerns: ["hair-fall"], ageGroup: "18-plus" };
    expect(ids(answers)).not.toContain(serum.id);
    const potential = getPotentialMatches(BODYWISE_CATALOGUE, answers);
    expect(potential.map((p) => p.product.id)).toContain(serum.id);
  });
});

describe("unsupported claims", () => {
  const withText = (overrides: Partial<BodywiseProduct>): BodywiseProduct => ({
    ...product("salicylic-face-wash"),
    ...overrides,
  });

  it("finds none in the shipped catalogue", () => {
    expect(getUnsupportedProductClaims(BODYWISE_CATALOGUE)).toEqual([]);
  });

  it.each([
    ["cure", "Cures acne for good"],
    ["guarantee", "Guarantees clear skin"],
    ["will-treat", "This will clear your skin"],
    ["diagnosis", "Diagnoses your skin condition"],
  ])("flags %s-style wording in the intended use", (_label, text) => {
    expect(getUnsupportedProductClaims([withText({ intendedUse: text })])).toEqual([
      `salicylic-face-wash: ${text}`,
    ]);
  });

  it("also checks the name, type and ingredients", () => {
    const flagged = getUnsupportedProductClaims([
      withText({ name: "Acne Cure Wash", type: "Skin cure", ingredients: ["Cures everything"] }),
    ]);
    expect(flagged).toHaveLength(3);
  });

  it("does not flag the word 'cure' inside other words, or neutral wording", () => {
    expect(
      getUnsupportedProductClaims([
        withText({ name: "Secure Care Wash", intendedUse: "For oily skin." }),
      ]),
    ).toEqual([]);
  });
});

describe("safety notices and products that must not be recommended", () => {
  it("states the required safety guidance", () => {
    expect(SAFETY_NOTICE).toMatch(/does not diagnose/i);
    expect(SAFETY_NOTICE).toMatch(/personalised medical advice/i);
    expect(SAFETY_NOTICE).toMatch(/does not guarantee results/i);
    expect(SAFETY_NOTICE).toMatch(/stop using the product/i);
    expect(SAFETY_NOTICE).toMatch(/healthcare professional/i);
    expect(SAFETY_NOTICE).toMatch(/urgent care/i);
  });

  it("gives every catalogue product an official source URL and verification date", () => {
    for (const p of BODYWISE_CATALOGUE) {
      expect(p.sourceUrl).toMatch(/^https:\/\/bebodywise\.com\/product\//);
      expect(p.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("marks any product without verified precautions as not verified", () => {
    for (const p of BODYWISE_CATALOGUE) {
      if (p.precautions === INFORMATION_UNVERIFIED) {
        expect(p.verificationStatus).not.toBe("verified");
      }
      if (p.verificationStatus === "verified") expect(p.precautions.trim()).not.toBe("");
    }
  });

  it("never recommends an unverified product for any possible answers", () => {
    const concernIds = CONCERNS.map((c) => c.id);
    const subsets: ConcernId[][] = [];
    for (let mask = 0; mask < 1 << concernIds.length; mask++) {
      subsets.push(concernIds.filter((_, i) => mask & (1 << i)));
    }
    const areas: (ApplicationArea | undefined)[] = [undefined, "face", "body", "both", "unsure"];
    const skins: (SkinProfile | undefined)[] = [undefined, "oily", "dry-combination", "unsure"];
    const patterns: (BreakoutPattern | undefined)[] = [
      undefined,
      "mild-occasional",
      "persistent-severe",
      "unsure",
    ];
    const places: (PigmentationLocation | undefined)[] = [
      undefined,
      "body-folds",
      "underarms",
      "face",
      "elsewhere",
      "unsure",
    ];

    let checked = 0;
    for (const concerns of subsets)
      for (const breakoutArea of areas)
        for (const skinProfile of skins)
          for (const breakoutPattern of patterns)
            for (const pigmentationLocation of places) {
              const answers: FinderAnswers = { concerns };
              if (breakoutArea) answers.breakoutArea = breakoutArea;
              if (skinProfile) answers.skinProfile = skinProfile;
              if (breakoutPattern) answers.breakoutPattern = breakoutPattern;
              if (pigmentationLocation) answers.pigmentationLocation = pigmentationLocation;
              for (const match of getProductMatches(BODYWISE_CATALOGUE, answers)) {
                expect(match.product.verificationStatus).toBe("verified");
                expect(match.product.precautions).not.toBe(INFORMATION_UNVERIFIED);
                expect(match.product.id).not.toBe("advanced-hair-growth-serum");
                expect(getVerificationGaps(match.product)).toEqual([]);
                expect(match.reasons.length).toBeGreaterThan(0);
              }
              checked++;
            }
    expect(checked).toBeGreaterThan(5000);
  });
});

describe("verification record", () => {
  it("records what was checked, and when, for every product", () => {
    for (const p of BODYWISE_CATALOGUE) {
      expect(p.verificationNotes.checkedOn).toBe(p.verifiedOn);
      expect(p.verificationNotes.confirmed.length).toBeGreaterThan(0);
    }
  });

  it("records the unconfirmed safety information for any product without verified precautions", () => {
    for (const p of BODYWISE_CATALOGUE) {
      if (p.precautions === INFORMATION_UNVERIFIED) {
        expect(p.verificationNotes.notConfirmed.join(" ")).toMatch(/precautions/i);
      }
    }
  });

  it("does not state a single rosemary strength where the official page is inconsistent", () => {
    const serum = product("advanced-hair-growth-serum");
    expect(serum.ingredients.join(" ")).not.toMatch(/^1% rosemary|3% rosemary/i);
    expect(serum.verificationNotes.notConfirmed.join(" ")).toMatch(/rosemary/i);
  });

  it("only cites other products and ages that the official pages state", () => {
    expect(product("salicylic-face-wash").intendedUse).toMatch(/13/);
    expect(product("underarm-roll-on").limitations.join(" ")).toMatch(/18/);
  });
});

describe("age and severity scope", () => {
  const issuesFor = (answers: FinderAnswers, id: string) =>
    getWithheldProducts(BODYWISE_CATALOGUE, answers)
      .find((w) => w.product.id === id)
      ?.issues.join(" ");

  describe("face wash (page lists ages 13 and above)", () => {
    it("is recommended for 13 to 17 and 18 or over", () => {
      expect(ids({ ...faceAcne, ageGroup: "13-17" })).toEqual(["salicylic-face-wash"]);
      expect(ids({ ...faceAcne, ageGroup: "18-plus" })).toEqual(["salicylic-face-wash"]);
    });

    it("is withheld, with the reason, for under 13", () => {
      const answers: FinderAnswers = { ...faceAcne, ageGroup: "under-13" };
      expect(ids(answers)).toEqual([]);
      expect(issuesFor(answers, "salicylic-face-wash")).toMatch(/under 13.*13 and above/);
    });

    it.each<[string, AgeGroup | undefined]>([
      ["prefer not to say", "unsure"],
      ["unanswered", undefined],
    ])("is withheld, as unconfirmed, when the age group is %s", (_label, ageGroup) => {
      const answers: FinderAnswers = { ...faceAcne };
      delete answers.ageGroup;
      if (ageGroup) answers.ageGroup = ageGroup;
      expect(ids(answers)).toEqual([]);
      expect(issuesFor(answers, "salicylic-face-wash")).toMatch(/could not confirm your age/i);
    });

    it("applies the same age rule to oily skin without breakouts", () => {
      const oily: FinderAnswers = { concerns: ["oily-skin"], breakoutArea: "face" };
      expect(ids({ ...oily, ageGroup: "under-13" })).toEqual([]);
      expect(ids(oily)).toEqual([]);
      expect(ids({ ...oily, ageGroup: "13-17" })).toEqual(["salicylic-face-wash"]);
    });

    it("explains persistent or severe, dry/combination and unsure answers instead of recommending", () => {
      expect(
        issuesFor({ ...faceAcne, breakoutPattern: "persistent-severe" }, "salicylic-face-wash"),
      ).toMatch(/persistent or severe/);
      expect(
        issuesFor({ ...faceAcne, skinProfile: "dry-combination" }, "salicylic-face-wash"),
      ).toMatch(/dry or combination/);
      expect(issuesFor({ ...faceAcne, breakoutPattern: "unsure" }, "salicylic-face-wash")).toMatch(
        /could not confirm/,
      );
    });
  });

  describe("body wash (page lists mild body acne)", () => {
    const bodyAcne: FinderAnswers = { concerns: ["acne"], breakoutArea: "body" };

    it("is recommended only for mild body acne, with a severity reason", () => {
      const [match] = getProductMatches(BODYWISE_CATALOGUE, {
        ...bodyAcne,
        bodyAcneSeverity: "mild",
      });
      expect(match?.product.id).toBe("salicylic-body-wash");
      expect(match?.reasons.join(" ")).toMatch(/mild/);
    });

    it.each<[string, BodyAcneSeverity | undefined]>([
      ["severe-or-marks", "severe-or-marks"],
      ["unsure", "unsure"],
      ["unanswered", undefined],
    ])("is withheld, not substituted, when severity is %s", (_label, severity) => {
      const answers: FinderAnswers = { ...bodyAcne };
      if (severity) answers.bodyAcneSeverity = severity;
      expect(getProductMatches(BODYWISE_CATALOGUE, answers)).toEqual([]);
      expect(withheldIds(answers)).toEqual(["salicylic-body-wash"]);
    });

    it("explains severe body acne or acne marks using the page's wording", () => {
      expect(
        issuesFor({ ...bodyAcne, bodyAcneSeverity: "severe-or-marks" }, "salicylic-body-wash"),
      ).toMatch(/severe body acne and acne marks/);
    });

    it("withholds only the body wash when face and body are selected and body acne is severe", () => {
      const answers: FinderAnswers = {
        ...faceAcne,
        breakoutArea: "both",
        bodyAcneSeverity: "severe-or-marks",
      };
      expect(ids(answers)).toEqual(["salicylic-face-wash"]);
      expect(withheldIds(answers)).toEqual(["salicylic-body-wash"]);
    });
  });

  describe("underarm roll-on (age guidance on the page is inconsistent)", () => {
    const odour: FinderAnswers = { concerns: ["body-odour"] };

    it("is recommended for odour at 18 or over without a severity question", () => {
      expect(ids({ ...odour, ageGroup: "18-plus" })).toEqual(["underarm-roll-on"]);
    });

    it.each<[string, AgeGroup | undefined]>([
      ["under 13", "under-13"],
      ["13 to 17 (borderline)", "13-17"],
      ["prefer not to say", "unsure"],
      ["unanswered", undefined],
    ])("is withheld when the age group is %s", (_label, ageGroup) => {
      const answers: FinderAnswers = { ...odour };
      if (ageGroup) answers.ageGroup = ageGroup;
      expect(ids(answers)).toEqual([]);
      expect(withheldIds(answers)).toEqual(["underarm-roll-on"]);
    });

    it("states the page's conflict rather than inventing an eligibility rule", () => {
      const text = issuesFor({ ...odour, ageGroup: "13-17" }, "underarm-roll-on");
      expect(text).toMatch(/inconsistent/);
      expect(text).toMatch(/above 18/);
      expect(text).toMatch(/teenagers/);
      expect(text).toMatch(/cannot be established/);
    });

    it("requires mild (about 1 shade) underarm pigmentation", () => {
      const pigment: FinderAnswers = {
        concerns: ["pigmentation"],
        pigmentationLocation: "underarms",
        ageGroup: "18-plus",
      };
      expect(ids({ ...pigment, underarmPigmentationSeverity: "mild" })).toEqual([
        "underarm-roll-on",
      ]);
      const notMild: (UnderarmPigmentationSeverity | undefined)[] = [
        "moderate",
        "severe",
        "unsure",
        undefined,
      ];
      for (const severity of notMild) {
        const answers: FinderAnswers = { ...pigment };
        if (severity) answers.underarmPigmentationSeverity = severity;
        expect(ids(answers)).toEqual([]);
        expect(withheldIds(answers)).toEqual(["underarm-roll-on"]);
      }
    });

    it("withholds the roll-on when odour is selected but underarm pigmentation is moderate", () => {
      const answers: FinderAnswers = {
        concerns: ["body-odour", "pigmentation"],
        pigmentationLocation: "underarms",
        underarmPigmentationSeverity: "moderate",
        ageGroup: "18-plus",
      };
      expect(ids(answers)).toEqual([]);
      expect(issuesFor(answers, "underarm-roll-on")).toMatch(/2 shades darker/);
    });

    it("reports both the age and severity issues together", () => {
      const answers: FinderAnswers = {
        concerns: ["pigmentation"],
        pigmentationLocation: "underarms",
        underarmPigmentationSeverity: "severe",
        ageGroup: "13-17",
      };
      expect(getWithheldProducts(BODYWISE_CATALOGUE, answers)[0]?.issues).toHaveLength(2);
    });
  });

  describe("products without a stated age or severity split", () => {
    it("does not gate the body-fold cream on age or severity", () => {
      expect(ids({ concerns: ["pigmentation"], pigmentationLocation: "body-folds" })).toEqual([
        "pigmentation-repair-cream",
      ]);
    });
  });

  describe("questions are only asked where a page draws the distinction", () => {
    it("asks for age only where a page states an age: face wash, roll-on and the 18+ hair products", () => {
      expect(requiresAgeGroup({ concerns: ["acne"], breakoutArea: "body" })).toBe(false);
      expect(
        requiresAgeGroup({
          concerns: ["pigmentation"],
          pigmentationLocation: "body-folds",
        }),
      ).toBe(false);
      expect(requiresAgeGroup({ concerns: ["hair-fall"] })).toBe(true);
      expect(requiresAgeGroup({ concerns: ["acne"], breakoutArea: "face" })).toBe(true);
      expect(requiresAgeGroup({ concerns: ["body-odour"] })).toBe(true);
    });

    it("asks body-acne severity only for body acne, and underarm shade only for underarms", () => {
      expect(requiresBodyAcneSeverity({ concerns: ["acne"], breakoutArea: "face" })).toBe(false);
      expect(requiresBodyAcneSeverity({ concerns: ["acne"], breakoutArea: "both" })).toBe(true);
      expect(requiresUnderarmPigmentationSeverity({ concerns: ["body-odour"] })).toBe(false);
      expect(
        requiresUnderarmPigmentationSeverity({
          concerns: ["pigmentation"],
          pigmentationLocation: "body-folds",
        }),
      ).toBe(false);
      expect(
        requiresUnderarmPigmentationSeverity({
          concerns: ["pigmentation"],
          pigmentationLocation: "underarms",
        }),
      ).toBe(true);
    });
  });

  describe("withheld products", () => {
    it("never lists an unverified product (those are reported as potential matches)", () => {
      expect(withheldIds({ concerns: ["hair-fall"] })).toEqual([
        "folli-advanced-hair-growth-roll-on",
      ]);
      expect(getWithheldProducts(BODYWISE_CATALOGUE, { concerns: [] })).toEqual([]);
    });

    it("never overlaps with recommendations, and every recommendation meets its page's scope", () => {
      const concernIds = CONCERNS.map((c) => c.id);
      const subsets: ConcernId[][] = [];
      for (let mask = 0; mask < 1 << concernIds.length; mask++) {
        subsets.push(concernIds.filter((_, i) => mask & (1 << i)));
      }
      const areas: (ApplicationArea | undefined)[] = [undefined, "face", "body", "both", "unsure"];
      const places: (PigmentationLocation | undefined)[] = [
        undefined,
        "body-folds",
        "underarms",
        "face",
        "elsewhere",
        "unsure",
      ];
      const bodySev: (BodyAcneSeverity | undefined)[] = [
        undefined,
        "mild",
        "severe-or-marks",
        "unsure",
      ];
      const armSev: (UnderarmPigmentationSeverity | undefined)[] = [
        undefined,
        "mild",
        "moderate",
        "severe",
        "unsure",
      ];
      const ages: (AgeGroup | undefined)[] = [undefined, "under-13", "13-17", "18-plus", "unsure"];

      let checked = 0;
      for (const concerns of subsets)
        for (const breakoutArea of areas)
          for (const pigmentationLocation of places)
            for (const bodyAcneSeverity of bodySev)
              for (const underarmPigmentationSeverity of armSev)
                for (const ageGroup of ages) {
                  const answers: FinderAnswers = {
                    concerns,
                    skinProfile: "oily",
                    breakoutPattern: "mild-occasional",
                  };
                  if (breakoutArea) answers.breakoutArea = breakoutArea;
                  if (pigmentationLocation) answers.pigmentationLocation = pigmentationLocation;
                  if (bodyAcneSeverity) answers.bodyAcneSeverity = bodyAcneSeverity;
                  if (underarmPigmentationSeverity) {
                    answers.underarmPigmentationSeverity = underarmPigmentationSeverity;
                  }
                  if (ageGroup) answers.ageGroup = ageGroup;

                  const recommended = ids(answers);
                  const withheld = withheldIds(answers);
                  for (const id of recommended) expect(withheld).not.toContain(id);

                  if (recommended.includes("salicylic-face-wash")) {
                    expect(["13-17", "18-plus"]).toContain(ageGroup);
                  }
                  if (recommended.includes("salicylic-body-wash")) {
                    expect(bodyAcneSeverity).toBe("mild");
                  }
                  if (recommended.includes("underarm-roll-on")) {
                    expect(ageGroup).toBe("18-plus");
                    if (concerns.includes("pigmentation") && pigmentationLocation === "underarms") {
                      expect(underarmPigmentationSeverity).toBe("mild");
                    }
                  }
                  checked++;
                }
      expect(checked).toBeGreaterThan(100000);
    });
  });
});

describe("hair fall or thinning: matching and the safety gate", () => {
  const folli = product("folli-advanced-hair-growth-roll-on");
  const serum = product("advanced-hair-growth-serum");
  const shampoo = product("keratin-hair-fall-shampoo");
  const adultHair: FinderAnswers = { concerns: ["hair-fall"], ageGroup: "18-plus" };
  const potentialIds = (
    answers: FinderAnswers,
    products: readonly BodywiseProduct[] = BODYWISE_CATALOGUE,
  ) => getPotentialMatches(products, answers).map((p) => p.product.id);

  // Based on the official Hair Strengthening Serum page: listed for frizz, dry and damaged hair,
  // not for hair fall, and advised for hair strands rather than the scalp.
  const strengtheningSerum: BodywiseProduct = {
    ...folli,
    id: "hair-strengthening-serum",
    name: "Hair Strengthening Serum",
    sourceUrl: "https://bebodywise.com/product/hair-strengthening-serum",
    verifiedConcerns: ["other"],
    intendedUse: "The brand lists this serum for frizz reduction and dry, damaged hair.",
  };

  describe("1. a verified, relevant hair product is recommended", () => {
    it("recommends the verified roll-on for hair fall or thinning, with reasons and no verification gaps", () => {
      const matches = getProductMatches(BODYWISE_CATALOGUE, adultHair);
      expect(matches.map((m) => m.product.id)).toEqual(["folli-advanced-hair-growth-roll-on"]);
      expect(getVerificationGaps(folli)).toEqual([]);
      expect(matches[0]?.matchedConcerns).toEqual(["hair-fall"]);
      expect(matches[0]?.reasons.join(" ")).toMatch(/hair thinning and improved hair volume/);
      expect(matches[0]?.limitations.join(" ")).toMatch(/hair fall alone/);
      expect(folli.precautions).not.toBe(INFORMATION_UNVERIFIED);
      expect(folli.sourceUrl).toMatch(/^https:\/\/bebodywise\.com\/product\//);
    });

    it("applies the 18+ age listing: under 18, 'prefer not to say' and unanswered are withheld", () => {
      for (const ageGroup of ["under-13", "13-17", "unsure", undefined] as const) {
        const answers: FinderAnswers = { concerns: ["hair-fall"] };
        if (ageGroup) answers.ageGroup = ageGroup;
        expect(ids(answers)).toEqual([]);
        expect(withheldIds(answers)).toEqual(["folli-advanced-hair-growth-roll-on"]);
      }
    });
  });

  describe("2. a hair product for a different concern is not recommended for hair fall", () => {
    it("does not recommend or list a product whose official page supports another concern", () => {
      const catalogue = [...BODYWISE_CATALOGUE, strengtheningSerum];
      expect(ids(adultHair, catalogue)).not.toContain("hair-strengthening-serum");
      expect(potentialIds(adultHair, catalogue)).not.toContain("hair-strengthening-serum");
    });

    it("does not recommend an in-scope product whose recorded concerns do not support hair fall", () => {
      const mistagged: BodywiseProduct = { ...folli, verifiedConcerns: ["acne"] };
      expect(ids(adultHair, [mistagged])).toEqual([]);
      expect(potentialIds(adultHair, [mistagged])).toEqual([]);
    });
  });

  describe("3. unverified required precautions are never promoted to a recommendation", () => {
    it("keeps the serum and shampoo out of recommendations and shows them as potential matches", () => {
      expect(ids(adultHair)).not.toContain(serum.id);
      expect(ids(adultHair)).not.toContain(shampoo.id);
      const potential = getPotentialMatches(BODYWISE_CATALOGUE, adultHair);
      expect(potential.map((p) => p.product.id).sort()).toEqual([serum.id, shampoo.id].sort());
      for (const item of potential) {
        expect(item.verificationGaps.join(" ")).toMatch(/precautions/i);
        expect(item.reasons.length).toBeGreaterThan(0);
      }
    });

    it("demotes a verified product to a potential match as soon as its precautions are unverified", () => {
      const demoted: BodywiseProduct = { ...folli, precautions: INFORMATION_UNVERIFIED };
      expect(ids(adultHair, [demoted])).toEqual([]);
      expect(potentialIds(adultHair, [demoted])).toEqual([folli.id]);
    });

    it("does not promote a product when only its directions are unverified", () => {
      const noDirections: BodywiseProduct = { ...folli, directions: INFORMATION_UNVERIFIED };
      expect(ids(adultHair, [noDirections])).toEqual([]);
      expect(getVerificationGaps(noDirections).join(" ")).toMatch(/directions/i);
    });

    it("never invents the missing information", () => {
      expect(serum.precautions).toBe(INFORMATION_UNVERIFIED);
      expect(shampoo.precautions).toBe(INFORMATION_UNVERIFIED);
      expect(shampoo.verificationNotes.notConfirmed.join(" ")).toMatch(/Precautions/);
    });
  });

  describe("4. irrelevant products are excluded", () => {
    it("shows no skin product for hair fall, in any list", () => {
      const skin = [
        "salicylic-face-wash",
        "salicylic-body-wash",
        "pigmentation-repair-cream",
        "underarm-roll-on",
      ];
      const shown = [...ids(adultHair), ...potentialIds(adultHair), ...withheldIds(adultHair)];
      for (const id of skin) expect(shown).not.toContain(id);
    });

    it("shows no hair product for skin concerns, in any list", () => {
      const hair = [folli.id, serum.id, shampoo.id];
      const shown = [
        ...ids(faceAcne),
        ...potentialIds(faceAcne),
        ...withheldIds(faceAcne),
        ...ids({ concerns: ["body-odour"], ageGroup: "18-plus" }),
        ...potentialIds({ concerns: ["body-odour"], ageGroup: "18-plus" }),
      ];
      for (const id of hair) expect(shown).not.toContain(id);
    });
  });

  describe("5. missing source information does not bypass the gate", () => {
    const bad: [string, Partial<BodywiseProduct>, RegExp][] = [
      ["an empty source URL", { sourceUrl: "" }, /official Be Bodywise product page/],
      ["a blank source URL", { sourceUrl: "   " }, /official Be Bodywise product page/],
      ["a non-https source URL", { sourceUrl: "http://bebodywise.com/product/x" }, /official/],
      ["another website", { sourceUrl: "https://example.com/product/x" }, /official/],
      [
        "a look-alike domain",
        { sourceUrl: "https://bebodywise.com.example.net/product/x" },
        /official/,
      ],
      ["no verification date", { verifiedOn: "" }, /verification date/],
      ["no recorded concern", { verifiedConcerns: [] }, /concern/],
      ["no recorded ingredients", { ingredients: [] }, /ingredients/],
      ["no recorded intended use", { intendedUse: "" }, /intended use/],
    ];

    it.each(bad)("never recommends a product with %s", (_label, override, gap) => {
      const broken: BodywiseProduct = { ...folli, ...override };
      expect(ids(adultHair, [broken])).toEqual([]);
      expect(getVerificationGaps(broken).join(" ")).toMatch(gap);
    });

    it("does not even list a product as potential when no supported concern is recorded", () => {
      expect(potentialIds(adultHair, [{ ...folli, verifiedConcerns: [] }])).toEqual([]);
    });

    it("reports no gaps only for products with every required item verified", () => {
      const gapFree = BODYWISE_CATALOGUE.filter((p) => getVerificationGaps(p).length === 0).map(
        (p) => p.id,
      );
      expect(gapFree).toContain(folli.id);
      expect(gapFree).not.toContain(serum.id);
      expect(gapFree).not.toContain(shampoo.id);
    });
  });

  describe("6. the no-match state", () => {
    it("returns no recommendations, but still explains, when no eligible hair product exists", () => {
      const underage: FinderAnswers = { concerns: ["hair-fall"], ageGroup: "13-17" };
      expect(getProductMatches(BODYWISE_CATALOGUE, underage)).toEqual([]);
      expect(withheldIds(underage)).toEqual([folli.id]);
      // The shampoo states no age, so it can be a potential match; the 18+ serum cannot.
      expect(potentialIds(underage)).toEqual([shampoo.id]);
    });

    it("returns nothing at all for an empty catalogue or no selected concern", () => {
      expect(ids(adultHair, [])).toEqual([]);
      expect(potentialIds(adultHair, [])).toEqual([]);
      expect(getPotentialMatches(BODYWISE_CATALOGUE, { concerns: [] })).toEqual([]);
    });

    it("returns no recommendation when every hair product is unverified", () => {
      const unverified = BODYWISE_CATALOGUE.map((p) => ({
        ...p,
        verificationStatus: "partially-verified" as const,
      }));
      expect(ids(adultHair, unverified)).toEqual([]);
    });
  });

  describe("7. skin matching and the age and severity safeguards still apply", () => {
    it("still matches the face wash for mild, occasional face acne at 18 or over", () => {
      expect(ids(faceAcne)).toEqual(["salicylic-face-wash"]);
    });

    it("still withholds the roll-on for 13 to 17, and the body wash for severe body acne", () => {
      expect(ids({ concerns: ["body-odour"], ageGroup: "13-17" })).toEqual([]);
      expect(
        ids({ concerns: ["acne"], breakoutArea: "body", bodyAcneSeverity: "severe-or-marks" }),
      ).toEqual([]);
    });

    it("does not let selecting hair fall change a skin result", () => {
      expect(ids({ ...faceAcne, concerns: ["acne", "hair-fall"] })).toEqual([
        "salicylic-face-wash",
        "folli-advanced-hair-growth-roll-on",
      ]);
    });
  });

  it("states professional-assessment guidance without diagnosing or promising anything", () => {
    expect(HAIR_LOSS_GUIDANCE).toMatch(/doctor or dermatologist/);
    expect(HAIR_LOSS_GUIDANCE).not.toMatch(/\b(cure|guarantee|diagnos)/i);
  });
});
