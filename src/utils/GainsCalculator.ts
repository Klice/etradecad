import { format, isWithinInterval } from 'date-fns';
import { parseCurrency, toIsoDate } from './format';
import { fetchRates } from './fetchRates';

export type Period = {
    start: Date;
    end: Date;
    name: string;
};

export const formatPeriod = (p: Period): string =>
    `${p.name}: ${format(p.start, 'P')} - ${format(p.end, 'P')}`;

export const GAIN_FIELD = {
    Period: 'Period',
    DateSold: 'Date Sold',
    Description: 'Description',
    Proceeds: 'Proceeds',
    CostBase: 'Cost base',
    Expenses: 'Expenses',
    GainLoss: 'Gain (loss)',
} as const;

export const ETRADE_FIELD = {
    RecordType: 'Record Type',
    DateSold: 'Date Sold',
    DateAcquired: 'Date Acquired',
    TotalProceeds: 'Total Proceeds',
    AdjustedCostBasis: 'Adjusted Cost Basis',
    Symbol: 'Symbol',
    PlanType: 'Plan Type',
    AdjustedGainLoss: 'Adjusted Gain/Loss',
    GainLoss: 'Gain/Loss',
} as const;

export type RecordType = 'Sell' | 'Summary';

export type GainsType = {
    [GAIN_FIELD.Period]: Period;
    [GAIN_FIELD.DateSold]: string;
    [GAIN_FIELD.Description]: string;
    [GAIN_FIELD.Proceeds]: number;
    [GAIN_FIELD.CostBase]: number;
    [GAIN_FIELD.Expenses]: number;
    [GAIN_FIELD.GainLoss]: number;
};

export type EtradeData = {
    [ETRADE_FIELD.RecordType]: RecordType;
    [ETRADE_FIELD.DateSold]: string;
    [ETRADE_FIELD.DateAcquired]: string;
    [ETRADE_FIELD.TotalProceeds]: string;
    [ETRADE_FIELD.AdjustedCostBasis]: string;
    [ETRADE_FIELD.Symbol]: string;
    [ETRADE_FIELD.PlanType]: string;
    [ETRADE_FIELD.AdjustedGainLoss]?: string;
    [ETRADE_FIELD.GainLoss]?: string;
};

export interface VerificationData {
    sellCount: number;
    uniqueDates: number;
    usdProceeds: number;
    usdGainLoss: number;
}

export interface ExchangeRate {
    date: string;
    rate: number;
}

export interface ResultsType {
    gains: GainsType[];
    total: GainsType[];
    verification: VerificationData;
    exchangeRates: ExchangeRate[];
}

type NumericGainKey =
    | typeof GAIN_FIELD.Proceeds
    | typeof GAIN_FIELD.CostBase
    | typeof GAIN_FIELD.Expenses
    | typeof GAIN_FIELD.GainLoss;

const strToNum = (str: string): number => parseCurrency(str) ?? 0;
const round2 = (n: number): number => Math.round(n * 100) / 100;

const findPeriod = (periods: Period[], date: Date): Period => {
    const period = periods.find(p => isWithinInterval(date, { start: p.start, end: p.end }));
    if (!period) {
        throw new Error(`No period found for date: ${toIsoDate(date)}`);
    }
    return period;
};

const buildGain = (
    row: EtradeData,
    periods: Period[],
    rates: Record<string, number>,
): GainsType => {
    const dateSold = new Date(row[ETRADE_FIELD.DateSold]);
    const dateAcquired = new Date(row[ETRADE_FIELD.DateAcquired]);
    const proceedsUsd = strToNum(row[ETRADE_FIELD.TotalProceeds]);
    const costBaseUsd = strToNum(row[ETRADE_FIELD.AdjustedCostBasis]);
    const proceeds = proceedsUsd * rates[toIsoDate(dateSold)];
    const costBase = costBaseUsd * rates[toIsoDate(dateAcquired)];

    return {
        [GAIN_FIELD.Period]: findPeriod(periods, dateSold),
        [GAIN_FIELD.DateSold]: row[ETRADE_FIELD.DateSold],
        [GAIN_FIELD.Description]: `${row[ETRADE_FIELD.Symbol]} ${row[ETRADE_FIELD.PlanType]}`,
        [GAIN_FIELD.Proceeds]: round2(proceeds),
        [GAIN_FIELD.CostBase]: round2(costBase),
        [GAIN_FIELD.Expenses]: 0,
        [GAIN_FIELD.GainLoss]: round2(proceeds - costBase),
    };
};

const totalForPeriod = (period: Period, gains: GainsType[]): GainsType => {
    const inPeriod = gains.filter(g => g[GAIN_FIELD.Period] === period);
    const sum = (key: NumericGainKey): number =>
        round2(inPeriod.reduce((acc, row) => acc + row[key], 0));

    return {
        [GAIN_FIELD.Period]: period,
        [GAIN_FIELD.DateSold]: '',
        [GAIN_FIELD.Description]: '',
        [GAIN_FIELD.Proceeds]: sum(GAIN_FIELD.Proceeds),
        [GAIN_FIELD.CostBase]: sum(GAIN_FIELD.CostBase),
        [GAIN_FIELD.Expenses]: sum(GAIN_FIELD.Expenses),
        [GAIN_FIELD.GainLoss]: sum(GAIN_FIELD.GainLoss),
    };
};

const usdTotals = (sales: EtradeData[]): { usdProceeds: number; usdGainLoss: number } =>
    sales.reduce(
        (acc, row) => {
            const proceeds = strToNum(row[ETRADE_FIELD.TotalProceeds]);
            const costBase = strToNum(row[ETRADE_FIELD.AdjustedCostBasis]);
            return {
                usdProceeds: acc.usdProceeds + proceeds,
                usdGainLoss: acc.usdGainLoss + (proceeds - costBase),
            };
        },
        { usdProceeds: 0, usdGainLoss: 0 },
    );

export const calculateTax = async (
    sales: EtradeData[],
    periods: Period[],
): Promise<ResultsType> => {
    const allDateStrs = sales.flatMap(row => [row[ETRADE_FIELD.DateAcquired], row[ETRADE_FIELD.DateSold]]);
    const uniqueDateStrs = Array.from(new Set(allDateStrs));
    const rates = await fetchRates(uniqueDateStrs.map(d => new Date(d)));

    const gains = sales.map(row => buildGain(row, periods, rates));
    const total = periods.map(p => totalForPeriod(p, gains));
    const { usdProceeds, usdGainLoss } = usdTotals(sales);

    const exchangeRates: ExchangeRate[] = Object.entries(rates)
        .map(([date, rate]) => ({ date, rate }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        gains,
        total,
        verification: {
            sellCount: sales.length,
            uniqueDates: uniqueDateStrs.length,
            usdProceeds: round2(usdProceeds),
            usdGainLoss: round2(usdGainLoss),
        },
        exchangeRates,
    };
};
