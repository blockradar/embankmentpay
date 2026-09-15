import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAccountStore } from "../../api/adapters/mock/accountStore";
import { WithdrawPage } from "./WithdrawPage";

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

beforeEach(() => {
  useAccountStore.getState().reset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("WithdrawPage", () => {
  it("shows the fixed USD destination inline, with no currency picker screen", async () => {
    await renderReady();
    expect(screen.getByText("To Chase ••4821 · USD")).toBeInTheDocument();
    expect(screen.queryByText(/EUR/)).not.toBeInTheDocument();
    expect(screen.queryByText(/GBP/)).not.toBeInTheDocument();
  });

  it("disables submit until a valid amount is entered, and flags an over-balance amount", async () => {
    const { user } = await renderReady();
    const submit = screen.getByRole("button", { name: /review withdrawal/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Amount in USD"), "999999");
    expect(await screen.findByText("Exceeds available balance")).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it("quick chips fill the amount and enable submit", async () => {
    const { user } = await renderReady();
    await user.click(screen.getByRole("button", { name: "$100" }));
    expect(screen.getByRole("button", { name: /review withdrawal/i })).toBeEnabled();
  });

  it("submitting a valid amount advances to Review with quote details and a countdown", async () => {
    const { user } = await renderReady();
    await user.type(screen.getByLabelText("Amount in USD"), "100");
    await user.click(screen.getByRole("button", { name: /review withdrawal/i }));

    expect(await screen.findByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("to Chase ••4821")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText(/rate locked for \d+s/i)).toBeInTheDocument();
  });

  it("an expired quote disables confirm and offers a way to get a fresh one", async () => {
    // Uses fireEvent (fully synchronous) instead of userEvent here — userEvent's
    // internal pointer/keyboard pacing fights with fake timers and hangs.
    vi.useFakeTimers();
    renderWithdraw();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    fireEvent.change(screen.getByLabelText("Amount in USD"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: /review withdrawal/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByText(/rate locked for 60s/i)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(61_000);
    });

    expect(screen.getByText(/quote has expired/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get new quote/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /confirm withdrawal/i })).not.toBeInTheDocument();
  });

  it("confirming a withdrawal advances to Complete with the debited balance", async () => {
    const { user } = await renderReady();
    await user.type(screen.getByLabelText("Amount in USD"), "100");
    await user.click(screen.getByRole("button", { name: /review withdrawal/i }));

    await screen.findByText(/rate locked for/i);
    await user.click(screen.getByRole("button", { name: /confirm withdrawal/i }));

    expect(await screen.findByText("On its way")).toBeInTheDocument();
    const pill = screen.getByText(/New balance/i).closest("div") as HTMLElement;
    expect(within(pill).getByText("$12,380.32")).toBeInTheDocument();
  });
});
