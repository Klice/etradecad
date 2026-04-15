import { parseCurrency } from './format';
import { fetchRates } from './fetchRates';

export type Period = {
    start: Date;
    end: Date;
    name: string;
};

export const formatPeriod = (p: Period): string =>
    `${p.name}: ${p.start.toLocaleDateString()} - ${p.end.toLocaleDateString()}`;

export interface GainsType {
    'Period': Period;
    'Date Sold': string;
    'Description': string;
    'Proceeds': number;
    'Cost base': number;
    'Expenses': number;
    'Gain (loss)': number;
}

export interface EtradeData {
    'Record Type': string;
    'Date Sold': string;
    'Date Acquired': string;
    'Total Proceeds': string;
    'Adjusted Cost Basis': string;
    'Symbol': string;
    'Plan Type': string;
    'Adjusted Gain/Loss'?: string;
    'Gain/Loss'?: string;
}

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

type NumericGainKey = 'Proceeds' | 'Cost base' | 'Expenses' | 'Gain (loss)';

const strToNum = (str: string): number => parseCurrency(str) ?? 0;
const round2 = (n: number): number => Math.round(n * 100) / 100;
const toIsoDate = (d: Date): string => d.toISOString().split('T')[0];

const findPeriod = (periods: Period[], date: Date): Period => {
    const period = periods.find(p => date >= p.start && date <= p.end);
    if (!period) {
        throw new Error(`No period found for date: ${date.toISOString()}`);
    }
    return period;
};

const buildGain = (
    row: EtradeData,
    periods: Period[],
    rates: Record<string, number>,
): GainsType => {
    const dateSold = new Date(row['Date Sold']);
    const dateAcquired = new Date(row['Date Acquired']);
    const proceedsUsd = strToNum(row['Total Proceeds']);
    const costBaseUsd = strToNum(row['Adjusted Cost Basis']);
    const proceeds = proceedsUsd * rates[toIsoDate(dateSold)];
    const costBase = costBaseUsd * rates[toIsoDate(dateAcquired)];

    return {
        'Period': findPeriod(periods, dateSold),
        'Date Sold': row['Date Sold'],
        'Description': `${row['Symbol']} ${row['Plan Type']}`,
        'Proceeds': round2(proceeds),
        'Cost base': round2(costBase),
        'Expenses': 0,
        'Gain (loss)': round2(proceeds - costBase),
    };
};

const totalForPeriod = (period: Period, gains: GainsType[]): GainsType => {
    const inPeriod = gains.filter(g => g.Period === period);
    const sum = (key: NumericGainKey): number =>
        round2(inPeriod.reduce((acc, row) => acc + row[key], 0));

    return {
        'Period': period,
        'Date Sold': '',
        'Description': '',
        'Proceeds': sum('Proceeds'),
        'Cost base': sum('Cost base'),
        'Expenses': sum('Expenses'),
        'Gain (loss)': sum('Gain (loss)'),
    };
};

const usdTotals = (sales: EtradeData[]): { usdProceeds: number; usdGainLoss: number } =>
    sales.reduce(
        (acc, row) => {
            const proceeds = strToNum(row['Total Proceeds']);
            const costBase = strToNum(row['Adjusted Cost Basis']);
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
    const allDateStrs = sales.flatMap(row => [row['Date Acquired'], row['Date Sold']]);
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
