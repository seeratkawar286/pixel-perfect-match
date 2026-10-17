import { describe, expect, it } from "vitest";

import {
  BODYWISE_CATALOGUE,
  CONCERNS,
  INFORMATION_UNVERIFIED,
  SAFETY_NOTICE,
  getProductMatches,
  getUnavailableRelatedProducts,
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
    expect(getUnavailableRelatedProducts([], faceAcne)).toEqual([]);
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

  it("lists the unusable product as unavailable instead, when it relates to a selected concern", () => {
    const partial: BodywiseProduct = { ...faceWash, verificationStatus: "partially-verified" };
    expect(getUnavailableRelatedProducts([partial], faceAcne)).toEqual([partial]);
    expect(getUnavailableRelatedProducts([faceWash], faceAcne)).toEqual([]);
    expect(getUnavailableRelatedProducts([partial], { concerns: ["hair-fall"] })).toEqual([]);
  });

  it("excludes the catalogue's partially verified hair serum but reports it as unavailable", () => {
    const serum = product("advanced-hair-growth-serum");
    expect(serum.verificationStatus).toBe("partially-verified");
    expect(serum.precautions).toBe(INFORMATION_UNVERIFIED);

    const answers: FinderAnswers = { concerns: ["hair-fall"] };
    expect(getProductMatches(BODYWISE_CATALOGUE, answers)).toEqual([]);
    expect(getUnavailableRelatedProducts(BODYWISE_CATALOGUE, answers)).toEqual([serum]);
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
  const withheldIds = (answers: FinderAnswers) =>
    getWithheldProducts(BODYWISE_CATALOGUE, answers).map((w) => w.product.id);
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
    it("asks for age only for face-wash or roll-on scope", () => {
      expect(requiresAgeGroup({ concerns: ["acne"], breakoutArea: "body" })).toBe(false);
      expect(
        requiresAgeGroup({
          concerns: ["pigmentation"],
          pigmentationLocation: "body-folds",
        }),
      ).toBe(false);
      expect(requiresAgeGroup({ concerns: ["hair-fall"] })).toBe(false);
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
    it("never lists an unverified product (those are reported separately)", () => {
      expect(withheldIds({ concerns: ["hair-fall"] })).toEqual([]);
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
