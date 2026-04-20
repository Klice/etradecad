import { Table } from 'react-bootstrap';
import RateLink from './RateLink';
import type { ExchangeRate } from '../utils/GainsCalculator';
import { formatDate } from '../utils/format';

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
                    <th className="text-end">USD &rarr; CAD Rate</th>
                </tr>
            </thead>
            <tbody>
                {rates.map((r) => {
                    const lookback = r.date !== r.rateDate;
                    return (
                        <tr key={r.date}>
                            <td>
                                {formatDate(r.date)}
                                {lookback && <span className="text-muted ms-1 small">(rate from {formatDate(r.rateDate)})</span>}
                            </td>
                            <td className="text-end" style={{ fontFamily: "'Courier New', monospace" }}>
                                <RateLink rate={r} />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
};

export default ExchangeRatesTable;
