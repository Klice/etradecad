import { useState } from 'react';
import { parseXls, type ParseResult } from './utils/xlsParser';
import { calculateTax, type EtradeData, type Period, type ResultsType } from './utils/GainsCalculator';
import LandingPage from './components/LandingPage';
import ResultsPage from './components/Results';
import Footer from './components/Footer';

const periods: Period[] = [
    { start: new Date(2025, 0, 1), end: new Date(2025, 11, 31), name: '2025' },
];

const App = () => {
    const [results, setResults] = useState<ResultsType | null>(null);
    const [summary, setSummary] = useState<EtradeData | null>(null);
    const [sales, setSales] = useState<EtradeData[]>([]);

    const handleFileSelect = async (file: File) => {
        const parsed: ParseResult = await parseXls(file);
        setSummary(parsed.summary);
        setSales(parsed.sales);
        const calculated = await calculateTax(parsed.sales, periods);
        setResults(calculated);
    };

    const handleReset = () => {
        setResults(null);
        setSummary(null);
        setSales([]);
    };

    return (
        <div className="App">
            {results ? (
                <ResultsPage results={results} summary={summary} sales={sales} onReset={handleReset} />
            ) : (
                <LandingPage onFileSelect={handleFileSelect} />
            )}
            <Footer />
        </div>
    );
};

export default App;
