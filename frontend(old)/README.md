# Fintech Platform - Frontend Application

A modern, professional fintech web application built with React JS. This frontend-only application provides a complete banking and finance platform UI with no hardcoded data.

## 🚀 Features

- **Landing Page** - Public-facing page with hero section, status cards, and announcements
- **Dashboard** - Main dashboard with broadcast updates and portfolio overview
- **Transaction Log** - Comprehensive transaction table with search and filter capabilities
- **Wallet** - Wallet management with balance, growth charts, and credit score
- **Banker Portal** - Role-based banker page with lending system, assets, and transactions

## 🎨 Design

- **Theme**: Banking + Finance + Currency + Digital Assets
- **Color Palette**: Navy Blue (primary), Emerald Green (secondary), Gold/Teal (accents)
- **Typography**: Inter & Poppins fonts
- **Style**: Professional fintech dashboard with modern UI/UX

## 🛠️ Tech Stack

- React 18.2.0
- React Router DOM 6.20.0
- Recharts 2.10.3 (for data visualization)
- Vite 5.0.8 (build tool)

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## 📁 Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Navbar.jsx          # Top navigation bar
│   │   ├── Sidebar.jsx          # Left sidebar navigation
│   │   ├── Card.jsx             # Reusable card component
│   │   ├── Table.jsx            # Data table with search/filter
│   │   └── Chart.jsx            # Chart component (Recharts)
│   ├── dashboard/
│   ├── wallet/
│   ├── transactions/
│   └── banker/
├── pages/
│   ├── Landing.jsx              # Landing page (/)
│   ├── Dashboard.jsx            # Main dashboard (/dashboard)
│   ├── Wallet.jsx               # Wallet page (/wallet)
│   ├── Transactions.jsx         # Transactions page (/transactions)
│   └── Banker.jsx               # Banker page (/banker)
├── context/
│   └── AppContext.jsx           # Global state management
├── App.jsx                      # Main app component with routing
└── main.jsx                     # Entry point
```

## 🔑 Key Features

### No Hardcoded Data
- All data comes from `AppContext` (mockData)
- Data can be easily replaced with API calls
- Props-driven components for maximum reusability

### Role-Based Access
- Banker page shows locked sections for non-banker users
- Visual indicators for restricted content
- Frontend-only role management (ready for backend integration)

### Responsive Design
- Mobile-friendly layouts
- Adaptive grid systems
- Touch-friendly interactions

## 🎯 Usage

### Adding Mock Data

**Option 1: Use Sample Data**

Import and initialize sample data in `src/context/AppContext.jsx`:

```javascript
import { sampleMockData } from '../data/mockData'

// In AppProvider component, replace initial state:
const [mockData, setMockData] = useState(sampleMockData)
```

**Option 2: Manual Setup**

Update `src/context/AppContext.jsx` to add custom mock data:

```javascript
const [mockData, setMockData] = useState({
  landing: {
    hero: { title: '...', subtitle: '...' },
    statusCards: { approved: 10, pending: 5, requested: 3 },
    broadcasts: [...]
  },
  // ... other sections
})
```

See `src/data/mockData.js` for complete data structure examples.

### Connecting to Backend

Replace mock data calls in components with API calls:

```javascript
// Example: In Dashboard.jsx
useEffect(() => {
  fetch('/api/dashboard')
    .then(res => res.json())
    .then(data => updateMockData('dashboard', data))
}, [])
```

## 📝 Routes

- `/` - Landing page
- `/dashboard` - Main dashboard (requires login)
- `/wallet` - Wallet management
- `/transactions` - Transaction log
- `/banker` - Banker portal (role-based)

## 🎨 Customization

### Colors
Edit CSS variables in `src/index.css`:

```css
:root {
  --primary-navy: #1e3a5f;
  --secondary-emerald: #10b981;
  --accent-gold: #f59e0b;
  /* ... */
}
```

### Fonts
Change font imports in `index.html` and update `font-family` in CSS.

## 📄 License

This project is created for educational and hackathon purposes.

## 👨‍💻 Development

Built with ❤️ using React and modern web technologies.

