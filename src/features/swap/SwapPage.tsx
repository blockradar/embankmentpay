import { useState } from "react";
import { api } from "../../api";
import { useAsync } from "../../lib/useAsync";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { FlowComplete } from "../../components/FlowComplete";
import { SelectableCard } from "../../components/SelectableCard";
import { AmountInput } from "../../components/AmountInput";
import { percentChips } from "../../lib/amountChips";
import { formatUsd } from "../../lib/format";
import type { OnChainAssetHolding, SwapQuote } from "../../api/types";
import { SwapReview } from "./SwapReview";
import { AssetIcon } from "./AssetIcon";
import card from "../dashboard/Card.module.css";
import styles from "./SwapPage.module.css";

type Step =
  | { kind: "asset" }
  | { kind: "amount"; holding: OnChainAssetHolding }
  | { kind: "review"; holding: OnChainAssetHolding; amount: number; quote: SwapQuote }
  | { kind: "complete"; toAmountUsd: number; newBalanceUsd: number };

const USDC_ASSET_ID = "usdc-base";
const SWAP_CHIPS = percentChips([25, 50]);

/**
 * Swap flow: asset picker → amount → review → done. Unlike Deposit/Withdraw,
 * the asset picker is a real decision (multiple holdings) so it stays — but
 * selecting a row advances immediately, no separate "Continue" button like
 * the original mockup had. Review is kept (real slippage risk against a
 * live, short-lived quote) for the same reason Withdraw keeps one.
 */
export function SwapPage() {
  const [step, setStep] = useState<Step>({ kind: "asset" });
  const { data: holdings, loading } = useAsync(() => api.swap.getHoldings(), []);
  const [amount, setAmount] = useState(0);
  const [requestingQuote, setRequestingQuote] = useState(false);

  if (step.kind === "complete") {
    return (
      <FlowComplete
        headline="Swapped"
        description={`${formatUsd(step.toAmountUsd)} USDC added to your balance.`}
        newBalanceUsd={step.newBalanceUsd}
      />
    );
  }

  if (step.kind === "review") {
    const { holding, amount: reviewAmount, quote } = step;
    return (
      <SwapReview
        holding={holding}
        amount={reviewAmount}
        quote={quote}
        onBack={() => setStep({ kind: "amount", holding })}
        onRefreshQuote={async () => {
          const freshQuote = await api.swap.getSwapQuote({
            fromAssetId: holding.assetId,
            toAssetId: USDC_ASSET_ID,
            amount: reviewAmount,
            amountSide: "source",
          });
          setStep({ kind: "review", holding, amount: reviewAmount, quote: freshQuote });
        }}
        onConfirm={async () => {
          await api.swap.executeSwap({ fromAssetId: holding.assetId, toAssetId: USDC_ASSET_ID, amount: reviewAmount });
          const balance = await api.deposit.getBalance();
          setStep({ kind: "complete", toAmountUsd: quote.toAmount, newBalanceUsd: balance.totalUsd });
        }}
      />
    );
  }

  if (step.kind === "amount") {
    const holding = step.holding;
    const overBalance = amount > holding.balance;
    const canSubmit = amount > 0 && !overBalance;

    async function handleSubmit() {
      setRequestingQuote(true);
      try {
        const quote = await api.swap.getSwapQuote({
          fromAssetId: holding.assetId,
          toAssetId: USDC_ASSET_ID,
          amount,
          amountSide: "source",
        });
        setStep({ kind: "review", holding, amount, quote });
      } finally {
        setRequestingQuote(false);
      }
    }

    return (
      <FlowLayout>
        <StepHeader title={`Swap ${holding.symbol}`} onBack={() => setStep({ kind: "asset" })} />
        <div className={`${card.card} ${styles.card}`}>
          <div className={styles.destination}>{holding.symbol} &rarr; USDC</div>
          <AmountInput
            onAmountChange={setAmount}
            available={holding.balance}
            unitLabel={holding.symbol}
            prefix=""
            chips={SWAP_CHIPS}
            decimals={6}
            formatAvailable={(value) => `${value} ${holding.symbol}`}
            error={overBalance ? "Exceeds available balance" : undefined}
          />
          <button
            type="button"
            className={styles.submit}
            disabled={!canSubmit || requestingQuote}
            onClick={handleSubmit}
          >
            {requestingQuote ? "Getting quote…" : "Review swap"}
          </button>
        </div>
      </FlowLayout>
    );
  }

  return (
    <FlowLayout>
      <StepHeader title="Swap to USDC" />
      <p className={styles.subtitle}>Convert assets already in your wallet into USDC.</p>
      <div className={styles.cardList}>
        {loading || !holdings ? (
          <p className={styles.loading}>Loading your holdings&hellip;</p>
        ) : (
          holdings.map((holding) => (
            <SelectableCard
              key={holding.assetId}
              icon={<AssetIcon symbol={holding.symbol} />}
              title={holding.name}
              subtitle={`${holding.balance} ${holding.symbol}`}
              trailing={
                <span className={styles.trailing}>
                  <div>{formatUsd(holding.balanceUsd)}</div>
                  <div className={styles.rate}>
                    1 {holding.symbol} = {formatUsd(holding.priceUsd)}
                  </div>
                </span>
              }
              onClick={() => setStep({ kind: "amount", holding })}
            />
          ))
        )}
      </div>
    </FlowLayout>
  );
}
