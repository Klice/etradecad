import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';

interface FileDropZoneProps {
    onFileSelect: (file: File) => void;
}

const FileDropZone = ({ onFileSelect }: FileDropZoneProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xls') || file.name.endsWith('.xlsx'))) {
            onFileSelect(file);
        }
    };

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div
            className={`drop-zone ${isDragging ? 'drop-zone-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <div className="drop-zone-icon">&#128196;</div>
            <p className="fs-5 mb-1">Drag &amp; drop your Excel file here</p>
            <p className="text-muted small mb-1">.xls and .xlsx supported</p>
            <p className="text-muted mb-0">or click to browse</p>
            <input
                ref={inputRef}
                type="file"
                accept=".xls,.xlsx"
                onChange={handleChange}
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default FileDropZone;
