import { BoxArrowUpRight } from 'react-bootstrap-icons';
import { bocLookupUrl } from '../utils/boc';
import type { ExchangeRate } from '../utils/GainsCalculator';
import { formatMoney } from '../utils/money';

interface RateLinkProps {
    rate: ExchangeRate;
}

const RateLink = ({ rate }: RateLinkProps) => (
    <a href={bocLookupUrl(rate.rateDate)} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
        {formatMoney(rate.rate, { decimals: 4 })}&nbsp;<BoxArrowUpRight size={10} className="text-muted" />
    </a>
);

export default RateLink;
