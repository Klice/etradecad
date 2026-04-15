import { CSVLink } from 'react-csv';
import type { GainsType, Period } from '../utils/GainsCalculator';
import { formatCurrency } from '../utils/currency';

interface TaxSummaryProps {
    totals: GainsType[];
}

const formatPeriodDates = (period: Period): string => {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const start = period.start.toLocaleDateString('en-CA', opts);
    const end = period.end.toLocaleDateString('en-CA', { ...opts, year: 'numeric' });
    return `${start} \u2013 ${end}`;
};

const PeriodBlock = ({ row, showPeriod }: { row: GainsType; showPeriod: boolean }) => {
    const period = row['Period'] as Period;
    const gainLoss = row['Gain (loss)'] as number;
    const gainClass = gainLoss >= 0 ? 'gain-positive' : 'gain-negative';

    return (
        <>
            {showPeriod && (
                <div className="cra-period-title">
                    {period.name} &middot; {formatPeriodDates(period)}
                </div>
            )}
            <div className="cra-row">
                <span className="cra-row-label">Proceeds of disposition</span>
                <span className="cra-row-value">{formatCurrency(row['Proceeds'] as number)}</span>
            </div>
            <div className="cra-row">
                <span className="cra-row-label">Adjusted cost base</span>
                <span className="cra-row-value">{formatCurrency(row['Cost base'] as number)}</span>
            </div>
            <div className="cra-row">
                <span className="cra-row-label">Outlays and expenses</span>
                <span className="cra-row-value">{formatCurrency(row['Expenses'] as number)}</span>
            </div>
            <div className="cra-row cra-row-highlight">
                <span className="cra-row-label">Gain (Loss)</span>
                <span className={`cra-row-value ${gainClass}`}>{formatCurrency(gainLoss)}</span>
            </div>
        </>
    );
};

const TaxSummary = ({ totals }: TaxSummaryProps) => {
    const showPeriod = totals.length > 1;

    return (
        <div className="cra-card mb-4">
            <div className="cra-header">Schedule 3 &mdash; Capital Gains (Losses)</div>
            {totals.map((row, i) => (
                <PeriodBlock key={i} row={row} showPeriod={showPeriod} />
            ))}
            <div className="d-flex justify-content-end p-2">
                <CSVLink className="btn btn-sm btn-outline-primary" data={totals}>
                    Download CSV
                </CSVLink>
            </div>
        </div>
    );
};

export default TaxSummary;
