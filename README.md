# Halal Coin - Islamic Budget Manager

A complete Progressive Web Application (PWA) for managing personal finances with Islamic principles. Features expense tracking, borrow/lend management, Zakat calculation, and beautiful Islamic-inspired design.

## Features

### 🕌 Islamic Design
- Deep green (#0B3B2F) and gold (#D4AF37) color scheme
- Arabic-inspired geometric patterns
- Clean, modern interface with glassmorphism effects
- Responsive design for all devices

### 🔐 Authentication
- Simple login with Name, Mobile Number, and Email
- No email verification required
- "Remember Me" functionality
- Automatic user data backup to Supabase

### 💰 Expense Management
- Add, edit, and delete expenses
- Islamic categories: Food, Transport, Utilities, Shopping, Charity (Sadaqah), Family, Education, Healthcare
- Visual charts for expense breakdown
- Filter by date and category

### 🤝 Borrow/Lend Management
- Track money given to others (lent)
- Track money taken from others (borrowed)
- Person name, amount, date, due date, status
- Separate from expense manager
- Net balance calculation

### 📊 Dashboard
- "ASSALAMUALAIKUM" greeting with user's name
- Total Balance, Expenses, Lent, Borrowed, Net Borrow
- Expense breakdown pie chart
- Monthly trend line chart
- Recent transactions
- Islamic date display

### 📱 PWA Features
- Installable on mobile and desktop
- Offline support with service worker
- Manifest file with Islamic theme
- App icon and splash screen

### ⚙️ Additional Features
- Zakat calculator
- User profile management
- Data export functionality
- Settings (currency, notifications, Islamic calendar)
- Real-time sync with Supabase

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL)
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter, Poppins)
- **Hosting**: Netlify (recommended)
- **PWA**: Service Worker + Manifest

## Database Schema

The application uses three main tables in Supabase:

### Users Table
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Expenses Table
```sql
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Borrow/Lend Table
```sql
CREATE TABLE borrow_lend (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) CHECK (type IN ('lent', 'borrowed')) NOT NULL,
  person_name VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Setup Instructions

### 1. Supabase Setup
1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Run the SQL schema from above in the SQL editor
4. Get your project URL and anon key from Project Settings > API

### 2. Local Development
1. Clone this repository
2. Update `js/config.js` with your Supabase URL and anon key:
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```
3. Serve the files using a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```
4. Open `http://localhost:8000` in your browser

### 3. Netlify Deployment
1. Push your code to a GitHub repository
2. Sign in to [Netlify](https://netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Configure build settings:
   - Build command: (leave empty for static site)
   - Publish directory: `.` (root)
6. Click "Deploy site"
7. Your site will be live at `https://your-site.netlify.app`

### 4. PWA Installation
- **Desktop**: Click the install icon in the address bar (Chrome/Edge)
- **Mobile**: Use "Add to Home Screen" from the browser menu
- The app will work offline after first visit

## File Structure

```
halal-coin/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline support
├── README.md              # This file
├── css/
│   └── style.css          # Main styles with Islamic design
├── js/
│   ├── config.js          # Configuration and utilities
│   ├── auth.js            # Authentication manager
│   ├── dashboard.js       # Dashboard with charts
│   ├── expenses.js        # Expense manager
│   ├── borrowlend.js      # Borrow/Lend manager
│   └── main.js           # Main app initialization
└── assets/                # Icons and images (placeholder)
```

## Usage Guide

### First Time Setup
1. Open the application in your browser
2. Register with your name, mobile number, and email
3. The app will automatically create your account in Supabase

### Adding Expenses
1. Go to the Expenses page
2. Click "Add Expense"
3. Enter amount, category, description, and date
4. Click "Save Expense"

### Managing Borrow/Lend
1. Go to the Borrow/Lend page
2. Switch between "Money Lent" and "Money Borrowed" tabs
3. Click "Add Transaction"
4. Fill in person details, amount, due date, and status
5. Click "Save Transaction"

### Viewing Dashboard
1. The dashboard shows your financial overview
2. View charts for expense breakdown and trends
3. Check your net balance and recent transactions
4. See Islamic date alongside Gregorian date

### Calculating Zakat
1. Go to the Profile page
2. Scroll to the Zakat Calculator section
3. Enter your total savings and gold value
4. Click "Calculate Zakat"
5. View your Zakat obligation (2.5% of wealth above Nisab)

## Customization

### Changing Colors
Edit the CSS variables in `css/style.css`:
```css
:root {
    --primary-color: #0B3B2F;    /* Deep green */
    --secondary-color: #D4AF37;  /* Gold */
    --accent-color: #2E8B57;     /* Sea green */
    --background-color: #F5F0E1; /* Cream */
    /* ... */
}
```

### Adding Categories
Update the categories in `js/config.js`:
```javascript
categories: [
    'Food',
    'Transport',
    'Utilities',
    'Shopping',
    'Charity',
    'Family',
    'Education',
    'Healthcare',
    'Your New Category'  // Add here
],
```

### Changing Currency
Update the currency in `js/config.js`:
```javascript
currency: '₹', // Change to '$', '€', '£', etc.
```

## Security Notes

- User data is stored securely in Supabase PostgreSQL
- No sensitive financial data is stored locally
- All API calls use Supabase's secure authentication
- The app follows Islamic financial principles
- Users can export their data at any time

## Browser Support

- Chrome 50+ (recommended)
- Firefox 54+
- Safari 11.1+
- Edge 79+
- Opera 41+

## Mobile Support

- iOS 11.3+ (Safari)
- Android 5+ (Chrome)
- All modern PWA-capable browsers

## License

This project is created for educational and personal use. Feel free to modify and distribute with proper attribution.

## Acknowledgments

- Design inspired by Islamic geometric patterns
- Built with Islamic financial principles in mind
- Thanks to the Supabase team for the excellent backend platform
- Chart.js for beautiful data visualization

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify Supabase credentials in `js/config.js`
3. Ensure database tables are created correctly
4. Clear browser cache and reload

---

**بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ**  
*In the name of Allah, the Most Gracious, the Most Merciful*

May this application help you manage your finances in accordance with Islamic principles and bring barakah to your wealth.