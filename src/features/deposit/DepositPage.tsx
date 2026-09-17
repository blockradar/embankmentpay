import { useEffect, useState } from "react";
import { api } from "../../api";
import { DEFAULT_NETWORK, NETWORK_LABELS } from "../../config/networks";
import { useAsync } from "../../lib/useAsync";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { CopyButton } from "../../components/CopyButton";
import { QrCode } from "../../components/QrCode";
import type { CreditedDeposit, SettlementNetwork } from "../../api/types";
import card from "../dashboard/Card.module.css";
import styles from "./DepositPage.module.css";

const CHAINS: SettlementNetwork[] = ["arc", "base"];

/**
 * Deposit flow: pick a network, get a dedicated Blockradar deposit address,
 * send USDC to it from any wallet or exchange. Deposits are push-based, so
 * there's no amount entry or review step here.
 */
export function DepositPage() {
  const [chain, setChain] = useState<SettlementNetwork>(DEFAULT_NETWORK);
  const { data: address, loading, error } = useAsync(
    () => api.deposit.getAddress(chain),
    [chain],
  );
  const arrived = useNewDeposit(chain);

  const chainLabel = NETWORK_LABELS[chain];

  return (
    <FlowLayout>
      <StepHeader title="Deposit USDC" />
      <div className={`${card.card} ${styles.detailCard}`}>
        <div className={styles.chainRow}>
          {CHAINS.map((id) => (
            <button
              key={id}
              type="button"
              className={`${styles.chip} ${chain === id ? styles.chipSelected : ""}`}
              onClick={() => setChain(id)}
            >
              {NETWORK_LABELS[id]}
            </button>
          ))}
        </div>

        {error ? (
          <p className={styles.error}>{error.message}</p>
        ) : loading || !address ? (
          <p className={styles.loading}>Generating your {chainLabel} deposit address&hellip;</p>
        ) : (
          <>
            <div className={styles.qrRow}>
              <QrCode value={address.address} size={120} />
              <div className={styles.addressCol}>
                <div className={styles.address}>{address.address}</div>
                <div className={styles.fieldActions}>
                  <CopyButton value={address.address} label="Copy address" />
                </div>
              </div>
            </div>

            {arrived && (
              <p className={styles.received} role="status">
                <b>✓</b> {arrived.amount} {arrived.asset} received
                {arrived.id.startsWith("test-") ? " (test event)" : ""} — credited by the webhook.
              </p>
            )}

            <ol className={styles.instructions}>
              <li>
                <b>1</b> Send USDC on {chainLabel} from any wallet or exchange.
              </li>
              <li>
                <b>2</b> Only use the {chainLabel} network — funds sent on another network won't
                arrive.
              </li>
            </ol>
          </>
        )}
      </div>
    </FlowLayout>
  );
}

/**
 * Polls for deposits the webhook has credited and returns the newest one
 * that arrived while this page was open. (A production app would push this
 * to the browser over a websocket or server-sent events instead.)
 */
function useNewDeposit(network: SettlementNetwork): CreditedDeposit | null {
  const [arrived, setArrived] = useState<{ network: SettlementNetwork; deposit: CreditedDeposit } | null>(null);

  useEffect(() => {
    let known: Set<string> | null = null;
    let cancelled = false;

    async function check() {
      try {
        const deposits = await api.deposit.listDeposits(network);
        if (cancelled) return;
        // First response: remember what was already there when the page opened.
        if (!known) {
          known = new Set(deposits.map((d) => d.id));
          return;
        }
        const fresh = deposits.find((d) => !known!.has(d.id));
        if (fresh) {
          known.add(fresh.id);
          setArrived({ network, deposit: fresh });
        }
      } catch {
        // Keep polling — a missed tick is harmless.
      }
    }

    check();
    const timer = setInterval(check, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [network]);

  return arrived?.network === network ? arrived.deposit : null;
}
