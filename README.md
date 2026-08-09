# Trip Balance

A modern, responsive web application for tracking travel expenses. Keep all your trip expenses organized and easily manage your travel budget.

## Features

- **Trip Management**: Set trip name, start date, end date, and trip currency
- **Expense Tracking**: Add expenses with description, amount, category, and date (currency uses trip currency)
- **Multi-Currency Support**: Choose from multiple currencies (USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, MYR)
- **Category Organization**: Organize expenses by categories (Food & Dining, Transport, Accommodation, Activities, Shopping, Other)
- **Filtering**: Filter expenses by category
- **Summary Statistics**: View total expenses, count, average per expense, and category breakdown (all in trip currency)
- **Data Export**: Export expenses to CSV format
- **Persistent Storage**: All data saved in Firebase Firestore (cloud-based, real-time sync)
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Project Structure

```
TripBalance/
├── index.html          # Main HTML file with structure and layout
├── styles.css          # CSS styling and responsive design
├── app.js              # JavaScript logic and data management
├── firebase-config.js  # Firebase configuration
├── README.md           # Project documentation (this file)
└── AGENTS.md           # AI agent instructions
```

## File Descriptions

### index.html
The main HTML file containing:
- Semantic HTML5 structure
- Trip details form (name, start date, end date, currency) with save button
- Expense entry form (description, amount, category, date)
- Expenses list with category filtering
- Summary cards showing totals and statistics
- Action buttons for export and clear all

### styles.css
Complete CSS styling including:
- CSS custom properties (variables) for easy theming
- Modern card-based layout
- Responsive grid system
- Form styling with focus states
- Expense item cards with hover effects
- Summary statistics cards
- Category color coding
- Mobile-responsive design (breakpoint at 640px)
- Custom scrollbar styling

### app.js
JavaScript application logic organized into:
- **DataStore**: Firestore integration for data persistence
- **CurrencyUtils**: Currency formatting and symbol management
- **CategoryUtils**: Category information and organization
- **UI Controller**: DOM manipulation, event handling, and rendering

### firebase-config.js
Firebase configuration file containing:
- Firebase project configuration
- Firestore initialization
- Connection to your Firebase project

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser

### Installation
1. Clone or download the project files
2. Open `index.html` in your web browser
3. Start adding your trip expenses!

### Usage
1. **Set Trip Details**: Enter your trip name, dates, and select the trip currency, then click "Save Trip Details"
2. **Add Expenses**: Fill in the expense form with description, amount, category, and date (currency is automatically set to trip currency)
3. **View Expenses**: See all your expenses in the list below
4. **Filter**: Use the category dropdown to filter expenses
5. **Track Summary**: Monitor your total spending and category breakdown (all amounts shown in trip currency)
6. **Export**: Download your expenses as a CSV file for spreadsheets
7. **Clear**: Remove all expenses if needed (use with caution)

## Data Storage

This project uses Firebase Firestore for cloud-based data persistence:
- **trips** collection: Stores trip details (name, dates, currency)
- **expenses** collection: Stores all expense records

### Firestore Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** in the left sidebar
4. Click **Create Database**
5. Choose a location for your database
6. Select **Start in test mode** (for development)
7. Click **Enable**

### Firestore Security Rules (Development)

For development, you can use these rules in Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Note:** These rules allow public access. For production, implement proper authentication and security rules.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License

This project is open source and available for personal and commercial use.

## Contact

For questions or feedback about Trip Balance, please open an issue in the repository.
