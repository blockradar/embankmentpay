import { useState } from "react";
import { api } from "../../api";
import { useAsync } from "../../lib/useAsync";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { FlowComplete } from "../../components/FlowComplete";
import { AmountInput } from "../../components/AmountInput";
import { formatUsd } from "../../lib/format";
import type { FiatWithdrawQuote, ResolvedRecipient } from "../../api/types";
import { WithdrawRecipient } from "./WithdrawRecipient";
import { WithdrawReview } from "./WithdrawReview";
import card from "../dashboard/Card.module.css";
import styles from "./WithdrawPage.module.css";

type Step =
  | { kind: "amount" }
  | { kind: "recipient"; amount: number; sessionId: string }
  | {
      kind: "review";
      amount: number;
      sessionId: string;
      recipient: ResolvedRecipient;
      quote: FiatWithdrawQuote;
    }
  | { kind: "complete"; amount: number; newBalanceUsd: number; recipient: ResolvedRecipient };

/**
 * Withdraw flow: amount → recipient → review → done. Blockradar's fiat
 * withdrawal has no saved/reusable payout method — a destination bank
 * account must be collected and resolved (to the holder's name, as an
 * anti-fraud check) fresh on every withdrawal, so unlike Deposit this
 * can't collapse the recipient step away. Review stays for the same
 * reason as before: a rate-locked quote against real money leaving to a
 * bank is worth a pause.
 */
export function WithdrawPage() {
  const [step, setStep] = useState<Step>({ kind: "amount" });
  const { data: balance } = useAsync(() => api.deposit.getBalance(), []);
  const [amount, setAmount] = useState(0);
  const [startingSession, setStartingSession] = useState(false);

  const available = balance?.availableUsd ?? 0;
  const overBalance = amount > available;
  const canSubmit = amount > 0 && !overBalance;

  async function handleStartSession() {
    setStartingSession(true);
    try {
      const { sessionId } = await api.withdraw.getWithdrawSession(amount);
      setStep({ kind: "recipient", amount, sessionId });
    } finally {
      setStartingSession(false);
    }
  }

  async function requestQuote(forAmount: number, sessionId: string, recipient: ResolvedRecipient) {
    const quote = await api.withdraw.getFiatWithdrawQuote({
      sessionId,
      amountUsd: forAmount,
      recipient,
    });
    setStep({ kind: "review", amount: forAmount, sessionId, recipient, quote });
  }

  if (step.kind === "complete") {
    return (
      <FlowComplete
        headline="On its way"
        description={`${formatUsd(step.amount)} arrives in ${step.recipient.accountName}'s account within 1 business day.`}
        newBalanceUsd={step.newBalanceUsd}
      />
    );
  }

  if (step.kind === "review") {
    return (
      <WithdrawReview
        amount={step.amount}
        quote={step.quote}
        recipient={step.recipient}
        onBack={() => setStep({ kind: "recipient", amount: step.amount, sessionId: step.sessionId })}
        onRefreshQuote={() => requestQuote(step.amount, step.sessionId, step.recipient)}
        onConfirm={async () => {
          await api.withdraw.executeFiatWithdraw({ quote: step.quote, recipient: step.recipient });
          const nextBalance = await api.deposit.getBalance();
          setStep({
            kind: "complete",
            amount: step.amount,
            newBalanceUsd: nextBalance.totalUsd,
            recipient: step.recipient,
          });
        }}
      />
    );
  }

  if (step.kind === "recipient") {
    return (
      <WithdrawRecipient
        amount={step.amount}
        sessionId={step.sessionId}
        onBack={() => setStep({ kind: "amount" })}
        onContinue={(recipient) => requestQuote(step.amount, step.sessionId, recipient)}
      />
    );
  }

  return (
    <FlowLayout>
      <StepHeader title="Withdraw" />
      <div className={`${card.card} ${styles.card}`}>
        <AmountInput
          onAmountChange={setAmount}
          available={available}
          error={overBalance ? "Exceeds available balance" : undefined}
        />
        <button
          type="button"
          className={styles.submit}
          disabled={!canSubmit || startingSession}
          onClick={handleStartSession}
        >
          {startingSession ? "Continuing…" : "Continue"}
        </button>
      </div>
    </FlowLayout>
  );
}
