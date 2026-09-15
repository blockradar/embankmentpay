import { useState } from "react";
import { BankIcon, CoinIcon } from "../shell/icons";
import { StepHeader } from "../../components/StepHeader";
import { FlowLayout } from "../../components/FlowLayout";
import { FlowComplete } from "../../components/FlowComplete";
import { SelectableCard } from "../../components/SelectableCard";
import { BankTransferPanel } from "./BankTransferPanel";
import { StablecoinPanel } from "./StablecoinPanel";
import styles from "./DepositPage.module.css";

type Method = "bank" | "stablecoin";

interface CompleteInfo {
  headline: string;
  description: string;
  newBalanceUsd: number;
}

/**
 * Deposit flow, simplified to method → instructions → done (no amount
 * entry, no separate review step): both Blockradar funding methods are
 * push-based — we hand the user an account number or address and they send
 * to it externally, so there's nothing for the app to "review" first.
 */
export function DepositPage() {
  const [method, setMethod] = useState<Method | null>(null);
  const [complete, setComplete] = useState<CompleteInfo | null>(null);

  if (complete) {
    return (
      <FlowComplete
        headline={complete.headline}
        description={complete.description}
        newBalanceUsd={complete.newBalanceUsd}
      />
    );
  }

  if (method === "bank") {
    return <BankTransferPanel onBack={() => setMethod(null)} onComplete={setComplete} />;
  }

  if (method === "stablecoin") {
    return <StablecoinPanel onBack={() => setMethod(null)} onComplete={setComplete} />;
  }

  return (
    <FlowLayout>
      <StepHeader title="Add money" />
      <p className={styles.subtitle}>Everything you add settles as USDC.</p>
      <div className={styles.cardList}>
        <SelectableCard
          icon={<BankIcon />}
          title="Bank transfer"
          subtitle="USD · usually within minutes"
          showChevron
          onClick={() => setMethod("bank")}
        />
        <SelectableCard
          icon={<CoinIcon />}
          title="Stablecoin"
          subtitle="USDC or USDT from Ethereum, Base, Polygon, Solana, Tron"
          showChevron
          onClick={() => setMethod("stablecoin")}
        />
      </div>
    </FlowLayout>
  );
}
