import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { useAccountStore } from "../../api/adapters/mock/accountStore";
import { AddToEarnPage } from "./AddToEarnPage";

function renderAdd() {
  return render(
    <MemoryRouter initialEntries={["/earn/add"]}>
      <AddToEarnPage />
    </MemoryRouter>,
  );
}

async function renderReady() {
  const user = userEvent.setup();
  const utils = renderAdd();
  await screen.findByText("Available $9,280.32");
  return { user, ...utils };
}

beforeEach(() => {
  useAccountStore.getState().reset();
});

describe("AddToEarnPage", () => {
  it("disables submit until a valid amount is entered, and flags an over-balance amount", async () => {
    const { user } = await renderReady();
    const submit = screen.getByRole("button", { name: /start earning/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Amount in USD"), "999999");
    expect(await screen.findByText("Exceeds available balance")).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it("shows a live monthly yield estimate that updates with the amount, with no review step", async () => {
    const { user } = await renderReady();
    await user.type(screen.getByLabelText("Amount in USD"), "1200");
    expect(await screen.findByText(/≈ \+\$4\.85 per month at 4\.85% apy/i)).toBeInTheDocument();
  });

  it("submitting moves money into Earn and shows Complete with the account total unchanged", async () => {
    const { user } = await renderReady();
    await user.click(screen.getByRole("button", { name: "$100" }));
    await user.click(screen.getByRole("button", { name: /start earning/i }));

    expect(await screen.findByText("Earning")).toBeInTheDocument();
    expect(screen.getByText("$100.00 is now earning 4.85% APY.")).toBeInTheDocument();
    // Total is unchanged — this moves money within the account, not new money.
    const pill = screen.getByText(/New balance/i).closest("div") as HTMLElement;
    expect(within(pill).getByText("$12,480.32")).toBeInTheDocument();

    const state = useAccountStore.getState();
    expect(state.balance.availableUsd).toBeCloseTo(9180.32, 2);
    expect(state.balance.inEarnUsd).toBeCloseTo(3300.0, 2);
    expect(state.rewardPosition.principalUsd).toBeCloseTo(3300.0, 2);
    expect(state.transactions[0].title).toBe("Added to Earn");
    expect(state.transactions[0].amountUsd).toBeCloseTo(-100, 2);
  });
});
