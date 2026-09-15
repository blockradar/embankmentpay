import { Link } from "react-router-dom";
import card from "./Card.module.css";
import styles from "./OffRampWidget.module.css";

export function OffRampWidget() {
  return (
    <Link to="/withdraw" className={card.card} aria-label="Withdraw to bank">
      <div className={styles.eyebrow}>Off-ramp to fiat</div>
      <div className={styles.title}>Cash out anytime</div>
      <p className={styles.desc}>Send USDC straight to your US bank account, settled in USD.</p>

      <div className={styles.row}>
        <span className={styles.badge}>$</span>
        <div className={styles.rowText}>
          <div className={styles.rowTitle}>USD &middot; US Dollar</div>
          <div className={styles.rowMeta}>ACH &middot; 1 business day</div>
        </div>
        <span className={styles.rate}>1:1</span>
      </div>
    </Link>
  );
}
