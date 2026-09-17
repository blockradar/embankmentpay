import { depositLiveAdapter } from "./adapters/live/deposit.live";
import { withdrawLiveAdapter } from "./adapters/live/withdraw.live";

/**
 * The one place screens import API calls from — `api.deposit.getBalance()`
 * etc. — never an adapter file directly.
 */
export const api = {
  deposit: depositLiveAdapter,
  withdraw: withdrawLiveAdapter,
};
