import React from 'react';
import { Table } from 'react-bootstrap';
import { CSVLink } from 'react-csv';

interface DataTableProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Array<any>;
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div>No data available</div>;
    }

    const headers = Object.keys(data[0]);

    return (

        <div>
            <div className="mb-3">
                <CSVLink className="btn btn-info" data={data}>Download CSV</CSVLink>
            </div>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>#</th>
                        {headers.map((header) => (
                            <th scope="col" key={header}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index}>
                            <th>{index + 1}</th>
                            {headers.map((header) => (
                                <td key={header}>{row[header].toString()}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default DataTable;