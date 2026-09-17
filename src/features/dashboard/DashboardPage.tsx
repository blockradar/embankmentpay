import { Link } from "react-router-dom";
import { api } from "../../api";
import { useAsync } from "../../lib/useAsync";
import styles from "./DashboardPage.module.css";
import { BalanceCard } from "./BalanceCard";
import { TransactionList } from "./TransactionList";

const STAGGER_MS = 70;

export function DashboardPage() {
  const balanceState = useAsync(() => api.deposit.getBalance(), []);
  const transactionsState = useAsync(() => api.deposit.getRecentTransactions(5), []);

  const ready = balanceState.data && transactionsState.data;

  return (
    <div>
      <header className={styles.header}>
        <div>
          <div className={styles.greeting}>Good evening, Ana</div>
          <h1 className={styles.title}>Dashboard</h1>
        </div>
        <div className={styles.headerActions}>
          <Link to="/activity" className={styles.ghostButton}>
            Activity
          </Link>
          <Link to="/deposit" className={styles.goldButton}>
            + Add money
          </Link>
        </div>
      </header>

      {!ready ? (
        <p style={{ color: "var(--ep-text-tertiary)" }}>Loading account&hellip;</p>
      ) : (
        <div className={styles.column}>
          <div className={styles.reveal} style={{ animationDelay: "0ms" }}>
            <BalanceCard balance={balanceState.data!} />
          </div>
          <div className={styles.reveal} style={{ animationDelay: `${STAGGER_MS}ms` }}>
            <TransactionList transactions={transactionsState.data!} />
          </div>
        </div>
      )}
    </div>
  );
}
