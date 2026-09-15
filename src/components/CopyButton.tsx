import { useState } from "react";
import { CheckIcon, CopyIcon } from "../features/shell/icons";
import styles from "./CopyButton.module.css";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // clipboard API unavailable (e.g. insecure context) — fail silently
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      className={`${styles.btn} ${copied ? styles.copied : ""}`}
      onClick={handleCopy}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "Copied" : label}
    </button>
  );
}
