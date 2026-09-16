import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Sidebar } from "./Sidebar";
import styles from "./Sidebar.module.css";

describe("Sidebar", () => {
  it("marks the current route's link as active and leaves others inactive", () => {
    render(
      <MemoryRouter initialEntries={["/earn"]}>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /earn/i })).toHaveClass(styles.linkActive);
    expect(screen.getByRole("link", { name: /dashboard/i })).not.toHaveClass(styles.linkActive);
  });

  it("renders the profile identity", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    expect(screen.getByText("Ana Ramos")).toBeInTheDocument();
    expect(screen.getByText("Arc network")).toBeInTheDocument();
  });
});
