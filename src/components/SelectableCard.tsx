import type { ReactNode } from "react";
import styles from "./SelectableCard.module.css";

/**
 * Icon + title/subtitle + trailing value row, clickable. Used for method
 * pickers across flows (Deposit's funding method, Withdraw's currency,
 * Swap's asset) so selection always looks and behaves the same way.
 */
export function SelectableCard({
  icon,
  title,
  subtitle,
  trailing,
  selected,
  showChevron,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  trailing?: ReactNode;
  selected?: boolean;
  showChevron?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.card} ${selected ? styles.selected : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.body}>
        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle}>{subtitle}</div>
      </span>
      {trailing && <span className={styles.trailing}>{trailing}</span>}
      {showChevron && <span className={styles.chevron}>&rsaquo;</span>}
    </button>
  );
}
