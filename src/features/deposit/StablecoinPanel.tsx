import { useState } from "react";
import { api } from "../../api";
import { env } from "../../config/env";
import { simulateDepositArriving } from "../../api/adapters/mock/simulate";
import { useAsync } from "../../lib/useAsync";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { CopyButton } from "../../components/CopyButton";
import type { DepositSourceChain } from "../../api/types";
import card from "../dashboard/Card.module.css";
import styles from "./panels.module.css";

const CHAINS: { id: DepositSourceChain; label: string }[] = [
  { id: "base", label: "Base" },
  { id: "arc", label: "Arc" },
  { id: "ethereum", label: "Ethereum" },
  { id: "polygon", label: "Polygon" },
  { id: "solana", label: "Solana" },
  { id: "tron", label: "Tron" },
];

const SIMULATED_AMOUNT_USDC = 500;

export function StablecoinPanel({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: (info: { headline: string; description: string; newBalanceUsd: number }) => void;
}) {
  const [chain, setChain] = useState<DepositSourceChain>(env.defaultNetwork);
  const { data: address, loading, error } = useAsync(
    () => api.deposit.createStablecoinAddress(chain),
    [chain],
  );
  const [submitting, setSubmitting] = useState(false);

  const chainLabel = CHAINS.find((c) => c.id === chain)?.label ?? chain;
  const settlementLabel = env.networks[env.defaultNetwork].label;

  async function handleSimulate() {
    setSubmitting(true);
    simulateDepositArriving(SIMULATED_AMOUNT_USDC, {
      kind: "deposit-received",
      title: `From ${chainLabel}`,
      subtitle: `USDC via ${chainLabel} → ${settlementLabel}`,
    });
    const balance = await api.deposit.getBalance();
    onComplete({
      headline: "Deposit credited",
      description: `${SIMULATED_AMOUNT_USDC} USDC from ${chainLabel} was bridged in and added to your balance.`,
      newBalanceUsd: balance.totalUsd,
    });
  }

  return (
    <FlowLayout>
      <StepHeader title="Deposit stablecoins" onBack={onBack} />
      <div className={`${card.card} ${styles.detailCard}`}>
        <div>
          <div className={styles.chainRow}>
            {CHAINS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`${styles.chip} ${chain === c.id ? styles.chipSelected : ""}`}
                onClick={() => setChain(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className={styles.error}>{error.message}</p>
        ) : loading || !address ? (
          <p className={styles.loading}>Generating your {chainLabel} deposit address&hellip;</p>
        ) : (
          <>
            <div className={styles.qrRow}>
              <div className={styles.qr}>QR &middot; {chainLabel} deposit</div>
              <div className={styles.addressCol}>
                <div className={styles.address}>{address.address}</div>
                <div className={styles.fieldActions}>
                  <CopyButton value={address.address} label="Copy address" />
                </div>
              </div>
            </div>

            <ol className={styles.instructions}>
              <li>
                <b>1</b> Send USDC or USDT from any {chainLabel} wallet or exchange.
              </li>
              <li>
                <b>2</b> We bridge it into {settlementLabel} automatically.
              </li>
              <li>
                <b>3</b> It lands in your balance as USDC — network fee only.
              </li>
            </ol>

            {env.apiModes.deposit === "mock" && (
              <button
                type="button"
                className={styles.simulate}
                onClick={handleSimulate}
                disabled={submitting}
              >
                Prototype: simulate {SIMULATED_AMOUNT_USDC} USDC arriving
              </button>
            )}
          </>
        )}
      </div>
    </FlowLayout>
  );
}
