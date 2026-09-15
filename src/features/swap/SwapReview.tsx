import { useState } from "react";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { formatCountdown, formatUsd } from "../../lib/format";
import { useCountdown } from "../../lib/useCountdown";
import type { OnChainAssetHolding, SwapQuote } from "../../api/types";
import card from "../dashboard/Card.module.css";
import styles from "./SwapPage.module.css";

/** "eth-base" → "Base" */
function chainLabel(assetId: string): string {
  const chain = assetId.split("-").slice(1).join("-");
  return chain.length > 0 ? chain.charAt(0).toUpperCase() + chain.slice(1) : "the network";
}

/**
 * The review step in Swap that keeps a hard confirm — a swap executes
 * against a live market quote with real slippage risk, so (like Withdraw's
 * rate-locked fiat quote) a pause-and-confirm with a visible countdown is
 * warranted. Swap's quote window is much shorter (15s, a live price) than
 * Withdraw's (~20min, a routed bank rate) — same pattern, different clock.
 */
export function SwapReview({
  holding,
  amount,
  quote,
  onBack,
  onRefreshQuote,
  onConfirm,
}: {
  holding: OnChainAssetHolding;
  amount: number;
  quote: SwapQuote;
  onBack: () => void;
  onRefreshQuote: () => Promise<void>;
  onConfirm: () => Promise<void>;
}) {
  const secondsLeft = useCountdown(quote.quoteValidSeconds, quote);
  const [confirming, setConfirming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const expired = secondsLeft <= 0;

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
      <StepHeader title="Review swap" onBack={onBack} />
      <div className={`${card.card} ${styles.reviewCard}`}>
        <div className={styles.reviewAmountLabel}>Swap</div>
        <div className={`${styles.reviewAmount} ep-serif`}>
          {amount} {holding.symbol}
        </div>
        <div className={styles.reviewSub}>&rarr; {formatUsd(quote.toAmount)} USDC</div>

        <div className={styles.rows}>
          <div className={styles.row}>
            <span>Rate</span>
            <span>
              1 {holding.symbol} = {formatUsd(quote.rate)}
            </span>
          </div>
          <div className={styles.row}>
            <span>Fee</span>
            <span>{quote.networkFeeInUsd > 0 ? formatUsd(quote.networkFeeInUsd) : "Free"}</span>
          </div>
          <div className={styles.row}>
            <span>You receive</span>
            <span>{formatUsd(quote.toAmount)} USDC</span>
          </div>
        </div>

        <p className={`${styles.note} ${expired ? styles.noteExpired : ""}`}>
          {expired
            ? "This quote has expired — prices may have moved."
            : `Executed on ${chainLabel(holding.assetId)}. Slippage capped at ${quote.slippagePct}%; if the price moves further the swap is cancelled. Quote valid for ${formatCountdown(secondsLeft)}.`}
        </p>

        {expired ? (
          <button type="button" className={styles.submit} onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "Getting new quote…" : "Get new quote"}
          </button>
        ) : (
          <button type="button" className={styles.submit} onClick={handleConfirm} disabled={confirming}>
            {confirming ? "Confirming…" : "Confirm swap"}
          </button>
        )}
      </div>
    </FlowLayout>
  );
}
