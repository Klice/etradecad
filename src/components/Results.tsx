import React from 'react';
import { Accordion, Stack } from 'react-bootstrap';
import DataTable from './DataTable';
import { EtradeData, GainsType } from '../utils/GainsCalculator';

interface ResultsProps {
    data: EtradeData[];
    gains: GainsType[] | undefined;
    total: GainsType[] | undefined;
}

const Results: React.FC<ResultsProps> = ({ data, gains, total }) => {
    if (!data || data.length === 0) {
        return <div>No data available</div>;
    }

    return (
        <Stack gap={3}>
            <div className="p-2">
                <Accordion>
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Imported records ({data.length})</Accordion.Header>
                        <Accordion.Body>
                            <DataTable data={data} />
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </div>

            <div className="p-2">
                <h4>Total Gains/Losses in CAD</h4>
                {total && <DataTable data={total} />}
            </div>

            <div className="p-2">
                <h4>Gains/Losses in CAD</h4>
                {gains && <DataTable data={gains} />}
            </div>
        </Stack>
    );
};

export default Results;