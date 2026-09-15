import { Link } from "react-router-dom";
import type { RewardPosition } from "../../api/types";
import { formatSigned, formatUsd } from "../../lib/format";
import card from "./Card.module.css";
import styles from "./EarnWidget.module.css";

export function EarnWidget({ position }: { position: RewardPosition }) {
  return (
    <Link to="/earn" className={card.card} aria-label="Earn balance, view details">
      <div className={styles.header}>
        <span className={styles.eyebrow}>Earn</span>
        <span className={styles.chevron}>&rsaquo;</span>
      </div>
      <div className={styles.amount}>{formatUsd(position.principalUsd)}</div>
      <div className={styles.apy}>
        earning <b>{position.apyPct.toFixed(2)}% APY</b>
      </div>
      <div className={styles.row}>
        <span>
          Today
          <b>{formatSigned(position.todayYieldUsd)}</b>
        </span>
        <span>
          Lifetime
          <b>{formatUsd(position.lifetimeYieldUsd)}</b>
        </span>
      </div>
    </Link>
  );
}
