/**
 * Demo mode: generates sample trade data for classroom presentations.
 */
import type { Market, Trade, UserPortfolio } from "@/lib/tradingEngine";
import { estimateTrade, marketToEngineConfig } from "@/lib/tradingEngine";

const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Sam", "Avery", "Quinn", "Drew"];
const LAST_NAMES = ["Smith", "Chen", "Patel", "Kim", "Garcia", "Wilson", "Brown", "Lee", "Davis", "Martinez"];

export function generateSampleStudents(count: number, startingCash: number): UserPortfolio[] {
  const students: UserPortfolio[] = [];
  const used = new Set<string>();
  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
    } while (used.has(name));
    used.add(name);
    students.push({
      userId: `demo-${crypto.randomUUID().slice(0, 8)}`,
      displayName: name,
      cash: startingCash,
      holdings: [],
    });
  }
  return students;
}

export function generateSampleTrades(
  markets: Market[],
  students: UserPortfolio[],
  tradesPerStudent: number
): { trades: Trade[]; updatedMarkets: Market[]; updatedStudents: UserPortfolio[] } {
  const trades: Trade[] = [];
  const mktMap = new Map(markets.map((m) => [m.id, { ...m, outcomes: m.outcomes.map((o) => ({ ...o })) }]));
  const stuMap = new Map(students.map((s) => [s.userId, { ...s, holdings: [...s.holdings] }]));

  const openMarkets = markets.filter((m) => m.status === "open");
  if (openMarkets.length === 0) return { trades, updatedMarkets: markets, updatedStudents: students };

  const baseTime = Date.now() - 3600_000; // start 1 hour ago

  for (const student of students) {
    const stu = stuMap.get(student.userId)!;

    for (let t = 0; t < tradesPerStudent; t++) {
      const market = openMarkets[Math.floor(Math.random() * openMarkets.length)];
      const mkt = mktMap.get(market.id)!;
      const outcome = mkt.outcomes[Math.floor(Math.random() * mkt.outcomes.length)];
      const quantity = Math.floor(Math.random() * 30) + 5;

      try {
        const config = marketToEngineConfig(mkt);
        const est = estimateTrade(
          mkt.outcomes, outcome.id, quantity, "BUY",
          config.liquidityParameter, config.type, config
        );

        if (est.totalCost > stu.cash) continue;

        // Apply trade
        stu.cash -= est.totalCost;
        const existingHolding = stu.holdings.find((h) => h.marketId === mkt.id && h.outcomeId === outcome.id);
        if (existingHolding) {
          const totalShares = existingHolding.shares + quantity;
          existingHolding.avgCostPerShare = (existingHolding.avgCostPerShare * existingHolding.shares + est.totalCost) / totalShares;
          existingHolding.shares = totalShares;
        } else {
          stu.holdings.push({
            marketId: mkt.id,
            marketTitle: mkt.title,
            outcomeId: outcome.id,
            outcomeName: outcome.name,
            shares: quantity,
            avgCostPerShare: est.avgPrice,
          });
        }

        // Update market prices
        for (const np of est.newPrices) {
          const o = mkt.outcomes.find((x) => x.id === np.outcomeId);
          if (o) o.price = np.price;
        }

        const timestamp = new Date(baseTime + (trades.length * 15_000) + Math.random() * 10_000).toISOString();
        trades.push({
          id: crypto.randomUUID(),
          userId: stu.userId,
          marketId: mkt.id,
          outcomeId: outcome.id,
          outcomeName: outcome.name,
          marketTitle: mkt.title,
          type: "BUY",
          quantity,
          pricePerShare: est.avgPrice,
          totalCost: Math.abs(est.totalCost),
          priceBeforeTrade: est.priceBefore,
          priceAfterTrade: est.priceAfter,
          engineType: config.type,
          timestamp,
        });
      } catch {
        // skip failed trades
      }
    }
  }

  return {
    trades: trades.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    updatedMarkets: Array.from(mktMap.values()),
    updatedStudents: Array.from(stuMap.values()),
  };
}
