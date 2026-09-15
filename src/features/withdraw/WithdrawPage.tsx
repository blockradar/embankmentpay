import { useState } from "react";
import { api } from "../../api";
import { useAsync } from "../../lib/useAsync";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { FlowComplete } from "../../components/FlowComplete";
import { AmountInput } from "../../components/AmountInput";
import { formatUsd } from "../../lib/format";
import type { FiatWithdrawQuote } from "../../api/types";
import { WithdrawReview } from "./WithdrawReview";
import card from "../dashboard/Card.module.css";
import styles from "./WithdrawPage.module.css";

type Step =
  | { kind: "amount" }
  | { kind: "review"; amount: number; quote: FiatWithdrawQuote }
  | { kind: "complete"; amount: number; newBalanceUsd: number };

/**
 * Withdraw flow, simplified to amount → review → done. The original mockup
 * had a separate first screen for picking a currency + destination account;
 * since v1 ships USD-only with one destination, that screen is redundant —
 * the destination is just shown inline here. Unlike Deposit, this keeps a
 * real review step: it debits a rate-locked quote against real money
 * leaving to a bank, which is exactly the kind of action worth a pause.
 */
export function WithdrawPage() {
  const [step, setStep] = useState<Step>({ kind: "amount" });
  const { data: balance } = useAsync(() => api.deposit.getBalance(), []);
  const [amount, setAmount] = useState(0);
  const [requestingQuote, setRequestingQuote] = useState(false);

  const available = balance?.availableUsd ?? 0;
  const overBalance = amount > available;
  const canSubmit = amount > 0 && !overBalance;

  async function requestQuote(forAmount: number) {
    const quote = await api.withdraw.getFiatWithdrawQuote(forAmount);
    setStep({ kind: "review", amount: forAmount, quote });
  }

  async function handleRequestQuote() {
    setRequestingQuote(true);
    try {
      await requestQuote(amount);
    } finally {
      setRequestingQuote(false);
    }
  }

  if (step.kind === "complete") {
    return (
      <FlowComplete
        headline="On its way"
        description={`${formatUsd(step.amount)} arrives in Chase ••4821 within 1 business day.`}
        newBalanceUsd={step.newBalanceUsd}
      />
    );
  }

  if (step.kind === "review") {
    return (
      <WithdrawReview
        amount={step.amount}
        quote={step.quote}
        onBack={() => setStep({ kind: "amount" })}
        onRefreshQuote={() => requestQuote(step.amount)}
        onConfirm={async () => {
          await api.withdraw.executeFiatWithdraw(step.quote);
          const nextBalance = await api.deposit.getBalance();
          setStep({ kind: "complete", amount: step.amount, newBalanceUsd: nextBalance.totalUsd });
        }}
      />
    );
  }

  return (
    <FlowLayout>
      <StepHeader title="Withdraw" />
      <div className={`${card.card} ${styles.card}`}>
        <div className={styles.destination}>To Chase &bull;&bull;4821 &middot; USD</div>
        <AmountInput
          onAmountChange={setAmount}
          availableUsd={available}
          error={overBalance ? "Exceeds available balance" : undefined}
        />
        <button
          type="button"
          className={styles.submit}
          disabled={!canSubmit || requestingQuote}
          onClick={handleRequestQuote}
        >
          {requestingQuote ? "Getting quote…" : "Review withdrawal"}
        </button>
      </div>
    </FlowLayout>
  );
}
