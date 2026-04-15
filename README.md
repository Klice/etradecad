# eTrade Gains/Losses USD to CAD Converter

A single-page application that converts eTrade gain/loss reports from USD to CAD using Bank of Canada exchange rates. Designed for Canadian tax filers who need to report capital gains from US stock plans.

## Features

- Upload eTrade Gain/Loss exports (.xls, .xlsx)
- Automatically fetch USD/CAD exchange rates from the Bank of Canada
- Calculate gains/losses in CAD, formatted to match CRA Schedule 3
- Data verification with cross-check against the spreadsheet summary row
- View loaded exchange rates and imported data for transparency
- Export results as CSV

## Tech Stack

- **React** 19 with **TypeScript** 5
- **Vite** 6 — build tool and dev server
- **React Bootstrap** 2 — UI components
- **read-excel-file** — Excel (.xls/.xlsx) parsing
- **date-fns** — date utilities
- **react-csv** — CSV export
- **Vitest** — unit testing

## Prerequisites

- Node.js 20+
- npm 10+

## Getting Started

1. Clone the repository:

   ```
   git clone https://github.com/Klice/etradecad.git
   cd etradecad
   ```

2. Install dependencies and start the dev server:

   ```
   npm install
   npm start
   ```

The application will be available at `http://localhost:3000`.

### Building for Production

```
npm run build
```

This will generate a `dist` folder with the optimized application.

### Running Tests

```
npm test
```

## Usage

1. Log in to **us.etrade.com** and navigate to **Stock Plan** > **My Account** > **Gains & Losses**.
2. Select the tax year and click **Apply**.
3. Click the **Download** dropdown and select **Download Expanded** to save the .xlsx file.
4. Upload the file to the app using drag-and-drop or the file picker.
5. Review the CRA Schedule 3 summary and verify data integrity in the verification panel.
6. Download the results as CSV.

A sample file is available in [`examples/sample_gains_losses.xlsx`](examples/sample_gains_losses.xlsx).

## Contributing

Feel free to submit issues or pull requests for improvements and bug fixes.

## License

This project is licensed under the MIT License.
