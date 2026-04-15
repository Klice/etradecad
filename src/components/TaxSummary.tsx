import { format } from 'date-fns';
import { CSVLink } from 'react-csv';
import { GAIN_FIELD, type GainsType, type Period } from '../utils/GainsCalculator';
import { formatCurrency, gainClass } from '../utils/format';
import { formatMoney } from '../utils/money';

interface TaxSummaryProps {
    totals: GainsType[];
}

const formatPeriodDates = (period: Period): string =>
    `${format(period.start, 'MMM d')} \u2013 ${format(period.end, 'MMM d, yyyy')}`;

const toCsvRow = (row: GainsType) => ({
    [GAIN_FIELD.Period]: row[GAIN_FIELD.Period].name,
    [GAIN_FIELD.Proceeds]: formatMoney(row[GAIN_FIELD.Proceeds]),
    [GAIN_FIELD.CostBase]: formatMoney(row[GAIN_FIELD.CostBase]),
    [GAIN_FIELD.Expenses]: formatMoney(row[GAIN_FIELD.Expenses]),
    [GAIN_FIELD.GainLoss]: formatMoney(row[GAIN_FIELD.GainLoss]),
});

const PeriodBlock = ({ row, showPeriod }: { row: GainsType; showPeriod: boolean }) => {
    const period = row[GAIN_FIELD.Period];
    const gainLoss = row[GAIN_FIELD.GainLoss];

    return (
        <>
            {showPeriod && (
                <div className="cra-period-title">
                    {period.name} &middot; {formatPeriodDates(period)}
                </div>
            )}
            <div className="cra-row">
                <span className="cra-row-label">Proceeds of disposition</span>
                <span className="cra-row-value">{formatCurrency(row[GAIN_FIELD.Proceeds])}</span>
            </div>
            <div className="cra-row">
                <span className="cra-row-label">Adjusted cost base</span>
                <span className="cra-row-value">{formatCurrency(row[GAIN_FIELD.CostBase])}</span>
            </div>
            <div className="cra-row">
                <span className="cra-row-label">Outlays and expenses</span>
                <span className="cra-row-value">{formatCurrency(row[GAIN_FIELD.Expenses])}</span>
            </div>
            <div className="cra-row cra-row-highlight">
                <span className="cra-row-label">Gain (Loss)</span>
                <span className={`cra-row-value ${gainClass(gainLoss)}`}>{formatCurrency(gainLoss)}</span>
            </div>
        </>
    );
};

const TaxSummary = ({ totals }: TaxSummaryProps) => {
    const showPeriod = totals.length > 1;

    return (
        <div className="cra-card mb-4">
            <div className="cra-header">
                Schedule 3 &mdash; Capital Gains (Losses)
                <span className="cra-header-note">Values converted to CAD using Bank of Canada exchange rates</span>
            </div>
            {totals.map((row, i) => (
                <PeriodBlock key={i} row={row} showPeriod={showPeriod} />
            ))}
            <div className="d-flex justify-content-end p-2">
                <CSVLink className="btn btn-sm btn-outline-primary" data={totals.map(toCsvRow)}>
                    Download CSV
                </CSVLink>
            </div>
        </div>
    );
};

export default TaxSummary;
