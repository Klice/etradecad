import { Table } from 'react-bootstrap';
import { CSVLink } from 'react-csv';
import type { GainsType } from '../utils/GainsCalculator';
import { formatCurrency } from '../utils/currency';

interface TransactionsTableProps {
    data: GainsType[];
}

const TransactionsTable = ({ data }: TransactionsTableProps) => {
    if (!data || data.length === 0) {
        return <div>No data available</div>;
    }

    const showPeriod = new Set(data.map(r => r['Period'].toString())).size > 1;

    return (
        <div>
            <div className="mb-3 text-end">
                <CSVLink className="btn btn-sm btn-outline-primary" data={data}>
                    Download CSV
                </CSVLink>
            </div>
            <Table striped bordered hover size="sm" className="transactions-table">
                <thead>
                    <tr>
                        <th>#</th>
                        {showPeriod && <th>Period</th>}
                        <th>Description</th>
                        <th className="text-end">Proceeds</th>
                        <th className="text-end">Cost base</th>
                        <th className="text-end">Expenses</th>
                        <th className="text-end">Gain (Loss)</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => {
                        const gainLoss = row['Gain (loss)'] as number;
                        const gainClass = gainLoss >= 0 ? 'gain-positive' : 'gain-negative';
                        return (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                {showPeriod && <td>{String(row['Period'])}</td>}
                                <td>{row['Description']}</td>
                                <td className="text-end">{formatCurrency(row['Proceeds'] as number)}</td>
                                <td className="text-end">{formatCurrency(row['Cost base'] as number)}</td>
                                <td className="text-end">{formatCurrency(row['Expenses'] as number)}</td>
                                <td className={`text-end ${gainClass}`}>
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
