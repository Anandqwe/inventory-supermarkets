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

// Enhanced Product Management with DataTable and Advanced Features
function Products() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });
  const [sorting, setSorting] = useState([]);

  // API functions
  const fetchProducts = async () => {
    const params = new URLSearchParams({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: searchTerm,
      category: selectedCategory,
      stock: stockFilter,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      sortBy: sorting[0]?.id || 'createdAt',
      sortOrder: sorting[0]?.desc ? 'desc' : 'asc'
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
    queryKey: ['products', pagination, searchTerm, selectedCategory, stockFilter, priceRange, sorting],
    queryFn: fetchProducts,
    keepPreviousData: true,
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
        throw new Error('Failed to delete product');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries(['products']);
      setShowDeleteModal(false);
      setDeletingProduct(null);
    },
    onError: (error) => {
      toast.error('Failed to delete product');
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
      queryClient.invalidateQueries(['products']);
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
      queryClient.invalidateQueries(['products']);
      setSelectedProducts([]);
      setShowBulkActions(false);
    },
    onError: (error) => {
      toast.error('Failed to update products');
    }
  });

  // Data processing
  const products = productsData?.data?.products || [];
  const totalProducts = productsData?.data?.total || 0;
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
              SKU: {row.original.sku || row.original.barcode}
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
      sku: `${product.sku}-copy`,
      barcode: `${product.barcode}-copy`
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

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.exportToCSV({
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        ...filters
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

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    // Use the actual CSV import API
    const importCSV = async () => {
      try {
        setLoading(true);
        const result = await productsAPI.importFromCSV(file);
        
        if (result.success) {
          toast.success(`CSV imported successfully! ${result.data.summary.created} products created, ${result.data.summary.updated} updated`);
          queryClient.invalidateQueries(['products']);
        } else {
          toast.error(result.message || 'Import failed');
        }
      } catch (error) {
        console.error('CSV import error:', error);
        toast.error(error.response?.data?.message || 'Failed to import CSV file');
      } finally {
        setLoading(false);
      }
    };
    
    importCSV();
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
    <div className="space-y-6">
      {/* Enhanced Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Product Management" 
          subtitle={`${totalProducts} products in inventory`}
        />
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-surface-300 dark:border-surface-700">
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

          {/* Export/Import */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Export
          </Button>
          
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" as="span">
              <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
              Import
            </Button>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>

          <Button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800"
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
            className="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800"
          >
            <option value="all">All Stock</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="h-4 w-4 mr-1" />
            Filters
          </Button>

          {/* Clear Filters */}
          {(searchTerm || selectedCategory || stockFilter !== 'all' || priceRange.min || priceRange.max) && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-red-600 hover:text-red-500"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Min Price</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Price</label>
                <Input
                  type="number"
                  placeholder="1000000"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}
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

      {/* Products Table */}
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
        ) : (
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
        )}
      </Card>

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={(productData) => {
            // Handle save logic here
            queryClient.invalidateQueries(['products']);
            setShowModal(false);
            setEditingProduct(null);
          }}
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