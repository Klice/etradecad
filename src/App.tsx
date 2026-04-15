import { useState } from 'react';
import CsvUploader from './components/CsvUploader';
import { parseCsv } from './utils/csvParser';
import { EtradeData, GainsCalculator, Period, ResultsType } from './utils/GainsCalculator';
import Results from './components/Results';
import Footer from './components/Footer';

const periods: Period[] = [
    new Period(new Date(2025, 0, 1), new Date(2025, 5, 24), 'Period 1'),
    new Period(new Date(2025, 5, 25), new Date(2025, 11, 31), 'Period 2'),
];

const App = () => {
    const [data, setData] = useState<EtradeData[]>([]);
    const [results, setResults] = useState<ResultsType>();

    const handleFileUpload = async (file: File) => {
        const parsedData = await parseCsv(file);
        setData(parsedData);
        const calculatedResults = await new GainsCalculator(parsedData, periods).calculateTax();
        setResults(calculatedResults);
    };

    return (
        <div className="App">
            <h1>eTrade Gains/Losses USD to CAD converter</h1>
            <CsvUploader onFileUpload={handleFileUpload} />
            <Results data={data} gains={results?.gains} total={results?.total} />
            <Footer />
        </div>
    );
};

export default App;
