import { useState } from "react";
import { useAccountStore } from "../../api/adapters/mock/accountStore";
import { TransactionGlyph } from "../dashboard/transactionIcons";
import { formatSigned, formatUsd } from "../../lib/format";
import type { Transaction, TransactionKind } from "../../api/types";
import card from "../dashboard/Card.module.css";
import styles from "./ActivityPage.module.css";

type Filter = "all" | "in" | "out" | "earn";

const EARN_KINDS: TransactionKind[] = ["yield", "earn-add", "earn-withdraw"];

function matchesFilter(txn: Transaction, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "earn") return EARN_KINDS.includes(txn.kind);
  if (EARN_KINDS.includes(txn.kind)) return false; // earn activity only shows under "Earn"
  return filter === "in" ? txn.amountUsd >= 0 : txn.amountUsd < 0;
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in", label: "In" },
  { id: "out", label: "Out" },
  { id: "earn", label: "Earn" },
];

/**
 * Deliberately mock, not wired to api.deposit — reads the account store
 * directly, the same way Bank transfer deposits stay mocked even while
 * Deposit itself is live. Keeps this page's balance figures and the full
 * transaction history internally consistent on one dataset rather than
 * mixing a live balance with a mock-only history.
 */
export function ActivityPage() {
  const balance = useAccountStore((s) => s.balance);
  const transactions = useAccountStore((s) => s.transactions);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = transactions.filter((txn) => matchesFilter(txn, filter));

  return (
    <div>
      <header className={styles.header}>
        <h1 className={`ep-serif ${styles.title}`}>Activity</h1>
      </header>

      <div className={styles.stats}>
        <div className={card.card}>
          <div className={styles.statLabel}>Available</div>
          <div className={`${styles.statAmount} ep-serif`}>{formatUsd(balance.availableUsd)}</div>
        </div>
        <div className={card.card}>
          <div className={styles.statLabel}>In Earn</div>
          <div className={`${styles.statAmount} ep-serif`}>{formatUsd(balance.inEarnUsd)}</div>
        </div>
        <div className={card.card}>
          <div className={styles.statLabel}>Total</div>
          <div className={`${styles.statAmount} ep-serif`}>{formatUsd(balance.totalUsd)}</div>
        </div>
      </div>

      <div className={styles.filterRow}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`${styles.filterChip} ${filter === f.id ? styles.filterChipSelected : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <section className={card.card}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No activity in this filter yet.</p>
        ) : (
          <ul className={styles.list}>
            {filtered.map((txn) => (
              <li key={txn.id} className={styles.row}>
                <div className={styles.icon}>
                  <TransactionGlyph kind={txn.kind} />
                </div>
                <div className={styles.body}>
                  <div className={styles.title2}>{txn.title}</div>
                  <div className={styles.subtitle}>{txn.subtitle}</div>
                </div>
                <div className={styles.amountCol}>
                  <div className={`${styles.amount} ${txn.amountUsd >= 0 ? styles.positive : ""}`}>
                    {formatSigned(txn.amountUsd)}
                  </div>
                  <div className={styles.timestamp}>Completed &middot; {txn.timestampLabel}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
