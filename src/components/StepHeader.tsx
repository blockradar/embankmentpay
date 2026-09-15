import { Link } from "react-router-dom";
import { ChevronLeftIcon, CloseIcon } from "../features/shell/icons";
import styles from "./StepHeader.module.css";

/**
 * Shared header for money-movement flows: optional back action (omit it on
 * a flow's entry screen), a title, and a close control that always returns
 * to the Dashboard. No "Step X of Y" — these flows are short enough that a
 * step counter would overstate their complexity.
 */
export function StepHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className={styles.row}>
      <div className={styles.left}>
        {onBack && (
          <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Back">
            <ChevronLeftIcon />
          </button>
        )}
        <h1 className={`ep-serif ${styles.title}`}>{title}</h1>
      </div>
      <Link to="/" className={styles.closeBtn} aria-label="Close">
        <CloseIcon />
      </Link>
    </div>
  );
}
