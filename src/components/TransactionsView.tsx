import { Table } from 'react-bootstrap';
import CopyButton from './CopyButton';
import { GAIN_FIELD, type GainsType } from '../utils/GainsCalculator';
import { formatCurrency, gainClass } from '../utils/format';

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

export default TransactionsView;
