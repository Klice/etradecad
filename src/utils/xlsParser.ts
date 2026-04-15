import readXlsxFile, { type Row } from 'read-excel-file/browser';
import type { EtradeData } from './GainsCalculator';

export interface ParseResult {
    sales: EtradeData[];
    summary: EtradeData | null;
    totalRows: number;
}

export const parseXls = async (file: File): Promise<ParseResult> => {
    const results = await readXlsxFile(file);
    const sheets = results as unknown as { sheet: string; data: Row[] }[];
    const rows = sheets[0].data;

    if (rows.length < 2) {
        throw new Error('File is empty or has no data rows');
    }

    const headers = rows[0].map(cell => String(cell ?? ''));
    const dataRows = rows.slice(1);

    const allRows = dataRows.map(row =>
        Object.fromEntries(
            headers.map((header, i) => [header, row[i] != null ? String(row[i]) : '']),
        ) as unknown as EtradeData,
    );

    const summary = allRows.find(r => r['Record Type'] === 'Summary') ?? null;
    const sales = allRows.filter(r => r['Record Type'] === 'Sell');

    return {
        sales,
        summary,
        totalRows: allRows.length,
    };
};
