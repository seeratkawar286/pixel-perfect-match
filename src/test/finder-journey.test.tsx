import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Route } from "@/routes/index";
import { INFORMATION_UNVERIFIED, SAFETY_NOTICE } from "@/lib/bodywise-catalogue";

function renderApp() {
  const Page = Route.options.component;
  if (!Page) throw new Error("Index route has no component");
  return render(<Page />);
}

const click = (name: string | RegExp, role: "button" | "checkbox" | "radio" = "button") =>
  fireEvent.click(screen.getByRole(role, { name }));
const next = () => click("Continue");
const heading = () => screen.getByRole("heading", { level: 1 }).textContent;
const cards = () => screen.queryAllByRole("article");

function answerFaceAcne() {
  click("Start");
  click(/Breakouts/, "checkbox");
  next();
  click("Face", "radio");
  next();
  click("Oily", "radio");
  next();
  click(/Mild and occasional/, "radio");
  next();
  click("18 or over", "radio");
  next();
}

describe("Bodywise Clarity journey", () => {
  it("introduces the tool as independent, not official, and not medical", () => {
    renderApp();
    expect(heading()).toMatch(/Be Bodywise products/);
    const main = within(screen.getByRole("main"));
    expect(main.getByText(/not an official Be Bodywise service/i)).toBeInTheDocument();
    expect(main.getByText(/does not diagnose or treat medical conditions/i)).toBeInTheDocument();
  });

  it("offers exactly the six catalogue concerns and requires a choice before continuing", () => {
    renderApp();
    click("Start");
    expect(heading()).toBe("What would you like to explore?");
    expect(screen.getAllByRole("checkbox")).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    click(/Hair fall or thinning/, "checkbox");
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("shows a verified match with reasons, details, precautions, source and safety notice", () => {
    renderApp();
    answerFaceAcne();

    expect(heading()).toBe("1 product listed for what you told us");
    const [card] = cards();
    const view = within(card!);
    expect(view.getByRole("heading", { name: "2% Salicylic Acid Face Wash" })).toBeInTheDocument();
    expect(view.getByText(/Verified from official page/)).toBeInTheDocument();
    expect(view.getByText("Why it matched")).toBeInTheDocument();
    expect(
      view.getByText(/You selected face breakouts and described them as mild and occasional/),
    ).toBeInTheDocument();
    expect(view.getByText("2% salicylic acid")).toBeInTheDocument();
    expect(view.getByText(/Squeeze a small quantity/)).toBeInTheDocument();
    expect(view.getByText(/patch test/)).toBeInTheDocument();
    expect(view.getByText("Not confirmed on the official page")).toBeInTheDocument();
    expect(view.getByText(/every day, starting twice a day/)).toBeInTheDocument();
    expect(view.getByRole("link", { name: /Official product page/ })).toHaveAttribute(
      "href",
      "https://bebodywise.com/product/2-salicylic-acid-face-wash",
    );
    expect(screen.getByText(SAFETY_NOTICE)).toBeInTheDocument();
  });

  it("keeps earlier answers when going back, and skips questions that no longer apply", () => {
    renderApp();
    click("Start");
    click(/Breakouts/, "checkbox");
    next();
    click("Body", "radio");
    next();
    // Body-only breakouts need no face-skin or age questions, only the body severity question.
    expect(heading()).toBe("How would you describe your body breakouts?");
    click("Mild body acne", "radio");
    next();
    expect(heading()).toBe("1 product listed for what you told us");
    expect(within(cards()[0]!).getByRole("heading", { name: "1% Salicylic Acid Body Wash" }));
    expect(screen.queryByText("Age group")).not.toBeInTheDocument();

    click("Back");
    expect(screen.getByRole("radio", { name: "Mild body acne" })).toBeChecked();
    click("Back");
    expect(heading()).toBe("Where do you get breakouts?");
    expect(screen.getByRole("radio", { name: "Body" })).toBeChecked();
    click("Back");
    expect(screen.getByRole("checkbox", { name: /Breakouts/ })).toBeChecked();
  });

  it("lets users edit an answer from the results", () => {
    renderApp();
    answerFaceAcne();
    fireEvent.click(screen.getByRole("button", { name: "Edit face skin" }));
    expect(heading()).toBe("How would you describe your face skin?");
    click("Dry or combination", "radio");
    next();
    next();
    next();
    expect(heading()).toBe("No matching products right now");
    expect(cards()).toHaveLength(0);
    expect(screen.getByText("Not matched to your answers")).toBeInTheDocument();
    expect(screen.getByText(/dry or combination/)).toBeInTheDocument();
  });

  it("shows a helpful, non-pushy empty result with the safety notice", () => {
    renderApp();
    click("Start");
    click(/Something else/, "checkbox");
    next();

    expect(heading()).toBe("No matching products right now");
    expect(cards()).toHaveLength(0);
    expect(screen.getByText(/There’s no need to buy anything/)).toBeInTheDocument();
    expect(screen.getByText(/dermatologist or doctor/)).toBeInTheDocument();
    expect(screen.getByText(SAFETY_NOTICE)).toBeInTheDocument();
  });

  it("does not recommend the partially verified hair serum and labels it unverified", () => {
    renderApp();
    click("Start");
    click(/Hair fall or thinning/, "checkbox");
    next();

    expect(heading()).toBe("No matching products right now");
    expect(cards()).toHaveLength(0);
    expect(screen.getByText("Related products we can’t recommend yet")).toBeInTheDocument();
    expect(screen.getByText("Advanced Hair Growth Serum")).toBeInTheDocument();
    expect(screen.getByText("Partially verified")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(INFORMATION_UNVERIFIED))).toBeInTheDocument();
    expect(screen.queryByText("2% Aminexil")).not.toBeInTheDocument();
  });

  it("explains persistent or severe face breakouts without recommending the face wash", () => {
    renderApp();
    click("Start");
    click(/Breakouts/, "checkbox");
    next();
    click("Face", "radio");
    next();
    click("Oily", "radio");
    next();
    click(/Persistent or severe/, "radio");
    next();
    click("18 or over", "radio");
    next();

    expect(heading()).toBe("No matching products right now");
    expect(cards()).toHaveLength(0);
    const withheld = within(screen.getByText("Not matched to your answers").parentElement!);
    expect(withheld.getByText(/persistent or severe/)).toBeInTheDocument();
    expect(screen.getByText(/We’re not suggesting a substitute/)).toBeInTheDocument();
  });

  it("compares two matched products side by side", () => {
    renderApp();
    click("Start");
    click(/Breakouts/, "checkbox");
    next();
    click("Face and body", "radio");
    next();
    click("Oily", "radio");
    next();
    click(/Mild and occasional/, "radio");
    next();
    click("Mild body acne", "radio");
    next();
    click("13 to 17", "radio");
    next();

    expect(cards()).toHaveLength(2);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/Tick “Compare” on at least two products/)).toBeInTheDocument();

    for (const box of screen.getAllByRole("checkbox", { name: /Compare/ })) fireEvent.click(box);

    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "1% Salicylic Acid Body Wash" }));
    expect(within(table).getByRole("columnheader", { name: "2% Salicylic Acid Face Wash" }));
    for (const row of ["Ingredients", "Directions", "Precautions", "Limitations", "Source"]) {
      expect(within(table).getByRole("rowheader", { name: row })).toBeInTheDocument();
    }
  });

  it("restarts from the results back to the welcome screen with answers cleared", () => {
    renderApp();
    answerFaceAcne();
    click("Restart");
    expect(heading()).toMatch(/Be Bodywise products/);

    click("Start");
    expect(screen.getByRole("checkbox", { name: /Breakouts/ })).not.toBeChecked();
  });

  it("asks for an age group, not a date of birth, and requires an answer", () => {
    renderApp();
    click("Start");
    click(/Body odour/, "checkbox");
    next();

    expect(heading()).toBe("Which age group are you in?");
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/date of birth/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("recommends the roll-on for odour at 18 or over and shows reasons, precautions and source", () => {
    renderApp();
    click("Start");
    click(/Body odour/, "checkbox");
    next();
    click("18 or over", "radio");
    next();

    const [card] = cards();
    const view = within(card!);
    expect(view.getByRole("heading", { name: "4% AHA BHA Underarm Roll On" })).toBeInTheDocument();
    expect(view.getByText(/You said you are 18 or over/)).toBeInTheDocument();
    expect(view.getAllByText(/does not ask about gender/).length).toBeGreaterThan(0);
    expect(view.getByText(/6–12 hours after waxing/)).toBeInTheDocument();
    expect(view.getByRole("link", { name: /Official product page/ })).toHaveAttribute(
      "href",
      "https://bebodywise.com/product/4-aha-bha-underarm-roll-on",
    );
    expect(screen.getByText(SAFETY_NOTICE)).toBeInTheDocument();
  });

  it("withholds the roll-on for 13 to 17 and explains the page's inconsistent age guidance", () => {
    renderApp();
    click("Start");
    click(/Body odour/, "checkbox");
    next();
    click("13 to 17", "radio");
    next();

    expect(heading()).toBe("No matching products right now");
    expect(cards()).toHaveLength(0);
    expect(screen.getByText("Not matched to your answers")).toBeInTheDocument();
    expect(screen.getByText(/age guidance is inconsistent/)).toBeInTheDocument();
    expect(screen.getByText(/cannot be established/)).toBeInTheDocument();
    expect(screen.getByText(SAFETY_NOTICE)).toBeInTheDocument();
  });

  it("withholds the roll-on when the age group is not given", () => {
    renderApp();
    click("Start");
    click(/Body odour/, "checkbox");
    next();
    click("Prefer not to say", "radio");
    next();

    expect(cards()).toHaveLength(0);
    expect(screen.getByText(/could not confirm your age group/i)).toBeInTheDocument();
  });

  it("withholds the face wash for under 13", () => {
    renderApp();
    click("Start");
    click(/Oily skin/, "checkbox");
    next();
    click("Under 13", "radio");
    next();

    expect(cards()).toHaveLength(0);
    expect(screen.getByText(/You said you are under 13/)).toBeInTheDocument();
  });

  it("does not recommend a substitute for severe body acne", () => {
    renderApp();
    click("Start");
    click(/Breakouts/, "checkbox");
    next();
    click("Body", "radio");
    next();
    click("Severe body acne or acne marks", "radio");
    next();

    expect(heading()).toBe("No matching products right now");
    expect(cards()).toHaveLength(0);
    const withheld = within(screen.getByText("Not matched to your answers").parentElement!);
    expect(withheld.getByText("1% Salicylic Acid Body Wash")).toBeInTheDocument();
    expect(withheld.getByText(/severe body acne and acne marks/)).toBeInTheDocument();
    expect(screen.getByText(/There’s no need to buy anything/)).toBeInTheDocument();
    expect(screen.getByText(SAFETY_NOTICE)).toBeInTheDocument();
  });

  it("asks the underarm shade question only for underarm pigmentation, and withholds moderate", () => {
    renderApp();
    click("Start");
    click(/Uneven-looking tone/, "checkbox");
    next();
    click(/Body folds/, "radio");
    next();
    // Body folds: no shade or age question, straight to the cream.
    expect(cards()).toHaveLength(1);
    click("Restart");

    click("Start");
    click(/Uneven-looking tone/, "checkbox");
    next();
    click("Underarms", "radio");
    next();
    expect(heading()).toBe("How dark is your underarm skin?");
    click("About 2 shades darker", "radio");
    next();
    click("18 or over", "radio");
    next();

    expect(cards()).toHaveLength(0);
    expect(screen.getByText(/2 shades darker than your skin tone/)).toBeInTheDocument();
  });
});
