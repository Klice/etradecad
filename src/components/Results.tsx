import TaxSummary from './TaxSummary';
import DataVerification from './DataVerification';
import type { EtradeData, ResultsType } from '../utils/GainsCalculator';

interface ResultsPageProps {
    results: ResultsType;
    summary: EtradeData | null;
    onReset: () => void;
}

const ResultsPage = ({ results, summary, onReset }: ResultsPageProps) => {
    return (
        <div className="container results-container">
            <div className="d-flex justify-content-between align-items-center py-4">
                <h4 className="mb-0">
                    eTrade Gains/Losses <span className="text-muted fw-normal">USD &rarr; CAD</span>
                </h4>
                <button className="btn btn-outline-secondary btn-sm" onClick={onReset}>
                    Upload new file
                </button>
            </div>

            <TaxSummary totals={results.total} />

            <DataVerification
                verification={results.verification}
                summary={summary}
                exchangeRates={results.exchangeRates}
                gains={results.gains}
            />
        </div>
    );
};

export default ResultsPage;
