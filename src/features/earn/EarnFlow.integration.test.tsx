import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useAccountStore } from "../../api/adapters/mock/accountStore";
import App from "../../App";

beforeEach(() => {
  useAccountStore.getState().reset();
  window.history.pushState({}, "", "/");
});

describe("Earn flow, end to end", () => {
  it("adding to Earn and moving out both reflect back on the Dashboard", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("$12,480.32")).toBeInTheDocument();

    // "Earn" appears in the sidebar nav and as the Dashboard's Earn widget
    // link; the sidebar one renders first.
    await user.click(screen.getAllByRole("link", { name: /earn/i })[0]);
    await user.click(await screen.findByRole("link", { name: "Add to Earn" }));
    // Wait for the async available-balance fetch before interacting — a chip
    // clicked before it resolves would validate against 0 and stay disabled.
    await screen.findByText("Available $9,280.32");
    await user.click(screen.getByRole("button", { name: "$100" }));
    await user.click(screen.getByRole("button", { name: /start earning/i }));

    await screen.findByText("Earning");
    await user.click(screen.getByRole("link", { name: "Done" }));

    // Total is unchanged, but the available/in-Earn split has moved. $3,300
    // appears twice — once in the balance card's "In Earn" stat, once as the
    // Earn widget's own headline amount — both reading the same store state.
    expect(await screen.findByText("$12,480.32")).toBeInTheDocument();
    expect(screen.getByText("$9,180.32")).toBeInTheDocument(); // Available
    expect(screen.getAllByText("$3,300.00")).toHaveLength(2); // In Earn (card stat + widget)

    await user.click(screen.getAllByRole("link", { name: /earn/i })[0]);
    await user.click(await screen.findByRole("link", { name: "Move out" }));
    await screen.findByText("Available $3,300.00");
    // Partial (50%), not Max — moving out the full $3,300 would make
    // availableUsd equal totalUsd once inEarnUsd hits zero, colliding with
    // the total-balance assertion below. 50% keeps every figure distinct.
    await user.click(screen.getByRole("button", { name: "50%" }));
    await user.click(screen.getByRole("button", { name: /move out/i }));

    await screen.findByText("Moved out");
    await user.click(screen.getByRole("link", { name: "Done" }));

    expect(await screen.findByText("$12,480.32")).toBeInTheDocument();
    expect(screen.getByText("$10,830.32")).toBeInTheDocument(); // Available, partially restored
    expect(screen.getAllByText("$1,650.00")).toHaveLength(2); // In Earn (card stat + widget)
  });
});
