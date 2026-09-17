import { Link } from "react-router-dom";
import type { Balance } from "../../api/types";
import { formatUsd } from "../../lib/format";
import { NETWORK_LABELS } from "../../config/networks";
import card from "./Card.module.css";
import styles from "./BalanceCard.module.css";
import { DownloadIcon, PlusIcon } from "../shell/icons";

export function BalanceCard({ balance }: { balance: Balance }) {
  return (
    <section className={card.card} aria-label="Total balance">
      <div className={styles.eyebrow}>
        Total balance &middot; {balance.asset} on {NETWORK_LABELS[balance.network]}
      </div>
      <div className={styles.amount}>{formatUsd(balance.totalUsd)}</div>

      <div className={styles.stats}>
        <span>
          Available <b>{formatUsd(balance.availableUsd)}</b>
        </span>
      </div>

      <div className={styles.actions}>
        <Link to="/deposit" className={styles.primary}>
          <PlusIcon /> Deposit
        </Link>
        <Link to="/withdraw" className={styles.secondary}>
          <DownloadIcon /> Withdraw
        </Link>
      </div>
    </section>
  );
}
