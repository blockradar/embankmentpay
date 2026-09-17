import { useState } from "react";
import { api } from "../../api";
import { useAsync } from "../../lib/useAsync";
import { DEFAULT_NETWORK } from "../../config/networks";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { FlowComplete } from "../../components/FlowComplete";
import { AmountInput } from "../../components/AmountInput";
import type { CryptoWithdrawFee, SettlementNetwork } from "../../api/types";
import { WithdrawReview } from "./WithdrawReview";
import card from "../dashboard/Card.module.css";
import styles from "./WithdrawPage.module.css";

const NETWORK: SettlementNetwork = DEFAULT_NETWORK;

// Arc's exact address format isn't confirmed from the docs available to us —
// a lenient non-empty/length check stands in until live integration
// confirms the real format.
function validateAddress(address: string): string | undefined {
  const trimmed = address.trim();
  if (!trimmed) return undefined; // no error yet — just hasn't been typed
  if (trimmed.length < 10) return "Enter a valid Arc address.";
  return undefined;
}

type Step =
  | { kind: "amount" }
  | {
      kind: "review";
      address: string;
      amount: number;
      fee: CryptoWithdrawFee;
    }
  | { kind: "complete"; address: string; amount: number; newBalanceUsd: number };

/**
 * Withdraw flow: amount → destination → review → done. Same-chain crypto
 * withdrawal on Arc only (the live settlement network) — no chain picker.
 * Amount comes first so the fee/arrival estimate request has everything it
 * needs by the time the destination is entered. Keeps a review step since
 * this sends real money on-chain and is irreversible once confirmed.
 */
export function WithdrawPage() {
  const [step, setStep] = useState<Step>({ kind: "amount" });
  const { data: balance } = useAsync(() => api.account.getBalance(NETWORK), []);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState(0);
  const [requestingFee, setRequestingFee] = useState(false);

  const available = balance?.availableUsd ?? 0;
  const overBalance = amount > available;
  const addressError = validateAddress(address);
  const canSubmit = amount > 0 && !overBalance && address.trim().length > 0 && !addressError;

  async function requestFee(forAddress: string, forAmount: number) {
    const fee = await api.withdraw.getCryptoWithdrawFee({
      network: NETWORK,
      address: forAddress,
      amountUsd: forAmount,
    });
    setStep({ kind: "review", address: forAddress, amount: forAmount, fee });
  }

  async function handleContinue() {
    setRequestingFee(true);
    try {
      await requestFee(address.trim(), amount);
    } finally {
      setRequestingFee(false);
    }
  }

  if (step.kind === "complete") {
    return (
      <FlowComplete
        headline="Sent"
        description={`$${step.amount.toFixed(2)} sent to ${step.address.slice(0, 6)}…${step.address.slice(-4)} on Arc.`}
        newBalanceUsd={step.newBalanceUsd}
      />
    );
  }

  if (step.kind === "review") {
    return (
      <WithdrawReview
        network={NETWORK}
        address={step.address}
        amount={step.amount}
        fee={step.fee}
        onBack={() => setStep({ kind: "amount" })}
        onConfirm={async () => {
          await api.withdraw.executeCryptoWithdraw({
            network: NETWORK,
            address: step.address,
            amountUsd: step.amount,
          });
          const nextBalance = await api.account.getBalance(NETWORK);
          setStep({
            kind: "complete",
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
        <AmountInput
          onAmountChange={setAmount}
          available={available}
          unitLabel="USDC"
          error={overBalance ? "Exceeds available balance" : undefined}
        />

        <label className={styles.addressField}>
          <span className={styles.addressLabel}>Destination address</span>
          <input
            className={styles.addressInput}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Arc address"
            aria-label="Destination address"
            spellCheck={false}
          />
          {addressError && <span className={styles.addressError}>{addressError}</span>}
        </label>

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
