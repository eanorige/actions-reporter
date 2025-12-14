# GitHub Actions Reporter

This is a Next.js application that allows you to upload a CSV file of your GitHub Actions history and view a report of the actions.

## Features

- Upload a CSV file of your GitHub Actions history.
- View a summary of the actions, separated by branch.
- View a chart of the actions over time.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How to Use

1.  Export your GitHub Actions history as a CSV file.
2.  Click the "Choose File" button to select the CSV file.
3.  The application will parse the file and display a report of the actions.

## Built With

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [recharts](https://recharts.org/)
- [papaparse](https://www.papaparse.com/)
