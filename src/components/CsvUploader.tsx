import React from 'react';

interface CsvUploaderProps {
    onFileUpload: (file: File) => void;
}


const CsvUploader: React.FC<CsvUploaderProps> = ({ onFileUpload }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileUpload(file);
        }
    };

    return (
        <div className="container mt-4">
            <div className="mb-3">
                <label htmlFor="csvFile" className="form-label">
                    Upload eTrade Gain/Losses in CSV format
                </label>
                <input
                    type="file"
                    className="form-control"
                    id="csvFile"
                    accept=".csv"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
};

export default CsvUploader;