import type { EtradeData, VerificationData } from '../utils/GainsCalculator';
import { formatCurrency, parseCurrency } from '../utils/currency';

interface DataVerificationProps {
    verification: VerificationData;
    summary: EtradeData | null;
}

const CheckIcon = () => <span className="verification-check">&#10003;</span>;
const WarnIcon = () => <span className="verification-warn">&#9888;</span>;

interface CrossCheckRow {
    label: string;
    csvValue: number;
    calculatedValue: number;
}

const DataVerification = ({ verification, summary }: DataVerificationProps) => {
    const crossChecks: CrossCheckRow[] = [];

    if (summary) {
        const summaryProceeds = parseCurrency(summary['Total Proceeds']);
        if (summaryProceeds !== null) {
            crossChecks.push({
                label: 'Total Proceeds',
                csvValue: summaryProceeds,
                calculatedValue: verification.usdProceeds,
            });
        }

        const summaryGainLoss = parseCurrency(summary['Adjusted Gain/Loss'])
            ?? parseCurrency(summary['Gain/Loss']);
        if (summaryGainLoss !== null) {
            crossChecks.push({
                label: 'Adjusted Gain/Loss',
                csvValue: summaryGainLoss,
                calculatedValue: verification.usdGainLoss,
            });
        }
    }

    return (
        <div className="card mb-4">
            <div className="card-body">
                <h5 className="card-title mb-3">Data Verification</h5>

                <div className="verification-item">
                    <CheckIcon />
                    <span>{verification.sellCount} sell transactions loaded</span>
                </div>
                {summary && (
                    <div className="verification-item">
                        <CheckIcon />
                        <span>1 summary row found</span>
                    </div>
                )}
                <div className="verification-item">
                    <CheckIcon />
                    <span>Exchange rates fetched for {verification.uniqueDates} unique dates</span>
                </div>

                {crossChecks.length > 0 && (
                    <>
                        <hr />
                        <p className="text-muted mb-2">
                            <strong>Cross-check against spreadsheet summary row (USD)</strong>
                        </p>
                        <table className="crosscheck-table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>CSV Summary</th>
                                    <th>Calculated</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {crossChecks.map((row) => {
                                    const match = Math.abs(row.csvValue - row.calculatedValue) < 0.02;
                                    return (
                                        <tr key={row.label}>
                                            <td className="text-muted">{row.label}</td>
                                            <td>{formatCurrency(row.csvValue)}</td>
                                            <td>{formatCurrency(row.calculatedValue)}</td>
                                            <td>{match ? <CheckIcon /> : <WarnIcon />}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    );
};

export default DataVerification;
