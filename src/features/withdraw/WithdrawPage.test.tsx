import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAccountStore } from "../../api/adapters/mock/accountStore";
import { WithdrawPage } from "./WithdrawPage";
import styles from "./WithdrawPage.module.css";

const VALID_BASE_ADDRESS = "0x1234567890123456789012345678901234567890";

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

/** Types a valid address and amount, advances from Amount to Review. */
async function goToReview(user: ReturnType<typeof userEvent.setup>, amount = "100") {
  await user.type(screen.getByLabelText("Destination address"), VALID_BASE_ADDRESS);
  await user.type(screen.getByLabelText("Amount in USD"), amount);
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
  it("defaults to Base and shows a chain picker limited to Base and Arc", async () => {
    await renderReady();
    expect(screen.getByRole("button", { name: "Base" })).toHaveClass(styles.chipSelected);
    expect(screen.getByRole("button", { name: "Arc" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ethereum" })).not.toBeInTheDocument();
  });

  it("disables submit until a valid address and amount are entered", async () => {
    const { user } = await renderReady();
    const submit = screen.getByRole("button", { name: /continue/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Amount in USD"), "100");
    expect(submit).toBeDisabled(); // no address yet

    await user.type(screen.getByLabelText("Destination address"), "not-an-address");
    expect(await screen.findByText(/enter a valid base address/i)).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it("flags an over-balance amount", async () => {
    const { user } = await renderReady();
    await user.type(screen.getByLabelText("Destination address"), VALID_BASE_ADDRESS);
    await user.type(screen.getByLabelText("Amount in USD"), "999999");
    expect(await screen.findByText("Exceeds available balance")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("a valid Base address enables submit; switching to Arc accepts a non-EVM-looking address", async () => {
    const { user } = await renderReady();
    await user.click(screen.getByRole("button", { name: "Arc" }));
    await user.type(screen.getByLabelText("Destination address"), "arc-address-example-1234");
    await user.type(screen.getByLabelText("Amount in USD"), "50");
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });
});

describe("WithdrawPage — review step", () => {
  it("advances to Review with the amount, truncated address, chain, fee, and no countdown", async () => {
    const { user } = await renderReady();
    await goToReview(user);

    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText(/0x1234…7890/)).toBeInTheDocument();
    expect(screen.getByText(/base/i)).toBeInTheDocument();
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
