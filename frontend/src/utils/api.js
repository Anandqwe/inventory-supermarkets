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
    // Only redirect to login if it's not a login attempt and we get 401
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
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
  
  importFromCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  exportToCSV: async (params = {}) => {
    const response = await api.get('/products/export', { 
      params,
      responseType: 'blob'
    });
    return response;
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

// Inventory API
export const inventoryAPI = {
  getAdjustments: async (params = {}) => {
    const response = await api.get('/inventory/adjustments', { params });
    return response.data;
  },

  createAdjustment: async (data) => {
    const response = await api.post('/inventory/adjustments', data);
    return response.data;
  },

  getTransfers: async (params = {}) => {
    const response = await api.get('/inventory/transfers', { params });
    return response.data;
  },

  createTransfer: async (data) => {
    const response = await api.post('/inventory/transfers', data);
    return response.data;
  },

  getLowStockAlerts: async () => {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  },

  getStockMovements: async (params = {}) => {
    const response = await api.get('/inventory/stock-movements', { params });
    return response.data;
  },

  getReorderSuggestions: async () => {
    const response = await api.get('/purchases/reorder-suggestions');
    return response.data;
  }
};

// Purchase Orders API
export const purchaseAPI = {
  getOrders: async (params = {}) => {
    const response = await api.get('/purchases/orders', { params });
    return response.data;
  },

  createOrder: async (data) => {
    const response = await api.post('/purchases/orders', data);
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/purchases/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/purchases/orders/${id}/status`, { status });
    return response.data;
  }
};

// Master Data API
export const masterDataAPI = {
  // Categories
  getCategories: async (params = {}) => {
    const response = await api.get('/master-data/categories', { params });
    return response.data;
  },
  
  createCategory: async (data) => {
    const response = await api.post('/master-data/categories', data);
    return response.data;
  },
  
  updateCategory: async (id, data) => {
    const response = await api.put(`/master-data/categories/${id}`, data);
    return response.data;
  },
  
  deleteCategory: async (id) => {
    const response = await api.delete(`/master-data/categories/${id}`);
    return response.data;
  },
  
  // Brands
  getBrands: async (params = {}) => {
    const response = await api.get('/master-data/brands', { params });
    return response.data;
  },
  
  createBrand: async (data) => {
    const response = await api.post('/master-data/brands', data);
    return response.data;
  },
  
  updateBrand: async (id, data) => {
    const response = await api.put(`/master-data/brands/${id}`, data);
    return response.data;
  },
  
  deleteBrand: async (id) => {
    const response = await api.delete(`/master-data/brands/${id}`);
    return response.data;
  },
  
  // Units
  getUnits: async (params = {}) => {
    const response = await api.get('/master-data/units', { params });
    return response.data;
  },
  
  createUnit: async (data) => {
    const response = await api.post('/master-data/units', data);
    return response.data;
  },
  
  updateUnit: async (id, data) => {
    const response = await api.put(`/master-data/units/${id}`, data);
    return response.data;
  },
  
  deleteUnit: async (id) => {
    const response = await api.delete(`/master-data/units/${id}`);
    return response.data;
  },
  
  // Suppliers
  getSuppliers: async (params = {}) => {
    const response = await api.get('/master-data/suppliers', { params });
    return response.data;
  },
  
  createSupplier: async (data) => {
    const response = await api.post('/master-data/suppliers', data);
    return response.data;
  },
  
  updateSupplier: async (id, data) => {
    const response = await api.put(`/master-data/suppliers/${id}`, data);
    return response.data;
  },
  
  deleteSupplier: async (id) => {
    const response = await api.delete(`/master-data/suppliers/${id}`);
    return response.data;
  },
  
  // Branches
  getBranches: async (params = {}) => {
    const response = await api.get('/master-data/branches', { params });
    return response.data;
  },
  
  createBranch: async (data) => {
    const response = await api.post('/master-data/branches', data);
    return response.data;
  },
  
  updateBranch: async (id, data) => {
    const response = await api.put(`/master-data/branches/${id}`, data);
    return response.data;
  },
  
  deleteBranch: async (id) => {
    const response = await api.delete(`/master-data/branches/${id}`);
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
  getDailyReport: async (params = {}) => {
    const response = await api.get('/reports/daily', { params });
    return response.data;
  },
  
  getSalesReport: async (params = {}) => {
    const response = await api.get('/reports/sales', { params });
    return response.data;
  },
  
  getProductReport: async (params = {}) => {
    const response = await api.get('/reports/products', { params });
    return response.data;
  },
  
  getInventoryReport: async (params = {}) => {
    const response = await api.get('/reports/inventory', { params });
    return response.data;
  },
  
  getProfitAnalysis: async (params = {}) => {
    const response = await api.get('/reports/profit-analysis', { params });
    return response.data;
  },
  
  getCustomerAnalysis: async (params = {}) => {
    const response = await api.get('/reports/customer-analysis', { params });
    return response.data;
  },
  
  getAllCategories: async () => {
    const response = await api.get('/products/categories');
    return response.data;
  }
};

// Settings & Profile API
export const settingsAPI = {
  getUserProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  updateUserProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
  
  changePassword: async (data) => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  }
};



export default api;
