# eTrade Gains/Losses USD to CAD Converter

A single-page application that converts eTrade gain/loss reports from USD to CAD using Bank of Canada exchange rates.

## Features

- Upload eTrade Gain/Loss CSV exports
- Automatically fetch USD/CAD exchange rates from the Bank of Canada
- Calculate gains/losses in CAD grouped by configurable tax periods
- Export results as CSV

## Tech Stack

- **React** 19 with **TypeScript** 5
- **Vite** 6 — build tool and dev server
- **React Bootstrap** 2 — UI components
- **PapaParse** — CSV parsing
- **react-csv** — CSV export

## Prerequisites

- Node.js 20+
- npm 10+

## Getting Started

1. Clone the repository:

   ```
   git clone https://github.com/Klice/etradecad.git
   ```

2. Navigate to the project directory:

   ```
   cd etradecad
   ```

3. Install the dependencies:

   ```
   npm install
   ```

### Running the Application

To start the application in development mode, run:

```
npm start
```

The application will be available at `http://localhost:3000`.

### Building for Production

To create a production build, run:

```
npm run build
```

This will generate a `dist` folder with the optimized application.

## Usage

1. Export your Gain/Loss report from eTrade as a CSV file.
2. Upload the CSV file using the file input.
3. The app fetches exchange rates and calculates gains/losses in CAD.
4. Review results by period or download as CSV.

## Contributing

Feel free to submit issues or pull requests for improvements and bug fixes.

## License

This project is licensed under the MIT License.
