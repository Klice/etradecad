import { Table } from 'react-bootstrap';
import type { ExchangeRate } from '../utils/GainsCalculator';

interface ExchangeRatesTableProps {
    rates: ExchangeRate[];
}

const ExchangeRatesTable = ({ rates }: ExchangeRatesTableProps) => {
    if (rates.length === 0) {
        return <div>No exchange rates loaded</div>;
    }

    return (
        <Table striped bordered hover size="sm" className="transactions-table mb-0">
            <thead>
                <tr>
                    <th>Date</th>
                    <th className="text-end">USD/CAD Rate</th>
                </tr>
            </thead>
            <tbody>
                {rates.map((r) => (
                    <tr key={r.date}>
                        <td>{r.date}</td>
                        <td className="text-end" style={{ fontFamily: "'Courier New', monospace" }}>
                            {r.rate.toFixed(4)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};

export default ExchangeRatesTable;
