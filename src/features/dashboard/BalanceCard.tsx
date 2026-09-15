import { Link } from "react-router-dom";
import type { Balance } from "../../api/types";
import { formatSigned, formatUsd } from "../../lib/format";
import card from "./Card.module.css";
import styles from "./BalanceCard.module.css";
import { DownloadIcon, PlusIcon, SwapIcon } from "../shell/icons";

export function BalanceCard({ balance }: { balance: Balance }) {
  return (
    <section className={card.card} aria-label="Total balance">
      <div className={styles.eyebrow}>
        Total balance &middot; {balance.asset} on {balance.network === "base" ? "Base" : "Arc"}
      </div>
      <div className={styles.amount}>{formatUsd(balance.totalUsd)}</div>

      <div className={styles.stats}>
        <span>
          Available <b>{formatUsd(balance.availableUsd)}</b>
        </span>
        <span>
          In Earn <b>{formatUsd(balance.inEarnUsd)}</b>
        </span>
        <span className={styles.positive}>{formatSigned(balance.todayDeltaUsd)} today</span>
      </div>

      <div className={styles.actions}>
        <Link to="/deposit" className={styles.primary}>
          <PlusIcon /> Deposit
        </Link>
        <Link to="/withdraw" className={styles.secondary}>
          <DownloadIcon /> Withdraw
        </Link>
        <Link to="/swap" className={styles.secondary}>
          <SwapIcon /> Swap
        </Link>
      </div>
    </section>
  );
}
