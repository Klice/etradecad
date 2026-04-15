import { format, isValid } from 'date-fns';
import { formatMoney, type Money } from './money';

const ISO_DATE = 'yyyy-MM-dd';

export const formatCurrency = (value: Money): string => {
    const formatted = formatMoney(value, { decimals: 2, grouping: true });
    return formatted.startsWith('-') ? `-$${formatted.slice(1)}` : `$${formatted}`;
};

export const toIsoDate = (date: Date): string => format(date, ISO_DATE);

export const formatDate = (value: string): string => {
    const date = new Date(value);
    return isValid(date) ? format(date, ISO_DATE) : value;
};

export type GainClass = 'gain-positive' | 'gain-negative';

export const gainClass = (value: Money): GainClass =>
    value >= 0n ? 'gain-positive' : 'gain-negative';
