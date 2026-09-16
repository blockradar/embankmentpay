import { useState } from "react";
import { api } from "../../api";
import { env } from "../../config/env";
import { useAsync } from "../../lib/useAsync";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { FlowComplete } from "../../components/FlowComplete";
import { AmountInput } from "../../components/AmountInput";
import type { CryptoWithdrawFee, SettlementNetwork } from "../../api/types";
import { WithdrawReview } from "./WithdrawReview";
import card from "../dashboard/Card.module.css";
import styles from "./WithdrawPage.module.css";

const CHAINS: { id: SettlementNetwork; label: string }[] = [
  { id: "base", label: "Base" },
  { id: "arc", label: "Arc" },
];

// Base is confirmed EVM-compatible (real live wallet data). Arc's exact
// address format isn't confirmed from the docs available to us — a lenient
// non-empty/length check stands in until Arc's live integration confirms
// the real format.
function validateAddress(network: SettlementNetwork, address: string): string | undefined {
  const trimmed = address.trim();
  if (!trimmed) return undefined; // no error yet — just hasn't been typed
  if (network === "base" && !/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return "Enter a valid Base address (0x… 40 hex characters).";
  }
  if (network === "arc" && trimmed.length < 10) {
    return "Enter a valid Arc address.";
  }
  return undefined;
}

type Step =
  | { kind: "amount" }
  | {
      kind: "review";
      network: SettlementNetwork;
      address: string;
      amount: number;
      fee: CryptoWithdrawFee;
    }
  | { kind: "complete"; network: SettlementNetwork; address: string; amount: number; newBalanceUsd: number };

/**
 * Withdraw flow: amount + destination → review → done. Crypto withdrawal
 * to an external address is a single-screen input step (no session/resolve
 * dance the way fiat withdraw needed — there's no bank account to verify),
 * but keeps a review step since this sends real money on-chain and is
 * irreversible once confirmed.
 */
export function WithdrawPage() {
  const [step, setStep] = useState<Step>({ kind: "amount" });
  const { data: balance } = useAsync(() => api.deposit.getBalance(), []);
  const [network, setNetwork] = useState<SettlementNetwork>(env.defaultNetwork);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState(0);
  const [requestingFee, setRequestingFee] = useState(false);

  const available = balance?.availableUsd ?? 0;
  const overBalance = amount > available;
  const addressError = validateAddress(network, address);
  const canSubmit = amount > 0 && !overBalance && address.trim().length > 0 && !addressError;

  async function requestFee(forNetwork: SettlementNetwork, forAddress: string, forAmount: number) {
    const fee = await api.withdraw.getCryptoWithdrawFee({
      network: forNetwork,
      address: forAddress,
      amountUsd: forAmount,
    });
    setStep({ kind: "review", network: forNetwork, address: forAddress, amount: forAmount, fee });
  }

  async function handleContinue() {
    setRequestingFee(true);
    try {
      await requestFee(network, address.trim(), amount);
    } finally {
      setRequestingFee(false);
    }
  }

  if (step.kind === "complete") {
    return (
      <FlowComplete
        headline="Sent"
        description={`$${step.amount.toFixed(2)} sent to ${step.address.slice(0, 6)}…${step.address.slice(-4)} on ${
          CHAINS.find((c) => c.id === step.network)?.label ?? step.network
        }.`}
        newBalanceUsd={step.newBalanceUsd}
      />
    );
  }

  if (step.kind === "review") {
    return (
      <WithdrawReview
        network={step.network}
        address={step.address}
        amount={step.amount}
        fee={step.fee}
        onBack={() => setStep({ kind: "amount" })}
        onConfirm={async () => {
          await api.withdraw.executeCryptoWithdraw({
            network: step.network,
            address: step.address,
            amountUsd: step.amount,
          });
          const nextBalance = await api.deposit.getBalance();
          setStep({
            kind: "complete",
            network: step.network,
            address: step.address,
            amount: step.amount,
            newBalanceUsd: nextBalance.totalUsd,
          });
        }}
      />
    );
  }

  return (
    <FlowLayout>
      <StepHeader title="Withdraw" />
      <div className={`${card.card} ${styles.card}`}>
        <div className={styles.chainRow}>
          {CHAINS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`${styles.chip} ${network === c.id ? styles.chipSelected : ""}`}
              onClick={() => setNetwork(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label className={styles.addressField}>
          <span className={styles.addressLabel}>Destination address</span>
          <input
            className={styles.addressInput}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={network === "base" ? "0x…" : "Arc address"}
            aria-label="Destination address"
            spellCheck={false}
          />
          {addressError && <span className={styles.addressError}>{addressError}</span>}
        </label>

        <AmountInput
          onAmountChange={setAmount}
          available={available}
          error={overBalance ? "Exceeds available balance" : undefined}
        />
        <button
          type="button"
          className={styles.submit}
          disabled={!canSubmit || requestingFee}
          onClick={handleContinue}
        >
          {requestingFee ? "Continuing…" : "Continue"}
        </button>
      </div>
    </FlowLayout>
  );
}
