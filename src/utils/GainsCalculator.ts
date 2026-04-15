import { parseCurrency } from './currency';
import { ExchangeRateFetcher } from './fetchRates';

export class Period {
    start: Date;
    end: Date;
    name: string;
    constructor(start: Date, end: Date, name: string) {
        this.start = start;
        this.end = end;
        this.name = name;
    }

    public toString(): string {
        return this.name + ': ' + this.start.toLocaleDateString() + ' - ' + this.end.toLocaleDateString();
    }
}

export interface GainsType {
    [key: string]: string | number | Period;
    'Period': Period;
    'Description': string;
    'Proceeds': number;
    'Cost base': number;
    'Expenses': number;
    'Gain (loss)': number;
}

export interface EtradeData {
    [key: string]: string;
    'Record Type': string;
    'Date Sold': string;
    'Date Acquired': string;
    'Total Proceeds': string;
    'Adjusted Cost Basis': string;
    'Symbol': string;
    'Plan Type': string;
}

export interface VerificationData {
    sellCount: number;
    uniqueDates: number;
    usdProceeds: number;
    usdGainLoss: number;
}

export interface ResultsType {
    gains: GainsType[];
    total: GainsType[];
    verification: VerificationData;
}

export class GainsCalculator {
    private sales: EtradeData[];
    private periods: Period[];

    constructor(sales: EtradeData[], periods: Period[]) {
        this.sales = sales;
        this.periods = periods;
    }

    private getDates(dateColumn: keyof EtradeData): string[] {
        return this.sales.map(row => row[dateColumn]);
    }

    private getFxRates(): Promise<Record<string, number>> {
        const allDatesStr = this.getDates('Date Acquired').concat(this.getDates('Date Sold'));
        const allDates = Array.from(new Set(allDatesStr)).map(date => new Date(date));
        return new ExchangeRateFetcher().fetchRates(allDates);
    }

    private strToNum(str: string): number {
        return parseCurrency(str) ?? 0;
    }

    private roundToTwoDecimals(num: number): number {
        return Math.round(num * 100) / 100;
    }

    private getTotalForPeriod(period: Period, gains: GainsType[]): GainsType {
        const total = gains.reduce((acc, row) => {
            if (row.Period !== period) {
                return acc;
            }
            acc['Proceeds'] += row['Proceeds'];
            acc['Cost base'] += row['Cost base'];
            acc['Expenses'] += row['Expenses'];
            acc['Gain (loss)'] += row['Gain (loss)'];
            return acc;
        }, {
            'Period': period,
            'Description': '',
            'Proceeds': 0,
            'Cost base': 0,
            'Expenses': 0,
            'Gain (loss)': 0,
        } as GainsType);

        total['Proceeds'] = this.roundToTwoDecimals(total['Proceeds']);
        total['Cost base'] = this.roundToTwoDecimals(total['Cost base']);
        total['Expenses'] = this.roundToTwoDecimals(total['Expenses']);
        total['Gain (loss)'] = this.roundToTwoDecimals(total['Gain (loss)']);
        return total;
    }

    private getPeriodForDate(date: Date): Period {
        const period = this.periods.find((p: Period) => {
            return date >= p.start && date <= p.end;
        });
        if (!period) {
            throw new Error(`No period found for date: ${date}`);
        }
        return period;
    }

    public async calculateTax(): Promise<ResultsType> {
        const rates = await this.getFxRates();

        const allDatesStr = this.getDates('Date Acquired').concat(this.getDates('Date Sold'));
        const uniqueDates = new Set(allDatesStr).size;

        let usdProceeds = 0;
        let usdGainLoss = 0;

        const gains: GainsType[] = [];
        this.sales.forEach(row => {
            const dateSold = new Date(row['Date Sold']);
            const dateAcquired = new Date(row['Date Acquired']);
            const rateSold = rates[dateSold.toISOString().split('T')[0]];
            const rateAcquired = rates[dateAcquired.toISOString().split('T')[0]];
            const proceedsUsd = this.strToNum(row['Total Proceeds']);
            const costBaseUsd = this.strToNum(row['Adjusted Cost Basis']);
            const proceeds = proceedsUsd * rateSold;
            const costBase = costBaseUsd * rateAcquired;

            usdProceeds += proceedsUsd;
            usdGainLoss += proceedsUsd - costBaseUsd;

            gains.push({
                'Period': this.getPeriodForDate(dateSold),
                'Description': row['Symbol'] + ' ' + row['Plan Type'],
                'Proceeds': this.roundToTwoDecimals(proceeds),
                'Cost base': this.roundToTwoDecimals(costBase),
                'Expenses': 0,
                'Gain (loss)': this.roundToTwoDecimals(proceeds - costBase),
            } as GainsType);
        });

        const total = this.periods.map((period: Period) => {
            return this.getTotalForPeriod(period, gains);
        });

        return {
            gains,
            total,
            verification: {
                sellCount: this.sales.length,
                uniqueDates,
                usdProceeds: this.roundToTwoDecimals(usdProceeds),
                usdGainLoss: this.roundToTwoDecimals(usdGainLoss),
            },
        };
    }
}
