import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { useAsync } from "../../lib/useAsync";
import { formatSigned, formatUsd } from "../../lib/format";
import card from "../dashboard/Card.module.css";
import styles from "./EarnPage.module.css";

const STAGGER_MS = 70;

export function EarnPage() {
  const { data: position } = useAsync(() => api.earn.getPosition(), []);
  // Auto-earn is a UI-only preference in this mock build — Blockradar's
  // Rewards API has no "auto-sweep idle balance into Earn" endpoint, so this
  // never calls the mock adapter, just local component state.
  const [autoEarn, setAutoEarn] = useState(true);

  if (!position) {
    return <p style={{ color: "var(--ep-text-tertiary)" }}>Loading Earn…</p>;
  }

  return (
    <div>
      <header className={styles.header}>
        <h1 className={`ep-serif ${styles.title}`}>Earn</h1>
      </header>

      <div className={styles.column}>
        <section className={`${card.card} ${styles.reveal}`} style={{ animationDelay: "0ms" }}>
          <div className={styles.eyebrow}>Earning balance</div>
          <div className={styles.amount}>{formatUsd(position.principalUsd)}</div>

          <div className={styles.stats}>
            <span>
              APY <b>{position.apyPct.toFixed(2)}%</b>
            </span>
            <span className={styles.statPositive}>
              Today <b>{formatSigned(position.todayYieldUsd)}</b>
            </span>
            <span>
              Lifetime <b>{formatUsd(position.lifetimeYieldUsd)}</b>
            </span>
          </div>

          <div className={styles.actions}>
            <Link to="/earn/add" className={styles.primary}>
              Add to Earn
            </Link>
            <Link to="/earn/withdraw" className={styles.secondary}>
              Move out
            </Link>
          </div>
        </section>

        <section
          className={`${card.card} ${styles.reveal}`}
          style={{ animationDelay: `${STAGGER_MS}ms` }}
        >
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleTitle}>Auto-earn on idle USDC</div>
              <div className={styles.toggleDescription}>
                Keeps $500 liquid for spending; the rest earns automatically. Withdraw anytime, no
                lock-up.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoEarn}
              aria-label="Auto-earn on idle USDC"
              className={`${styles.toggle} ${autoEarn ? styles.toggleOn : ""}`}
              onClick={() => setAutoEarn((v) => !v)}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </section>

        <section
          className={`${styles.howItWorks} ${styles.reveal}`}
          style={{ animationDelay: `${STAGGER_MS * 2}ms` }}
        >
          <div className={styles.howEyebrow}>How it works</div>
          <p className={styles.howBody}>
            Eligible USDC is placed in short-duration, over-collateralized lending (real Aave V3 and
            Compound V3 positions, not a synthetic yield). Interest accrues continuously and is paid
            out in USDC to the same balance. Rates are variable and not guaranteed; there are no
            lock-ups, so you can move money out at any time.
          </p>
        </section>
      </div>
    </div>
  );
}
