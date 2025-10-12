import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon, 
  ExclamationTriangleIcon, 
  CubeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CheckIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  TagIcon,
  CameraIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/shell';
import { 
  Button, 
  Input, 
  Card, 
  Badge,
  DataTable,
  Modal,
  EmptyState,
  SkeletonTable
} from '../components/ui';
import { LoadingSpinner } from '../components/LoadingSpinner';
import ProductModal from '../components/ProductModal';
import DeleteModal from '../components/DeleteModal';
import { cn } from '../utils/cn';
import { productsAPI } from '../utils/api';

// Enhanced Product Management with DataTable and Advanced Features
function Products() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [debouncedPriceRange, setDebouncedPriceRange] = useState({ min: '', max: '' });
  
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });
  const [sorting, setSorting] = useState([]);

  // Debounce search term to avoid excessive API calls while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounce price range to avoid excessive API calls while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [priceRange.min, priceRange.max]);

  // Reset pagination when filters change (using debounced values)
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearchTerm, selectedCategory, stockFilter, debouncedPriceRange.min, debouncedPriceRange.max]);

  // API functions
  const fetchProducts = async () => {
    const params = new URLSearchParams({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      sortBy: sorting[0]?.id || 'createdAt',
      sortOrder: sorting[0]?.desc ? 'desc' : 'asc'
    });

    // Add optional filters only if they have values (using debounced values)
    if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
    if (selectedCategory) params.append('category', selectedCategory);
    if (debouncedPriceRange.min) params.append('minPrice', debouncedPriceRange.min);
    if (debouncedPriceRange.max) params.append('maxPrice', debouncedPriceRange.max);
    
    // Add stock filter if not 'all'
    if (stockFilter && stockFilter !== 'all') {
      params.append('stock', stockFilter);
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

  // React Query hooks
  const { 
    data: productsData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['products', pagination, debouncedSearchTerm, selectedCategory, stockFilter, debouncedPriceRange.min, debouncedPriceRange.max, sorting],
    queryFn: fetchProducts,
    keepPreviousData: true,
    staleTime: 30000, // Cache for 30 seconds to prevent unnecessary refetches
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // Mutations
  const deleteProductMutation = useMutation({
    mutationFn: async (productId) => {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete product');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
      // Invalidate and refetch the products query
      queryClient.invalidateQueries({ queryKey: ['products'] });
      refetch();
      setShowDeleteModal(false);
      setDeletingProduct(null);
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete product');
      setShowDeleteModal(false);
      setDeletingProduct(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds) => {
      const response = await fetch('http://localhost:5000/api/products/bulk-delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productIds })
      });

      if (!response.ok) {
        throw new Error('Failed to delete products');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(`${selectedProducts.length} products deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      refetch();
      setSelectedProducts([]);
      setShowBulkActions(false);
    },
    onError: (error) => {
      toast.error('Failed to delete products');
    }
  });

  const bulkUpdateCategoryMutation = useMutation({
    mutationFn: async ({ productIds, category }) => {
      const response = await fetch('http://localhost:5000/api/products/bulk-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productIds, updates: { category } })
      });

      if (!response.ok) {
        throw new Error('Failed to update products');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Products updated successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      refetch();
      setSelectedProducts([]);
      setShowBulkActions(false);
    },
    onError: (error) => {
      toast.error('Failed to update products');
    }
  });

  // Data processing
  const products = productsData?.data?.products || [];
  const totalProducts = productsData?.data?.pagination?.totalItems || 0;
  const categories = categoriesData?.data || [];

  // DataTable columns configuration
  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="rounded"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded"
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.image ? (
            <img 
              src={row.original.image} 
              alt={row.original.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="h-10 w-10 bg-surface-100 dark:bg-surface-800 rounded-lg flex items-center justify-center">
              <CubeIcon className="h-5 w-5 text-surface-400" />
            </div>
          )}
          <div>
            <div className="font-medium text-surface-900 dark:text-surface-100">
              {row.original.name}
            </div>
            <div className="text-sm text-surface-500 dark:text-surface-400">
              SKU: {row.original.sku}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.category?.name || row.original.category || 'N/A'}
        </Badge>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <div className="font-medium">
          ₹{(row.original.price || 0).toLocaleString('en-IN')}
        </div>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => {
        const stock = row.original.stock || 0;
        const minLevel = row.original.minStockLevel || 10;
        
        const getStockStatus = () => {
          if (stock === 0) return { variant: 'destructive', label: 'Out of Stock' };
          if (stock <= minLevel) return { variant: 'warning', label: 'Low Stock' };
          if (stock <= minLevel * 1.5) return { variant: 'secondary', label: 'Medium' };
          return { variant: 'success', label: 'In Stock' };
        };

        const status = getStockStatus();

        return (
          <div className="flex items-center gap-2">
            <Badge variant={status.variant} size="sm">
              {stock} units
            </Badge>
            <span className="text-xs text-surface-500 dark:text-surface-400">
              {status.label}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => (
        <span className="text-sm text-surface-600 dark:text-surface-400">
          {row.original.supplier?.name || row.original.supplier || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Added',
      cell: ({ row }) => (
        <span className="text-sm text-surface-600 dark:text-surface-400">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditProduct(row.original)}
            className="h-8 w-8 p-0"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDuplicateProduct(row.original)}
            className="h-8 w-8 p-0"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(row.original)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-500"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
  ], []);

  // Event handlers
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDuplicateProduct = (product) => {
    const duplicatedProduct = {
      ...product,
      name: `${product.name} (Copy)`,
      sku: `${product.sku}-copy`
    };
    delete duplicatedProduct._id;
    setEditingProduct(duplicatedProduct);
    setShowModal(true);
  };

  const handleDeleteClick = (product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    bulkDeleteMutation.mutate(selectedProducts.map(p => p._id));
  };

  const handleBulkCategoryUpdate = (category) => {
    if (selectedProducts.length === 0) return;
    bulkUpdateCategoryMutation.mutate({
      productIds: selectedProducts.map(p => p._id),
      category
    });
  };

  const handleProductSave = async (productData) => {
    try {
      setLoading(true);
      if (editingProduct && editingProduct._id) {
        // Update existing product
        const response = await fetch(`http://localhost:5000/api/products/${editingProduct._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update product');
        }

        toast.success('Product updated successfully');
      } else {
        // Create new product
        const response = await fetch('http://localhost:5000/api/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create product');
        }

        toast.success('Product created successfully');
      }

      queryClient.invalidateQueries(['products']);
      setShowModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
      throw error; // Re-throw to let ProductModal handle loading state
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.exportToCSV({
        category: selectedCategory,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        stock: stockFilter,
        search: searchTerm
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Products exported to CSV successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Failed to export products');
    } finally {
      setLoading(false);
    }
  };

  const handleImportCSV = async (event) => {
    const file = event.target.files[0];
    console.log('Import file selected:', file);
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a valid CSV file');
      event.target.value = '';
      return;
    }

    try {
      setLoading(true);
      console.log('Starting import...');
      
      const result = await productsAPI.importFromCSV(file);
      console.log('Import result:', result);
      
      if (result.success) {
        const summary = result.data?.summary || {};
        toast.success(
          `CSV imported successfully! ${summary.created || 0} products created, ${summary.updated || 0} updated${summary.errors > 0 ? `, ${summary.errors} errors` : ''}`
        );
        queryClient.invalidateQueries(['products']);
        // Reset the file input
        event.target.value = '';
      } else {
        toast.error(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('CSV import error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to import CSV file';
      toast.error(errorMessage);
      // Reset the file input on error too
      event.target.value = '';
    } finally {
      setLoading(false);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setStockFilter('all');
    setPriceRange({ min: '', max: '' });
  };

  // Loading state
  if (isLoading && !productsData) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Product Management" 
          subtitle="Manage your inventory with advanced tools"
        />
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6 max-w-full overflow-hidden">
      {/* Enhanced Header with Actions */}
      <div className="flex flex-col gap-4 max-w-full">
        <PageHeader 
          title="Product Management" 
          subtitle={`${totalProducts} products in inventory`}
        />
        
        <div className="flex flex-wrap items-center gap-2 w-full max-w-full">
          {/* View Mode Toggle - Hidden on mobile */}
          <div className="hidden sm:flex rounded-lg border border-surface-300 dark:border-surface-700 shrink-0">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none"
            >
              <ListBulletIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </Button>
          </div>

          {/* Export/Import - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={loading}
            >
              <ArrowDownTrayIcon className={cn("h-4 w-4", loading && "animate-spin")} />
              <span className="hidden lg:inline ml-1">{loading ? 'Exporting...' : 'Export'}</span>
            </Button>
            
            <label 
              htmlFor="csv-import"
              className={cn(
                "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800",
                "hover:bg-surface-50 dark:hover:bg-surface-700 cursor-pointer",
                loading && "opacity-50 pointer-events-none cursor-not-allowed"
              )}
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              <span className="hidden lg:inline ml-1">{loading ? 'Importing...' : 'Import'}</span>
              <input
                id="csv-import"
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>

          <Button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search */}
          <div className="w-full">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission/page reload
                  }
                }}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-sm w-full"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-sm w-full"
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>

            {/* Price Range - Mobile: Full width */}
            <div className="sm:col-span-2 lg:col-span-2 flex gap-2">
              <Input
                type="number"
                placeholder="Min Price"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission/page reload
                  }
                }}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Max Price"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission/page reload
                  }
                }}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
              </span>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
                
                <select
                  onChange={(e) => e.target.value && handleBulkCategoryUpdate(e.target.value)}
                  className="px-3 py-1 text-sm border border-surface-300 dark:border-surface-700 rounded bg-white dark:bg-surface-800"
                  defaultValue=""
                >
                  <option value="">Update Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProducts([])}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Products Table or Grid */}
      <Card>
        {isLoading ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={CubeIcon}
            title="No products found"
            description="Get started by adding your first product to the inventory."
            action={
              <Button onClick={() => setShowModal(true)}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            }
          />
        ) : viewMode === 'table' ? (
          <DataTable
            data={products}
            columns={columns}
            pagination={pagination}
            sorting={sorting}
            rowSelection={selectedProducts}
            onPaginationChange={setPagination}
            onSortingChange={setSorting}
            onRowSelectionChange={setSelectedProducts}
            pageCount={Math.ceil(totalProducts / pagination.pageSize)}
            totalRows={totalProducts}
          />
        ) : (
          /* Grid View */
          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {products.map((product) => (
                <Card
                  key={product._id}
                  className="p-3 sm:p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleEditProduct(product)}
                >
                  <div className="space-y-2 sm:space-y-3">
                    {/* Product Image */}
                    <div className="aspect-square bg-surface-100 dark:bg-surface-800 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <CubeIcon className="h-12 sm:h-16 w-12 sm:w-16 text-surface-400" />
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-surface-900 dark:text-surface-100 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                        {product.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1">
                        SKU: {product.sku}
                      </p>
                    </div>
                    
                    {/* Price and Stock */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-base sm:text-lg font-bold text-primary-600 dark:text-primary-400 truncate">
                          ₹{(product.pricing?.sellingPrice || product.price || 0).toLocaleString('en-IN')}
                        </div>
                        {product.pricing?.mrp && product.pricing.mrp > product.pricing.sellingPrice && (
                          <div className="text-xs text-surface-500 line-through">
                            ₹{product.pricing.mrp.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={
                          (product.stock || product.quantity || 0) <= 0 ? 'destructive' :
                          (product.stock || product.quantity || 0) <= (product.minStockLevel || product.reorderLevel || 10) ? 'warning' : 'success'
                        }
                        className="text-xs shrink-0"
                      >
                        {product.stock || product.quantity || 0}
                      </Badge>
                    </div>
                    
                    {/* Category */}
                    <div className="text-xs text-surface-500 dark:text-surface-400">
                      {product.category?.name || product.category || 'Uncategorized'}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-surface-200 dark:border-surface-700">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProduct(product);
                        }}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        <PencilIcon className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(product);
                        }}
                        className="flex-1 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:border-red-600"
                      >
                        <TrashIcon className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Pagination for Grid View */}
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-surface-200 dark:border-surface-700 pt-4">
              <div className="text-xs sm:text-sm text-surface-600 dark:text-surface-400 text-center sm:text-left">
                Showing {(pagination.pageIndex * pagination.pageSize) + 1} to {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalProducts)} of {totalProducts} products
              </div>
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
                <span className="text-xs sm:text-sm text-surface-600 dark:text-surface-400 px-2">
                  Page {pagination.pageIndex + 1} of {Math.ceil(totalProducts / pagination.pageSize)}
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
            </div>
          </div>
        )}
      </Card>

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={handleProductSave}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteModal
          title="Delete Product"
          message={`Are you sure you want to delete "${deletingProduct?.name}"? This action cannot be undone.`}
          onConfirm={() => deleteProductMutation.mutate(deletingProduct._id)}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeletingProduct(null);
          }}
          loading={deleteProductMutation.isLoading}
        />
      )}
    </div>
  );
}

export default Products;