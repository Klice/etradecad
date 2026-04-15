import { format } from 'date-fns';
import { CSVLink } from 'react-csv';
import { BoxArrowUpRight, InfoCircle } from 'react-bootstrap-icons';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { GAIN_FIELD, type GainsType, type Period } from '../utils/GainsCalculator';
import { formatCurrency, gainClass } from '../utils/format';

const CraTooltip = ({ text }: { text: string }) => (
    <OverlayTrigger
        placement="right"
        overlay={<Tooltip className="cra-tooltip">{text}</Tooltip>}
    >
        <InfoCircle size={12} className="ms-1 text-muted" style={{ cursor: 'help' }} />
    </OverlayTrigger>
);
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
                <span className="cra-row-label">
                    Proceeds of disposition
                    <CraTooltip text="This is usually the amount you received or will receive for your property. In most cases, it refers to the sale price of the property. This could also include compensation you received for property that has been destroyed, expropriated or stolen." />
                </span>
                <span className="cra-row-value">{formatCurrency(row[GAIN_FIELD.Proceeds])}</span>
            </div>
            <div className="cra-row">
                <span className="cra-row-label">
                    Adjusted cost base
                    <CraTooltip text="This is usually the cost of a property plus any expenses to acquire it, such as commissions and legal fees.

The cost of a capital property is its actual or deemed cost, depending on the type of property and how you acquired it. It also includes capital expenditures, such as the cost of additions and improvements to the property. You cannot add current expenses, such as maintenance and repair costs, to the cost base of a property." />
                </span>
                <span className="cra-row-value">{formatCurrency(row[GAIN_FIELD.CostBase])}</span>
            </div>
            <div className="cra-row">
                <span className="cra-row-label">
                    Outlays and expenses
                    <CraTooltip text="These are amounts that you incurred to sell a capital property. You can deduct outlays and expenses from your proceeds of disposition when calculating your capital gain or loss. You cannot reduce your other income by claiming a deduction for these outlays and expenses. These types of expenses include fixing-up expenses, finders' fees, commissions, brokers' fees, surveyors' fees, legal fees, transfer taxes, and advertising costs." />
                </span>
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
            <div className="d-flex justify-content-between align-items-center" style={{ padding: '10px 16px' }}>
                <a
                    href="https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-12700-capital-gains/calculating-reporting-your-capital-gains-losses.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="small text-muted"
                >
                    CRA: Reporting capital gains/losses<BoxArrowUpRight size={10} className="ms-1" />
                </a>
                <CSVLink className="btn btn-sm btn-outline-primary" data={totals.map(toCsvRow)}>
                    Download CSV
                </CSVLink>
            </div>
        </div>
    );
};

export default TaxSummary;
