import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useAccountStore } from "../../api/adapters/mock/accountStore";
import App from "../../App";

beforeEach(() => {
  useAccountStore.getState().reset();
  window.history.pushState({}, "", "/");
});

describe("Withdraw flow, end to end", () => {
  it("a confirmed withdrawal debits the balance and adds a transaction back on the Dashboard", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("$12,480.32")).toBeInTheDocument();

    const balanceCard = screen.getByLabelText("Total balance");
    await user.click(within(balanceCard).getByRole("link", { name: /withdraw/i }));

    await screen.findByText("Available $9,280.32");
    await user.type(screen.getByLabelText("Amount in USD"), "100");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await screen.findByText("Withdraw to bank");
    await user.click(screen.getByRole("button", { name: /verify account/i }));
    await screen.findByText(/sending to/i);
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    await screen.findByText(/rate locked for/i);
    await user.click(screen.getByRole("button", { name: /confirm withdrawal/i }));

    await screen.findByText("On its way");
    await user.click(screen.getByRole("link", { name: "Done" }));

    expect(await screen.findByText("$12,380.32")).toBeInTheDocument();
    expect(within(screen.getByLabelText("Total balance")).getByText("$9,180.32")).toBeInTheDocument();

    // "To bank account" also appears on a pre-existing seeded transaction, so
    // find the new row via its distinct subtitle instead.
    const row = screen.getByText("ACH · ••1124").closest("li") as HTMLElement;
    expect(within(row).getByText("To bank account")).toBeInTheDocument();
    expect(within(row).getByText("-$100.00")).toBeInTheDocument();
  });
});
