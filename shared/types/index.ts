/**
 * Shared type definitions for the Inventory Management System
 * Used across both frontend and backend for type safety
 */

// Base types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// User types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'manager' | 'cashier';

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// Product types
export interface Product {
  _id: string;
  name: string;
  description: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  category?: Category;
  price: number;
  costPrice: number;
  quantity: number;
  reorderLevel: number;
  maxStockLevel: number;
  supplier: string;
  expiryDate?: string;
  gstRate: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  price: number;
  costPrice: number;
  quantity: number;
  reorderLevel: number;
  maxStockLevel: number;
  supplier: string;
  expiryDate?: string;
  gstRate: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  price?: number;
  costPrice?: number;
  quantity?: number;
  reorderLevel?: number;
  maxStockLevel?: number;
  supplier?: string;
  expiryDate?: string;
  gstRate?: number;
  isActive?: boolean;
}

export interface ProductFilters extends PaginationQuery {
  categoryId?: string;
  supplier?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  nearExpiry?: boolean;
  priceMin?: number;
  priceMax?: number;
}

// Category types
export interface Category {
  _id: string;
  name: string;
  description: string;
  parentId?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  parentId?: string;
  image?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  parentId?: string;
  image?: string;
  isActive?: boolean;
}

// Sale types
export interface Sale {
  _id: string;
  saleNumber: string;
  items: SaleItem[];
  customer: Customer;
  totals: SaleTotals;
  payment: PaymentInfo;
  cashierId: string;
  cashier?: User;
  notes?: string;
  status: SaleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  product?: Product;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  totalPrice: number;
  discountAmount: number;
  taxAmount: number;
}

export interface Customer {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface SaleTotals {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
  roundingAdjustment: number;
}

export interface PaymentInfo {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  cardLast4?: string;
  changeGiven?: number;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'netbanking' | 'wallet';
export type SaleStatus = 'completed' | 'cancelled' | 'refunded' | 'partial_refund';

export interface CreateSaleRequest {
  items: {
    productId: string;
    quantity: number;
    price: number;
    discountAmount?: number;
  }[];
  customer?: Customer;
  payment: PaymentInfo;
  notes?: string;
}

export interface SaleFilters extends PaginationQuery {
  startDate?: string;
  endDate?: string;
  cashierId?: string;
  status?: SaleStatus;
  paymentMethod?: PaymentMethod;
  minAmount?: number;
  maxAmount?: number;
}

// Alert types
export interface Alert {
  _id: string;
  type: AlertType;
  message: string;
  productId?: string;
  product?: Product;
  userId: string;
  user?: User;
  isRead: boolean;
  priority: AlertPriority;
  createdAt: string;
  resolvedAt?: string;
}

export type AlertType = 'low_stock' | 'out_of_stock' | 'expiry_warning' | 'system' | 'security';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface CreateAlertRequest {
  type: AlertType;
  message: string;
  productId?: string;
  userId: string;
  priority: AlertPriority;
}

// Report types
export interface Report {
  _id: string;
  type: ReportType;
  period: ReportPeriod;
  filters: ReportFilters;
  data: any;
  fileUrl?: string;
  generatedBy: string;
  generatedAt: string;
}

export type ReportType = 'sales' | 'inventory' | 'financial' | 'tax' | 'custom';

export interface ReportPeriod {
  startDate: string;
  endDate: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
}

export interface ReportFilters {
  categoryId?: string;
  cashierId?: string;
  paymentMethod?: PaymentMethod;
  productIds?: string[];
  includeRefunds?: boolean;
}

export interface GenerateReportRequest {
  type: ReportType;
  period: ReportPeriod;
  filters?: ReportFilters;
  format?: 'json' | 'pdf' | 'excel' | 'csv';
}

// Dashboard types
export interface DashboardStats {
  today: DailyStats;
  thisWeek: WeeklyStats;
  thisMonth: MonthlyStats;
  recentSales: Sale[];
  lowStockProducts: Product[];
  topSellingProducts: ProductSalesStats[];
  alerts: Alert[];
}

export interface DailyStats {
  totalSales: number;
  totalAmount: number;
  totalTransactions: number;
  averageOrderValue: number;
}

export interface WeeklyStats {
  totalSales: number;
  totalAmount: number;
  totalTransactions: number;
  averageOrderValue: number;
  growth: number;
}

export interface MonthlyStats {
  totalSales: number;
  totalAmount: number;
  totalTransactions: number;
  averageOrderValue: number;
  growth: number;
  topCategories: CategorySalesStats[];
}

export interface ProductSalesStats {
  product: Product;
  totalSold: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface CategorySalesStats {
  category: Category;
  totalSold: number;
  totalRevenue: number;
  productCount: number;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiError {
  success: false;
  message: string;
  error: string;
  code?: number;
  timestamp: string;
  validationErrors?: ValidationError[];
}

// Utility types
export type DateRange = {
  startDate: string;
  endDate: string;
};

export type SearchFilters = {
  query: string;
  fields: string[];
  exact?: boolean;
};

export type SortOptions = {
  field: string;
  direction: 'asc' | 'desc';
};

// Configuration types
export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  auth: {
    tokenKey: string;
    refreshKey: string;
    sessionTimeout: number;
  };
  ui: {
    itemsPerPage: number;
    maxItemsPerPage: number;
    debounceMs: number;
  };
  business: {
    currency: string;
    currencySymbol: string;
    decimalPlaces: number;
    taxRate: number;
  };
}

// Event types (for real-time features)
export interface SocketEvent<T = any> {
  type: string;
  data: T;
  timestamp: string;
  userId?: string;
}

export type InventoryUpdateEvent = SocketEvent<{
  productId: string;
  oldQuantity: number;
  newQuantity: number;
  reason: 'sale' | 'restock' | 'adjustment' | 'return';
}>;

export type SaleCompleteEvent = SocketEvent<{
  sale: Sale;
  affectedProducts: string[];
}>;

export type AlertEvent = SocketEvent<{
  alert: Alert;
}>;

// Export all types as a single namespace for easy importing
export type InventoryTypes = {
  ApiResponse: ApiResponse;
  User: User;
  Product: Product;
  Category: Category;
  Sale: Sale;
  Alert: Alert;
  Report: Report;
  DashboardStats: DashboardStats;
};