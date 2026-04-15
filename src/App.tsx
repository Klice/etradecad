import { useState } from 'react';
import { parseXls, type ParseResult } from './utils/xlsParser';
import { GainsCalculator, Period, type EtradeData, type ResultsType } from './utils/GainsCalculator';
import LandingPage from './components/LandingPage';
import ResultsPage from './components/Results';
import Footer from './components/Footer';

const periods: Period[] = [
    new Period(new Date(2025, 0, 1), new Date(2025, 5, 24), 'Period 1'),
    new Period(new Date(2025, 5, 25), new Date(2025, 11, 31), 'Period 2'),
];

const App = () => {
    const [results, setResults] = useState<ResultsType | null>(null);
    const [summary, setSummary] = useState<EtradeData | null>(null);

    const handleFileSelect = async (file: File) => {
        const parsed: ParseResult = await parseXls(file);
        setSummary(parsed.summary);
        const calculated = await new GainsCalculator(parsed.sales, periods).calculateTax();
        setResults(calculated);
    };

    const handleReset = () => {
        setResults(null);
        setSummary(null);
    };

    return (
        <div className="App">
            {results ? (
                <ResultsPage results={results} summary={summary} onReset={handleReset} />
            ) : (
                <LandingPage onFileSelect={handleFileSelect} />
            )}
            <Footer />
        </div>
    );
};

export default App;
