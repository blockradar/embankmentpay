import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { useAccountStore } from "../../api/adapters/mock/accountStore";
import { ActivityPage } from "./ActivityPage";

function renderActivity() {
  return render(
    <MemoryRouter initialEntries={["/activity"]}>
      <ActivityPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAccountStore.getState().reset();
});

describe("ActivityPage", () => {
  it("shows Available/In Earn/Total stats and the full mock transaction list", () => {
    renderActivity();
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("$9,280.32")).toBeInTheDocument();
    expect(screen.getByText("In Earn")).toBeInTheDocument();
    expect(screen.getByText("$3,200.00")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("$12,480.32")).toBeInTheDocument();

    expect(screen.getByText("Yield paid")).toBeInTheDocument();
    expect(screen.getByText("To Priya S.")).toBeInTheDocument();
  });

  it("the Earn filter shows only earn-kind activity", async () => {
    const user = userEvent.setup();
    renderActivity();

    await user.click(screen.getByRole("button", { name: "Earn" }));
    expect(screen.getByText("Yield paid")).toBeInTheDocument();
    expect(screen.queryByText("To Priya S.")).not.toBeInTheDocument();
    expect(screen.queryByText("Bank deposit")).not.toBeInTheDocument();
  });

  it("the Out filter shows only negative, non-earn activity", async () => {
    const user = userEvent.setup();
    renderActivity();

    await user.click(screen.getByRole("button", { name: "Out" }));
    expect(screen.getByText("To Priya S.")).toBeInTheDocument();
    expect(screen.getByText("To bank account")).toBeInTheDocument();
    expect(screen.queryByText("Bank deposit")).not.toBeInTheDocument();
    expect(screen.queryByText("Yield paid")).not.toBeInTheDocument();
  });

  it("the In filter shows only positive, non-earn activity", async () => {
    const user = userEvent.setup();
    renderActivity();

    await user.click(screen.getByRole("button", { name: "In" }));
    expect(screen.getByText("Bank deposit")).toBeInTheDocument();
    expect(screen.getByText("From Marco V.")).toBeInTheDocument();
    expect(screen.queryByText("To Priya S.")).not.toBeInTheDocument();
    expect(screen.queryByText("Yield paid")).not.toBeInTheDocument();
  });
});
