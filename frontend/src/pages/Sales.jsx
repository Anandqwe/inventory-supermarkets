import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MinusIcon,
  MagnifyingGlassIcon, 
  TrashIcon, 
  ShoppingCartIcon, 
  CalculatorIcon, 
  UserIcon, 
  CreditCardIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/shell';
import { Button, Input, Card, Badge } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';

function Sales() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const { token } = useAuth();

  // Fetch products for selection
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add product to cart
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product._id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast.error(`Cannot add more. Only ${product.quantity} ${product.unit} available in stock`);
        return;
      }
      updateCartQuantity(existingItem.productId, existingItem.quantity + 1);
    } else {
      if (product.quantity <= 0) {
        toast.error('Product is out of stock');
        return;
      }
      
      const newItem = {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        unit: product.unit,
        maxQuantity: product.quantity
      };
      
      setCart([...cart, newItem]);
      toast.success(`${product.name} added to cart`);
    }
  };

  // Update cart item quantity
  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => {
      if (item.productId === productId) {
        if (newQuantity > item.maxQuantity) {
          toast.error(`Cannot add more. Only ${item.maxQuantity} ${item.unit} available`);
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmountCalculated = discountPercentage > 0 
    ? (subtotal * discountPercentage / 100) 
    : discountAmount;
  const taxRate = 18; // 18% GST
  const taxAmount = (subtotal - discountAmountCalculated) * taxRate / 100;
  const grandTotal = subtotal - discountAmountCalculated + taxAmount;

  // Handle discount changes
  const handleDiscountPercentageChange = (value) => {
    setDiscountPercentage(value);
    setDiscountAmount(0); // Clear fixed discount when percentage is set
  };

  const handleDiscountAmountChange = (value) => {
    setDiscountAmount(value);
    setDiscountPercentage(0); // Clear percentage when fixed amount is set
  };

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      toast.error('Please add items to cart');
      return;
    }

    setProcessing(true);

    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        customerName: customerInfo.name || undefined,
        customerPhone: customerInfo.phone || undefined,
        customerEmail: customerInfo.email || undefined,
        paymentMethod,
        discountPercentage: discountPercentage || undefined,
        discountAmount: discountAmount || undefined
      };

      const response = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saleData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process sale');
      }

      const result = await response.json();
      
      toast.success(`Sale completed! Total: ₹${grandTotal.toFixed(2)}`);
      
      // Clear the cart and customer info
      setCart([]);
      setCustomerInfo({ name: '', phone: '', email: '' });
      setDiscountPercentage(0);
      setDiscountAmount(0);
      
      // Refresh products to update stock quantities
      fetchProducts();

    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-3">
      <PageHeader 
        title="Point of Sale"
        subtitle="Search and add products to create a sale"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {/* Product Selection */}
        <div className="md:col-span-1 lg:col-span-2 xl:col-span-3 space-y-3">
          {/* Search */}
          <Input
            type="text"
            placeholder="Search products by name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={MagnifyingGlassIcon}
            size="lg"
          />

          {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white dark:bg-[#09090b] p-3 rounded-lg shadow border border-gray-200 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-800 cursor-pointer transition-colors"
              onClick={() => addToCart(product)}
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{product.name}</h3>
                  <span className="text-sm font-bold text-violet-600 dark:text-violet-400 ml-2">₹{product.price}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.category}</p>
                <div className="mt-auto">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {product.quantity} {product.unit}
                    </span>
                    {product.quantity <= (product.reorderLevel || 10) && (
                      <span className="inline-flex items-center px-1.5 py-0.5 mt-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-6">
            <ShoppingCartIcon className="mx-auto h-8 w-8 text-surface-400" />
            <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-surface-100">No products found</h3>
            <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
              Try adjusting your search terms
            </p>
          </div>
        )}
        </div>

        {/* Shopping Cart & Checkout */}
        <div className="space-y-4">
        {/* Cart */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-md font-medium text-surface-900 dark:text-surface-100">Shopping Cart</h2>
            <span className="text-sm text-surface-500 dark:text-surface-400">{cart.length} items</span>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-4">
              <ShoppingCartIcon className="mx-auto h-6 w-6 text-surface-400" />
              <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[calc(100vh-420px)] overflow-y-auto">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-2 bg-surface-50 dark:bg-surface-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-surface-900 dark:text-surface-100">{item.name}</h4>
                    <p className="text-xs text-surface-500 dark:text-surface-400">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 p-0 rounded-full"
                    >
                      <MinusIcon className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm text-surface-900 dark:text-surface-100">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                      className="w-6 h-6 p-0 rounded-full"
                    >
                      <PlusIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.productId)}
                      className="ml-2 text-danger-600 hover:text-danger-800 dark:text-danger-400 dark:hover:text-danger-300 p-1"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Customer Information */}
        <Card className="p-3">
          <div className="flex items-center mb-2">
            <UserIcon className="h-4 w-4 text-surface-400 mr-1.5" />
            <h2 className="text-md font-medium text-surface-900 dark:text-surface-100">Customer Information</h2>
          </div>
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Customer Name (Optional)"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              size="sm"
            />
            <Input
              type="tel"
              placeholder="Phone Number (Optional)"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              size="sm"
            />
          </div>
        </Card>

        {/* Payment & Discounts */}
        <Card className="p-3">
          <div className="flex items-center mb-2">
            <CreditCardIcon className="h-4 w-4 text-surface-400 mr-1.5" />
            <h2 className="text-md font-medium text-surface-900 dark:text-surface-100">Payment & Discounts</h2>
          </div>
          
          <div className="space-y-2">
            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="block w-full px-2 py-1 border border-surface-300 dark:border-surface-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="netbanking">Net Banking</option>
              </select>
            </div>

            {/* Discounts */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">Discount %</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => handleDiscountPercentageChange(parseFloat(e.target.value) || 0)}
                  size="sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">Discount ₹</label>
                <Input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => handleDiscountAmountChange(parseFloat(e.target.value) || 0)}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Order Summary */}
        <Card className="p-3">
          <div className="flex items-center mb-2">
            <CalculatorIcon className="h-4 w-4 text-surface-400 mr-1.5" />
            <h2 className="text-md font-medium text-surface-900 dark:text-surface-100">Order Summary</h2>
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-surface-600 dark:text-surface-400">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmountCalculated > 0 && (
              <div className="flex justify-between text-success-600">
                <span>Discount:</span>
                <span>-₹{discountAmountCalculated.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-surface-600 dark:text-surface-400">
              <span>Tax (18%):</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-surface-200 dark:border-surface-600 pt-1 mt-1 flex justify-between font-bold text-sm text-surface-900 dark:text-surface-100">
              <span>Total:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={processSale}
            disabled={cart.length === 0 || processing}
            className="w-full mt-3"
            size="default"
          >
            {processing ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              `Complete Sale - ₹${grandTotal.toFixed(2)}`
            )}
          </Button>
        </Card>
        </div>
      </div>
    </div>
  );
}

export default Sales;
