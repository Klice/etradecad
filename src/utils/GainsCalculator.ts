import { ExchangeRateFetcher } from "./fetchRates";

export interface ResultsType {
    gains: GainsType[];
    total: GainsType[];
}

class Period {
    start: Date;
    end: Date;
    name: string;
    constructor(start: Date, end: Date, name: string) {
        this.start = start;
        this.end = end;
        this.name = name;
    }

    public toString = (): string => {
        return this.name + ": " + this.start.toLocaleDateString() + " - " + this.end.toLocaleDateString();
    }
}

export interface GainsType {
    "Period": Period
    "Description": string;
    "Proceeds": number;
    "Cost base": number;
    "Expenses": number;
    "Gain (loss)": number;
}

export interface EtradeData {
    "Record Type": string;
    "Date Sold": string;
    "Date Acquired": string;
    "Total Proceeds": string;
    "Adjusted Cost Basis": string;
    "Symbol": string;
    "Plan Type": string;
}

const periods: Period[] = [
    new Period(new Date("2024-01-01"), new Date("2024-06-24"), "Period 1"),
    new Period(new Date("2024-06-25"), new Date("2024-12-31"), "Period 2"),
];

export class GainsCalculator {
    private data: EtradeData[];
    private sales: EtradeData[];

    constructor(data: EtradeData[]) {
        this.data = data;
        this.sales = this.data.filter(r => r["Record Type"] == "Sell");
    }

    private getDates(dateColumn: keyof EtradeData): string[] {
        return this.sales.map(row => { return row[dateColumn]; });
    }

    private getFxRates(): Promise<Record<string, number>> {
        const allDatesStr = this.getDates("Date Acquired").concat(this.getDates("Date Sold"));
        const allDates = Array.from(new Set(allDatesStr)).map(date => new Date(date));
        return new ExchangeRateFetcher().fetchRates(allDates)
    }

    private strToNum(str: string): number {
        // Remove commas and dollar sign, then parse to float
        return parseFloat(str.replace(/[$,]/g, ""));
    }

    private roundToTwoDecimals(num: number): number {
        return Math.round(num * 100) / 100;
    }

    private getTotalForPeriod(period: Period, gains: GainsType[]): GainsType {
        const total = gains.reduce((acc, row) => {
            if (row.Period !== period) {
                return acc;
            }
            acc["Proceeds"] += row["Proceeds"];
            acc["Cost base"] += row["Cost base"];
            acc["Expenses"] += row["Expenses"];
            acc["Gain (loss)"] += row["Gain (loss)"];
            return acc;
        }, <GainsType>({
            "Period": period,
            "Description": "",
            "Proceeds": 0,
            "Cost base": 0,
            "Expenses": 0,
            "Gain (loss)": 0,
        }));


        total["Proceeds"] = this.roundToTwoDecimals(total["Proceeds"]);
        total["Cost base"] = this.roundToTwoDecimals(total["Cost base"]);
        total["Expenses"] = this.roundToTwoDecimals(total["Expenses"]);
        total["Gain (loss)"] = this.roundToTwoDecimals(total["Gain (loss)"]);
        return total;
    }

    private getPeriodForDate(date: Date): Period {
        const period = periods.find(period => {
            return date >= period.start && date <= period.end;
        });
        if (!period) {
            throw new Error(`No period found for date: ${date}`);
        }
        return period;
    }

    public calcualteTax(): Promise<ResultsType> {
        return this.getFxRates().then(rates => {
            const gains: GainsType[] = [];
            this.sales.forEach(row => {
                const dateSold = new Date(row["Date Sold"]);
                const dateAcquired = new Date(row["Date Acquired"]);
                const rateSold = rates[dateSold.toISOString().split('T')[0]];
                const rateAcquired = rates[dateAcquired.toISOString().split('T')[0]];
                const proceeds = this.strToNum(row["Total Proceeds"]) * rateSold;
                const costBase = this.strToNum(row["Adjusted Cost Basis"]) * rateAcquired;
                gains.push(<GainsType>({
                    "Period": this.getPeriodForDate(dateSold),
                    "Description": row["Symbol"] + " " + row["Plan Type"],
                    "Proceeds": this.roundToTwoDecimals(proceeds),
                    "Cost base": this.roundToTwoDecimals(costBase),
                    "Expenses": 0,
                    "Gain (loss)": this.roundToTwoDecimals(proceeds - costBase)
                }));
            });

            const total = periods.map(period => {
                return this.getTotalForPeriod(period, gains);
            });

            return {
                "gains": gains,
                "total": total
            };
        });
    }
}

