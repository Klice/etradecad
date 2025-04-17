import React, { useState } from 'react';
import CsvUploader from './components/CsvUploader';
import { parseCsv } from './utils/csvParser';
import { EtradeData, GainsCalculator, ResultsType } from './utils/GainsCalculator';
import Results from './components/Results';
import Footer from './components/Footer';

const App: React.FC = () => {
    const [data, setData] = useState<EtradeData[]>([]);
    const [results, setResults] = useState<ResultsType>();

    const handleFileUpload = (file: File) => {
        parseCsv(file).then(parsedData => {
            setData(parsedData);
            const calculatedResults = new GainsCalculator(parsedData).calcualteTax();
            calculatedResults.then((res) => {
                setResults(res);
            });
        });
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
