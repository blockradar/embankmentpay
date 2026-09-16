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
  { id: "arc", label: "Arc" },
  { id: "base", label: "Base" },
  { id: "ethereum", label: "Ethereum" },
  { id: "polygon", label: "Polygon" },
  { id: "solana", label: "Solana" },
  { id: "tron", label: "Tron" },
];

const ARC_LABEL = CHAINS.find((c) => c.id === "arc")!.label;

// Arc is the intended settlement network for stablecoin deposits, but it
// has no live wallet provisioned yet on this Blockradar account. Default to
// Arc in mock mode to match that product direction; default to Base in
// live mode so the panel doesn't open straight into a "not live yet" error
// (only Base has a live wallet configured — see deposit.live.ts).
const DEFAULT_CHAIN: DepositSourceChain = env.apiModes.deposit === "live" ? "base" : "arc";

const SIMULATED_AMOUNT_USDC = 500;

export function StablecoinPanel({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: (info: { headline: string; description: string; newBalanceUsd: number }) => void;
}) {
  const [chain, setChain] = useState<DepositSourceChain>(DEFAULT_CHAIN);
  const { data: address, loading, error } = useAsync(
    () => api.deposit.createStablecoinAddress(chain),
    [chain],
  );
  const [submitting, setSubmitting] = useState(false);

  const chainLabel = CHAINS.find((c) => c.id === chain)?.label ?? chain;
  const isArc = chain === "arc";

  async function handleSimulate() {
    setSubmitting(true);
    simulateDepositArriving(SIMULATED_AMOUNT_USDC, {
      kind: "deposit-received",
      title: `From ${chainLabel}`,
      subtitle: isArc ? `USDC on ${ARC_LABEL}` : `USDC via ${chainLabel} → ${ARC_LABEL}`,
    });
    const balance = await api.deposit.getBalance();
    onComplete({
      headline: "Deposit credited",
      description: isArc
        ? `${SIMULATED_AMOUNT_USDC} USDC was added to your balance.`
        : `${SIMULATED_AMOUNT_USDC} USDC from ${chainLabel} was bridged into ${ARC_LABEL} and added to your balance.`,
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

            {!isArc && (
              <p className={styles.settlementFlag}>
                <b>Note:</b> deposits from {chainLabel} settle into the equivalent stablecoin on{" "}
                {ARC_LABEL}.
              </p>
            )}

            <ol className={styles.instructions}>
              {isArc ? (
                <>
                  <li>
                    <b>1</b> Send USDC or USDT from any {ARC_LABEL} wallet or exchange.
                  </li>
                  <li>
                    <b>2</b> It lands in your balance — network fee only.
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <b>1</b> Send USDC or USDT from any {chainLabel} wallet or exchange.
                  </li>
                  <li>
                    <b>2</b> We bridge it into {ARC_LABEL} automatically.
                  </li>
                  <li>
                    <b>3</b> It lands in your balance as the equivalent stablecoin on {ARC_LABEL} —
                    network fee only.
                  </li>
                </>
              )}
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
