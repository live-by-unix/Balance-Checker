# Balance Checker

A personal digital checkbook and transaction ledger that helps you track payments, deposits, and running balances with modern analytics.

## Features

- **Transaction Management**: Record payments/debits and deposits/credits with optional check numbers and categories
- **Running Balance**: Automatically calculates and displays your account balance over time
- **Financial Analytics**: Visual charts for balance trends, deposits vs payments, cash flow, and spending breakdown
- **Search & Filter**: Find transactions quickly with search, filters, and sorting options
- **Import/Export**: Backup your data with JSON or export to CSV for spreadsheet compatibility
- **Dark/Light Mode**: Beautiful themes that respect your system preferences
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Offline-First**: All data stored locally in your browser using IndexedDB
- **PWA Support**: Install as a progressive web app on mobile and desktop
- **No Account Required**: Complete privacy with no authentication or cloud storage

## Technology

- **HTML5**: Semantic markup for accessibility
- **CSS3**: Custom design system with CSS variables for theming
- **Vanilla JavaScript**: No frameworks - pure, performant code
- **IndexedDB**: Browser-native database for persistent storage
- **Chart.js**: Lightweight charting library for analytics

## Running Locally

1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. No build process or server required

```bash
# If using a local server (optional)
python -m http.server 8000
# Then visit http://localhost:8000
```

## Deployment

Balance Checker is a static application and can be deployed to any static hosting service:

- **GitHub Pages**: Push to a repository and enable Pages in settings
- **Netlify**: Drag and drop the folder or connect to Git
- **Vercel**: Import from Git or deploy via CLI
- **Cloudflare Pages**: Connect to Git or upload via direct upload
- **Any web server**: Upload files to any web hosting service

## Data Storage

**Important**: Balance Checker stores all financial data locally in your browser using IndexedDB. This means:

- **Privacy**: Your data never leaves your device
- **Offline Access**: Works without an internet connection
- **No Backend**: No server costs or dependencies
- **Data Persistence**: Data remains in your browser until cleared

**Warning**: If you clear your browser data or use incognito/private browsing mode, your data may be lost. Always export regular backups.

## Import/Export

### Export Data

- **JSON Backup**: Complete backup including transactions, starting balance, and metadata
- **CSV Export**: Spreadsheet-compatible format for external analysis

### Import Data

- **JSON Import**: Restore from a previous backup
- **Merge Option**: Import new transactions without overwriting existing data
- **Validation**: File format validation prevents data corruption

## Privacy Information

Balance Checker is designed with privacy in mind:

- No user accounts or authentication
- No cloud storage or data transmission
- No analytics or tracking
- No third-party services
- All data remains on your device
- Open source code for full transparency

**Disclaimer**: This is a personal ledger tool for manual transaction entry. It does not connect to real bank accounts or financial institutions. Always verify your balances against official bank statements.

## Usage Guide

### Getting Started

1. **Set Starting Balance**: Go to Settings and enter your initial account balance
2. **Add Transactions**: Click "Do a Transaction" to record your first entry
3. **View Analytics**: Visit the Transactions page to see charts and history

### Recording Transactions

1. Click "Do a Transaction" from the dashboard
2. Enter transaction name (required)
3. Add optional check number
4. Select date or use "Today" button
5. Choose category (optional)
6. Enter payment OR deposit amount
7. See live balance preview
8. Click "Save Transaction"

### Managing Transactions

- **Edit**: Click the edit icon in the transactions table
- **Delete**: Click the delete icon (requires confirmation)
- **Search**: Use the search box to find specific transactions
- **Filter**: Filter by type (deposits/payments) or date range
- **Sort**: Sort by date, amount, or name

### Analytics

- **Balance Over Time**: Line chart showing account balance trends
- **Deposits vs Payments**: Monthly comparison bar chart
- **Cash Flow**: Monthly net change visualization
- **Spending Breakdown**: Category-based payment distribution (pie chart)

### Settings

- **Starting Balance**: Set or change your initial balance
- **Theme**: Switch between light and dark mode
- **Export**: Download CSV or JSON backups
- **Import**: Restore from previous backups
- **Clear Data**: Reset the application (requires confirmation)

## Browser Compatibility

Works in all modern browsers that support:

- IndexedDB (for data storage)
- CSS Variables (for theming)
- ES6+ JavaScript
- Canvas API (for charts)

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## File Structure

```
balance-checker/
├── index.html          # Main application HTML
├── css/
│   └── styles.css      # Complete styling with design system
├── js/
│   ├── app.js          # Main application logic
│   ├── db.js           # IndexedDB operations
│   ├── calculations.js # Financial calculations
│   ├── charts.js       # Chart.js integration
│   ├── import-export.js # Data import/export
│   └── ui.js           # UI utilities and navigation
└── README.md           # This file
```

## Currency Handling

All monetary values are stored as integer cents to avoid floating-point errors:

- Internal storage: `8241` (representing $82.41)
- Display: Formatted using `Intl.NumberFormat` for proper currency formatting
- Input: Parsed from user input with validation

## Security Considerations

- Input validation on all forms
- XSS prevention through proper escaping
- No external script loading except Chart.js CDN
- HTTPS recommended for deployment (though not required)

## Troubleshooting

**Data not appearing after refresh?**
- Ensure you're not in incognito/private browsing mode
- Check that browser storage is not being cleared
- Try exporting a backup and re-importing

**Charts not displaying?**
- Ensure Chart.js CDN is accessible
- Check browser console for errors
- Verify you have sufficient transaction data

**Theme not persisting?**
- Check that localStorage is enabled in your browser
- Clear browser cache and reload

## License

This project is open source and available for personal and commercial use.

## Support

For issues, questions, or contributions, please refer to the project repository.
