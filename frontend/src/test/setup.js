import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock Chart.js
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  BarElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
}));

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Bar: vi.fn(() => <div data-testid="bar-chart">Bar Chart</div>),
  Line: vi.fn(() => <div data-testid="line-chart">Line Chart</div>),
  Pie: vi.fn(() => <div data-testid="pie-chart">Pie Chart</div>),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
    }),
  };
});

// Environment variables for testing
Object.defineProperty(window, 'import.meta', {
  value: {
    env: {
      VITE_API_URL: 'http://localhost:5000/api',
      VITE_APP_NAME: 'Test App',
      VITE_DEFAULT_THEME: 'light',
    },
  },
});

// localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

// sessionStorage mock
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});