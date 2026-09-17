import { useState } from "react";
import { api } from "../../api";
import { DEFAULT_NETWORK, NETWORK_LABELS } from "../../config/networks";
import { useAsync } from "../../lib/useAsync";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { CopyButton } from "../../components/CopyButton";
import { QrCode } from "../../components/QrCode";
import type { SettlementNetwork } from "../../api/types";
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
