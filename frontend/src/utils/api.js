import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response; // Return the full axios response
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response; // Return the full axios response
  }
};

// Products API
export const productsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  create: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },
  
  update: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  
  getLowStock: async (params = {}) => {
    const response = await api.get('/products/low-stock', { params });
    return response.data;
  },
  
  getInventoryStatus: async (params = {}) => {
    // Get both low stock items and normal products to identify overstock items
    const [lowStockResponse, allProductsResponse] = await Promise.all([
      api.get('/products/low-stock', { params: { ...params, limit: 100 } }),
      api.get('/products', { params: { ...params, limit: 100 } })
    ]);
    
    // Filter for overstock items (quantity > maxStockLevel)
    const overstockItems = allProductsResponse.data.data.filter(
      product => product.maxStockLevel && product.quantity > product.maxStockLevel
    );
    
    // Filter for out of stock items (quantity === 0)
    const outOfStockItems = allProductsResponse.data.data.filter(
      product => product.quantity === 0
    );
    
    return {
      lowStock: lowStockResponse.data.data,
      overstock: overstockItems,
      outOfStock: outOfStockItems
    };
  }
};

// Sales API
export const salesAPI = {
  create: async (saleData) => {
    const response = await api.post('/sales', saleData);
    return response.data;
  },
  
  getAll: async (params = {}) => {
    const response = await api.get('/sales', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  }
};

// Dashboard API
export const dashboardAPI = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },
  
  getOverview: async () => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  }
};

// Reports API
export const reportsAPI = {
  getDailyReport: async (date) => {
    const response = await api.get(`/reports/daily?date=${date}`);
    return response.data;
  },
  
  getDateRangeReport: async (startDate, endDate, category = '') => {
    const url = `/reports/daterange?startDate=${startDate}&endDate=${endDate}${category ? `&category=${category}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },
  
  getProductReport: async (startDate, endDate, category = '') => {
    const url = `/reports/products?startDate=${startDate}&endDate=${endDate}${category ? `&category=${category}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },
  
  getAllCategories: async () => {
    // Fetch all products to extract unique categories
    const response = await api.get('/products?fields=category');
    if (response.data && response.data.data) {
      // Extract unique categories
      const categories = [...new Set(response.data.data.map(product => product.category))];
      return categories.filter(Boolean); // Filter out any null/undefined categories
    }
    return [];
  }
};

export default api;
