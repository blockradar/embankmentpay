import { useState } from "react";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { formatUsd, truncateAddress } from "../../lib/format";
import { NETWORK_LABELS } from "../../config/networks";
import type { CryptoWithdrawFee, SettlementNetwork } from "../../api/types";
import card from "../dashboard/Card.module.css";
import styles from "./WithdrawPage.module.css";

function formatArrival(seconds: number): string {
  if (seconds < 60) return `~${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `~${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/**
 * Withdraw's one hard review step — a same-chain on-chain send is
 * irreversible once confirmed, unlike Deposit, so a pause is warranted.
 * There's no rate-locked quote here, just a point-in-time network-fee
 * estimate, so no countdown.
 */
export function WithdrawReview({
  network,
  address,
  amount,
  fee,
  onBack,
  onConfirm,
}: {
  network: SettlementNetwork;
  address: string;
  amount: number;
  fee: CryptoWithdrawFee;
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

  return (
    <FlowLayout>
      <StepHeader title="Review withdrawal" onBack={onBack} />
      <div className={`${card.card} ${styles.reviewCard}`}>
        <div className={styles.reviewAmountLabel}>Withdraw</div>
        <div className={`${styles.reviewAmount} ep-serif`}>{formatUsd(amount)}</div>
        <div className={styles.reviewSub}>
          to {truncateAddress(address)} &middot; {NETWORK_LABELS[network]}
        </div>

        <div className={styles.rows}>
          <div className={styles.row}>
            <span>Network fee</span>
            <span>{fee.networkFeeUsd > 0 ? formatUsd(fee.networkFeeUsd) : "Free"}</span>
          </div>
          <div className={styles.row}>
            <span>Arrives</span>
            <span>{formatArrival(fee.estimatedArrivalSeconds)}</span>
          </div>
        </div>

        <p className={styles.note}>Sent directly on-chain — this can't be reversed once confirmed.</p>

        <button type="button" className={styles.submit} onClick={handleConfirm} disabled={confirming}>
          {confirming ? "Confirming…" : "Confirm withdrawal"}
        </button>
      </div>
    </FlowLayout>
  );
}
