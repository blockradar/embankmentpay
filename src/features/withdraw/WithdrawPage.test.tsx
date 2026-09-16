import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAccountStore } from "../../api/adapters/mock/accountStore";
import { WithdrawPage } from "./WithdrawPage";

const VALID_ARC_ADDRESS = "arc-address-example-1234";

function renderWithdraw() {
  return render(
    <MemoryRouter initialEntries={["/withdraw"]}>
      <WithdrawPage />
    </MemoryRouter>,
  );
}

async function renderReady() {
  const user = userEvent.setup();
  const utils = renderWithdraw();
  await screen.findByText("Available $9,280.32");
  return { user, ...utils };
}

/** Fills amount then address (matching the flow's order), advances to Review. */
async function goToReview(user: ReturnType<typeof userEvent.setup>, amount = "100") {
  await user.type(screen.getByLabelText("Amount in USD"), amount);
  await user.type(screen.getByLabelText("Destination address"), VALID_ARC_ADDRESS);
  await user.click(screen.getByRole("button", { name: /continue/i }));
  await screen.findByText("Review withdrawal");
}

beforeEach(() => {
  useAccountStore.getState().reset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("WithdrawPage — amount + destination step", () => {
  it("has no chain picker — withdrawals are Arc-only", async () => {
    await renderReady();
    expect(screen.queryByRole("button", { name: "Arc" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Base" })).not.toBeInTheDocument();
  });

  it("shows the amount field before the destination address field", async () => {
    await renderReady();
    const amountInput = screen.getByLabelText("Amount in USD");
    const addressInput = screen.getByLabelText("Destination address");
    expect(
      amountInput.compareDocumentPosition(addressInput) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("disables submit until a valid amount and address are entered", async () => {
    const { user } = await renderReady();
    const submit = screen.getByRole("button", { name: /continue/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Amount in USD"), "50");
    expect(submit).toBeDisabled(); // no address yet

    await user.type(screen.getByLabelText("Destination address"), VALID_ARC_ADDRESS);
    expect(submit).toBeEnabled();
  });

  it("shows an error for an address that's too short", async () => {
    const { user } = await renderReady();
    await user.type(screen.getByLabelText("Destination address"), "short");
    expect(await screen.findByText(/enter a valid arc address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("flags an over-balance amount", async () => {
    const { user } = await renderReady();
    await user.type(screen.getByLabelText("Amount in USD"), "999999");
    await user.type(screen.getByLabelText("Destination address"), VALID_ARC_ADDRESS);
    expect(await screen.findByText("Exceeds available balance")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });
});

describe("WithdrawPage — review step", () => {
  it("advances to Review with the amount, truncated address, Arc, fee, and no countdown", async () => {
    const { user } = await renderReady();
    await goToReview(user);

    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText(/arc-ad…1234/)).toBeInTheDocument();
    expect(screen.getByText(/arc/i)).toBeInTheDocument();
    expect(screen.getByText(/network fee/i)).toBeInTheDocument();
    expect(screen.queryByText(/rate locked/i)).not.toBeInTheDocument();
    expect(screen.getByText(/can't be reversed/i)).toBeInTheDocument();
  });

  it("confirming a withdrawal advances to Complete with the debited balance", async () => {
    const { user } = await renderReady();
    await goToReview(user);
    await user.click(screen.getByRole("button", { name: /confirm withdrawal/i }));

    expect(await screen.findByText("Sent")).toBeInTheDocument();
    const pill = screen.getByText(/New balance/i).closest("div") as HTMLElement;
    expect(within(pill).getByText("$12,380.32")).toBeInTheDocument();
  });
});
