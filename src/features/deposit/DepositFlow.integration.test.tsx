import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useAccountStore } from "../../api/adapters/mock/accountStore";
import App from "../../App";

beforeEach(() => {
  useAccountStore.getState().reset();
  window.history.pushState({}, "", "/");
});

describe("Deposit flow, end to end", () => {
  it("a simulated deposit updates the balance and transaction list back on the Dashboard", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("$12,480.32")).toBeInTheDocument();

    await user.click(screen.getByText("+ Add money"));
    await user.click(await screen.findByText("Bank transfer"));
    await screen.findByText("Column N.A.");
    await user.click(screen.getByRole("button", { name: /simulate \$250 arriving/i }));

    await screen.findByText("Deposit credited");
    await user.click(screen.getByRole("link", { name: "Done" }));

    expect(await screen.findByText("$12,730.32")).toBeInTheDocument();
    expect(screen.getByText("Bank deposit")).toBeInTheDocument();
    expect(screen.getByText("Virtual account · USD")).toBeInTheDocument();
  });
});
