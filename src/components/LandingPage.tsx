import FileDropZone from './FileDropZone';

const ExternalLinkIcon = () => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="currentColor"
        style={{ verticalAlign: '-0.05em' }}
    >
        <path d="M3.5 1a.5.5 0 0 0 0 1H5.3L1.15 6.15a.5.5 0 0 0 .7.7L6 2.71V4.5a.5.5 0 0 0 1 0v-4a.5.5 0 0 0-.5-.5h-3zM1 3.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 1 0 1H1.5v6h6V8a.5.5 0 0 1 1 0v2.5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-7z" />
    </svg>
);

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
                        <li className="mb-2">Log in to <a href="https://us.etrade.com" target="_blank" rel="noopener noreferrer"><strong>us.etrade.com</strong>&nbsp;<ExternalLinkIcon /></a></li>
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
