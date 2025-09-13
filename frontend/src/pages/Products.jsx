import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon, 
  ExclamationTriangleIcon, 
  CubeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/shell';
import { Button, Input, Card, Badge } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductModal from '../components/ProductModal';
import DeleteModal from '../components/DeleteModal';

function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const { token } = useAuth();

  // Fetch products from API
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
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.data.map(product => product.category))];
      setCategories(uniqueCategories);
      
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, [token]);

  // Handle product creation/update
  const handleSaveProduct = async (productData) => {
    try {
      const url = editingProduct 
        ? `http://localhost:5000/api/products/${editingProduct._id}`
        : 'http://localhost:5000/api/products';
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save product');
      }

      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      setShowModal(false);
      setEditingProduct(null);
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.message);
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${deletingProduct._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      toast.success('Product deleted successfully');
      setShowDeleteModal(false);
      setDeletingProduct(null);
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  // Get stock status and color
  const getStockStatus = (quantity, reorderLevel) => {
    if (quantity <= reorderLevel) return { status: 'low', label: 'Low Stock' };
    if (quantity <= reorderLevel * 1.5) return { status: 'medium', label: 'Medium Stock' };
    return { status: 'good', label: 'In Stock' };
  };

  const getStockColor = (status) => {
    switch (status) {
      case 'low': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-green-600 bg-green-100 border-green-200';
    }
  };

  // Open edit modal
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  // Open delete modal
  const handleDeleteClick = (product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader 
        title="Products"
        subtitle="Manage your inventory items and stock levels"
      >
        <Button
          onClick={() => setShowModal(true)}
          variant="primary"
          size="sm"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={MagnifyingGlassIcon}
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-md leading-5 bg-white dark:bg-[#09090b] text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center text-sm text-surface-600 dark:text-surface-400">
            <CubeIcon className="h-4 w-4 mr-2" />
            {filteredProducts.length} of {products.length} products
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="px-4 py-5 sm:p-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <CubeIcon className="mx-auto h-12 w-12 text-surface-400" />
              <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-surface-100">No products found</h3>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                {searchTerm || selectedCategory ? 'Try adjusting your filters' : 'Get started by creating a new product'}
              </p>
              {!searchTerm && !selectedCategory && (
                <div className="mt-6">
                  <Button
                    onClick={() => setShowModal(true)}
                    variant="primary"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
                <thead className="bg-surface-50 dark:bg-[#0a0a0b]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#09090b] divide-y divide-surface-200 dark:divide-surface-700">
                  {filteredProducts.map((product) => {
                    const stockInfo = getStockStatus(product.quantity, product.reorderLevel || 10);
                    return (
                      <tr key={product._id} className="hover:bg-surface-50 dark:hover:bg-[#18181b] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-surface-900 dark:text-surface-100">{product.name}</div>
                          {product.brand && (
                            <div className="text-sm text-surface-500 dark:text-surface-400">{product.brand}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-900 dark:text-surface-100">
                          {product.sku || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-900 dark:text-surface-100">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-900 dark:text-surface-100">
                          ₹{product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-900 dark:text-surface-100">
                          {product.quantity} {product.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={stockInfo.status === 'low' ? 'danger' : stockInfo.status === 'out' ? 'warning' : 'success'}
                            size="sm"
                          >
                            {stockInfo.status === 'low' && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
                            {stockInfo.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="text-emerald-500 hover:text-emerald-400 dark:text-emerald-400 dark:hover:text-emerald-300"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(product)}
                              className="text-rose-500 hover:text-rose-400 dark:text-rose-400 dark:hover:text-rose-300"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          onSave={handleSaveProduct}
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
          onConfirm={handleDeleteProduct}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeletingProduct(null);
          }}
        />
      )}
    </div>
  );
}

export default Products;
