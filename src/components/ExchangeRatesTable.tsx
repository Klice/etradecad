import { Table } from 'react-bootstrap';
import { BoxArrowUpRight } from 'react-bootstrap-icons';
import type { ExchangeRate } from '../utils/GainsCalculator';
import { formatDate } from '../utils/format';
import { formatMoney } from '../utils/money';

const bocUrl = (date: string) =>
    `https://www.bankofcanada.ca/rates/exchange/daily-exchange-rates-lookup/?lookupPage=lookup_daily_exchange_rates_2017.php&startRange=2017-01-01&series%5B%5D=FXUSDCAD&lookupPage=lookup_daily_exchange_rates_2017.php&startRange=2017-01-01&rangeType=range&rangeValue=&dFrom=${date}&dTo=&submit_button=Submit`;

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
                                <a
                                    href={bocUrl(r.rateDate)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-decoration-none"
                                >
                                    {formatMoney(r.rate, { decimals: 4 })}
                                    &nbsp;<BoxArrowUpRight size={10} className="text-muted" />
                                </a>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
};

export default ExchangeRatesTable;
