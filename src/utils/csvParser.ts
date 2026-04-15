import Papa from 'papaparse';
import { EtradeData } from './GainsCalculator';

export interface ParseResult {
    sales: EtradeData[];
    summary: EtradeData | null;
    totalRows: number;
}

export const parseCsv = (file: File): Promise<ParseResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const results = Papa.parse(event.target?.result as string, {
                header: true,
                skipEmptyLines: true,
            });
            const allRows = results.data as EtradeData[];
            const summary = allRows.find(r => r['Record Type'] === 'Summary') ?? null;
            const sales = allRows.filter(r => r['Record Type'] === 'Sell');

            resolve({
                sales,
                summary,
                totalRows: allRows.length,
            });
        };

        reader.onerror = () => {
            reject(new Error('Error reading the file'));
        };

        reader.readAsText(file);
    });
};
