import { Link } from "react-router-dom";
import type { Transaction } from "../../api/types";
import { formatUsdc } from "../../lib/format";
import card from "./Card.module.css";
import styles from "./TransactionList.module.css";
import { TransactionGlyph } from "./transactionIcons";

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <section className={card.card} aria-label="Recent transactions">
      <div className={styles.header}>
        <span className={styles.title}>Recent transactions</span>
        <Link to="/activity" className={styles.seeAll}>
          See all
        </Link>
      </div>

      <ul className={styles.list}>
        {transactions.map((txn) => (
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
                {txn.amountUsd < 0 ? "−" : "+"}
                    {formatUsdc(txn.amount)} {txn.asset}
              </div>
              <div className={styles.timestamp}>{txn.timestampLabel}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
