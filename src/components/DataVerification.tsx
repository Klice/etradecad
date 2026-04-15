import { Accordion, Table } from 'react-bootstrap';
import ExchangeRatesTable from './ExchangeRatesTable';
import TransactionsTable from './TransactionsTable';
import type { EtradeData, ExchangeRate, GainsType, VerificationData } from '../utils/GainsCalculator';
import { formatCurrency, parseCurrency } from '../utils/format';

interface DataVerificationProps {
    verification: VerificationData;
    summary: EtradeData | null;
    exchangeRates: ExchangeRate[];
    gains: GainsType[];
}

const CheckIcon = () => <span className="verification-check">&#10003;</span>;
const WarnIcon = () => <span className="verification-warn">&#9888;</span>;

interface CrossCheckRow {
    label: string;
    csvValue: number;
    calculatedValue: number;
}

const SummaryRow = ({ data }: { data: EtradeData }) => {
    const entries = Object.entries(data).filter(([, v]) => v !== '');
    return (
        <Table striped bordered size="sm" className="transactions-table mb-0">
            <thead>
                <tr>
                    <th>Field</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                {entries.map(([key, value]) => (
                    <tr key={key}>
                        <td className="text-muted">{key}</td>
                        <td>{value}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};

const DataVerification = ({ verification, summary, exchangeRates, gains }: DataVerificationProps) => {
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
                    <span><span className="verification-badge">{verification.sellCount}</span> sell transactions loaded</span>
                </div>
                <Accordion className="ms-4 mb-2">
                    <Accordion.Item eventKey="txn">
                        <Accordion.Header>
                            All Transactions <span className="verification-badge">{gains.length}</span>
                        </Accordion.Header>
                        <Accordion.Body>
                            <TransactionsTable data={gains} />
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>

                {summary && (
                    <>
                        <div className="verification-item">
                            <CheckIcon />
                            <span><span className="verification-badge">1</span> summary row found</span>
                        </div>
                        <Accordion className="ms-4 mb-2">
                            <Accordion.Item eventKey="summary">
                                <Accordion.Header>
                                    Imported Summary Row
                                </Accordion.Header>
                                <Accordion.Body>
                                    <SummaryRow data={summary} />
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </>
                )}

                <div className="verification-item">
                    <CheckIcon />
                    <span>Exchange rates fetched for <span className="verification-badge">{verification.uniqueDates}</span> unique dates</span>
                </div>
                <Accordion className="ms-4 mb-2">
                    <Accordion.Item eventKey="rates">
                        <Accordion.Header>
                            Exchange Rates <span className="verification-badge">{exchangeRates.length}</span>
                        </Accordion.Header>
                        <Accordion.Body>
                            <ExchangeRatesTable rates={exchangeRates} />
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>

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
                                    <th>Summary</th>
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
