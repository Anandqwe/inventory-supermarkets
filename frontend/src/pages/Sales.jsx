import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { 
  PlusIcon, 
  MinusIcon,
  MagnifyingGlassIcon, 
  TrashIcon, 
  ShoppingCartIcon, 
  CalculatorIcon, 
  UserIcon, 
  CreditCardIcon,
  PrinterIcon,
  XMarkIcon,
  ReceiptPercentIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
  IdentificationIcon,
  TagIcon,
  PhotoIcon,
  CubeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  CalendarIcon,
  FunnelIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { PageHeader } from '../components/shell';
import { masterDataAPI, salesAPI } from '../utils/api';
import { 
  Button, 
  Input, 
  Card, 
  Badge,
  Modal,
  EmptyState
} from '../components/ui';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { cn } from '../utils/cn';
import { PERMISSIONS } from '../../../shared/permissions';

// Professional Point of Sale System
function Sales() {
  const { token, user } = useAuth();
  const { hasPermission } = usePermission();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab State - default to 'history' if coming from dashboard, otherwise 'pos'
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam === 'history' ? 'history' : 'pos';
  });
  
  // Core POS State
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Customer & Payment State
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDetails, setPaymentDetails] = useState({
    amountPaid: 0,
    cardNumber: '',
    upiId: '',
    checkNumber: ''
  });
  const [discount, setDiscount] = useState({
    type: 'percentage', // 'percentage' | 'fixed'
    value: 0,
    reason: ''
  });
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState(18); // GST rate
  
  // UI State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [categoryFilter, setCategoryFilter] = useState('');
  const [savedTransactions, setSavedTransactions] = useState([]);
  const [showSavedTransactions, setShowSavedTransactions] = useState(false);
  // Initialize selectedBranch from user's branch for non-admin users
  const [selectedBranch, setSelectedBranch] = useState(
    user?.branch?._id || user?.branch || ''
  );
  const [showMobileCart, setShowMobileCart] = useState(false); // Mobile cart drawer
  const [showAccessModal, setShowAccessModal] = useState(false); // Modal for restricted access
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25, // Default to 25 products per page
  });
  
  // Sales History State
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState('');
  const [historyLimit] = useState(20);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showSaleDetailsModal, setShowSaleDetailsModal] = useState(false);
  
  // Sales History Filters
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('');
  const [historyFromDate, setHistoryFromDate] = useState('');
  const [historyToDate, setHistoryToDate] = useState('');
  
  // Refs
  const searchInputRef = useRef(null);

  // API Functions
  const fetchProducts = async () => {
    const params = new URLSearchParams({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: searchTerm,
      inStock: 'true'
    });

    // Only add category if it's selected
    if (categoryFilter) {
      params.append('category', categoryFilter);
    }

    // Add branch filter if selected
    if (selectedBranch) {
      params.append('branch', selectedBranch);
    }

    const response = await fetch(`http://localhost:5000/api/products?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    return response.json();
  };

  const fetchCategories = async () => {
    const response = await fetch('http://localhost:5000/api/products/categories', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    return response.json();
  };

  const fetchBranches = async () => {
    try {
      const response = await masterDataAPI.getBranches({ limit: 100 });
      // Backend returns { success, data: [...branches array...], pagination }
      // So we need to wrap it to match our expected structure
      return { branches: response.data };
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  };

  // React Query Hooks
  const { 
    data: productsData, 
    isLoading: isLoadingProducts,
    refetch: refetchProducts 
  } = useQuery({
    queryKey: ['pos-products', pagination, searchTerm, categoryFilter, selectedBranch],
    queryFn: fetchProducts,
    staleTime: 30000,
    enabled: !!selectedBranch || !!user?.branch, // Enable if branch is selected OR user has a branch
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 300000, // Cache for 5 minutes
  });

  const { data: branchesData, isLoading: isLoadingBranches, error: branchesError } = useQuery({
    queryKey: ['branches'],
    queryFn: fetchBranches,
    staleTime: 300000, // Cache for 5 minutes
  });

  // Sales History Query
  const { 
    data: salesHistoryData, 
    isLoading: isLoadingSalesHistory,
    refetch: refetchSalesHistory
  } = useQuery({
    queryKey: ['sales-history', historyPage, historySearch, selectedBranch, historyPaymentFilter, historyStatusFilter, historyFromDate, historyToDate],
    queryFn: async () => {
      const params = {
        page: historyPage,
        limit: historyLimit,
        search: historySearch
      };
      if (selectedBranch) {
        params.branchId = selectedBranch;
      }
      if (historyPaymentFilter) {
        params.paymentMethod = historyPaymentFilter;
      }
      if (historyStatusFilter) {
        params.status = historyStatusFilter;
      }
      if (historyFromDate) {
        params.startDate = historyFromDate;
      }
      if (historyToDate) {
        params.endDate = historyToDate;
      }
      return await salesAPI.getAll(params);
    },
    staleTime: 30000,
    enabled: activeTab === 'history', // Only fetch when on history tab
  });

  // Mutations
  const createSaleMutation = useMutation({
    mutationFn: async (saleData) => {
      const response = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saleData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Sale creation error:', data);
        throw new Error(data.message || 'Failed to create sale');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('Sale completed successfully!');
      clearCart();
      if (data.data.receipt) {
        handlePrintReceipt(data.data);
      }
      // Invalidate all related queries to refresh data
      queryClient.invalidateQueries(['pos-products']);
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] }); // Refresh all dashboard queries regardless of dateRange
      queryClient.invalidateQueries({ queryKey: ['sales-chart'] }); // Refresh all sales charts
    },
    onError: (error) => {
      console.error('Sale mutation error:', error);
      toast.error(error.message || 'Failed to complete sale');
    }
  });

  // Data Processing
  const products = productsData?.data?.products || [];
  const totalProducts = productsData?.data?.pagination?.totalItems || 0;
  
  // Filter unique active categories (remove duplicates by name)
  const allCategories = categoriesData?.data || [];
  const categories = allCategories.filter((category, index, self) => 
    category.isActive !== false && 
    index === self.findIndex(c => c.name === category.name)
  ).sort((a, b) => a.name.localeCompare(b.name));
  
  // Extract branches from the response
  const branches = branchesData?.branches || [];

  // Set default branch on load (use user's branch or first available branch)
  useEffect(() => {
    // If user already has a branch assigned, ensure it's set
    if (!selectedBranch && user?.branch) {
      const userBranchId = user.branch._id || user.branch;
      setSelectedBranch(userBranchId);
    }
    // For admins without a branch, set to first available branch
    else if (!selectedBranch && !user?.branch && branches.length > 0) {
      setSelectedBranch(branches[0]?._id);
    }
  }, [branches, user, selectedBranch]);

  // Reset pagination when search or category changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [searchTerm, categoryFilter]);

  // Helper function to get stock for selected branch
  const getBranchStock = useCallback((product) => {
    if (!selectedBranch || !product.stockByBranch) {
      return product.stock || 0;
    }
    
    const branchStock = product.stockByBranch.find(
      stock => stock.branch === selectedBranch || stock.branch?._id === selectedBranch
    );
    
    return branchStock?.quantity || 0;
  }, [selectedBranch]);

  // Cart Calculations
  // Note: Indian Retail Pricing - All prices are GST-inclusive
  // We don't add tax on top, we extract it for display purposes only
  const cartCalculations = useMemo(() => {
    // Subtotal: Sum of all items (prices already include GST)
    const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
    
    // Apply discount
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (subtotal * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }
    
    // Total payable (GST already included in prices)
    const total = subtotal - discountAmount;
    
    // For display only: Extract GST component from total
    // Formula: taxableAmount = total / (1 + taxRate/100)
    const taxableAmount = total / (1 + (taxRate / 100));
    const taxAmount = total - taxableAmount;
    
    return {
      subtotal,        // Total before discount (GST inclusive)
      discountAmount,  // Discount applied
      taxableAmount,   // Base amount (GST exclusive) - for display only
      taxAmount,       // GST component - for display only  
      total,           // Final payable amount (GST inclusive)
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [cart, discount, taxRate]);

  // Event Handlers
  const addToCart = useCallback((product, quantity = 1) => {
    if (product.stock < quantity) {
      toast.error('Insufficient stock');
      return;
    }

    setCart(prev => {
      const existingItem = prev.find(item => item._id === product._id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          toast.error('Cannot add more items than available stock');
          return prev;
        }
        return prev.map(item =>
          item._id === product._id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      
      return [...prev, { ...product, quantity }];
    });
  }, []);

  const updateCartItemQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item._id === productId) {
        const product = products.find(p => p._id === productId);
        if (quantity > product.stock) {
          toast.error('Cannot exceed available stock');
          return item;
        }
        return { ...item, quantity };
      }
      return item;
    }));
  }, [products]);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item._id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCustomer({ name: '', phone: '', email: '', address: '' });
    setPaymentMethod('cash');
    setPaymentDetails({ amountPaid: 0, cardNumber: '', upiId: '', checkNumber: '' });
    setDiscount({ type: 'percentage', value: 0, reason: '' });
    setNotes('');
  }, []);

  const handleKeyboardShortcuts = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'f':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'Enter':
          e.preventDefault();
          if (cart.length > 0) {
            setShowPaymentModal(true);
          }
          break;
        case 'Escape':
          e.preventDefault();
          clearCart();
          break;
      }
    }
  }, [cart.length, clearCart]);

  const saveTransaction = useCallback(() => {
    const transaction = {
      id: Date.now(),
      cart: [...cart],
      customer: { ...customer },
      discount: { ...discount },
      notes,
      timestamp: new Date().toISOString(),
      calculations: cartCalculations
    };
    
    setSavedTransactions(prev => [...prev, transaction]);
    toast.success('Transaction saved');
    clearCart();
  }, [cart, customer, discount, notes, cartCalculations, clearCart]);

  const loadTransaction = useCallback((transaction) => {
    setCart(transaction.cart);
    setCustomer(transaction.customer);
    setDiscount(transaction.discount);
    setNotes(transaction.notes);
    setShowSavedTransactions(false);
    toast.success('Transaction loaded');
  }, []);

  // Print Receipt Function
  const printReceipt = useCallback((sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print receipt');
      return;
    }

    // Calculate totals for receipt
    const subtotal = sale.items?.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0) || 0;
    const discount = sale.discount || 0;
    const total = sale.total || subtotal - discount;
    const taxableAmount = total / 1.18; // Assuming 18% GST
    const taxAmount = total - taxableAmount;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt - ${sale.saleNumber || 'Sale'}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            background-color: #f5f5f5;
            padding: 20px;
          }
          
          .receipt-container {
            width: 80mm;
            margin: 0 auto;
            background: white;
            padding: 15px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px dashed #333;
            padding-bottom: 10px;
          }
          
          .store-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .receipt-number {
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
          }
          
          .divider {
            border-bottom: 1px dashed #333;
            margin: 10px 0;
          }
          
          .info-section {
            font-size: 11px;
            margin-bottom: 10px;
            line-height: 1.6;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          
          .items-section {
            margin: 10px 0;
          }
          
          .item-row {
            font-size: 11px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            padding-bottom: 5px;
            border-bottom: 1px dotted #ddd;
          }
          
          .item-name {
            flex: 1;
          }
          
          .item-qty {
            width: 30px;
            text-align: center;
          }
          
          .item-price {
            width: 50px;
            text-align: right;
          }
          
          .summary-section {
            margin-top: 10px;
            border-top: 2px dashed #333;
            padding-top: 10px;
          }
          
          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 5px;
            padding-bottom: 3px;
          }
          
          .summary-row.total {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #333;
            border-bottom: 1px solid #333;
            padding: 5px 0;
            margin: 5px 0;
          }
          
          .footer {
            text-align: center;
            font-size: 10px;
            color: #666;
            margin-top: 15px;
            border-top: 1px dashed #333;
            padding-top: 10px;
          }
          
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .receipt-container {
              width: 100%;
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="store-name">SUPERMARKET</div>
            <div class="receipt-number">Sale #${sale.saleNumber || 'N/A'}</div>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <span>Date:</span>
              <span>${new Date(sale.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span>Time:</span>
              <span>${new Date(sale.createdAt).toLocaleTimeString()}</span>
            </div>
            ${sale.branch ? `<div class="info-row">
              <span>Branch:</span>
              <span>${sale.branch.name || 'Main'}</span>
            </div>` : ''}
            ${sale.customer?.name ? `<div class="info-row">
              <span>Customer:</span>
              <span>${sale.customer.name}</span>
            </div>` : ''}
          </div>
          
          <div class="divider"></div>
          
          <div class="items-section">
            ${sale.items?.map(item => `
              <div class="item-row">
                <div class="item-name">${item.product?.name || item.name || 'Product'}</div>
              </div>
              <div class="item-row">
                <span class="item-qty">Qty: ${item.quantity}</span>
                <span class="item-price">₹${(item.unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            `).join('') || ''}
          </div>
          
          <div class="divider"></div>
          
          <div class="summary-section">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            ${discount > 0 ? `<div class="summary-row">
              <span>Discount:</span>
              <span>-₹${discount.toFixed(2)}</span>
            </div>` : ''}
            <div class="summary-row">
              <span>Taxable Amt (ex GST):</span>
              <span>₹${taxableAmount.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>GST (18%):</span>
              <span>₹${taxAmount.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
              <span>TOTAL:</span>
              <span>₹${total.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Payment:</span>
              <span>${sale.paymentMethod?.toUpperCase() || 'CASH'}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>Visit us again</p>
            <p style="margin-top: 10px; font-size: 9px;">${new Date().toLocaleString()}</p>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 1000);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  }, []);

  // Handler for checkout button - checks if user has permission to create sales
  const handleCheckoutClick = useCallback(() => {
    if (!hasPermission(PERMISSIONS.SALES.CREATE)) {
      setShowAccessModal(true);
      return;
    }
    setShowPaymentModal(true);
  }, [hasPermission]);

  const handleCompleteSale = useCallback(async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (paymentMethod !== 'cash' && paymentDetails.amountPaid < cartCalculations.total) {
      toast.error('Payment amount is insufficient');
      return;
    }

    // Use selected branch for sale
    const branchId = selectedBranch || user?.branch?._id || user?.branch;

    if (!branchId) {
      toast.error('Please select a branch to complete the sale');
      return;
    }

    const saleData = {
      items: cart.map(item => ({
        productId: item._id,
        quantity: item.quantity
      })),
      customerName: customer.name || undefined,
      customerPhone: customer.phone || undefined,
      customerEmail: customer.email || undefined,
      paymentMethod,
      discountPercentage: discount.type === 'percentage' ? discount.value : 0,
      taxPercentage: taxRate || 18,
      branchId,
      notes
    };

    console.log('Sending sale data:', saleData);
    createSaleMutation.mutate(saleData);
    setShowPaymentModal(false);
  }, [cart, customer, paymentMethod, paymentDetails, discount, cartCalculations, notes, taxRate, selectedBranch, user, createSaleMutation]);

  const handlePrintReceipt = useCallback((saleData) => {
    // Generate receipt data
    const receiptData = {
      saleNumber: saleData.saleNumber,
      date: new Date().toLocaleString(),
      cashier: saleData.cashier,
      customer: saleData.customer,
      items: saleData.items,
      subtotal: saleData.subtotal,
      discount: saleData.discountAmount,
      tax: saleData.taxAmount,
      total: saleData.total,
      paymentMethod: saleData.paymentMethod,
      change: paymentMethod === 'cash' ? paymentDetails.amountPaid - saleData.total : 0
    };

    // Open receipt in new window for printing
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(generateReceiptHTML(receiptData));
    receiptWindow.document.close();
    receiptWindow.print();
  }, [paymentMethod, paymentDetails.amountPaid]);

  // Keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  // Payment method options
  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: BanknotesIcon },
    { id: 'card', label: 'Card', icon: CreditCardIcon },
    { id: 'upi', label: 'UPI', icon: DevicePhoneMobileIcon },
    { id: 'check', label: 'Check', icon: BuildingLibraryIcon },
  ];

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-black">
      {/* Header with Tabs */}
      <div className="bg-white dark:bg-black border-b border-zinc-300 dark:border-zinc-900 px-3 sm:px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
            <PageHeader 
              title="Sales" 
              subtitle={activeTab === 'pos' 
                ? `${cartCalculations.itemCount} items • ₹${cartCalculations.total.toFixed(2)}`
                : 'View and manage sales transactions'
              }
            />
            
            {activeTab === 'pos' && (
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                {/* Keyboard Shortcuts Info - Hidden on mobile/tablet */}
                <div className="hidden xl:flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-600 mr-2">
                  <span>Ctrl+F: Search</span>
                  <span>Ctrl+Enter: Checkout</span>
                  <span>Esc: Clear</span>
                </div>
                
                {/* Quick Actions */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSavedTransactions(true)}
                  disabled={savedTransactions.length === 0}
                  className="whitespace-nowrap"
                >
                  <ClockIcon className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Saved</span> ({savedTransactions.length})
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveTransaction}
                  disabled={cart.length === 0}
                  className="whitespace-nowrap"
                >
                  <DocumentDuplicateIcon className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="whitespace-nowrap"
                >
                  <XMarkIcon className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </div>
            )}
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 border-b border-zinc-300 dark:border-zinc-900 -mb-3 pb-0">
            <button
              onClick={() => {
                setActiveTab('pos');
                setSearchParams({ tab: 'pos' });
              }}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'pos'
                  ? 'border-primary-500 text-primary-600 dark:text-purple-400'
                  : 'border-transparent text-zinc-600 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <ShoppingCartIcon className="h-4 w-4 inline mr-1.5" />
              New Sale
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setSearchParams({ tab: 'history' });
              }}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-600 dark:text-purple-400'
                  : 'border-transparent text-zinc-600 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <ClockIcon className="h-4 w-4 inline mr-1.5" />
              Sales History
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Content based on active tab */}
      {activeTab === 'pos' ? (
        // POS Content
        <div className="flex-1 flex overflow-hidden relative"> 
        {/* Products Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search & Filters */}
          <div className="bg-white dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-900 p-3 sm:p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:gap-3">
              {/* First Row: Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-surface-400" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 text-sm border-2 focus:border-blue-500 dark:focus:border-purple-500 bg-white dark:bg-zinc-950 w-full"
                />
              </div>
              
              {/* Second Row: Branch (if admin) and Category */}
              <div className="flex gap-2 sm:gap-3">
                {/* Branch Selector (Admin & Regional Manager) */}
                {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'regional manager') && (
                  <select
                    value={selectedBranch || ''}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="flex-1 h-11 px-4 border-2 border-zinc-400 dark:border-zinc-900 rounded-lg bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100 focus:border-blue-500 dark:focus:border-purple-500 outline-none transition-colors cursor-pointer"
                    disabled={isLoadingBranches}
                  >
                    <option value="">
                      {isLoadingBranches ? 'Loading branches...' : branchesError ? 'Error loading branches' : 'Select Branch'}
                    </option>
                    {branchesData?.branches?.map(branch => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                )}
                
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="flex-1 h-11 px-4 border-2 border-zinc-400 dark:border-zinc-900 rounded-lg bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100 focus:border-blue-500 dark:focus:border-purple-500 outline-none transition-colors cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
            {!selectedBranch ? (
              <EmptyState
                icon={CubeIcon}
                title="Select a branch to continue"
                description="Please select a branch from the dropdown above to view products"
              />
            ) : isLoadingProducts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-zinc-950 rounded-lg p-4 animate-pulse">
                    <div className="bg-zinc-300 dark:bg-zinc-900 h-40 sm:h-48 rounded-lg mb-4"></div>
                    <div className="bg-zinc-300 dark:bg-zinc-900 h-5 rounded mb-3"></div>
                    <div className="bg-zinc-300 dark:bg-zinc-900 h-4 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={CubeIcon}
                title="No products found"
                description="Try adjusting your search or filters"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => {
                  const branchStock = getBranchStock(product);
                  return (
                  <Card
                    key={product._id}
                    className={cn(
                      "group relative cursor-pointer transition-all duration-300 overflow-hidden h-full",
                      "hover:shadow-2xl hover:-translate-y-2 border-2 border-transparent",
                      branchStock === 0 
                        ? "opacity-50 cursor-not-allowed grayscale" 
                        : "hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-blue-200 dark:hover:shadow-purple-950/50"
                    )}
                    onClick={() => branchStock > 0 && addToCart(product)}
                  >
                    {/* Stock Badge - Top Right */}
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
                      <Badge
                        variant={
                          branchStock === 0 ? 'destructive' :
                          branchStock <= (product.minStockLevel || 10) ? 'warning' : 'success'
                        }
                        className="shadow-lg text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1"
                      >
                        {branchStock === 0 ? 'Out' : `${branchStock} left`}
                      </Badge>
                    </div>

                    {/* Quick Add Button - Top Left (visible on hover) */}
                    {branchStock > 0 && (
                      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-110">
                        <Button
                          size="sm"
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                            toast.success('Added to cart!');
                          }}
                        >
                          <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </Button>
                      </div>
                    )}

                    <div className="p-3 sm:p-4 lg:p-5">
                      {/* Product Image with gradient overlay */}
                      <div className="relative h-40 sm:h-48 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 overflow-hidden shadow-inner group-hover:shadow-lg transition-all">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <CubeIcon className="h-16 w-16 sm:h-20 sm:w-20 text-zinc-400 dark:text-zinc-700 group-hover:text-blue-500 transition-colors duration-300" />
                          </div>
                        )}
                        
                        {/* Gradient overlay on image */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="space-y-3">
                        {/* Category Badge */}
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-800 dark:text-purple-300 shadow-sm">
                            {product.category?.name || product.category || 'N/A'}
                          </span>
                        </div>

                        {/* Product Name */}
                        <h3 
                          className="font-bold text-base sm:text-lg text-zinc-950 dark:text-zinc-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-words"
                          title={product.name}
                        >
                          {product.name}
                        </h3>
                        
                        {/* SKU */}
                        <p className="text-xs text-zinc-600 dark:text-zinc-600 font-mono bg-surface-50 dark:bg-zinc-950 px-2 py-1 rounded inline-block">
                          SKU: {product.sku}
                        </p>

                        {/* Price Section */}
                        <div className="pt-3 border-t-2 border-zinc-200 dark:border-zinc-950">
                          <div className="flex items-end justify-between">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-600 mb-1">Price</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                  ₹{(product.price || 0).toFixed(0)}
                                </span>
                                {product.mrp && product.mrp > product.price && (
                                  <span className="text-sm text-surface-400 line-through">
                                    ₹{product.mrp}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Add to Cart Icon Button */}
                            {branchStock > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-10 w-10 p-0 rounded-xl text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-600 transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                                }}
                              >
                                <ShoppingCartIcon className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Out of Stock Overlay */}
                    {branchStock === 0 && (
                      <div className="absolute inset-0 bg-surface-900/60 dark:bg-black/80 flex items-center justify-center rounded-lg backdrop-blur-sm">
                        <div className="text-center">
                          <span className="text-white font-bold text-xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 rounded-xl shadow-2xl inline-block">
                            OUT OF STOCK
                          </span>
                        </div>
                      </div>
                    )}
                  </Card>
                )})}
              </div>
            )}

            {/* Pagination - Show only when there are products */}
            {!isLoadingProducts && products.length > 0 && (
              <div className="mt-6 flex flex-col lg:flex-row items-center justify-between gap-3 border-t border-zinc-300 dark:border-zinc-900 pt-4 px-2">
                {/* Results Count */}
                <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-600 font-medium">
                  Showing {(pagination.pageIndex * pagination.pageSize) + 1} to {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalProducts)} of {totalProducts} products
                </div>
                
                {/* Navigation and Page Size */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Page Navigation */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
                      disabled={pagination.pageIndex === 0}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </Button>
                    <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-600 px-2 font-medium">
                      Page {pagination.pageIndex + 1} of {Math.ceil(totalProducts / pagination.pageSize) || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
                      disabled={(pagination.pageIndex + 1) * pagination.pageSize >= totalProducts}
                      className="text-xs sm:text-sm"
                    >
                      Next
                    </Button>
                  </div>
                  
                  {/* Page Size Selector */}
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => {
                      setPagination(prev => ({ 
                        ...prev, 
                        pageSize: Number(e.target.value),
                        pageIndex: 0 // Reset to first page when changing page size
                      }));
                    }}
                    className="px-3 py-1.5 text-xs sm:text-sm border-2 border-zinc-400 dark:border-zinc-900 rounded-lg bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 font-medium cursor-pointer focus:border-blue-500 dark:focus:border-purple-500 outline-none transition-colors"
                  >
                    {[25, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        Show {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart Panel - Desktop Only (hidden on mobile/tablet) */}
        <div className="hidden lg:flex w-96 bg-white dark:bg-black border-l border-zinc-300 dark:border-zinc-900 flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b border-zinc-300 dark:border-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
                Cart ({cartCalculations.itemCount})
              </h2>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomerModal(true)}
              >
                <UserIcon className="h-4 w-4 mr-1" />
                <span className="max-w-[100px] truncate">{customer.name || 'Customer'}</span>
              </Button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <EmptyState
                icon={ShoppingCartIcon}
                title="Cart is empty"
                description="Add products to start a sale"
              />
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item._id} className="bg-surface-50 dark:bg-zinc-950 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-zinc-950 dark:text-zinc-100">
                          {item.name}
                        </h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-600">
                          ₹{item.price || 0} each
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item._id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemQuantity(item._id, item.quantity - 1)}
                          className="h-6 w-6 p-0"
                        >
                          <MinusIcon className="h-3 w-3" />
                        </Button>
                        
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemQuantity(item._id, item.quantity + 1)}
                          className="h-6 w-6 p-0"
                          disabled={item.quantity >= item.stock}
                        >
                          <PlusIcon className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <span className="font-semibold text-zinc-950 dark:text-zinc-100">
                        ₹{((item.price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary & Checkout */}
          {cart.length > 0 && (
            <div className="border-t border-zinc-300 dark:border-zinc-900 p-4">
              {/* Discount Section */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ReceiptPercentIcon className="h-4 w-4 text-zinc-600" />
                  <span className="text-sm font-medium">Discount</span>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={discount.type}
                    onChange={(e) => setDiscount(prev => ({ ...prev, type: e.target.value }))}
                    className="px-2 py-1 text-xs border border-zinc-400 dark:border-zinc-900 rounded bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">₹</option>
                  </select>
                  
                  <Input
                    type="number"
                    placeholder="0"
                    value={discount.value}
                    onChange={(e) => setDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    className="flex-1 text-sm"
                    min="0"
                    max={discount.type === 'percentage' ? 100 : cartCalculations.subtotal}
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal (incl. GST):</span>
                  <span>₹{cartCalculations.subtotal.toFixed(2)}</span>
                </div>
                
                {cartCalculations.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{cartCalculations.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold border-t-2 border-zinc-400 dark:border-zinc-900 pt-2 mt-2">
                  <span>Total Payable:</span>
                  <span>₹{cartCalculations.total.toFixed(2)}</span>
                </div>
                
                {/* Tax Info - For Reference Only */}
                <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-600 border-t border-dashed border-zinc-300 dark:border-zinc-900 pt-2 mt-2">
                  <span>GST @ {taxRate}% (included):</span>
                  <span>₹{cartCalculations.taxAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckoutClick}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={processing}
              >
                {processing ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <CreditCardIcon className="h-4 w-4 mr-2" />
                    Checkout
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Cart Button - Fixed Bottom */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t-2 border-zinc-300 dark:border-zinc-900 p-3 sm:p-4 z-50 shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={() => setShowMobileCart(true)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold h-12 sm:h-14 text-base sm:text-lg"
              disabled={cart.length === 0}
            >
              <ShoppingCartIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
              View Cart ({cartCalculations.itemCount})
              <span className="ml-auto">₹{cartCalculations.total.toFixed(2)}</span>
            </Button>
          </div>
        </div>

        {/* Mobile Cart Drawer */}
        {showMobileCart && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobileCart(false)}>
            <div 
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-black flex flex-col animate-slide-in-right"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Cart Header */}
              <div className="p-4 border-b border-zinc-300 dark:border-zinc-900 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
                  Cart ({cartCalculations.itemCount})
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomerModal(true)}
                  >
                    <UserIcon className="h-4 w-4 mr-1" />
                    <span className="max-w-[80px] truncate">{customer.name || 'Customer'}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileCart(false)}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Mobile Cart Items */}
              <div className="flex-1 overflow-auto p-4">
                {cart.length === 0 ? (
                  <EmptyState
                    icon={ShoppingCartIcon}
                    title="Cart is empty"
                    description="Add products to start a sale"
                  />
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item._id} className="bg-surface-50 dark:bg-zinc-950 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-zinc-950 dark:text-zinc-100">
                              {item.name}
                            </h4>
                            <p className="text-xs text-zinc-600 dark:text-zinc-600">
                              ₹{item.price || 0} each
                            </p>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item._id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <MinusIcon className="h-3 w-3" />
                            </Button>
                            
                            <span className="w-10 text-center font-medium">{item.quantity}</span>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <PlusIcon className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold text-blue-600 dark:text-blue-400">
                              ₹{((item.price || 0) * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Cart Summary & Checkout */}
              {cart.length > 0 && (
                <div className="border-t border-zinc-300 dark:border-zinc-900 p-4 space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal (incl. GST):</span>
                      <span>₹{cartCalculations.subtotal.toFixed(2)}</span>
                    </div>
                    {cartCalculations.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-₹{cartCalculations.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t-2 border-zinc-400 dark:border-zinc-900 pt-2 mt-2">
                      <span>Total Payable:</span>
                      <span>₹{cartCalculations.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-600 border-t border-dashed pt-2">
                      <span>GST @ {taxRate}% (included):</span>
                      <span>₹{cartCalculations.taxAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setShowMobileCart(false);
                      handleCheckoutClick();
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
                    disabled={processing}
                  >
                    {processing ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <CreditCardIcon className="h-5 w-5 mr-2" />
                        Checkout
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      ) : (
        // Sales History Content
        <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          {/* Advanced Filters */}
          <Card className="p-4 sm:p-5 border-0 shadow-sm bg-gradient-to-r from-white to-slate-50 dark:from-surface-900 dark:to-zinc-900 mb-6">
            <div className="flex flex-col gap-4">
              {/* Header with Title and Filter Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                    Search & Filters
                  </h3>
                </div>
              </div>

              {/* Search Bar */}
              <div className="w-full">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-surface-400" />
                  <Input
                    placeholder="Search by sale number, customer name..."
                    value={historySearch}
                    onChange={(e) => {
                      setHistorySearch(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="pl-10 h-10 text-sm border-2 focus:border-purple-500 dark:focus:border-purple-400 bg-white dark:bg-zinc-950 w-full transition-all"
                  />
                </div>
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Branch Filter (Admin & Regional Manager) */}
                {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'regional manager') && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-600 uppercase tracking-wide">
                      Branch
                    </label>
                    <select
                      value={selectedBranch || ''}
                      onChange={(e) => {
                        setSelectedBranch(e.target.value);
                        setHistoryPage(1);
                      }}
                      className="h-10 px-3 border-2 border-zinc-400 dark:border-zinc-900 rounded-lg bg-white dark:bg-zinc-950 text-sm text-zinc-950 dark:text-zinc-100 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-colors cursor-pointer hover:border-zinc-500 dark:hover:border-zinc-800"
                      disabled={isLoadingBranches}
                    >
                      <option value="">
                        {isLoadingBranches ? 'Loading...' : branchesError ? 'Error' : 'All Branches'}
                      </option>
                      {branchesData?.branches?.map(branch => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Payment Method Filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-600 uppercase tracking-wide">
                    Payment Method
                  </label>
                  <select
                    value={historyPaymentFilter}
                    onChange={(e) => {
                      setHistoryPaymentFilter(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="h-10 px-3 border-2 border-zinc-400 dark:border-zinc-900 rounded-lg bg-white dark:bg-zinc-950 text-sm text-zinc-950 dark:text-zinc-100 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-colors cursor-pointer hover:border-zinc-500 dark:hover:border-zinc-800"
                  >
                    <option value="">All Methods</option>
                    <option value="cash">💵 Cash</option>
                    <option value="card">💳 Card</option>
                    <option value="upi">📱 UPI</option>
                    <option value="check">📋 Check</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-600 uppercase tracking-wide">
                    Status
                  </label>
                  <select
                    value={historyStatusFilter}
                    onChange={(e) => {
                      setHistoryStatusFilter(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="h-10 px-3 border-2 border-zinc-400 dark:border-zinc-900 rounded-lg bg-white dark:bg-zinc-950 text-sm text-zinc-950 dark:text-zinc-100 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-colors cursor-pointer hover:border-zinc-500 dark:hover:border-zinc-800"
                  >
                    <option value="">All Status</option>
                    <option value="completed">✓ Completed</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="cancelled">✗ Cancelled</option>
                  </select>
                </div>

                {/* Date From */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-600 uppercase tracking-wide">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={historyFromDate}
                    onChange={(e) => {
                      setHistoryFromDate(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="h-10 text-sm border-2 focus:border-purple-500 dark:focus:border-purple-400"
                  />
                </div>

                {/* Date To */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-600 uppercase tracking-wide">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={historyToDate}
                    onChange={(e) => {
                      setHistoryToDate(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="h-10 text-sm border-2 focus:border-purple-500 dark:focus:border-purple-400"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Sales History Table */}
          {isLoadingSalesHistory ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !salesHistoryData?.data?.sales || salesHistoryData.data.sales.length === 0 ? (
            <EmptyState
              icon={ShoppingCartIcon}
              title="No sales found"
              description="No sales transactions match your search criteria"
            />
          ) : (
            <>
              <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-300 dark:border-zinc-900 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface-50 dark:bg-zinc-950 border-b border-zinc-300 dark:border-zinc-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-600 uppercase tracking-wider">
                          Sale #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-600 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-600 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-600 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-zinc-600 dark:text-zinc-600 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-zinc-600 dark:text-zinc-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 dark:divide-zinc-900">
                      {salesHistoryData.data.sales.map((sale) => (
                        <tr 
                          key={sale._id}
                          className="hover:bg-surface-50 dark:hover:bg-zinc-950/50 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-zinc-950 dark:text-zinc-100">
                              #{sale.saleNumber || sale._id?.slice(-6)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-zinc-950 dark:text-zinc-100">
                              {sale.customer?.name || 'Walk-in Customer'}
                            </div>
                            {sale.customer?.phone && (
                              <div className="text-xs text-zinc-600 dark:text-zinc-600">
                                {sale.customer.phone}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-zinc-950 dark:text-zinc-100">
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-600">
                              {new Date(sale.createdAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-zinc-950 dark:text-zinc-100">
                              {sale.items?.length || 0} items
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant={
                              sale.paymentMethod === 'cash' ? 'success' :
                              sale.paymentMethod === 'card' ? 'info' :
                              sale.paymentMethod === 'upi' ? 'warning' : 'default'
                            }>
                              {sale.paymentMethod?.toUpperCase() || 'CASH'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                              ₹{sale.total?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedSale(sale);
                                setShowSaleDetailsModal(true);
                              }}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {salesHistoryData?.pagination && salesHistoryData.pagination.pages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-zinc-600 dark:text-zinc-600">
                    Showing {((historyPage - 1) * historyLimit) + 1} to {Math.min(historyPage * historyLimit, salesHistoryData.pagination.total)} of {salesHistoryData.pagination.total} sales
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {[...Array(salesHistoryData.pagination.pages)].map((_, idx) => {
                        const pageNum = idx + 1;
                        // Show first page, last page, current page, and pages around current
                        if (
                          pageNum === 1 ||
                          pageNum === salesHistoryData.pagination.pages ||
                          (pageNum >= historyPage - 1 && pageNum <= historyPage + 1)
                        ) {
                          return (
                            <Button
                              key={pageNum}
                              size="sm"
                              variant={historyPage === pageNum ? 'default' : 'outline'}
                              onClick={() => setHistoryPage(pageNum)}
                              className="w-8"
                            >
                              {pageNum}
                            </Button>
                          );
                        } else if (pageNum === historyPage - 2 || pageNum === historyPage + 2) {
                          return <span key={pageNum} className="px-1">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setHistoryPage(p => Math.min(salesHistoryData.pagination.pages, p + 1))}
                      disabled={historyPage === salesHistoryData.pagination.pages}
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Sale Details Modal */}
      {showSaleDetailsModal && selectedSale && (
        <Modal
          isOpen={showSaleDetailsModal}
          onClose={() => {
            setShowSaleDetailsModal(false);
            setSelectedSale(null);
          }}
          title={`Sale #${selectedSale.saleNumber || selectedSale._id?.slice(-6)}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Sale Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-surface-50 dark:bg-zinc-950 rounded-lg">
              <div>
                <div className="text-xs text-zinc-600 dark:text-zinc-600">Date & Time</div>
                <div className="text-sm font-medium text-zinc-950 dark:text-zinc-100">
                  {new Date(selectedSale.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-600 dark:text-zinc-600">Payment Method</div>
                <div className="text-sm font-medium text-zinc-950 dark:text-zinc-100">
                  {selectedSale.paymentMethod?.toUpperCase() || 'CASH'}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-600 dark:text-zinc-600">Customer</div>
                <div className="text-sm font-medium text-zinc-950 dark:text-zinc-100">
                  {selectedSale.customer?.name || 'Walk-in Customer'}
                </div>
                {selectedSale.customer?.phone && (
                  <div className="text-xs text-zinc-600 dark:text-zinc-600">
                    {selectedSale.customer.phone}
                  </div>
                )}
              </div>
              {selectedSale.branch && (
                <div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-600">Branch</div>
                  <div className="text-sm font-medium text-zinc-950 dark:text-zinc-100">
                    {selectedSale.branch.name || selectedSale.branch}
                  </div>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <h4 className="font-medium mb-2 text-zinc-950 dark:text-zinc-100">Items</h4>
              <div className="space-y-2">
                {selectedSale.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-surface-50 dark:bg-zinc-950 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-zinc-950 dark:text-zinc-100">
                        {item.product?.name || item.name || 'Unknown Product'}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-600">
                        ₹{item.unitPrice?.toFixed(2)} × {item.quantity}
                      </div>
                    </div>
                    <div className="font-semibold text-zinc-950 dark:text-zinc-100">
                      ₹{(item.unitPrice * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-zinc-300 dark:border-zinc-900 pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-600">Subtotal:</span>
                  <span className="text-zinc-950 dark:text-zinc-100">₹{selectedSale.subtotal?.toFixed(2)}</span>
                </div>
                {selectedSale.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-600">Tax:</span>
                    <span className="text-zinc-950 dark:text-zinc-100">₹{selectedSale.tax?.toFixed(2)}</span>
                  </div>
                )}
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{selectedSale.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t-2 border-zinc-400 dark:border-zinc-900 pt-2 mt-2">
                  <span className="text-zinc-950 dark:text-zinc-100">Total:</span>
                  <span className="text-zinc-950 dark:text-zinc-100">₹{selectedSale.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-zinc-300 dark:border-zinc-900">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowSaleDetailsModal(false);
                  setSelectedSale(null);
                }}
              >
                Close
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  if (selectedSale) {
                    printReceipt(selectedSale);
                  }
                }}
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Complete Payment"
          size="lg"
        >
          <div className="space-y-6">
            {/* Payment Methods */}
            <div>
              <label className="block text-sm font-medium mb-3">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      paymentMethod === method.id
                        ? "border-purple-500 bg-purple-950/30 dark:bg-purple-950/30"
                        : "border-zinc-400 dark:border-zinc-900 hover:bg-surface-50 dark:hover:bg-zinc-950"
                    )}
                  >
                    <method.icon className="h-5 w-5" />
                    <span>{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            {paymentMethod !== 'cash' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount to Pay</label>
                  <Input
                    type="number"
                    value={paymentDetails.amountPaid}
                    onChange={(e) => setPaymentDetails(prev => ({ 
                      ...prev, 
                      amountPaid: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder={cartCalculations.total.toFixed(2)}
                    min="0"
                  />
                </div>

                {paymentMethod === 'card' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Card Number (Last 4 digits)</label>
                    <Input
                      value={paymentDetails.cardNumber}
                      onChange={(e) => setPaymentDetails(prev => ({ 
                        ...prev, 
                        cardNumber: e.target.value 
                      }))}
                      placeholder="****"
                      maxLength="4"
                    />
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">UPI ID</label>
                    <Input
                      value={paymentDetails.upiId}
                      onChange={(e) => setPaymentDetails(prev => ({ 
                        ...prev, 
                        upiId: e.target.value 
                      }))}
                      placeholder="user@upi"
                    />
                  </div>
                )}

                {paymentMethod === 'check' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Check Number</label>
                    <Input
                      value={paymentDetails.checkNumber}
                      onChange={(e) => setPaymentDetails(prev => ({ 
                        ...prev, 
                        checkNumber: e.target.value 
                      }))}
                      placeholder="123456"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-surface-50 dark:bg-zinc-950 rounded-lg p-4">
              <h3 className="font-medium mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal (incl. GST):</span>
                  <span>₹{cartCalculations.subtotal.toFixed(2)}</span>
                </div>
                {cartCalculations.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{cartCalculations.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t-2 border-zinc-400 dark:border-zinc-900 pt-2 mt-2">
                  <span>Total Payable:</span>
                  <span>₹{cartCalculations.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-600 border-t border-dashed pt-2">
                  <span>GST @ {taxRate}% (included):</span>
                  <span>₹{cartCalculations.taxAmount.toFixed(2)}</span>
                </div>
                
                {paymentMethod === 'cash' && (
                  <div className="flex justify-between text-green-600 mt-3">
                    <span>Payment (Cash):</span>
                    <span>₹{cartCalculations.total.toFixed(2)}</span>
                  </div>
                )}
                
                {paymentMethod !== 'cash' && paymentDetails.amountPaid > cartCalculations.total && (
                  <div className="flex justify-between text-blue-600">
                    <span>Change:</span>
                    <span>₹{(paymentDetails.amountPaid - cartCalculations.total).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleCompleteSale}
                disabled={createSaleMutation.isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {createSaleMutation.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Complete Sale
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <Modal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          title="Customer Information"
        >
          <div className="space-y-4">
            <Input
              placeholder="Customer Name"
              value={customer.name}
              onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
            />
            
            <Input
              placeholder="Phone Number"
              value={customer.phone}
              onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
            />
            
            <Input
              placeholder="Email (optional)"
              value={customer.email}
              onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
            />
            
            <Input
              placeholder="Address (optional)"
              value={customer.address}
              onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCustomerModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              
              <Button
                onClick={() => setShowCustomerModal(false)}
                className="flex-1"
              >
                Save Customer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Saved Transactions Modal */}
      {showSavedTransactions && (
        <Modal
          isOpen={showSavedTransactions}
          onClose={() => setShowSavedTransactions(false)}
          title="Saved Transactions"
          size="lg"
        >
          <div className="space-y-4">
            {savedTransactions.length === 0 ? (
              <EmptyState
                icon={ClockIcon}
                title="No saved transactions"
                description="Save a transaction to continue it later"
              />
            ) : (
              savedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-zinc-300 dark:border-zinc-900 rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {transaction.customer.name || 'Walk-in Customer'}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-600">
                      {transaction.cart.length} items • ₹{transaction.calculations.total.toFixed(2)} • {new Date(transaction.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTransaction(transaction)}
                    >
                      Load
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSavedTransactions(prev => prev.filter(t => t.id !== transaction.id))}
                      className="text-red-600 hover:text-red-500"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Access Denied Modal - For roles without sales.create permission */}
      {showAccessModal && (
        <Modal
          isOpen={showAccessModal}
          onClose={() => setShowAccessModal(false)}
          title="Cannot Process Sales"
          size="md"
        >
          <div className="space-y-6">
            {/* Icon and Message */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <ShieldExclamationIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Sales Processing Not Available
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Your role ({user?.role}) cannot process sales transactions.
                </p>
              </div>
            </div>

            {/* Information Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">What you can do:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>✓ View and review sales history</li>
                <li>✓ Analyze sales trends and reports</li>
                <li>✓ Manage inventory and stock levels</li>
                <li>✓ Process purchases from suppliers</li>
              </ul>
            </div>

            {/* Role Information */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
              <p className="text-xs text-slate-600 dark:text-slate-500 mb-2">
                <span className="font-semibold">To process sales:</span>
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                  Cashier
                </Badge>
                <span>role is required</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setShowAccessModal(false)}
                className="flex-1"
              >
                Understand
              </Button>
              <Button
                onClick={() => {
                  setShowAccessModal(false);
                  setActiveTab('history');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                View Sales History
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Sales;

