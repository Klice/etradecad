export const formatCurrency = (value: number): string => {
    const abs = Math.abs(value);
    const formatted = abs.toLocaleString('en-CA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return value < 0 ? `-$${formatted}` : `$${formatted}`;
};

export const parseCurrency = (str: string | undefined): number | null => {
    if (!str || str.trim() === '') return null;
    const value = parseFloat(str.replace(/[$,]/g, ''));
    return isNaN(value) ? null : value;
};

export const formatDate = (value: string): string => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD
};
