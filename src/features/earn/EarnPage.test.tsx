import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { useAccountStore } from "../../api/adapters/mock/accountStore";
import { EarnPage } from "./EarnPage";

function renderEarn() {
  return render(
    <MemoryRouter initialEntries={["/earn"]}>
      <EarnPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAccountStore.getState().reset();
});

describe("EarnPage", () => {
  it("renders the earning balance, APY, and today/lifetime stats from the store", async () => {
    renderEarn();
    expect(await screen.findByText("$3,200.00")).toBeInTheDocument();
    expect(screen.getByText("4.85%")).toBeInTheDocument();
    expect(screen.getByText("+$0.43")).toBeInTheDocument();
    expect(screen.getByText("$418.20")).toBeInTheDocument();
  });

  it("links to the Add to Earn and Move out flows", async () => {
    renderEarn();
    await screen.findByText("$3,200.00");
    expect(screen.getByRole("link", { name: "Add to Earn" })).toHaveAttribute("href", "/earn/add");
    expect(screen.getByRole("link", { name: "Move out" })).toHaveAttribute(
      "href",
      "/earn/withdraw",
    );
  });

  it("the auto-earn toggle flips without any network call", async () => {
    const user = userEvent.setup();
    renderEarn();
    await screen.findByText("$3,200.00");

    const toggle = screen.getByRole("switch", { name: /auto-earn on idle usdc/i });
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });
});
