import { CheckCircleFill } from 'react-bootstrap-icons';

interface CopyButtonProps {
    copied: boolean;
    onClick: () => void;
}

const CopyButton = ({ copied, onClick }: CopyButtonProps) => (
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

export default CopyButton;
