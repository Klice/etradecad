import { Accordion, Table } from 'react-bootstrap';
import { BoxArrowUpRight } from 'react-bootstrap-icons';
import { CSVLink } from 'react-csv';
import { ETRADE_FIELD, GAIN_FIELD, type EtradeData, type ExchangeRate, type GainsType } from '../utils/GainsCalculator';
import { formatCurrency, formatDate, gainClass } from '../utils/format';
import { formatMoney, moneyFromString, ZERO } from '../utils/money';

const bocUrl = (date: string) =>
    `https://www.bankofcanada.ca/rates/exchange/daily-exchange-rates-lookup/?lookupPage=lookup_daily_exchange_rates_2017.php&startRange=2017-01-01&series%5B%5D=FXUSDCAD&lookupPage=lookup_daily_exchange_rates_2017.php&startRange=2017-01-01&rangeType=range&rangeValue=&dFrom=${date}&dTo=&submit_button=Submit`;

const RateLink = ({ rate }: { rate: ExchangeRate }) => (
    <a href={bocUrl(rate.rateDate)} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
        {formatMoney(rate.rate, { decimals: 4 })} <BoxArrowUpRight size={10} className="text-muted" />
    </a>
);

interface CalculationBreakdownProps {
    sales: EtradeData[];
    gains: GainsType[];
    exchangeRates: ExchangeRate[];
}

const findRate = (rates: ExchangeRate[], dateStr: string): ExchangeRate | undefined => {
    const date = new Date(dateStr);
    const iso = date.toISOString().split('T')[0];
    return rates.find(r => r.date === iso);
};

const toCsvRow = (sale: EtradeData, gain: GainsType | undefined, rates: ExchangeRate[]) => {
    const proceedsUsd = moneyFromString(sale[ETRADE_FIELD.TotalProceeds]) ?? ZERO;
    const costBaseUsd = moneyFromString(sale[ETRADE_FIELD.AdjustedCostBasis]) ?? ZERO;
    const rateSold = findRate(rates, sale[ETRADE_FIELD.DateSold]);
    const rateAcquired = findRate(rates, sale[ETRADE_FIELD.DateAcquired]);
    return {
        'Symbol': sale[ETRADE_FIELD.Symbol],
        'Plan Type': sale[ETRADE_FIELD.PlanType],
        'Date Acquired': formatDate(sale[ETRADE_FIELD.DateAcquired]),
        'Cost Basis (USD)': formatMoney(costBaseUsd, { decimals: 2 }),
        'Rate Date (Acquired)': rateAcquired?.rateDate ?? '',
        'Exchange Rate (Acquired)': rateAcquired ? formatMoney(rateAcquired.rate, { decimals: 4 }) : '',
        'Cost Base (CAD)': gain ? formatMoney(gain[GAIN_FIELD.CostBase], { decimals: 2 }) : '',
        'Date Sold': formatDate(sale[ETRADE_FIELD.DateSold]),
        'Proceeds (USD)': formatMoney(proceedsUsd, { decimals: 2 }),
        'Rate Date (Sold)': rateSold?.rateDate ?? '',
        'Exchange Rate (Sold)': rateSold ? formatMoney(rateSold.rate, { decimals: 4 }) : '',
        'Proceeds (CAD)': gain ? formatMoney(gain[GAIN_FIELD.Proceeds], { decimals: 2 }) : '',
        'Gain/Loss (CAD)': gain ? formatMoney(gain[GAIN_FIELD.GainLoss], { decimals: 2 }) : '',
    };
};

