import { useState } from "react";
import { api } from "../../api";
import { useAsync } from "../../lib/useAsync";
import { TransactionGlyph } from "../dashboard/transactionIcons";
import { formatSigned, formatUsd } from "../../lib/format";
import type { Transaction } from "../../api/types";
import card from "../dashboard/Card.module.css";
import styles from "./ActivityPage.module.css";

type Filter = "all" | "in" | "out";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in", label: "In" },
  { id: "out", label: "Out" },
];

function matchesFilter(txn: Transaction, filter: Filter): boolean {
  if (filter === "all") return true;
  return filter === "in" ? txn.amountUsd >= 0 : txn.amountUsd < 0;
}

export function ActivityPage() {
  const balanceState = useAsync(() => api.deposit.getBalance(), []);
  const transactionsState = useAsync(() => api.deposit.getRecentTransactions(50), []);
  const [filter, setFilter] = useState<Filter>("all");

  const error = balanceState.error ?? transactionsState.error;
  const transactions = transactionsState.data ?? [];
  const filtered = transactions.filter((txn) => matchesFilter(txn, filter));

  return (
    <div>
      <header className={styles.header}>
        <h1 className={`ep-serif ${styles.title}`}>Activity</h1>
      </header>

      <div className={styles.stats}>
        <div className={card.card}>
          <div className={styles.statLabel}>Available</div>
          <div className={`${styles.statAmount} ep-serif`}>
            {balanceState.data ? formatUsd(balanceState.data.availableUsd) : "—"}
          </div>
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
        {error ? (
          <p className={styles.empty}>{error.message}</p>
        ) : transactionsState.loading ? (
          <p className={styles.empty}>Loading activity&hellip;</p>
        ) : filtered.length === 0 ? (
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
                  <div className={styles.timestamp}>{txn.timestampLabel}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
