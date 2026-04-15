import { isWithinInterval } from 'date-fns';
import { toIsoDate } from './format';
import { fetchRates, type FetchedRate } from './fetchRates';
import { addMoney, moneyFromString, mulMoney, subMoney, sumMoney, ZERO, type Money } from './money';

export type Period = {
    start: Date;
    end: Date;
    name: string;
};

export const GAIN_FIELD = {
    Period: 'Period',
    DateAcquired: 'Date Acquired',
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
    [GAIN_FIELD.DateAcquired]: string;
    [GAIN_FIELD.DateSold]: string;
    [GAIN_FIELD.Description]: string;
    [GAIN_FIELD.Proceeds]: Money;
    [GAIN_FIELD.CostBase]: Money;
    [GAIN_FIELD.Expenses]: Money;
    [GAIN_FIELD.GainLoss]: Money;
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
    usdProceeds: Money;
    usdGainLoss: Money;
}

export interface ExchangeRate {
    date: string;
    rateDate: string;
    rate: Money;
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

const parseMoney = (str: string): Money => moneyFromString(str) ?? ZERO;

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
    rates: Record<string, FetchedRate>,
): GainsType => {
    const dateSold = new Date(row[ETRADE_FIELD.DateSold]);
    const dateAcquired = new Date(row[ETRADE_FIELD.DateAcquired]);
    const proceedsUsd = parseMoney(row[ETRADE_FIELD.TotalProceeds]);
    const costBaseUsd = parseMoney(row[ETRADE_FIELD.AdjustedCostBasis]);
    const proceeds = mulMoney(proceedsUsd, rates[toIsoDate(dateSold)].rate);
    const costBase = mulMoney(costBaseUsd, rates[toIsoDate(dateAcquired)].rate);

    return {
        [GAIN_FIELD.Period]: findPeriod(periods, dateSold),
        [GAIN_FIELD.DateAcquired]: row[ETRADE_FIELD.DateAcquired],
        [GAIN_FIELD.DateSold]: row[ETRADE_FIELD.DateSold],
        [GAIN_FIELD.Description]: `${row[ETRADE_FIELD.Symbol]} ${row[ETRADE_FIELD.PlanType]}`,
        [GAIN_FIELD.Proceeds]: proceeds,
        [GAIN_FIELD.CostBase]: costBase,
        [GAIN_FIELD.Expenses]: ZERO,
        [GAIN_FIELD.GainLoss]: subMoney(proceeds, costBase),
    };
};

const totalForPeriod = (period: Period, gains: GainsType[]): GainsType => {
    const inPeriod = gains.filter(g => g[GAIN_FIELD.Period] === period);
    const sum = (key: NumericGainKey): Money => sumMoney(inPeriod.map(row => row[key]));

    return {
        [GAIN_FIELD.Period]: period,
        [GAIN_FIELD.DateAcquired]: '',
        [GAIN_FIELD.DateSold]: '',
        [GAIN_FIELD.Description]: '',
        [GAIN_FIELD.Proceeds]: sum(GAIN_FIELD.Proceeds),
        [GAIN_FIELD.CostBase]: sum(GAIN_FIELD.CostBase),
        [GAIN_FIELD.Expenses]: sum(GAIN_FIELD.Expenses),
        [GAIN_FIELD.GainLoss]: sum(GAIN_FIELD.GainLoss),
    };
};

const usdTotals = (sales: EtradeData[]): { usdProceeds: Money; usdGainLoss: Money } =>
    sales.reduce<{ usdProceeds: Money; usdGainLoss: Money }>(
        (acc, row) => {
            const proceeds = parseMoney(row[ETRADE_FIELD.TotalProceeds]);
            const costBase = parseMoney(row[ETRADE_FIELD.AdjustedCostBasis]);
            return {
                usdProceeds: addMoney(acc.usdProceeds, proceeds),
                usdGainLoss: addMoney(acc.usdGainLoss, subMoney(proceeds, costBase)),
            };
        },
        { usdProceeds: ZERO, usdGainLoss: ZERO },
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
        .map(([date, { rate, rateDate }]) => ({ date, rateDate, rate }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        gains,
        total,
        verification: {
            sellCount: sales.length,
            uniqueDates: uniqueDateStrs.length,
            usdProceeds,
            usdGainLoss,
        },
        exchangeRates,
    };
};
