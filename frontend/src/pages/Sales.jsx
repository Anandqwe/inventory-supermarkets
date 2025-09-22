import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  MinusIcon,
  MagnifyingGlassIcon, 
  TrashIcon, 
  ShoppingCartIcon, 
  CalculatorIcon, 
  UserIcon, 
  CreditCardIcon,
  QrCodeIcon,
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
  CubeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/shell';
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

// Professional Point of Sale System
function Sales() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  
  // Core POS State
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
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
  
  // Refs
  const barcodeInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // API Functions
  const fetchProducts = async () => {
    const params = new URLSearchParams({
      search: searchTerm,
      category: categoryFilter,
      inStock: 'true',
      limit: 100
    });

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

  const fetchProductByBarcode = async (barcode) => {
    const response = await fetch(`http://localhost:5000/api/products/barcode/${barcode}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Product not found');
    }

    return response.json();
  };

  // React Query Hooks
  const { 
    data: productsData, 
    isLoading: isLoadingProducts,
    refetch: refetchProducts 
  } = useQuery({
    queryKey: ['pos-products', searchTerm, categoryFilter],
    queryFn: fetchProducts,
    staleTime: 30000,
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

      if (!response.ok) {
        throw new Error('Failed to create sale');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Sale completed successfully!');
      clearCart();
      if (data.data.receipt) {
        handlePrintReceipt(data.data);
      }
      queryClient.invalidateQueries(['pos-products']);
    },
    onError: (error) => {
      toast.error('Failed to complete sale');
    }
  });

  // Data Processing
  const products = productsData?.data?.products || [];
  const categories = [...new Set(products.map(p => p.category))].filter(Boolean);

  // Cart Calculations
  const cartCalculations = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (subtotal * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }
    
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + taxAmount;
    
    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
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

  const handleBarcodeInput = useCallback(async (barcode) => {
    try {
      const productData = await fetchProductByBarcode(barcode);
      if (productData.success) {
        addToCart(productData.data);
        toast.success(`Added ${productData.data.name} to cart`);
      }
    } catch (error) {
      toast.error('Product not found');
    }
  }, [addToCart]);

  const handleKeyboardShortcuts = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'f':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'b':
          e.preventDefault();
          barcodeInputRef.current?.focus();
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

  const handleCompleteSale = useCallback(async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (paymentMethod !== 'cash' && paymentDetails.amountPaid < cartCalculations.total) {
      toast.error('Payment amount is insufficient');
      return;
    }

    const saleData = {
      items: cart.map(item => ({
        product: item._id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      customer: customer.name ? customer : null,
      paymentMethod,
      paymentDetails: paymentMethod !== 'cash' ? paymentDetails : null,
      discount: discount.value > 0 ? discount : null,
      subtotal: cartCalculations.subtotal,
      discountAmount: cartCalculations.discountAmount,
      taxAmount: cartCalculations.taxAmount,
      total: cartCalculations.total,
      notes,
      cashier: user.firstName + ' ' + user.lastName
    };

    createSaleMutation.mutate(saleData);
    setShowPaymentModal(false);
  }, [cart, customer, paymentMethod, paymentDetails, discount, cartCalculations, notes, user, createSaleMutation]);

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

  const generateReceiptHTML = (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${data.saleNumber}</title>
        <style>
          body { font-family: monospace; width: 300px; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Supermarket POS</h2>
          <p>Sale #${data.saleNumber}</p>
          <p>${data.date}</p>
          <p>Cashier: ${data.cashier}</p>
          ${data.customer ? `<p>Customer: ${data.customer.name}</p>` : ''}
        </div>
        
        ${data.items.map(item => `
          <div class="item">
            <span>${item.productName} x${item.quantity}</span>
            <span>₹${item.total.toFixed(2)}</span>
          </div>
        `).join('')}
        
        <div class="total">
          <div class="item">
            <span>Subtotal:</span>
            <span>₹${data.subtotal.toFixed(2)}</span>
          </div>
          ${data.discount > 0 ? `
            <div class="item">
              <span>Discount:</span>
              <span>-₹${data.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="item">
            <span>Tax (${taxRate}%):</span>
            <span>₹${data.tax.toFixed(2)}</span>
          </div>
          <div class="item" style="font-size: 18px;">
            <span>TOTAL:</span>
            <span>₹${data.total.toFixed(2)}</span>
          </div>
          <div class="item">
            <span>Payment (${data.paymentMethod}):</span>
            <span>₹${(data.total + (data.change || 0)).toFixed(2)}</span>
          </div>
          ${data.change > 0 ? `
            <div class="item">
              <span>Change:</span>
              <span>₹${data.change.toFixed(2)}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>Thank you for shopping with us!</p>
          <p>Visit again soon!</p>
        </div>
      </body>
      </html>
    `;
  };

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
    <div className="h-screen flex flex-col bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <PageHeader 
            title="Point of Sale" 
            subtitle={`${cartCalculations.itemCount} items • ₹${cartCalculations.total.toFixed(2)}`}
          />
          
          <div className="flex items-center gap-2">
            {/* Keyboard Shortcuts Info */}
            <div className="hidden lg:flex items-center gap-4 text-xs text-surface-500 dark:text-surface-400">
              <span>Ctrl+F: Search</span>
              <span>Ctrl+B: Barcode</span>
              <span>Ctrl+Enter: Checkout</span>
              <span>Esc: Clear</span>
            </div>
            
            {/* Quick Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavedTransactions(true)}
              disabled={savedTransactions.length === 0}
            >
              <ClockIcon className="h-4 w-4 mr-1" />
              Saved ({savedTransactions.length})
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={saveTransaction}
              disabled={cart.length === 0}
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
              Save
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Products Panel */}
        <div className="flex-1 flex flex-col">
          {/* Search & Filters */}
          <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 p-4">
            <div className="flex gap-4">
              {/* Product Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search products... (Ctrl+F)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Barcode Input */}
              <div className="w-48 relative">
                <QrCodeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scan barcode..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      handleBarcodeInput(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="pl-10"
                />
              </div>
              
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              {/* Barcode Scanner Button */}
              <Button
                variant="outline"
                onClick={() => setShowBarcodeScanner(true)}
              >
                <QrCodeIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-auto p-4">
            {isLoadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-surface-800 rounded-lg p-4 animate-pulse">
                    <div className="bg-surface-200 dark:bg-surface-700 h-24 rounded mb-3"></div>
                    <div className="bg-surface-200 dark:bg-surface-700 h-4 rounded mb-2"></div>
                    <div className="bg-surface-200 dark:bg-surface-700 h-3 rounded w-2/3"></div>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {products.map((product) => (
                  <Card
                    key={product._id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg hover:scale-105",
                      product.stock === 0 && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => product.stock > 0 && addToCart(product)}
                  >
                    <div className="p-4">
                      {/* Product Image */}
                      <div className="h-24 bg-surface-100 dark:bg-surface-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <CubeIcon className="h-8 w-8 text-surface-400" />
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div>
                        <h3 className="font-medium text-sm text-surface-900 dark:text-surface-100 mb-1 line-clamp-2">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-surface-900 dark:text-surface-100">
                            ₹{product.price.toFixed(0)}
                          </span>
                          
                          <Badge
                            variant={
                              product.stock === 0 ? 'destructive' :
                              product.stock <= (product.minStockLevel || 10) ? 'warning' : 'success'
                            }
                            size="sm"
                          >
                            {product.stock} left
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-surface-500 dark:text-surface-400">
                          {product.category}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="w-96 bg-white dark:bg-surface-800 border-l border-surface-200 dark:border-surface-700 flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                Cart ({cartCalculations.itemCount})
              </h2>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomerModal(true)}
              >
                <UserIcon className="h-4 w-4 mr-1" />
                {customer.name || 'Customer'}
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
                  <div key={item._id} className="bg-surface-50 dark:bg-surface-700 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-surface-900 dark:text-surface-100">
                          {item.name}
                        </h4>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          ₹{item.price} each
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
                      
                      <span className="font-semibold text-surface-900 dark:text-surface-100">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary & Checkout */}
          {cart.length > 0 && (
            <div className="border-t border-surface-200 dark:border-surface-700 p-4">
              {/* Discount Section */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ReceiptPercentIcon className="h-4 w-4 text-surface-500" />
                  <span className="text-sm font-medium">Discount</span>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={discount.type}
                    onChange={(e) => setDiscount(prev => ({ ...prev, type: e.target.value }))}
                    className="px-2 py-1 text-xs border border-surface-300 dark:border-surface-700 rounded bg-white dark:bg-surface-800"
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
                  <span>Subtotal:</span>
                  <span>₹{cartCalculations.subtotal.toFixed(2)}</span>
                </div>
                
                {cartCalculations.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{cartCalculations.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Tax ({taxRate}%):</span>
                  <span>₹{cartCalculations.taxAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-lg font-bold border-t border-surface-200 dark:border-surface-700 pt-2">
                  <span>Total:</span>
                  <span>₹{cartCalculations.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={() => setShowPaymentModal(true)}
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
      </div>

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
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-surface-300 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800"
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
            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
              <h3 className="font-medium mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{cartCalculations.subtotal.toFixed(2)}</span>
                </div>
                {cartCalculations.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{cartCalculations.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>₹{cartCalculations.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-surface-200 dark:border-surface-700 pt-2">
                  <span>Total:</span>
                  <span>₹{cartCalculations.total.toFixed(2)}</span>
                </div>
                
                {paymentMethod === 'cash' && (
                  <div className="flex justify-between text-green-600">
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
                  className="flex items-center justify-between p-4 border border-surface-200 dark:border-surface-700 rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {transaction.customer.name || 'Walk-in Customer'}
                    </div>
                    <div className="text-sm text-surface-500 dark:text-surface-400">
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
    </div>
  );
}

export default Sales;