import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    calculateTax,
    ETRADE_FIELD,
    GAIN_FIELD,
    type EtradeData,
    type Period,
} from './GainsCalculator';

type Obs = { d: string; FXUSDCAD?: { v: string } };

const stubBocFetch = (observations: Obs[]) =>
    vi.stubGlobal(
        'fetch',
        vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ observations }),
            } as Response),
        ),
    );

const sale = (opts: {
    acquired: string;
    sold: string;
    proceeds: string;
    costBasis: string;
    symbol?: string;
    plan?: string;
}): EtradeData => ({
    [ETRADE_FIELD.RecordType]: 'Sell',
    [ETRADE_FIELD.DateSold]: opts.sold,
    [ETRADE_FIELD.DateAcquired]: opts.acquired,
    [ETRADE_FIELD.TotalProceeds]: opts.proceeds,
    [ETRADE_FIELD.AdjustedCostBasis]: opts.costBasis,
    [ETRADE_FIELD.Symbol]: opts.symbol ?? 'ACME',
    [ETRADE_FIELD.PlanType]: opts.plan ?? 'RS',
});

describe('calculateTax (integration)', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('computes gains, period totals and verification end-to-end', async () => {
        const periods: Period[] = [
            { name: 'Q1', start: new Date(2025, 0, 1), end: new Date(2025, 2, 31) },
            { name: 'Q2', start: new Date(2025, 3, 1), end: new Date(2025, 5, 30) },
        ];

        const sales: EtradeData[] = [
            sale({ acquired: '12/01/2024', sold: '02/10/2025', proceeds: '$1,000.00', costBasis: '$800.00' }),
            sale({ acquired: '01/15/2025', sold: '03/20/2025', proceeds: '$500.00', costBasis: '$600.00' }),
            sale({ acquired: '02/01/2025', sold: '03/25/2025', proceeds: '$2,000.00', costBasis: '$1,500.00' }),
            sale({ acquired: '01/10/2025', sold: '05/15/2025', proceeds: '$1,500.00', costBasis: '$1,200.00' }),
        ];

        stubBocFetch([
            { d: '2024-12-01', FXUSDCAD: { v: '1.35' } },
            { d: '2025-01-10', FXUSDCAD: { v: '1.40' } },
            { d: '2025-01-15', FXUSDCAD: { v: '1.42' } },
            { d: '2025-02-01', FXUSDCAD: { v: '1.41' } },
            { d: '2025-02-10', FXUSDCAD: { v: '1.43' } },
            { d: '2025-03-20', FXUSDCAD: { v: '1.40' } },
            { d: '2025-03-25', FXUSDCAD: { v: '1.39' } },
            { d: '2025-05-15', FXUSDCAD: { v: '1.38' } },
        ]);

        const result = await calculateTax(sales, periods);

        // Row-level gains in order
        expect(result.gains).toHaveLength(4);

        expect(result.gains[0][GAIN_FIELD.Proceeds]).toBe(1_430_000_000n);
        expect(result.gains[0][GAIN_FIELD.CostBase]).toBe(1_080_000_000n);
        expect(result.gains[0][GAIN_FIELD.GainLoss]).toBe(350_000_000n);
        expect(result.gains[0][GAIN_FIELD.Period].name).toBe('Q1');
        expect(result.gains[0][GAIN_FIELD.Description]).toBe('ACME RS');

        expect(result.gains[1][GAIN_FIELD.Proceeds]).toBe(700_000_000n);
        expect(result.gains[1][GAIN_FIELD.CostBase]).toBe(852_000_000n);
        expect(result.gains[1][GAIN_FIELD.GainLoss]).toBe(-152_000_000n);

        expect(result.gains[2][GAIN_FIELD.Proceeds]).toBe(2_780_000_000n);
        expect(result.gains[2][GAIN_FIELD.CostBase]).toBe(2_115_000_000n);
        expect(result.gains[2][GAIN_FIELD.GainLoss]).toBe(665_000_000n);

        expect(result.gains[3][GAIN_FIELD.Proceeds]).toBe(2_070_000_000n);
        expect(result.gains[3][GAIN_FIELD.CostBase]).toBe(1_680_000_000n);
        expect(result.gains[3][GAIN_FIELD.GainLoss]).toBe(390_000_000n);
        expect(result.gains[3][GAIN_FIELD.Period].name).toBe('Q2');

        // Period totals
        expect(result.total).toHaveLength(2);
        const [q1, q2] = result.total;
        expect(q1[GAIN_FIELD.Period].name).toBe('Q1');
        expect(q1[GAIN_FIELD.Proceeds]).toBe(4_910_000_000n);
        expect(q1[GAIN_FIELD.CostBase]).toBe(4_047_000_000n);
        expect(q1[GAIN_FIELD.Expenses]).toBe(0n);
        expect(q1[GAIN_FIELD.GainLoss]).toBe(863_000_000n);

        expect(q2[GAIN_FIELD.Period].name).toBe('Q2');
        expect(q2[GAIN_FIELD.Proceeds]).toBe(2_070_000_000n);
        expect(q2[GAIN_FIELD.CostBase]).toBe(1_680_000_000n);
        expect(q2[GAIN_FIELD.GainLoss]).toBe(390_000_000n);

        // USD verification (independent of FX)
        expect(result.verification.sellCount).toBe(4);
        expect(result.verification.uniqueDates).toBe(8);
        expect(result.verification.usdProceeds).toBe(5_000_000_000n); // $5,000
        expect(result.verification.usdGainLoss).toBe(900_000_000n);   // $900

        // Exchange rates: unique, sorted by date, Money-typed
        expect(result.exchangeRates).toHaveLength(8);
        const dates = result.exchangeRates.map(r => r.date);
        expect(dates).toEqual([...dates].sort());
        expect(result.exchangeRates[0]).toEqual({ date: '2024-12-01', rate: 1_350_000n });
        expect(result.exchangeRates.at(-1)).toEqual({ date: '2025-05-15', rate: 1_380_000n });
    });

    it('uses BoC lookback when a sale falls on a weekend', async () => {
        const periods: Period[] = [
            { name: '2025', start: new Date(2025, 0, 1), end: new Date(2025, 11, 31) },
        ];

        // 03/15/2025 (Sat) acquired, 03/16/2025 (Sun) sold
        const sales: EtradeData[] = [
            sale({
                acquired: '03/15/2025',
                sold: '03/16/2025',
                proceeds: '$100.00',
                costBasis: '$100.00',
            }),
        ];

        // Only Friday 2025-03-14 has a rate
        stubBocFetch([{ d: '2025-03-14', FXUSDCAD: { v: '1.40' } }]);

        const result = await calculateTax(sales, periods);

        // Both weekend dates fall back to Friday's 1.40 rate
        expect(result.gains[0][GAIN_FIELD.Proceeds]).toBe(140_000_000n);
        expect(result.gains[0][GAIN_FIELD.CostBase]).toBe(140_000_000n);
        expect(result.gains[0][GAIN_FIELD.GainLoss]).toBe(0n);
    });

    it('throws when a sale date is outside all periods', async () => {
        const periods: Period[] = [
            { name: 'Q1', start: new Date(2025, 0, 1), end: new Date(2025, 2, 31) },
        ];

        const sales: EtradeData[] = [
            sale({
                acquired: '01/10/2025',
                sold: '04/10/2025', // outside Q1
                proceeds: '$100.00',
                costBasis: '$50.00',
            }),
        ];

        stubBocFetch([
            { d: '2025-01-10', FXUSDCAD: { v: '1.40' } },
            { d: '2025-04-10', FXUSDCAD: { v: '1.40' } },
        ]);

        await expect(calculateTax(sales, periods)).rejects.toThrow(/No period found/);
    });

    it('returns empty gains and totals for empty sales input', async () => {
        const periods: Period[] = [
            { name: '2025', start: new Date(2025, 0, 1), end: new Date(2025, 11, 31) },
        ];

        stubBocFetch([]);

        const result = await calculateTax([], periods);

        expect(result.gains).toEqual([]);
        expect(result.total).toHaveLength(1);
        expect(result.total[0][GAIN_FIELD.Proceeds]).toBe(0n);
        expect(result.total[0][GAIN_FIELD.GainLoss]).toBe(0n);
        expect(result.verification).toEqual({
            sellCount: 0,
            uniqueDates: 0,
            usdProceeds: 0n,
            usdGainLoss: 0n,
        });
        expect(result.exchangeRates).toEqual([]);
    });
});
