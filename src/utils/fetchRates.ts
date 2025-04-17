import axios from 'axios';

interface Obeservation {
    d: string; // Date in 'YYYY-MM-DD' format
    FXUSDCAD?: {
        v: string; // Conversion rate
    };
}

export class ExchangeRateFetcher {
    private apiUrl: string;

    constructor() {
        this.apiUrl = 'https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json';
    }

    /**
     * Fetches conversion rates for a list of dates.
     * @param dates - An array of dates in the format 'YYYY-MM-DD'.
     * @returns A promise that resolves to an object where keys are dates and values are conversion rates.
     */
    public async fetchRates(dates: Date[]): Promise<Record<string, number>> {
        try {
            const response = await axios.get(this.apiUrl);
            const data = response.data as { observations: { d: string; FXUSDCAD?: { v: string } }[] };
            const observations = data.observations;

            const rates: Record<string, number> = {};
            dates.forEach(date => {
                const dateStr = date.toISOString().split('T')[0]
                const observation = this.findObservationByDateWithLookback(observations, date);
                if (observation && observation['FXUSDCAD']) {
                    rates[dateStr] = parseFloat(observation['FXUSDCAD'].v);
                } else {
                    rates[dateStr] = NaN; // If no rate is found for the date, set it to NaN
                }
            });

            return rates;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error('Failed to fetch exchange rates: ' + error.message);
            } else {
                throw new Error('Failed to fetch exchange rates: An unknown error occurred.');
            }
        }
    }

    private findObservationByDate(observations: Obeservation[], date: Date): Obeservation | undefined {
        return observations.find((obs) => obs.d === date.toISOString().split('T')[0]);
    }

    private findObservationByDateWithLookback(observations: Obeservation[], date: Date): Obeservation | undefined {
        const maxlookbackDays = 2; // Number of days to look back
        let lookbackDays = 0;
        while (lookbackDays <= maxlookbackDays) {
            const lookbackDate = new Date(date);
            lookbackDate.setDate(date.getDate() - lookbackDays);
            const observation = this.findObservationByDate(observations, lookbackDate);
            if (observation && observation['FXUSDCAD']) {
                return observation;
            }
            lookbackDays++;
        }
        return undefined;
    }
}