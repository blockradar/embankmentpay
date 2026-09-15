import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAccountStore } from "../../api/adapters/mock/accountStore";
import { SwapPage } from "./SwapPage";

function renderSwap() {
  return render(
    <MemoryRouter initialEntries={["/swap"]}>
      <SwapPage />
    </MemoryRouter>,
  );
}

async function renderReady() {
  const user = userEvent.setup();
  const utils = renderSwap();
  await screen.findByText("Ether");
  return { user, ...utils };
}

async function goToEthAmount() {
  const { user } = await renderReady();
  await user.click(screen.getByText("Ether"));
  await screen.findByLabelText("Amount in ETH");
  return { user };
}

beforeEach(() => {
  useAccountStore.getState().reset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SwapPage", () => {
  it("renders all holdings with balance, USD value, and rate", async () => {
    await renderReady();
    expect(screen.getByText("Ether")).toBeInTheDocument();
    expect(screen.getByText("0.42 ETH")).toBeInTheDocument();
    expect(screen.getByText("$1,364.16")).toBeInTheDocument();
    expect(screen.getByText("1 ETH = $3,248.00")).toBeInTheDocument();
    expect(screen.getByText("Tether USD")).toBeInTheDocument();
    expect(screen.getByText("Euro Coin")).toBeInTheDocument();
    expect(screen.getByText("Wrapped BTC")).toBeInTheDocument();
  });

  it("selecting an asset advances straight to amount entry, no separate continue step", async () => {
    const { user } = await renderReady();
    await user.click(screen.getByText("Ether"));
    expect(await screen.findByText("Swap ETH")).toBeInTheDocument();
    expect(screen.getByText("ETH → USDC")).toBeInTheDocument();
  });

  it("percentage chips fill the correct fraction of the asset balance", async () => {
    const { user } = await goToEthAmount();
    await user.click(screen.getByRole("button", { name: "25%" }));
    const input = screen.getByLabelText("Amount in ETH") as HTMLInputElement;
    expect(input.value).toBe("0.105");
  });

  it("Max chip fills the full available balance", async () => {
    const { user } = await goToEthAmount();
    await user.click(screen.getByRole("button", { name: "Max" }));
    const input = screen.getByLabelText("Amount in ETH") as HTMLInputElement;
    expect(input.value).toBe("0.42");
  });

  it("disables submit and flags an over-balance amount", async () => {
    const { user } = await goToEthAmount();
    const submit = screen.getByRole("button", { name: /review swap/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Amount in ETH"), "99");
    expect(await screen.findByText("Exceeds available balance")).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it("submitting a valid amount advances to Review with quote details and a 15s countdown", async () => {
    const { user } = await goToEthAmount();
    await user.type(screen.getByLabelText("Amount in ETH"), "0.1");
    await user.click(screen.getByRole("button", { name: /review swap/i }));

    expect(await screen.findByText("0.1 ETH")).toBeInTheDocument();
    expect(screen.getByText("1 ETH = $3,248.00")).toBeInTheDocument();
    expect(screen.getByText("$324.80 USDC")).toBeInTheDocument();
    expect(screen.getByText(/quote valid for \d+s/i)).toBeInTheDocument();
  });

  it("an expired quote disables confirm and offers a way to get a fresh one", async () => {
    // fireEvent + fake timers, same approach as WithdrawPage's expiry test —
    // userEvent's internal pacing fights fake timers and hangs.
    vi.useFakeTimers();
    renderSwap();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    fireEvent.click(screen.getByText("Ether"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    fireEvent.change(screen.getByLabelText("Amount in ETH"), { target: { value: "0.1" } });
    fireEvent.click(screen.getByRole("button", { name: /review swap/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByText(/quote valid for 15s/i)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(16_000);
    });

    expect(screen.getByText(/quote has expired/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get new quote/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /confirm swap/i })).not.toBeInTheDocument();
  });

  it("confirming a swap credits USDC, debits the holding, and shows Complete", async () => {
    const { user } = await goToEthAmount();
    await user.type(screen.getByLabelText("Amount in ETH"), "0.1");
    await user.click(screen.getByRole("button", { name: /review swap/i }));

    await screen.findByText(/quote valid for/i);
    await user.click(screen.getByRole("button", { name: /confirm swap/i }));

    expect(await screen.findByText("Swapped")).toBeInTheDocument();
    expect(screen.getByText("$324.80 USDC added to your balance.")).toBeInTheDocument();
    const pill = screen.getByText(/New balance/i).closest("div") as HTMLElement;
    expect(within(pill).getByText("$12,805.12")).toBeInTheDocument();

    const state = useAccountStore.getState();
    expect(state.holdings.find((h) => h.assetId === "eth-base")?.balance).toBeCloseTo(0.32, 8);
    expect(state.balance.totalUsd).toBeCloseTo(12805.12, 2);
    expect(state.transactions[0].title).toBe("ETH → USDC");
  });
});
