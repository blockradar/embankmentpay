import { useEffect, useState } from "react";

/**
 * Ticks down from `totalSeconds` to 0, resetting whenever `resetToken`
 * changes identity (pass the quote object itself — a fresh quote from a
 * refresh gets a new countdown). Shared by any flow with a rate-locked
 * quote (Withdraw's ~20min fiat session, Swap's 15s price quote) so the
 * timer/expiry logic lives in one place instead of being re-implemented
 * per flow with slightly different bugs each time.
 */
export function useCountdown(totalSeconds: number, resetToken: unknown): number {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken]);

  return secondsLeft;
}
