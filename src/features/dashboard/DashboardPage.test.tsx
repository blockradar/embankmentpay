import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { mockTransactions } from "../../api/adapters/mock/data";
import { DashboardPage } from "./DashboardPage";

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe("DashboardPage", () => {
  it("renders the total balance figure once mock data resolves", async () => {
    renderDashboard();
    expect(await screen.findByText("$12,480.32")).toBeInTheDocument();
  });

  it("renders the 5 most recent mock transactions with correctly signed amounts", async () => {
    renderDashboard();
    const list = await screen.findByRole("list");

    for (const txn of mockTransactions.slice(0, 5)) {
      const row = within(list).getByText(txn.title).closest("li");
      expect(row).not.toBeNull();
      const expected =
        (txn.amountUsd >= 0 ? "+" : "-") +
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
          Math.abs(txn.amountUsd),
        );
      expect(within(row as HTMLElement).getByText(expected)).toBeInTheDocument();
    }
  });

  it("shows the Earn widget with APY and today's yield", async () => {
    renderDashboard();
    expect(await screen.findByText(/4\.85% APY/)).toBeInTheDocument();
    expect(screen.getByText("+$0.43")).toBeInTheDocument();
  });
});