const CalculationBreakdown = ({ sales, gains, exchangeRates }: CalculationBreakdownProps) => {
    const csvData = sales.map((sale, i) => toCsvRow(sale, gains[i], exchangeRates));

    return (
        <div>
            <div className="mb-3 text-end">
                <CSVLink className="btn btn-sm btn-outline-primary" data={csvData} filename="calculation-breakdown.csv">
                    Download CSV
                </CSVLink>
            </div>
            <Accordion>
            {sales.map((sale, i) => {
                const gain = gains[i];
                const proceedsUsd = moneyFromString(sale[ETRADE_FIELD.TotalProceeds]) ?? ZERO;
                const costBaseUsd = moneyFromString(sale[ETRADE_FIELD.AdjustedCostBasis]) ?? ZERO;
                const rateSold = findRate(exchangeRates, sale[ETRADE_FIELD.DateSold]);
                const rateAcquired = findRate(exchangeRates, sale[ETRADE_FIELD.DateAcquired]);

                return (
                    <Accordion.Item eventKey={String(i)} key={i}>
                        <Accordion.Header>
                            <span className="d-flex w-100 align-items-center">
                                <span className="text-muted" style={{ width: '2rem' }}>#{i + 1}</span>
                                <span style={{ width: '7rem' }}>{sale[ETRADE_FIELD.Symbol]} {sale[ETRADE_FIELD.PlanType]}</span>
                                <span className="text-muted">
                                    sold {formatDate(sale[ETRADE_FIELD.DateSold])}
                                </span>
                                {gain && (
                                    <span className={`ms-auto me-2 fw-semibold ${gainClass(gain[GAIN_FIELD.GainLoss])}`}>
                                        {formatCurrency(gain[GAIN_FIELD.GainLoss])}
                                    </span>
                                )}
                            </span>
                        </Accordion.Header>
                        <Accordion.Body>
                            <Table size="sm" bordered className="transactions-table mb-0">
                                <tbody>
                                    <tr>
                                        <td colSpan={3} className="text-muted fw-semibold bg-light">Proceeds</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Total Proceeds (USD)</td>
                                        <td colSpan={2}>{formatMoney(proceedsUsd, { decimals: 2, grouping: true })}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Date Sold</td>
                                        <td colSpan={2}>
                                            {formatDate(sale[ETRADE_FIELD.DateSold])}
                                            {rateSold && rateSold.date !== rateSold.rateDate && (
                                                <span className="text-muted small ms-1">(rate from {formatDate(rateSold.rateDate)})</span>
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Exchange Rate ({rateSold ? formatDate(rateSold.rateDate) : 'N/A'})</td>
                                        <td colSpan={2}>{rateSold ? <RateLink rate={rateSold} /> : 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Proceeds (CAD)</td>
                                        <td>{formatMoney(proceedsUsd, { decimals: 2, grouping: true })} &times; {rateSold ? formatMoney(rateSold.rate, { decimals: 4 }) : '?'}</td>
                                        <td className="fw-semibold">{gain ? formatCurrency(gain[GAIN_FIELD.Proceeds]) : 'N/A'}</td>
                                    </tr>

                                    <tr>
                                        <td colSpan={3} className="text-muted fw-semibold bg-light">Cost Base</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Adjusted Cost Basis (USD)</td>
                                        <td colSpan={2}>{formatMoney(costBaseUsd, { decimals: 2, grouping: true })}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Date Acquired</td>
                                        <td colSpan={2}>
                                            {formatDate(sale[ETRADE_FIELD.DateAcquired])}
                                            {rateAcquired && rateAcquired.date !== rateAcquired.rateDate && (
                                                <span className="text-muted small ms-1">(rate from {formatDate(rateAcquired.rateDate)})</span>
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Exchange Rate ({rateAcquired ? formatDate(rateAcquired.rateDate) : 'N/A'})</td>
                                        <td colSpan={2}>{rateAcquired ? <RateLink rate={rateAcquired} /> : 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Cost Base (CAD)</td>
                                        <td>{formatMoney(costBaseUsd, { decimals: 2, grouping: true })} &times; {rateAcquired ? formatMoney(rateAcquired.rate, { decimals: 4 }) : '?'}</td>
                                        <td className="fw-semibold">{gain ? formatCurrency(gain[GAIN_FIELD.CostBase]) : 'N/A'}</td>
                                    </tr>

                                    <tr>
                                        <td colSpan={3} className="text-muted fw-semibold bg-light">Result</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Gain (Loss) CAD</td>
                                        <td>{gain ? `${formatCurrency(gain[GAIN_FIELD.Proceeds])} \u2212 ${formatCurrency(gain[GAIN_FIELD.CostBase])}` : ''}</td>
                                        <td className={`fw-semibold ${gain ? gainClass(gain[GAIN_FIELD.GainLoss]) : ''}`}>
                                            {gain ? formatCurrency(gain[GAIN_FIELD.GainLoss]) : 'N/A'}
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Accordion.Body>
                    </Accordion.Item>
                );
            })}
            </Accordion>
        </div>
    );
};

export default CalculationBreakdown;
