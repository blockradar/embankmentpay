import { env } from "../config/env";
import { depositMockAdapter } from "./adapters/mock/deposit.mock";
import { earnMockAdapter } from "./adapters/mock/earn.mock";
import { swapMockAdapter } from "./adapters/mock/swap.mock";
import { withdrawMockAdapter } from "./adapters/mock/withdraw.mock";
import { depositLiveAdapter } from "./adapters/live/deposit.live";
import { earnLiveAdapter } from "./adapters/live/earn.live";
import { swapLiveAdapter } from "./adapters/live/swap.live";
import { withdrawLiveAdapter } from "./adapters/live/withdraw.live";

/**
 * The one place that knows about mock vs live. Every screen imports `api`
 * from here and calls `api.deposit.getBalance()` etc. — never a service
 * or adapter file directly. Flipping env.apiMode to "live" is the entire
 * migration from dummy data to real Blockradar calls.
 */
export const api = {
  deposit: env.apiMode === "live" ? depositLiveAdapter : depositMockAdapter,
  withdraw: env.apiMode === "live" ? withdrawLiveAdapter : withdrawMockAdapter,
  swap: env.apiMode === "live" ? swapLiveAdapter : swapMockAdapter,
  earn: env.apiMode === "live" ? earnLiveAdapter : earnMockAdapter,
};
