import React from 'react';
import { Table } from 'react-bootstrap';

interface DataTableProps {
    data: Array<any>;
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div>No data available</div>;
    }

    const headers = Object.keys(data[0]);

    return (
        <Table striped bordered hover>
            <thead>
                <tr>
                    {headers.map((header) => (
                        <th scope="col" key={header}>{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, index) => (
                    <tr key={index}>
                        {headers.map((header) => (
                            <td key={header}>{row[header]}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};

export default DataTable;