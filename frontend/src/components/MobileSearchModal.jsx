import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  CubeIcon, 
  ShoppingCartIcon, 
  UserIcon,
  ClockIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

const MobileSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState({
    products: [],
    sales: [],
    customers: []
  });
  const [recentSearches, setRecentSearches] = useState([]);
  
  const { token } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load recent searches:', e);
      }
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Debounced search function
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults({ products: [], sales: [], customers: [] });
      return;
    }

    setIsSearching(true);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    try {
      // Search products
      const productsPromise = fetch(`${apiBaseUrl}/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if (!res.ok) throw new Error('Products search failed');
        return res.json();
      }).catch((err) => {
        console.log('Products search error:', err);
        return { success: false, data: [] };
      });

      // Search sales (temporarily disabled due to backend error)
      const salesPromise = Promise.resolve({ success: true, data: [] });
      
      // Search customers/suppliers (temporarily disabled)
      const customersPromise = Promise.resolve({ success: true, data: [] });

      const [productsRes, salesRes, customersRes] = await Promise.all([
        productsPromise,
        salesPromise,
        customersPromise
      ]);

      // Extract data based on actual response structure
      const products = productsRes?.data?.products || productsRes?.products || [];
      const sales = salesRes?.data?.sales || salesRes?.data || [];
      const customers = customersRes?.data?.suppliers || customersRes?.data || [];

      setResults({
        products: Array.isArray(products) ? products : [],
        sales: Array.isArray(sales) ? sales : [],
        customers: Array.isArray(customers) ? customers : []
      });
    } catch (error) {
      console.error('Search error:', error);
      setResults({ products: [], sales: [], customers: [] });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Save to recent searches
  const saveToRecent = (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    const updated = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5);
    
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Handle result click
  const handleResultClick = (type, item) => {
    saveToRecent(query);
    onClose();
    setQuery('');
    
    switch (type) {
      case 'product':
        navigate(`/products`);
        break;
      case 'sale':
        navigate(`/sales`);
        break;
      case 'customer':
        navigate(`/sales`);
        break;
      default:
        break;
    }
  };

  // Handle recent search click
  const handleRecentClick = (searchQuery) => {
    setQuery(searchQuery);
    performSearch(searchQuery);
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setResults({ products: [], sales: [], customers: [] });
    inputRef.current?.focus();
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveToRecent(query);
      navigate(`/products?search=${encodeURIComponent(query)}`);
      onClose();
      setQuery('');
    }
  };

  const hasResults = results.products.length > 0 || results.sales.length > 0 || results.customers.length > 0;
  const showRecent = !query && recentSearches.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative h-full bg-white dark:bg-black flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-zinc-900">
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:text-zinc-600 dark:hover:text-zinc-400 rounded-lg"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          
          <form onSubmit={handleSubmit} className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 dark:text-zinc-600" />
              </div>
              
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleSearchChange}
                placeholder="Search products, sales, customers..."
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-zinc-900 rounded-lg bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-500 dark:placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              />
              
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-zinc-600 dark:hover:text-zinc-400"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {isSearching && (
            <div className="p-8 flex items-center justify-center">
              <ArrowPathIcon className="h-6 w-6 animate-spin text-primary-600 dark:text-primary-400" />
              <span className="ml-2 text-sm text-slate-500 dark:text-zinc-600">Searching...</span>
            </div>
          )}

          {!isSearching && showRecent && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-600 uppercase">Recent Searches</span>
                <button
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('recentSearches');
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {recentSearches.map((recent, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentClick(recent)}
                    className="w-full text-left px-4 py-3 rounded-lg text-base text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center gap-3"
                  >
                    <ClockIcon className="h-5 w-5 text-slate-400 dark:text-zinc-600 flex-shrink-0" />
                    <span className="truncate">{recent}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  💡 <strong>Try:</strong> <span className="font-mono text-blue-600 dark:text-blue-400">Amul</span>, <span className="font-mono text-blue-600 dark:text-blue-400">Tata</span>, <span className="font-mono text-blue-600 dark:text-blue-400">Milk</span>
                </p>
              </div>
            </div>
          )}

          {!isSearching && query && !hasResults && (
            <div className="p-8 text-center">
              <MagnifyingGlassIcon className="h-16 w-16 text-slate-300 dark:text-zinc-600 mx-auto mb-4" />
              <p className="text-base font-medium text-slate-900 dark:text-zinc-100">No results found</p>
              <p className="text-sm text-slate-500 dark:text-zinc-600 mt-2">
                Try different keywords
              </p>
            </div>
          )}

          {!isSearching && hasResults && (
            <div className="divide-y divide-slate-200 dark:divide-zinc-900">
              {/* Products Section */}
              {results.products.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CubeIcon className="h-5 w-5 text-slate-400 dark:text-zinc-600" />
                    <span className="text-sm font-medium text-slate-500 dark:text-zinc-600 uppercase">
                      Products ({results.products.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {results.products.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => handleResultClick('product', product)}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-slate-900 dark:text-zinc-100 truncate">
                              {product.name}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-zinc-600 truncate">
                              SKU: {product.sku} • Stock: {product.stock}
                            </p>
                          </div>
                          <span className="text-base font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0">
                            ₹{product.price?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sales Section */}
              {results.sales.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingCartIcon className="h-5 w-5 text-slate-400 dark:text-zinc-600" />
                    <span className="text-sm font-medium text-slate-500 dark:text-zinc-600 uppercase">
                      Sales ({results.sales.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {results.sales.map((sale) => (
                      <button
                        key={sale._id}
                        onClick={() => handleResultClick('sale', sale)}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-slate-900 dark:text-zinc-100 truncate">
                              Sale #{sale.saleNumber || sale._id?.slice(-6)}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-zinc-600 truncate">
                              {new Date(sale.createdAt).toLocaleDateString()} • {sale.customer?.name || 'Walk-in'}
                            </p>
                          </div>
                          <span className="text-base font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0">
                            ₹{sale.total?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers Section */}
              {results.customers.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <UserIcon className="h-5 w-5 text-slate-400 dark:text-zinc-600" />
                    <span className="text-sm font-medium text-slate-500 dark:text-zinc-600 uppercase">
                      Suppliers/Customers ({results.customers.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {results.customers.map((customer) => (
                      <button
                        key={customer._id}
                        onClick={() => handleResultClick('customer', customer)}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-slate-900 dark:text-zinc-100 truncate">
                            {customer.name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-zinc-600 truncate">
                            {customer.email || customer.phone || 'No contact info'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* View All Results */}
              <div className="p-4">
                <button
                  onClick={() => {
                    navigate(`/products?search=${encodeURIComponent(query)}`);
                    onClose();
                    saveToRecent(query);
                  }}
                  className="w-full text-center text-base font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 py-3 px-4 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  View all results for "{query}"
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileSearchModal;
