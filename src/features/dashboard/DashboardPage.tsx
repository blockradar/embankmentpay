import { api } from "../../api";
import { useAsync } from "../../lib/useAsync";
import styles from "./DashboardPage.module.css";
import { BalanceCard } from "./BalanceCard";
import { EarnWidget } from "./EarnWidget";
import { OffRampWidget } from "./OffRampWidget";
import { TransactionList } from "./TransactionList";

const STAGGER_MS = 70;

export function DashboardPage() {
  const balanceState = useAsync(() => api.deposit.getBalance(), []);
  const transactionsState = useAsync(() => api.deposit.getRecentTransactions(5), []);
  const positionState = useAsync(() => api.earn.getPosition(), []);

  const ready = balanceState.data && transactionsState.data && positionState.data;

  return (
    <div>
      <header className={styles.header}>
        <div>
          <div className={styles.greeting}>Good evening, Ana</div>
          <h1 className={styles.title}>Dashboard</h1>
        </div>
        <div className={styles.headerActions}>
          <a href="/activity" className={styles.ghostButton}>
            Activity
          </a>
          <a href="/deposit" className={styles.goldButton}>
            + Add money
          </a>
        </div>
      </header>

      {!ready ? (
        <p style={{ color: "var(--ep-text-tertiary)" }}>Loading account&hellip;</p>
      ) : (
        <div className={styles.grid}>
          <div className={styles.mainCol}>
            <div className={styles.reveal} style={{ animationDelay: "0ms" }}>
              <BalanceCard balance={balanceState.data!} />
            </div>
            <div className={styles.reveal} style={{ animationDelay: `${STAGGER_MS * 2}ms` }}>
              <TransactionList transactions={transactionsState.data!} />
            </div>
          </div>
          <div className={styles.sideCol}>
            <div className={styles.reveal} style={{ animationDelay: `${STAGGER_MS}ms` }}>
              <EarnWidget position={positionState.data!} />
            </div>
            <div className={styles.reveal} style={{ animationDelay: `${STAGGER_MS * 3}ms` }}>
              <OffRampWidget />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
