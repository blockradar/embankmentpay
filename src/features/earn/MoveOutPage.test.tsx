import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { useAccountStore } from "../../api/adapters/mock/accountStore";
import { MoveOutPage } from "./MoveOutPage";

function renderMoveOut() {
  return render(
    <MemoryRouter initialEntries={["/earn/withdraw"]}>
      <MoveOutPage />
    </MemoryRouter>,
  );
}

async function renderReady() {
  const user = userEvent.setup();
  const utils = renderMoveOut();
  await screen.findByText("Available $3,200.00");
  return { user, ...utils };
}

beforeEach(() => {
  useAccountStore.getState().reset();
});

describe("MoveOutPage", () => {
  it("caps the amount at what's actually earning, not the account's available balance", async () => {
    const { user } = await renderReady();
    const submit = screen.getByRole("button", { name: /move out/i });
    expect(submit).toBeDisabled();

    // More than the $3,200 in Earn, even though it's less than the $9,280.32
    // sitting available — this must still be rejected.
    await user.type(screen.getByLabelText("Amount in USD"), "5000");
    expect(await screen.findByText("Exceeds Earn balance")).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it("the Max chip fills exactly the in-Earn amount", async () => {
    const { user } = await renderReady();
    await user.click(screen.getByRole("button", { name: "Max" }));
    const input = screen.getByLabelText("Amount in USD") as HTMLInputElement;
    expect(input.value).toBe("3200");
  });

  it("submitting moves money out of Earn and shows Complete with the account total unchanged", async () => {
    const { user } = await renderReady();
    await user.click(screen.getByRole("button", { name: "25%" }));
    await user.click(screen.getByRole("button", { name: /move out/i }));

    expect(await screen.findByText("Moved out")).toBeInTheDocument();
    expect(screen.getByText("$800.00 moved to your available balance.")).toBeInTheDocument();
    const pill = screen.getByText(/New balance/i).closest("div") as HTMLElement;
    expect(within(pill).getByText("$12,480.32")).toBeInTheDocument();

    const state = useAccountStore.getState();
    expect(state.balance.availableUsd).toBeCloseTo(10080.32, 2);
    expect(state.balance.inEarnUsd).toBeCloseTo(2400.0, 2);
    expect(state.rewardPosition.principalUsd).toBeCloseTo(2400.0, 2);
    expect(state.transactions[0].title).toBe("Moved out of Earn");
    expect(state.transactions[0].amountUsd).toBeCloseTo(800, 2);
  });
});
