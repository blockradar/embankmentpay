import type { ReactNode } from "react";
import styles from "./FlowLayout.module.css";

/** Shared column shell for every money-movement flow (Deposit, Withdraw). */
export function FlowLayout({ children }: { children: ReactNode }) {
  return <div className={styles.wrap}>{children}</div>;
}
