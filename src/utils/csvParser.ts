import Papa from "papaparse";

export const parseCsv = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const results = Papa.parse(event.target?.result as string, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    const rowsArray = [];
                    const valuesArray = [];
                    results.data.map((d) => {
                        rowsArray.push(Object.keys(d as string));
                        valuesArray.push(Object.values(d as string));
                    });
                },
            });
            resolve(results.data)
        };

        reader.onerror = () => {
            reject(new Error('Error reading the file'));
        };

        reader.readAsText(file);
    });
};