import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { useAccountStore } from "../../api/adapters/mock/accountStore";
import { DepositPage } from "./DepositPage";

function renderDeposit() {
  return render(
    <MemoryRouter initialEntries={["/deposit"]}>
      <DepositPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAccountStore.getState().reset();
});

describe("DepositPage", () => {
  it("shows the two supported funding methods and no debit card option", () => {
    renderDeposit();
    expect(screen.getByText("Bank transfer")).toBeInTheDocument();
    expect(screen.getByText("Stablecoin")).toBeInTheDocument();
    expect(screen.queryByText(/debit card/i)).not.toBeInTheDocument();
  });

  it("selecting bank transfer shows virtual account details with no amount field", async () => {
    const user = userEvent.setup();
    renderDeposit();
    await user.click(screen.getByText("Bank transfer"));

    expect(await screen.findByText("Column N.A.")).toBeInTheDocument();
    expect(screen.getByText("0000481124")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByText(/^\$\s*0/)).not.toBeInTheDocument();
  });

  it("shows Stablecoin before Bank transfer in the method list", () => {
    renderDeposit();
    const labels = screen.getAllByText(/^(Stablecoin|Bank transfer)$/).map((el) => el.textContent);
    expect(labels).toEqual(["Stablecoin", "Bank transfer"]);
  });

  it("selecting stablecoin defaults to Arc, with no settlement flag and a deposit address", async () => {
    const user = userEvent.setup();
    renderDeposit();
    await user.click(screen.getByText("Stablecoin"));

    expect(screen.getByRole("button", { name: "Base" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Arc" })).toBeInTheDocument();
    expect(screen.queryByText(/settle into the equivalent stablecoin/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/0x8F3a41C9b2E7d5A06fB19cD3e84a7F2b6C0d9E15/)).toBeInTheDocument();
  });

  it("switching to a non-Arc chain shows the settlement flag", async () => {
    const user = userEvent.setup();
    renderDeposit();
    await user.click(screen.getByText("Stablecoin"));
    await screen.findByText(/0x8F3a41C9b2E7d5A06fB19cD3e84a7F2b6C0d9E15/);

    await user.click(screen.getByRole("button", { name: "Base" }));

    expect(await screen.findByText(/deposits from base settle into the equivalent stablecoin on arc/i)).toBeInTheDocument();
  });

  it("completes the bank transfer flow and shows the credited balance", async () => {
    const user = userEvent.setup();
    renderDeposit();
    await user.click(screen.getByText("Bank transfer"));
    await screen.findByText("Column N.A.");

    await user.click(screen.getByRole("button", { name: /simulate \$250 arriving/i }));

    expect(await screen.findByText("Deposit credited")).toBeInTheDocument();
    const pill = screen.getByText(/New balance/i).closest("div") as HTMLElement;
    expect(within(pill).getByText("$12,730.32")).toBeInTheDocument();
  });

  it("completes the stablecoin flow and shows the credited balance", async () => {
    const user = userEvent.setup();
    renderDeposit();
    await user.click(screen.getByText("Stablecoin"));
    await screen.findByText(/0x8F3a41C9b2E7d5A06fB19cD3e84a7F2b6C0d9E15/);

    await user.click(screen.getByRole("button", { name: /simulate 500 usdc arriving/i }));

    expect(await screen.findByText("Deposit credited")).toBeInTheDocument();
    const pill = screen.getByText(/New balance/i).closest("div") as HTMLElement;
    expect(within(pill).getByText("$12,980.32")).toBeInTheDocument();
  });
});
