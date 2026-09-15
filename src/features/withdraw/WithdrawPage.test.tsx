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

/** Types a valid amount and advances from Amount to Recipient. */
async function goToRecipient(user: ReturnType<typeof userEvent.setup>, amount = "100") {
  await user.type(screen.getByLabelText("Amount in USD"), amount);
  await user.click(screen.getByRole("button", { name: /continue/i }));
  await screen.findByText("Withdraw to bank");
}

/** From Recipient (defaults pre-filled and valid), resolves and advances to Review. */
async function goToReview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /verify account/i }));
  await screen.findByText(/sending to/i);
  await user.click(screen.getByRole("button", { name: /^continue$/i }));
  await screen.findByText(/rate locked for/i);
}

beforeEach(() => {
  useAccountStore.getState().reset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("WithdrawPage — amount step", () => {
  it("does not show a fixed destination on the amount screen — the account is collected later", async () => {
    await renderReady();
    expect(screen.queryByText(/chase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/routing number/i)).not.toBeInTheDocument();
  });

  it("disables submit until a valid amount is entered, and flags an over-balance amount", async () => {
    const { user } = await renderReady();
    const submit = screen.getByRole("button", { name: /continue/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Amount in USD"), "999999");
    expect(await screen.findByText("Exceeds available balance")).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it("quick chips fill the amount and enable submit", async () => {
    const { user } = await renderReady();
    await user.click(screen.getByRole("button", { name: "$100" }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("advances to the Recipient screen instead of straight to Review", async () => {
    const { user } = await renderReady();
    await goToRecipient(user);
    expect(screen.getByLabelText("Routing number")).toBeInTheDocument();
    expect(screen.getByLabelText("Account number")).toBeInTheDocument();
  });
});

describe("WithdrawPage — recipient step", () => {
  it("pre-fills routing/account number but requires verification before continuing", async () => {
    const { user } = await renderReady();
    await goToRecipient(user);

    expect(screen.getByLabelText("Routing number")).toHaveValue("021000021");
    expect(screen.getByLabelText("Account number")).toHaveValue("0000481124");
    expect(screen.queryByRole("button", { name: /^continue$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verify account/i })).toBeEnabled();
  });

  it("resolves the account to a holder name and enables continue", async () => {
    const { user } = await renderReady();
    await goToRecipient(user);

    await user.click(screen.getByRole("button", { name: /verify account/i }));
    expect(await screen.findByText(/sending to/i)).toBeInTheDocument();
    expect(screen.getByText("Ana Ramos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^continue$/i })).toBeInTheDocument();
  });

  it("shows an error for an invalid routing number instead of resolving", async () => {
    const { user } = await renderReady();
    await goToRecipient(user);

    await user.clear(screen.getByLabelText("Routing number"));
    await user.type(screen.getByLabelText("Routing number"), "123");
    await user.click(screen.getByRole("button", { name: /verify account/i }));

    expect(await screen.findByText(/valid 9-digit routing number/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^continue$/i })).not.toBeInTheDocument();
  });

  it("invalidates a successful resolution if either field is edited afterward", async () => {
    const { user } = await renderReady();
    await goToRecipient(user);

    await user.click(screen.getByRole("button", { name: /verify account/i }));
    await screen.findByText(/sending to/i);

    await user.type(screen.getByLabelText("Account number"), "9");

    expect(screen.queryByText(/sending to/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^continue$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verify account/i })).toBeInTheDocument();
  });
});

describe("WithdrawPage — review step", () => {
  it("submitting from Recipient advances to Review with quote details, the resolved account, and a countdown", async () => {
    const { user } = await renderReady();
    await goToRecipient(user);
    await goToReview(user);

    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText(/to ana ramos/i)).toBeInTheDocument();
    expect(screen.getByText(/••1124/)).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText(/rate locked for \d+:\d{2}/i)).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    fireEvent.click(screen.getByRole("button", { name: /verify account/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByText(/rate locked for 20:00/i)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20 * 60 * 1000 + 1_000);
    });

    expect(screen.getByText(/quote has expired/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get new quote/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /confirm withdrawal/i })).not.toBeInTheDocument();
  });

  it("confirming a withdrawal advances to Complete with the debited balance", async () => {
    const { user } = await renderReady();
    await goToRecipient(user);
    await goToReview(user);

    await user.click(screen.getByRole("button", { name: /confirm withdrawal/i }));

    expect(await screen.findByText("On its way")).toBeInTheDocument();
    expect(screen.getByText(/ana ramos/i)).toBeInTheDocument();
    const pill = screen.getByText(/New balance/i).closest("div") as HTMLElement;
    expect(within(pill).getByText("$12,380.32")).toBeInTheDocument();
  });
});
