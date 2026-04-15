import { BoxArrowUpRight } from 'react-bootstrap-icons';
import FileDropZone from './FileDropZone';

interface LandingPageProps {
    onFileSelect: (file: File) => void;
}

const LandingPage = ({ onFileSelect }: LandingPageProps) => {
    return (
        <div className="container landing-container">
            <div className="py-5 text-center">
                <h1 className="mb-2">eTrade Gains/Losses</h1>
                <p className="text-muted fs-5">USD to CAD Converter</p>
            </div>

            <div className="card instructions-card mb-4">
                <div className="card-body">
                    <h5 className="card-title mb-3">How to download your Gain/Loss file</h5>
                    <ol className="mb-0">
                        <li className="mb-2">Log in to <a href="https://us.etrade.com" target="_blank" rel="noopener noreferrer"><strong>us.etrade.com</strong></a>&nbsp;<BoxArrowUpRight size={12} className="text-muted" style={{ position: 'relative', top: '-1px' }} /></li>
                        <li className="mb-2">Navigate to <strong>Stock Plan</strong> &rarr; <strong>My Account</strong> &rarr; <strong>Gains &amp; Losses</strong></li>
                        <li className="mb-2">Select the tax year and click <strong>&quot;Apply&quot;</strong></li>
                        <li className="mb-2">Click the <strong>&quot;Download&quot;</strong> dropdown</li>
                        <li className="mb-0">Select <strong>&quot;Download Expanded&quot;</strong> to save the file (.xlsx)</li>
                    </ol>
                </div>
            </div>

            <FileDropZone onFileSelect={onFileSelect} />
        </div>
    );
};

export default LandingPage;
