import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useAccountStore } from "../../api/adapters/mock/accountStore";
import App from "../../App";

beforeEach(() => {
  useAccountStore.getState().reset();
  window.history.pushState({}, "", "/");
});

describe("Swap flow, end to end", () => {
  it("a confirmed swap updates the Dashboard balance and transaction list", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("$12,480.32")).toBeInTheDocument();

    // "Swap" appears both in the sidebar nav and as the balance card's CTA;
    // the CTA renders after the sidebar in DOM order.
    const swapLinks = screen.getAllByRole("link", { name: /swap/i });
    await user.click(swapLinks[swapLinks.length - 1]);
    await user.click(await screen.findByText("Ether"));
    await user.type(await screen.findByLabelText("Amount in ETH"), "0.1");
    await user.click(screen.getByRole("button", { name: /review swap/i }));

    await screen.findByText(/quote valid for/i);
    await user.click(screen.getByRole("button", { name: /confirm swap/i }));

    await screen.findByText("Swapped");
    await user.click(screen.getByRole("link", { name: "Done" }));

    expect(await screen.findByText("$12,805.12")).toBeInTheDocument();
    // "ETH → USDC" also matches the pre-existing seeded transaction (Sep 10),
    // so disambiguate the new one by its unique subtitle.
    expect(screen.getByText("0.1 ETH on Base")).toBeInTheDocument();
    expect(screen.getAllByText("ETH → USDC")).toHaveLength(2);
  });
});
