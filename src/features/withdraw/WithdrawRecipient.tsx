import { useState } from "react";
import { api } from "../../api";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { formatUsd } from "../../lib/format";
import type { ResolvedRecipient } from "../../api/types";
import card from "../dashboard/Card.module.css";
import styles from "./WithdrawRecipient.module.css";

/**
 * Blockradar has no saved/reusable payout method — a bank account is
 * collected and resolved to its holder's name (an anti-fraud check) fresh
 * on every withdrawal. Editing either field after a successful resolve
 * invalidates it, so a stale name can never carry over to edited numbers.
 */
export function WithdrawRecipient({
  amount,
  sessionId,
  onBack,
  onContinue,
}: {
  amount: number;
  sessionId: string;
  onBack: () => void;
  onContinue: (recipient: ResolvedRecipient) => void;
}) {
  const [institutionIdentifier, setInstitutionIdentifier] = useState("021000021");
  const [accountIdentifier, setAccountIdentifier] = useState("0000481124");
  const [resolved, setResolved] = useState<ResolvedRecipient | null>(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function invalidate() {
    setResolved(null);
    setError(null);
  }

  async function handleResolve() {
    setResolving(true);
    setError(null);
    try {
      const { accountName } = await api.withdraw.resolvePaymentAccount({
        sessionId,
        institutionIdentifier,
        accountIdentifier,
      });
      setResolved({ institutionIdentifier, accountIdentifier, accountName });
    } catch (err) {
      setResolved(null);
      setError(err instanceof Error ? err.message : "Couldn't verify this account.");
    } finally {
      setResolving(false);
    }
  }

  const canVerify =
    institutionIdentifier.trim().length > 0 && accountIdentifier.trim().length > 0 && !resolving;

  return (
    <FlowLayout>
      <StepHeader title="Withdraw to bank" onBack={onBack} />
      <div className={`${card.card} ${styles.card}`}>
        <div className={styles.amountLine}>
          Withdrawing <b>{formatUsd(amount)}</b>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Routing number</span>
          <input
            className={styles.input}
            value={institutionIdentifier}
            onChange={(e) => {
              setInstitutionIdentifier(e.target.value);
              invalidate();
            }}
            inputMode="numeric"
            aria-label="Routing number"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Account number</span>
          <input
            className={styles.input}
            value={accountIdentifier}
            onChange={(e) => {
              setAccountIdentifier(e.target.value);
              invalidate();
            }}
            inputMode="numeric"
            aria-label="Account number"
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}
        {resolved && (
          <p className={styles.resolved}>
            Sending to <b>{resolved.accountName}</b>
          </p>
        )}

        {resolved ? (
          <button type="button" className={styles.submit} onClick={() => onContinue(resolved)}>
            Continue
          </button>
        ) : (
          <button type="button" className={styles.submit} disabled={!canVerify} onClick={handleResolve}>
            {resolving ? "Verifying account…" : "Verify account"}
          </button>
        )}
      </div>
    </FlowLayout>
  );
}
