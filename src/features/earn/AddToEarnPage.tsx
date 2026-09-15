import { useState } from "react";
import { api } from "../../api";
import { useAsync } from "../../lib/useAsync";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { FlowComplete } from "../../components/FlowComplete";
import { AmountInput } from "../../components/AmountInput";
import { formatUsd } from "../../lib/format";
import card from "../dashboard/Card.module.css";
import styles from "./EarnForm.module.css";

type Step = { kind: "form" } | { kind: "complete"; amountUsd: number; newBalanceUsd: number };

/**
 * Add to Earn, collapsed to a single screen. Unlike Withdraw/Swap, moving
 * your own money into your own Earn position has no external counterparty,
 * no rate lock, and is instantly reversible (no lock-up) — so a separate
 * review step isn't earning its keep here. The yield estimate updates live
 * as you type instead of waiting for a review screen to show it.
 */
export function AddToEarnPage() {
  const [step, setStep] = useState<Step>({ kind: "form" });
  const { data: balance } = useAsync(() => api.deposit.getBalance(), []);
  const { data: position } = useAsync(() => api.earn.getPosition(), []);
  const [amount, setAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const available = balance?.availableUsd ?? 0;
  const apyPct = position?.apyPct ?? 0;
  const overBalance = amount > available;
  const canSubmit = amount > 0 && !overBalance;
  const monthlyEstimate = (amount * (apyPct / 100)) / 12;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.earn.deposit(amount);
      const nextBalance = await api.deposit.getBalance();
      setStep({ kind: "complete", amountUsd: amount, newBalanceUsd: nextBalance.totalUsd });
    } finally {
      setSubmitting(false);
    }
  }

  if (step.kind === "complete") {
    return (
      <FlowComplete
        headline="Earning"
        description={`${formatUsd(step.amountUsd)} is now earning ${apyPct.toFixed(2)}% APY.`}
        newBalanceUsd={step.newBalanceUsd}
      />
    );
  }

  return (
    <FlowLayout>
      <StepHeader title="Add to Earn" />
      <div className={`${card.card} ${styles.card}`}>
        <AmountInput
          onAmountChange={setAmount}
          available={available}
          error={overBalance ? "Exceeds available balance" : undefined}
        />
        {amount > 0 && !overBalance && (
          <div className={styles.estimate}>
            ≈ +{formatUsd(monthlyEstimate)} per month at {apyPct.toFixed(2)}% APY
          </div>
        )}
        <button
          type="button"
          className={styles.submit}
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Starting…" : "Start earning"}
        </button>
      </div>
    </FlowLayout>
  );
}
