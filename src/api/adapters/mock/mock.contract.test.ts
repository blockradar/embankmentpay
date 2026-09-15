import { beforeEach, describe, expect, it } from "vitest";
import { depositMockAdapter } from "./deposit.mock";
import { earnMockAdapter } from "./earn.mock";
import { swapMockAdapter } from "./swap.mock";
import { withdrawMockAdapter } from "./withdraw.mock";
import { useAccountStore } from "./accountStore";

beforeEach(() => {
  useAccountStore.getState().reset();
});

/**
 * Basic contract tests: assert the mock adapters return objects shaped like
 * the real Blockradar responses documented in api/types, so drift between
 * mock and live adapters is caught before it reaches a screen.
 */
describe("mock adapters satisfy their service contracts", () => {
  it("deposit adapter", async () => {
    const balance = await depositMockAdapter.getBalance();
    expect(balance).toMatchObject({
      totalUsd: expect.any(Number),
      availableUsd: expect.any(Number),
      inEarnUsd: expect.any(Number),
      network: expect.stringMatching(/^(arc|base)$/),
    });

    const txns = await depositMockAdapter.getRecentTransactions(3);
    expect(txns).toHaveLength(3);
    for (const txn of txns) {
      expect(txn).toMatchObject({ id: expect.any(String), amountUsd: expect.any(Number) });
    }

    const address = await depositMockAdapter.createStablecoinAddress("base");
    expect(address).toMatchObject({ address: expect.any(String), blockchain: "base" });

    const account = await depositMockAdapter.createVirtualAccount("USD");
    expect(account).toMatchObject({ currency: "USD", accountNumber: expect.any(String) });
  });

  it("withdraw adapter", async () => {
    const quote = await withdrawMockAdapter.getFiatWithdrawQuote(100);
    expect(quote).toMatchObject({
      sessionId: expect.any(String),
      debitAmount: 100,
      estimatedArrivalSeconds: expect.any(Number),
    });

    const result = await withdrawMockAdapter.executeFiatWithdraw(quote);
    expect(result.transactionId).toEqual(expect.any(String));
  });

  it("swap adapter", async () => {
    const holdings = await swapMockAdapter.getHoldings();
    expect(holdings.length).toBeGreaterThan(0);

    const quote = await swapMockAdapter.getSwapQuote({
      fromAssetId: holdings[0].assetId,
      toAssetId: "usdc-base",
      amount: 1,
    });
    expect(quote).toMatchObject({ rate: expect.any(Number), toAmount: expect.any(Number) });
  });

  it("earn adapter", async () => {
    const products = await earnMockAdapter.listProducts();
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toMatchObject({ apyPct: expect.any(Number), hasLockUp: false });

    const position = await earnMockAdapter.getPosition();
    expect(position).toMatchObject({
      apyPct: expect.any(Number),
      todayYieldUsd: expect.any(Number),
      lifetimeYieldUsd: expect.any(Number),
    });
  });
});
