import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    calculateTax,
    ETRADE_FIELD,
    GAIN_FIELD,
    type EtradeData,
    type GainsType,
    type Period,
    type ResultsType,
} from './GainsCalculator';
import type { Money } from './money';

const m = (b: bigint): Money => b as Money;

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

const gain = (period: Period, dateSold: string, proceeds: bigint, costBase: bigint): GainsType => ({
    [GAIN_FIELD.Period]: period,
    [GAIN_FIELD.DateSold]: dateSold,
    [GAIN_FIELD.Description]: 'ACME RS',
    [GAIN_FIELD.Proceeds]: proceeds,
    [GAIN_FIELD.CostBase]: costBase,
    [GAIN_FIELD.Expenses]: 0n,
    [GAIN_FIELD.GainLoss]: proceeds - costBase,
}) as GainsType;

const totalRow = (period: Period, proceeds: bigint, costBase: bigint, gainLoss: bigint): GainsType => ({
    [GAIN_FIELD.Period]: period,
    [GAIN_FIELD.DateSold]: '',
    [GAIN_FIELD.Description]: '',
    [GAIN_FIELD.Proceeds]: proceeds,
    [GAIN_FIELD.CostBase]: costBase,
    [GAIN_FIELD.Expenses]: 0n,
    [GAIN_FIELD.GainLoss]: gainLoss,
}) as GainsType;

describe('calculateTax (integration)', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('computes gains, period totals and verification end-to-end', async () => {
        const q1: Period = { name: 'Q1', start: new Date(2025, 0, 1), end: new Date(2025, 2, 31) };
        const q2: Period = { name: 'Q2', start: new Date(2025, 3, 1), end: new Date(2025, 5, 30) };

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

        const expected: ResultsType = {
            gains: [
                gain(q1, '02/10/2025', 1_430_000_000n, 1_080_000_000n),
                gain(q1, '03/20/2025',   700_000_000n,   852_000_000n),
                gain(q1, '03/25/2025', 2_780_000_000n, 2_115_000_000n),
                gain(q2, '05/15/2025', 2_070_000_000n, 1_680_000_000n),
            ],
            total: [
                totalRow(q1, 4_910_000_000n, 4_047_000_000n, 863_000_000n),
                totalRow(q2, 2_070_000_000n, 1_680_000_000n, 390_000_000n),
            ],
            verification: {
                sellCount: 4,
                uniqueDates: 8,
                usdProceeds: m(5_000_000_000n),
                usdGainLoss: m(  900_000_000n),
            },
            exchangeRates: [
                { date: '2024-12-01', rate: m(1_350_000n) },
                { date: '2025-01-10', rate: m(1_400_000n) },
                { date: '2025-01-15', rate: m(1_420_000n) },
                { date: '2025-02-01', rate: m(1_410_000n) },
                { date: '2025-02-10', rate: m(1_430_000n) },
                { date: '2025-03-20', rate: m(1_400_000n) },
                { date: '2025-03-25', rate: m(1_390_000n) },
                { date: '2025-05-15', rate: m(1_380_000n) },
            ],
        };

        const result = await calculateTax(sales, [q1, q2]);
        expect(result).toEqual(expected);
    });

    it('uses BoC lookback when a sale falls on a weekend', async () => {
        const period: Period = { name: '2025', start: new Date(2025, 0, 1), end: new Date(2025, 11, 31) };

        // 03/15/2025 (Sat) acquired, 03/16/2025 (Sun) sold; only Fri 03/14 has a rate
        const sales: EtradeData[] = [
            sale({ acquired: '03/15/2025', sold: '03/16/2025', proceeds: '$100.00', costBasis: '$100.00' }),
        ];
        stubBocFetch([{ d: '2025-03-14', FXUSDCAD: { v: '1.40' } }]);

        const result = await calculateTax(sales, [period]);

        expect(result.gains).toEqual([
            gain(period, '03/16/2025', 140_000_000n, 140_000_000n),
        ]);
    });

    it('throws when a sale date is outside all periods', async () => {
        const q1: Period = { name: 'Q1', start: new Date(2025, 0, 1), end: new Date(2025, 2, 31) };
        const sales: EtradeData[] = [
            sale({ acquired: '01/10/2025', sold: '04/10/2025', proceeds: '$100.00', costBasis: '$50.00' }),
        ];
        stubBocFetch([
            { d: '2025-01-10', FXUSDCAD: { v: '1.40' } },
            { d: '2025-04-10', FXUSDCAD: { v: '1.40' } },
        ]);

        await expect(calculateTax(sales, [q1])).rejects.toThrow(/No period found/);
    });

    it('returns empty gains and totals for empty sales input', async () => {
        const period: Period = { name: '2025', start: new Date(2025, 0, 1), end: new Date(2025, 11, 31) };
        stubBocFetch([]);

        const result = await calculateTax([], [period]);

        const expected: ResultsType = {
            gains: [],
            total: [totalRow(period, 0n, 0n, 0n)],
            verification: {
                sellCount: 0,
                uniqueDates: 0,
                usdProceeds: m(0n),
                usdGainLoss: m(0n),
            },
            exchangeRates: [],
        };
        expect(result).toEqual(expected);
    });
});
