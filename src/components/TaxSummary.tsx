import { useState } from 'react';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv';
import { BoxArrowUpRight, CheckCircleFill, InfoCircle } from 'react-bootstrap-icons';
import { OverlayTrigger, Table, Tooltip } from 'react-bootstrap';
import { GAIN_FIELD, type GainsType, type Period } from '../utils/GainsCalculator';
import { formatCurrency, gainClass } from '../utils/format';
import { formatMoney } from '../utils/money';

const copyRowToClipboard = async (name: string, row: GainsType): Promise<void> => {
    const tsv = [
        name,
        formatMoney(row[GAIN_FIELD.Proceeds]),
        formatMoney(row[GAIN_FIELD.CostBase]),
        formatMoney(row[GAIN_FIELD.Expenses]),
    ].join('\t');
    await navigator.clipboard.writeText(tsv);
};

const CopyButton = ({ copied, onClick }: { copied: boolean; onClick: () => void }) => (
    <button
        type="button"
        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center"
        onClick={onClick}
        title="Copy Proceeds, ACB, Outlays as tab-separated values"
    >
        {copied && <CheckCircleFill size={12} className="me-1 text-success" />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
);

type View = 'totals' | 'transactions';

const CraTooltip = ({ text }: { text: string }) => (
    <OverlayTrigger
        placement="right"
        overlay={<Tooltip className="cra-tooltip">{text}</Tooltip>}
    >
        <InfoCircle size={12} className="ms-1 text-muted" style={{ cursor: 'help' }} />
    </OverlayTrigger>
);

interface TaxSummaryProps {
    totals: GainsType[];
    gains: GainsType[];
}

const formatPeriodDates = (period: Period): string =>
    `${format(period.start, 'MMM d')} – ${format(period.end, 'MMM d, yyyy')}`;

const toCsvRow = (row: GainsType) => ({
    [GAIN_FIELD.Period]: row[GAIN_FIELD.Period].name,
    [GAIN_FIELD.Proceeds]: formatMoney(row[GAIN_FIELD.Proceeds]),
    [GAIN_FIELD.CostBase]: formatMoney(row[GAIN_FIELD.CostBase]),
    [GAIN_FIELD.Expenses]: formatMoney(row[GAIN_FIELD.Expenses]),
    [GAIN_FIELD.GainLoss]: formatMoney(row[GAIN_FIELD.GainLoss]),
});

interface CraBlockProps {
    row: GainsType;
    title: string | null;
    copied: boolean;
    onCopy: () => void;
}

const CraBlock = ({ row, title, copied, onCopy }: CraBlockProps) => {
    const gainLoss = row[GAIN_FIELD.GainLoss];

    return (
        <div className={`cra-block ${copied ? 'cra-block-copied' : ''}`}>
            {title && <div className="cra-period-title">{title}</div>}
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
            <div className="cra-block-actions">
                <CopyButton copied={copied} onClick={onCopy} />
            </div>
        </div>
    );
};

interface TransactionsViewProps {
    rows: GainsType[];
    isCopied: (i: number) => boolean;
    onCopy: (i: number) => void;
}

const TransactionsView = ({ rows, isCopied, onCopy }: TransactionsViewProps) => (
    <Table responsive hover size="sm" className="cra-table mb-0">
        <thead>
            <tr>
                <th>Transaction</th>
                <th className="text-end">Proceeds of disposition</th>
                <th className="text-end">Adjusted cost base</th>
                <th className="text-end">Outlays and expenses</th>
                <th className="text-end">Gain (Loss)</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            {rows.map((row, i) => {
                const gainLoss = row[GAIN_FIELD.GainLoss];
                const copied = isCopied(i);
                return (
                    <tr key={i} className={copied ? 'cra-block-copied' : ''}>
                        <td>{row[GAIN_FIELD.Description]}</td>
                        <td className="text-end cra-table-value">{formatCurrency(row[GAIN_FIELD.Proceeds])}</td>
                        <td className="text-end cra-table-value">{formatCurrency(row[GAIN_FIELD.CostBase])}</td>
                        <td className="text-end cra-table-value">{formatCurrency(row[GAIN_FIELD.Expenses])}</td>
                        <td className={`text-end cra-table-value ${gainClass(gainLoss)}`}>{formatCurrency(gainLoss)}</td>
                        <td className="text-end"><CopyButton copied={copied} onClick={() => onCopy(i)} /></td>
                    </tr>
                );
            })}
        </tbody>
    </Table>
);

const TaxSummary = ({ totals, gains }: TaxSummaryProps) => {
    const [view, setView] = useState<View>('totals');
    const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());
    const showPeriod = totals.length > 1;
    const csvRows = view === 'totals' ? totals : gains;

    const handleCopy = async (key: string, name: string, row: GainsType) => {
        await copyRowToClipboard(name, row);
        setCopiedKeys(prev => new Set(prev).add(key));
    };

    return (
        <div className="cra-card mb-4">
            <div className="cra-header">
                Schedule 3 &mdash; Capital Gains (Losses)
                <span className="cra-header-note">Values converted to CAD using Bank of Canada exchange rates</span>
            </div>
            <div className="cra-toolbar">
                <div className="btn-group btn-group-sm" role="group" aria-label="View toggle">
                    <button
                        type="button"
                        className={`btn btn-outline-secondary ${view === 'totals' ? 'active' : ''}`}
                        onClick={() => setView('totals')}
                    >
                        Totals by period
                    </button>
                    <button
                        type="button"
                        className={`btn btn-outline-secondary ${view === 'transactions' ? 'active' : ''}`}
                        onClick={() => setView('transactions')}
                    >
                        Per transaction
                    </button>
                </div>
            </div>
            {view === 'totals' ? (
                totals.map((row, i) => {
                    const period = row[GAIN_FIELD.Period];
                    const title = showPeriod ? `${period.name} · ${formatPeriodDates(period)}` : null;
                    const key = `p-${period.name}`;
                    return (
                        <CraBlock
                            key={i}
                            row={row}
                            title={title}
                            copied={copiedKeys.has(key)}
                            onCopy={() => handleCopy(key, period.name, row)}
                        />
                    );
                })
            ) : (
                <TransactionsView
                    rows={gains}
                    isCopied={(i) => copiedKeys.has(`t-${i}`)}
                    onCopy={(i) => handleCopy(`t-${i}`, gains[i][GAIN_FIELD.Description], gains[i])}
                />
            )}
            <div className="d-flex justify-content-between align-items-center" style={{ padding: '10px 16px' }}>
                <a
                    href="https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-12700-capital-gains/calculating-reporting-your-capital-gains-losses.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="small text-muted"
                >
                    CRA: Reporting capital gains/losses<BoxArrowUpRight size={10} className="ms-1" />
                </a>
                <CSVLink className="btn btn-sm btn-outline-primary" data={csvRows.map(toCsvRow)}>
                    Download CSV
                </CSVLink>
            </div>
        </div>
    );
};

export default TaxSummary;
