import { Link } from "react-router-dom";
import { formatUsd } from "../lib/format";
import { CheckIcon } from "../features/shell/icons";
import { StepHeader } from "./StepHeader";
import { FlowLayout } from "./FlowLayout";
import card from "../features/dashboard/Card.module.css";
import styles from "./FlowComplete.module.css";

/**
 * Shared terminal screen for every money-movement flow: green check,
 * headline, description, updated balance, and the two standard exits.
 * Deposit uses it now; Withdraw/Swap/Earn reuse it in later phases.
 */
export function FlowComplete({
  headline,
  description,
  newBalanceUsd,
}: {
  headline: string;
  description: string;
  newBalanceUsd: number;
}) {
  return (
    <FlowLayout>
      <StepHeader title="Complete" />
      <div className={`${card.card} ${styles.card}`}>
        <div className={styles.check}>
          <CheckIcon />
        </div>
        <h2 className={`ep-serif ${styles.headline}`}>{headline}</h2>
        <p className={styles.description}>{description}</p>
        <div className={styles.balancePill}>
          New balance <b>{formatUsd(newBalanceUsd)}</b>
        </div>
        <div className={styles.actions}>
          <Link to="/activity" className={styles.secondary}>
            View in activity
          </Link>
          <Link to="/" className={styles.primary}>
            Done
          </Link>
        </div>
      </div>
    </FlowLayout>
  );
}
