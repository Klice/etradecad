// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseXls } from './xlsParser';

const loadFixture = (name: string): File => {
    const buffer = readFileSync(resolve(__dirname, '../../examples', name));
    return new File([buffer], name, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
};

describe('parseXls', () => {
    it('parses the bundled example spreadsheet', async () => {
        const file = loadFixture('sample_gains_losses.xlsx');

        const result = await parseXls(file);

        expect(result.totalRows).toBeGreaterThan(0);
        expect(result.sales.length).toBeGreaterThan(0);
        expect(result.sales.every(r => r['Record Type'] === 'Sell')).toBe(true);
        if (result.summary) {
            expect(result.summary['Record Type']).toBe('Summary');
        }

        const firstSale = result.sales[0];
        expect(firstSale['Date Sold']).toBeTruthy();
        expect(firstSale['Date Acquired']).toBeTruthy();
        expect(firstSale['Total Proceeds']).toBeTruthy();
        expect(firstSale['Adjusted Cost Basis']).toBeTruthy();
    });

    it('filters Sell and Summary rows from everything else', async () => {
        const file = loadFixture('sample_gains_losses.xlsx');

        const result = await parseXls(file);

        const recordTypes = new Set(result.sales.map(r => r['Record Type']));
        expect(recordTypes).toEqual(new Set(['Sell']));
    });
});
