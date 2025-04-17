import { ExchangeRateFetcher } from "./fetchRates";

export interface ResultsType {
    gains: any[];
    total: TotalType;
}

interface TotalType {
    "Proceeds": number;
    "Cost base": number;
    "Expenses": number;
    "Gain (loss)": number;
}

export class GainsCalculator {
    private data: any[];
    private sales: any[];

    constructor(data: any[]) {
        this.data = data;
        this.sales = this.data.filter(r => r["Record Type"] == "Sell");
    }

    private getDates(dataColumn: string): Date[] {
        return this.sales.map(row => { return row[dataColumn]; });
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

    public calcualteTax(): Promise<ResultsType> {
        return this.getFxRates().then(rates => {
            const gains: any[] = [];
            this.sales.forEach(row => {
                const dateSold = new Date(row["Date Sold"]);
                const dateAcquired = new Date(row["Date Acquired"]);
                const rateSold = rates[dateSold.toISOString().split('T')[0]];
                const rateAcquired = rates[dateAcquired.toISOString().split('T')[0]];
                const proceeds = this.strToNum(row["Total Proceeds"]) * rateSold;
                const costBase = this.strToNum(row["Adjusted Cost Basis"]) * rateAcquired;
                gains.push({
                    "Description": row["Symbol"] + " " + row["Plan Type"],
                    "Proceeds": proceeds.toFixed(2),
                    "Cost base": costBase.toFixed(2),
                    "Expenses": 0,
                    "Gain (loss)": (proceeds - costBase).toFixed(2),
                });
            });

            const total = gains.reduce((acc, row) => {
                acc["Proceeds"] += parseFloat(row["Proceeds"]);
                acc["Cost base"] += parseFloat(row["Cost base"]);
                acc["Expenses"] += parseFloat(row["Expenses"]);
                acc["Gain (loss)"] += parseFloat(row["Gain (loss)"]);
                return acc;
            }, {
                "Proceeds": 0,
                "Cost base": 0,
                "Expenses": 0,
                "Gain (loss)": 0
            })

            total["Proceeds"] = total["Proceeds"].toFixed(2);
            total["Cost base"] = total["Cost base"].toFixed(2);
            total["Expenses"] = total["Expenses"].toFixed(2);
            total["Gain (loss)"] = total["Gain (loss)"].toFixed(2);

            return {
                "gains": gains,
                "total": total
            };
        });
    }
}

