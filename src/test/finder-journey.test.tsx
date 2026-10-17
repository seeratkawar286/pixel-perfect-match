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
    // Body-only breakouts need no face-skin questions, so we go straight to results.
    expect(heading()).toBe("1 product listed for what you told us");
    expect(within(cards()[0]!).getByRole("heading", { name: "1% Salicylic Acid Body Wash" }));

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
    expect(heading()).toBe("No matching products right now");
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

    expect(heading()).toBe("No matching products right now");
    expect(screen.getByText("About persistent or severe breakouts")).toBeInTheDocument();
    expect(screen.queryByText("2% Salicylic Acid Face Wash")).not.toBeInTheDocument();
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
});
