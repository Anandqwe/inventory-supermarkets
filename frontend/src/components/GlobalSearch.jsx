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

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState({
    products: [],
    sales: [],
    customers: []
  });
  const [recentSearches, setRecentSearches] = useState([]);
  
  const { token } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);
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

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      
      /* Commented out until backend sales search is fixed
      const salesPromise = fetch(`${apiBaseUrl}/api/sales?search=${encodeURIComponent(searchQuery)}&limit=5`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if (!res.ok) throw new Error('Sales search failed');
        return res.json();
      }).catch((err) => {
        console.log('Sales search error:', err);
        return { success: false, data: [] };
      });
      */

      // Search customers/suppliers (temporarily disabled)
      const customersPromise = Promise.resolve({ success: true, data: [] });
      
      /* Commented out until backend is fixed
      const customersPromise = fetch(`${apiBaseUrl}/api/master-data/suppliers?search=${encodeURIComponent(searchQuery)}&limit=5`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if (!res.ok) throw new Error('Customers search failed');
        return res.json();
      }).catch((err) => {
        console.log('Customers search error:', err);
        return { success: false, data: [] };
      });
      */

      const [productsRes, salesRes, customersRes] = await Promise.all([
        productsPromise,
        salesPromise,
        customersPromise
      ]);

      // Debug logging
      console.log('🔍 Search Results Debug:');
      console.log('Products Response:', productsRes);
      console.log('Sales Response:', salesRes);
      console.log('Customers Response:', customersRes);

      // Extract data based on actual response structure
      // Products API returns: { success: true, data: { products: [...], pagination: {...} } }
      const products = productsRes?.data?.products || productsRes?.products || [];
      const sales = salesRes?.data?.sales || salesRes?.data || [];
      const customers = customersRes?.data?.suppliers || customersRes?.data || [];

      console.log('Extracted Products:', products);
      console.log('Extracted Sales:', sales);
      console.log('Extracted Customers:', customers);

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
    setIsOpen(true);

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
    setIsOpen(false);
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
    inputRef.current?.focus();
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
      // Navigate to products page with search query
      navigate(`/products?search=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const hasResults = results.products.length > 0 || results.sales.length > 0 || results.customers.length > 0;
  const showRecent = !query && recentSearches.length > 0;

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 dark:text-amoled-muted" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleSearchChange}
            onFocus={() => setIsOpen(true)}
            placeholder="Search products, sales..."
            className="block w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 border border-slate-300 dark:border-amoled-border rounded-lg bg-white dark:bg-amoled-card text-slate-900 dark:text-amoled-primary placeholder-slate-500 dark:placeholder-amoled-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs sm:text-sm transition-all duration-200"
          />
          
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-amoled-muted dark:hover:text-amoled-secondary"
            >
              <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute mt-2 w-full sm:w-[calc(100vw-2rem)] md:w-full left-0 sm:left-auto bg-white dark:bg-amoled-card rounded-lg shadow-xl border border-slate-200 dark:border-amoled-border max-h-[70vh] sm:max-h-[32rem] overflow-y-auto z-50">
          {isSearching && (
            <div className="p-6 sm:p-8 flex items-center justify-center">
              <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary-600 dark:text-primary-400" />
              <span className="ml-2 text-xs sm:text-sm text-slate-500 dark:text-amoled-muted">Searching...</span>
            </div>
          )}

          {!isSearching && showRecent && (
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-amoled-muted uppercase">Recent Searches</span>
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
              <div className="space-y-1">
                {recentSearches.map((recent, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentClick(recent)}
                    className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm text-slate-700 dark:text-amoled-secondary hover:bg-slate-100 dark:hover:bg-amoled-hover flex items-center gap-2"
                  >
                    <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 dark:text-amoled-muted flex-shrink-0" />
                    <span className="truncate">{recent}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-amoled-border">
                <p className="text-xs text-slate-500 dark:text-amoled-muted">
                  💡 Try: <span className="font-mono text-primary-600 dark:text-primary-400">Amul</span>, <span className="font-mono text-primary-600 dark:text-primary-400">Tata</span>, <span className="font-mono text-primary-600 dark:text-primary-400">Milk</span>
                </p>
              </div>
            </div>
          )}

          {!isSearching && query && !hasResults && (
            <div className="p-6 sm:p-8 text-center">
              <MagnifyingGlassIcon className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 dark:text-amoled-muted mx-auto mb-3" />
              <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-amoled-primary">No results found</p>
              <p className="text-xs text-slate-500 dark:text-amoled-muted mt-1">
                Try different keywords
              </p>
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  💡 <strong>Tip:</strong> Search by product name, SKU, or sale number
                </p>
              </div>
            </div>
          )}

          {!isSearching && hasResults && (
            <div className="divide-y divide-slate-200 dark:divide-amoled-border">
              {/* Products Section */}
              {results.products.length > 0 && (
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <CubeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 dark:text-amoled-muted" />
                    <span className="text-xs font-medium text-slate-500 dark:text-amoled-muted uppercase">
                      Products ({results.products.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {results.products.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => handleResultClick('product', product)}
                        className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-slate-100 dark:hover:bg-amoled-hover transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-amoled-primary truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-amoled-muted truncate">
                              SKU: {product.sku} • Stock: {product.stock}
                            </p>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0">
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
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <ShoppingCartIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 dark:text-amoled-muted" />
                    <span className="text-xs font-medium text-slate-500 dark:text-amoled-muted uppercase">
                      Sales ({results.sales.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {results.sales.map((sale) => (
                      <button
                        key={sale._id}
                        onClick={() => handleResultClick('sale', sale)}
                        className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-slate-100 dark:hover:bg-amoled-hover transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-amoled-primary truncate">
                              Sale #{sale.saleNumber || sale._id?.slice(-6)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-amoled-muted truncate">
                              {new Date(sale.createdAt).toLocaleDateString()} • {sale.customer?.name || 'Walk-in'}
                            </p>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0">
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
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 dark:text-amoled-muted" />
                    <span className="text-xs font-medium text-slate-500 dark:text-amoled-muted uppercase">
                      Suppliers/Customers ({results.customers.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {results.customers.map((customer) => (
                      <button
                        key={customer._id}
                        onClick={() => handleResultClick('customer', customer)}
                        className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-slate-100 dark:hover:bg-amoled-hover transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-amoled-primary truncate">
                            {customer.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-amoled-muted truncate">
                            {customer.email || customer.phone || 'No contact info'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* View All Results */}
              <div className="p-2 sm:p-3 bg-slate-50 dark:bg-amoled-hover">
                <button
                  onClick={() => {
                    navigate(`/products?search=${encodeURIComponent(query)}`);
                    setIsOpen(false);
                    saveToRecent(query);
                  }}
                  className="w-full text-center text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 py-2 truncate"
                >
                  View all results for "{query}"
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
