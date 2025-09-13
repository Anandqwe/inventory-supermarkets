# Frontend README

## Supermarket Inventory & Sales Management - Frontend

This is the frontend application for the supermarket inventory and sales management system.

### Tech Stack
- React 18
- Vite (Build tool)
- Tailwind CSS (Styling)
- React Router (Navigation)
- Lucide React (Icons)
- Axios (API calls)

### Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API URL
```

3. Start development server:
```bash
npm run dev
```

4. Open your browser:
```
http://localhost:3000
```

### Project Structure
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Route components
│   ├── App.jsx        # Main app component
│   ├── main.jsx       # Entry point
│   └── index.css      # Global styles
├── public/            # Static assets
├── package.json       # Dependencies
└── vite.config.js     # Vite configuration
```

### Features
- **Dashboard**: Overview of key metrics and quick actions
- **Products**: Inventory management with CRUD operations
- **Sales**: Transaction recording and management
- **Reports**: Analytics and PDF report generation
- **Responsive Design**: Mobile-friendly interface

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables
- `VITE_API_BASE_URL`: Backend API base URL

### Routing
- `/login` - User authentication
- `/` - Dashboard (home)
- `/products` - Product management
- `/sales` - Sales management
- `/reports` - Reports and analytics
