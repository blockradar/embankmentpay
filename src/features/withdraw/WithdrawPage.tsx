import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { useAsync } from "../../lib/useAsync";
import { truncateAddress } from "../../lib/format";
import { DEFAULT_NETWORK } from "../../config/networks";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { AmountInput } from "../../components/AmountInput";
import type { SettlementNetwork, Withdrawal, WithdrawQuote } from "../../api/types";
import { WithdrawReview } from "./WithdrawReview";
import card from "../dashboard/Card.module.css";
import styles from "./WithdrawPage.module.css";

const NETWORK: SettlementNetwork = DEFAULT_NETWORK;

// A quick check for instant feedback. The server re-validates everything.
function validateAddress(address: string): string | undefined {
  const trimmed = address.trim();
  if (!trimmed) return undefined; // nothing typed yet
  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) return "Enter a valid address (0x followed by 40 characters).";
  return undefined;
}

type Step =
  | { kind: "form" }
  // The idempotency key is created once per review, so a double-click or a
  // retry of "Confirm" can never send the money twice.
  | { kind: "review"; quote: WithdrawQuote; idempotencyKey: string }
  | { kind: "sent"; withdrawal: Withdrawal };

/**
 * Withdraw flow: amount + address → review (gas quoted in USDC) → sent
 * (status updated by the webhook). Same-chain send on Arc from the user's
 * own gasless deposit address.
 */
export function WithdrawPage() {
  const [step, setStep] = useState<Step>({ kind: "form" });
  const { data: balance } = useAsync(() => api.account.getBalance(NETWORK), []);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState(0);
  const [amountText, setAmountText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = balance?.availableUsd ?? 0;
  const overBalance = amount > available;
  const addressError = validateAddress(address);
  const canSubmit = amount > 0 && !overBalance && address.trim().length > 0 && !addressError;

  async function handleContinue() {
    setBusy(true);
    setError(null);
    try {
      const quote = await api.withdraw.getQuote(NETWORK, { address: address.trim(), amount: amountText });
      setStep({ kind: "review", quote, idempotencyKey: crypto.randomUUID() });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (step.kind === "sent") {
    return <WithdrawSent initial={step.withdrawal} />;
  }

  if (step.kind === "review") {
    return (
      <WithdrawReview
        network={NETWORK}
        quote={step.quote}
        error={error}
        onBack={() => {
          setError(null);
          setStep({ kind: "form" });
        }}
        onConfirm={async () => {
          setError(null);
          try {
            const withdrawal = await api.withdraw.send(NETWORK, {
              address: step.quote.address,
              amount: step.quote.amount,
              idempotencyKey: step.idempotencyKey,
            });
            setStep({ kind: "sent", withdrawal });
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      />
    );
  }

  return (
    <FlowLayout>
      <StepHeader title="Withdraw" />
      <div className={`${card.card} ${styles.card}`}>
        <AmountInput
          onAmountChange={(value, text) => {
            setAmount(value);
            setAmountText(text);
          }}
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
            placeholder="0x… (Arc address)"
            aria-label="Destination address"
            spellCheck={false}
          />
          {(addressError ?? error) && <span className={styles.addressError}>{addressError ?? error}</span>}
        </label>

        <button type="button" className={styles.submit} disabled={!canSubmit || busy} onClick={handleContinue}>
          {busy ? "Checking…" : "Continue"}
        </button>
      </div>
    </FlowLayout>
  );
}

/**
 * After sending: Blockradar returns PENDING immediately; the webhook updates
 * the status. Poll our server until it's final, then show the gas proof.
 */
function WithdrawSent({ initial }: { initial: Withdrawal }) {
  const [withdrawal, setWithdrawal] = useState(initial);
  const isFinal = withdrawal.status !== "PENDING";

  useEffect(() => {
    if (isFinal) return;
    const timer = setInterval(() => {
      api.withdraw
        .get(NETWORK, withdrawal.id)
        .then(setWithdrawal)
        .catch(() => {}); // keep polling
    }, 3000);
    return () => clearInterval(timer);
  }, [isFinal, withdrawal.id]);

  const headline =
    withdrawal.status === "SUCCESS" ? "Sent" : withdrawal.status === "PENDING" ? "Sending…" : "Withdrawal failed";
  const fee = withdrawal.networkFee;

  return (
    <FlowLayout>
      <StepHeader title="Withdrawal" />
      <div className={`${card.card} ${styles.reviewCard}`}>
        <div className={styles.reviewAmountLabel}>{headline}</div>
        <div className={`${styles.reviewAmount} ep-serif`}>{withdrawal.amount} USDC</div>
        <div className={styles.reviewSub}>to {truncateAddress(withdrawal.address)} &middot; Arc</div>

        <div className={styles.rows}>
          <div className={styles.row}>
            <span>Status</span>
            <span>{withdrawal.status}</span>
          </div>
          <div className={styles.row}>
            <span>Transaction</span>
            <span>{withdrawal.hash ? truncateAddress(withdrawal.hash) : "—"}</span>
          </div>
          <div className={styles.row}>
            <span>Gas actually paid</span>
            <span>{fee ? `${fee.amount} ${fee.symbol}` : isFinal ? "—" : "waiting for webhook…"}</span>
          </div>
          <div className={styles.row}>
            <span>Paid by</span>
            <span>{fee ? fee.paidBy.join(", ") || "—" : "—"}</span>
          </div>
        </div>

        <Link to="/" className={styles.submit}>
          Done
        </Link>
      </div>
    </FlowLayout>
  );
}
