import { Accordion, Table } from 'react-bootstrap';
import { CheckLg, ExclamationTriangleFill } from 'react-bootstrap-icons';
import CalculationBreakdown from './CalculationBreakdown';
import ExchangeRatesTable from './ExchangeRatesTable';
import TransactionsTable from './TransactionsTable';
import { ETRADE_FIELD, type EtradeData, type ExchangeRate, type GainsType, type VerificationData } from '../utils/GainsCalculator';
import { formatCurrency } from '../utils/format';
import { moneyFromString, subMoney, type Money } from '../utils/money';

interface DataVerificationProps {
    verification: VerificationData;
    summary: EtradeData | null;
    sales: EtradeData[];
    exchangeRates: ExchangeRate[];
    gains: GainsType[];
}

const CheckIcon = () => <CheckLg className="verification-check" />;
const WarnIcon = () => <ExclamationTriangleFill className="verification-warn" />;

const CROSS_CHECK_TOLERANCE = 20_000n; // 0.02 in scale-6

interface CrossCheckRow {
    label: string;
    csvValue: Money;
    calculatedValue: Money;
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

const DataVerification = ({ verification, summary, sales, exchangeRates, gains }: DataVerificationProps) => {
    const crossChecks: CrossCheckRow[] = [];

    if (summary) {
        const summaryProceeds = moneyFromString(summary[ETRADE_FIELD.TotalProceeds]);
        if (summaryProceeds !== null) {
            crossChecks.push({
                label: 'Total Proceeds',
                csvValue: summaryProceeds,
                calculatedValue: verification.usdProceeds,
            });
        }

        const summaryGainLoss = moneyFromString(summary[ETRADE_FIELD.AdjustedGainLoss])
            ?? moneyFromString(summary[ETRADE_FIELD.GainLoss]);
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

                <div className="verification-item">
                    <CheckIcon />
                    <span>Calculation Breakdown</span>
                </div>
                <Accordion className="ms-4 mb-2">
                    <Accordion.Item eventKey="breakdown">
                        <Accordion.Header>
                            Calculation Details <span className="verification-badge">{gains.length}</span>
                        </Accordion.Header>
                        <Accordion.Body>
                            <CalculationBreakdown sales={sales} gains={gains} exchangeRates={exchangeRates} />
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
                                    const diff = subMoney(row.csvValue, row.calculatedValue);
                                    const match = (diff < 0n ? -diff : diff) < CROSS_CHECK_TOLERANCE;
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
