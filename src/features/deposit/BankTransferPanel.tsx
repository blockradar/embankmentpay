import { useState } from "react";
import { api } from "../../api";
import { env } from "../../config/env";
import { simulateDepositArriving } from "../../api/adapters/mock/simulate";
import { useAsync } from "../../lib/useAsync";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { CopyButton } from "../../components/CopyButton";
import card from "../dashboard/Card.module.css";
import styles from "./panels.module.css";

const SIMULATED_AMOUNT_USD = 250;

export function BankTransferPanel({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: (info: { headline: string; description: string; newBalanceUsd: number }) => void;
}) {
  const { data: account, loading } = useAsync(() => api.deposit.createVirtualAccount("USD"), []);
  const [submitting, setSubmitting] = useState(false);

  async function handleSimulate() {
    setSubmitting(true);
    simulateDepositArriving(SIMULATED_AMOUNT_USD, {
      kind: "bank-deposit",
      title: "Bank deposit",
      subtitle: "Virtual account · USD",
    });
    const balance = await api.deposit.getBalance();
    onComplete({
      headline: "Deposit credited",
      description: `$${SIMULATED_AMOUNT_USD.toFixed(2)} was converted to USDC and added to your balance.`,
      newBalanceUsd: balance.totalUsd,
    });
  }

  return (
    <FlowLayout>
      <StepHeader title="Bank transfer" onBack={onBack} />
      <div className={`${card.card} ${styles.detailCard}`}>
        {loading || !account ? (
          <p className={styles.loading}>Setting up your deposit account&hellip;</p>
        ) : (
          <>
            <div className={styles.bankGrid}>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Bank</div>
                <div className={styles.fieldValue}>{account.bankName}</div>
              </div>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Routing number</div>
                <div className={styles.fieldValue}>{account.bankCode}</div>
              </div>
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Account number</div>
              <div className={styles.fieldValue}>{account.accountNumber}</div>
            </div>
            <div className={styles.fieldActions}>
              <CopyButton value={account.accountNumber} label="Copy account number" />
              <CopyButton value={account.reference} label="Copy reference" />
            </div>

            <ol className={styles.instructions}>
              <li>
                <b>1</b> Send USD from your bank to this account, using the reference above.
              </li>
              <li>
                <b>2</b> We convert it to USDC automatically — no extra steps on your end.
              </li>
              <li>
                <b>3</b> It lands in your balance, usually within minutes.
              </li>
            </ol>

            {env.apiMode === "mock" && (
              <button
                type="button"
                className={styles.simulate}
                onClick={handleSimulate}
                disabled={submitting}
              >
                Prototype: simulate ${SIMULATED_AMOUNT_USD} arriving
              </button>
            )}
          </>
        )}
      </div>
    </FlowLayout>
  );
}
