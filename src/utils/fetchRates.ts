import { subDays } from 'date-fns';
import { toIsoDate } from './format';

interface Observation {
    d: string;
    FXUSDCAD?: { v: string };
}

const API_URL = 'https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json';
const MAX_LOOKBACK_DAYS = 2;

const findObservation = (observations: Observation[], date: Date): Observation | undefined => {
    const target = toIsoDate(date);
    return observations.find(obs => obs.d === target);
};

const findWithLookback = (observations: Observation[], date: Date): Observation | undefined => {
    for (let days = 0; days <= MAX_LOOKBACK_DAYS; days++) {
        const observation = findObservation(observations, subDays(date, days));
        if (observation?.FXUSDCAD) return observation;
    }
    return undefined;
};

export const fetchRates = async (dates: Date[]): Promise<Record<string, number>> => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        const data = await response.json() as { observations: Observation[] };

        return Object.fromEntries(
            dates.map(date => {
                const observation = findWithLookback(data.observations, date);
                const rate = observation?.FXUSDCAD ? parseFloat(observation.FXUSDCAD.v) : NaN;
                return [toIsoDate(date), rate];
            }),
        );
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Failed to fetch exchange rates: ${msg}`);
    }
};
