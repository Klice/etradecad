import { Table } from 'react-bootstrap';
import { CSVLink } from 'react-csv';
import { GAIN_FIELD, type GainsType } from '../utils/GainsCalculator';
import { formatCurrency, formatDate, gainClass } from '../utils/format';
import { formatMoney } from '../utils/money';

interface TransactionsTableProps {
    data: GainsType[];
}

const toCsvRow = (row: GainsType) => ({
    [GAIN_FIELD.Period]: row[GAIN_FIELD.Period].name,
    [GAIN_FIELD.DateSold]: row[GAIN_FIELD.DateSold],
    [GAIN_FIELD.Description]: row[GAIN_FIELD.Description],
    [GAIN_FIELD.Proceeds]: formatMoney(row[GAIN_FIELD.Proceeds]),
    [GAIN_FIELD.CostBase]: formatMoney(row[GAIN_FIELD.CostBase]),
    [GAIN_FIELD.Expenses]: formatMoney(row[GAIN_FIELD.Expenses]),
    [GAIN_FIELD.GainLoss]: formatMoney(row[GAIN_FIELD.GainLoss]),
});

const TransactionsTable = ({ data }: TransactionsTableProps) => {
    if (!data || data.length === 0) {
        return <div>No data available</div>;
    }

    const showPeriod = new Set(data.map(r => r[GAIN_FIELD.Period].name)).size > 1;

    return (
        <div>
            <div className="mb-3 text-end">
                <CSVLink className="btn btn-sm btn-outline-primary" data={data.map(toCsvRow)}>
                    Download CSV
                </CSVLink>
            </div>
            <Table striped bordered hover size="sm" className="transactions-table">
                <thead>
                    <tr>
                        <th>#</th>
                        {showPeriod && <th>Period</th>}
                        <th>Date Sold</th>
                        <th>Description</th>
                        <th className="text-end">Proceeds</th>
                        <th className="text-end">Cost base</th>
                        <th className="text-end">Expenses</th>
                        <th className="text-end">Gain (Loss)</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => {
                        const gainLoss = row[GAIN_FIELD.GainLoss];
                        return (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                {showPeriod && <td>{row[GAIN_FIELD.Period].name}</td>}
                                <td>{formatDate(row[GAIN_FIELD.DateSold])}</td>
                                <td>{row[GAIN_FIELD.Description]}</td>
                                <td className="text-end">{formatCurrency(row[GAIN_FIELD.Proceeds])}</td>
                                <td className="text-end">{formatCurrency(row[GAIN_FIELD.CostBase])}</td>
                                <td className="text-end">{formatCurrency(row[GAIN_FIELD.Expenses])}</td>
                                <td className={`text-end ${gainClass(gainLoss)}`}>
                                    {formatCurrency(gainLoss)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </div>
    );
};

export default TransactionsTable;
