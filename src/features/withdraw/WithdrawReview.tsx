import { useState } from "react";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { truncateAddress } from "../../lib/format";
import { NETWORK_LABELS } from "../../config/networks";
import type { SettlementNetwork, WithdrawQuote } from "../../api/types";
import card from "../dashboard/Card.module.css";
import styles from "./WithdrawPage.module.css";

function formatArrival(seconds: number): string {
  if (seconds < 60) return `~${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `~${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/** Up to 6 significant decimals: "0.0023670721183536" → "0.002367". */
function formatFee(fee: string): string {
  return Number(fee).toPrecision(4).replace(/\.?0+$/, "");
}

/**
 * Withdraw's one hard review step — an on-chain send is irreversible once
 * confirmed. Shows the Arc hook: gas is estimated in USDC and paid by the
 * platform, not the user.
 */
export function WithdrawReview({
  network,
  quote,
  error,
  onBack,
  onConfirm,
}: {
  network: SettlementNetwork;
  quote: WithdrawQuote;
  error: string | null;
  onBack: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  }

  const paidByPlatform = quote.gasPaidBy === "platform";

  return (
    <FlowLayout>
      <StepHeader title="Review withdrawal" onBack={onBack} />
      <div className={`${card.card} ${styles.reviewCard}`}>
        <div className={styles.reviewAmountLabel}>Withdraw</div>
        <div className={`${styles.reviewAmount} ep-serif`}>{quote.amount} USDC</div>
        <div className={styles.reviewSub}>
          to {truncateAddress(quote.address)} &middot; {NETWORK_LABELS[network]}
        </div>

        <div className={styles.rows}>
          <div className={styles.row}>
            <span>Network fee (gas)</span>
            <span>
              {formatFee(quote.networkFee)} {quote.gasToken}
            </span>
          </div>
          <div className={styles.row}>
            <span>Gas paid by</span>
            <span>{paidByPlatform ? "Embankment Pay (you pay $0)" : "You"}</span>
          </div>
          <div className={styles.row}>
            <span>You receive</span>
            <span>{quote.amount} USDC</span>
          </div>
          <div className={styles.row}>
            <span>Arrives</span>
            <span>{formatArrival(quote.estimatedArrivalSeconds)}</span>
          </div>
        </div>

        <p className={error ? styles.addressError : styles.note}>
          {error ?? "Sent directly on-chain — this can't be reversed once confirmed."}
        </p>

        <button type="button" className={styles.submit} onClick={handleConfirm} disabled={confirming}>
          {confirming ? "Sending…" : "Confirm withdrawal"}
        </button>
      </div>
    </FlowLayout>
  );
}
