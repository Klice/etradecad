import Papa from 'papaparse';
import { EtradeData } from './GainsCalculator';

export const parseCsv = (file: File): Promise<EtradeData[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const results = Papa.parse(event.target?.result as string, {
                header: true,
                skipEmptyLines: true,
            });
            resolve(results.data as EtradeData[]);
        };

        reader.onerror = () => {
            reject(new Error('Error reading the file'));
        };

        reader.readAsText(file);
    });
};
