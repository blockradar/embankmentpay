import { useState } from "react";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { formatCountdown, formatUsd } from "../../lib/format";
import { useCountdown } from "../../lib/useCountdown";
import type { FiatWithdrawQuote } from "../../api/types";
import card from "../dashboard/Card.module.css";
import styles from "./WithdrawPage.module.css";

function formatArrival(seconds: number): string {
  if (seconds >= 86_400) {
    const days = Math.round(seconds / 86_400);
    return days <= 1 ? "1 business day" : `${days} business days`;
  }
  if (seconds >= 3_600) {
    const hours = Math.round(seconds / 3_600);
    return `~${hours} hour${hours === 1 ? "" : "s"}`;
  }
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `~${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/**
 * The one step in Withdraw that keeps a hard review — unlike Deposit, this
 * moves real money out against a rate-locked quote, so a pause-and-confirm
 * (with a visible countdown, matching the original design's trust detail)
 * is warranted rather than redundant.
 */
export function WithdrawReview({
  amount,
  quote,
  onBack,
  onRefreshQuote,
  onConfirm,
}: {
  amount: number;
  quote: FiatWithdrawQuote;
  onBack: () => void;
  onRefreshQuote: () => Promise<void>;
  onConfirm: () => Promise<void>;
}) {
  const secondsLeft = useCountdown(quote.expiresInSeconds, quote);
  const [confirming, setConfirming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const expired = secondsLeft <= 0;
  const totalFee = quote.networkFee + quote.transactionFee;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await onRefreshQuote();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  }

  return (
    <FlowLayout>
      <StepHeader title="Review withdrawal" onBack={onBack} />
      <div className={`${card.card} ${styles.reviewCard}`}>
        <div className={styles.reviewAmountLabel}>Withdraw</div>
        <div className={`${styles.reviewAmount} ep-serif`}>{formatUsd(amount)}</div>
        <div className={styles.reviewSub}>to Chase &bull;&bull;4821</div>

        <div className={styles.rows}>
          <div className={styles.row}>
            <span>Fee</span>
            <span>{totalFee > 0 ? formatUsd(totalFee) : "Free"}</span>
          </div>
          <div className={styles.row}>
            <span>Arrives</span>
            <span>{formatArrival(quote.estimatedArrivalSeconds)}</span>
          </div>
        </div>

        <p className={`${styles.note} ${expired ? styles.noteExpired : ""}`}>
          {expired
            ? "This quote has expired — rates may have changed."
            : `Rate locked for ${formatCountdown(secondsLeft)}. Your bank may apply its own inbound fees.`}
        </p>

        {expired ? (
          <button type="button" className={styles.submit} onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "Getting new quote…" : "Get new quote"}
          </button>
        ) : (
          <button type="button" className={styles.submit} onClick={handleConfirm} disabled={confirming}>
            {confirming ? "Confirming…" : "Confirm withdrawal"}
          </button>
        )}
      </div>
    </FlowLayout>
  );
}
