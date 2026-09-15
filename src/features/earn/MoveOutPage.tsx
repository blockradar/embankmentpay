import { useState } from "react";
import { api } from "../../api";
import { useAsync } from "../../lib/useAsync";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { FlowComplete } from "../../components/FlowComplete";
import { AmountInput } from "../../components/AmountInput";
import { percentChips } from "../../lib/amountChips";
import { formatUsd } from "../../lib/format";
import card from "../dashboard/Card.module.css";
import styles from "./EarnForm.module.css";

const CHIPS = percentChips([25, 50]);

type Step = { kind: "form" } | { kind: "complete"; amountUsd: number; newBalanceUsd: number };

/**
 * Move money out of Earn, collapsed to a single screen for the same reason
 * as Add to Earn: no external counterparty, no rate lock, withdraw-anytime.
 * The ceiling here is what's actually earning (`rewardPosition.principalUsd`),
 * not the account's available balance — those are two different numbers.
 */
export function MoveOutPage() {
  const [step, setStep] = useState<Step>({ kind: "form" });
  const { data: position } = useAsync(() => api.earn.getPosition(), []);
  const [amount, setAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const available = position?.principalUsd ?? 0;
  const overBalance = amount > available;
  const canSubmit = amount > 0 && !overBalance;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.earn.withdraw(amount);
      const nextBalance = await api.deposit.getBalance();
      setStep({ kind: "complete", amountUsd: amount, newBalanceUsd: nextBalance.totalUsd });
    } finally {
      setSubmitting(false);
    }
  }

  if (step.kind === "complete") {
    return (
      <FlowComplete
        headline="Moved out"
        description={`${formatUsd(step.amountUsd)} moved to your available balance.`}
        newBalanceUsd={step.newBalanceUsd}
      />
    );
  }

  return (
    <FlowLayout>
      <StepHeader title="Move out" />
      <div className={`${card.card} ${styles.card}`}>
        <AmountInput
          onAmountChange={setAmount}
          available={available}
          chips={CHIPS}
          error={overBalance ? "Exceeds Earn balance" : undefined}
        />
        <button
          type="button"
          className={styles.submit}
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Moving…" : "Move out"}
        </button>
      </div>
    </FlowLayout>
  );
}
