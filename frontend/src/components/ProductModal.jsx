import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

function ProductModal({ product, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    brand: '',
    sku: '',
    barcode: '',
    price: '',
    costPrice: '',
    quantity: '',
    unit: 'pieces',
    reorderLevel: '',
    maxStockLevel: '',
    supplier: '',
    expiryDate: '',
    gstRate: '18'
  });

  const [loading, setLoading] = useState(false);

  // Populate form with existing product data when editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        brand: product.brand || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        price: product.price || '',
        costPrice: product.costPrice || '',
        quantity: product.quantity || '',
        unit: product.unit || 'pieces',
        reorderLevel: product.reorderLevel || '',
        maxStockLevel: product.maxStockLevel || '',
        supplier: product.supplier || '',
        expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
        gstRate: product.gstRate || '18'
      });
    }
  }, [product]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!formData.name || !formData.category || !formData.price || !formData.quantity) {
      alert('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Prepare data for API
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
      quantity: parseInt(formData.quantity),
      reorderLevel: formData.reorderLevel ? parseInt(formData.reorderLevel) : undefined,
      maxStockLevel: formData.maxStockLevel ? parseInt(formData.maxStockLevel) : undefined,
      gstRate: parseFloat(formData.gstRate),
      expiryDate: formData.expiryDate || undefined
    };

    try {
      await onSave(productData);
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Dairy', 'Bakery', 'Produce', 'Meat', 'Grains', 'Pantry', 'Beverages', 
    'Snacks', 'Frozen', 'Personal Care', 'Household', 'Other'
  ];

  const units = [
    'pieces', 'kg', 'grams', 'liters', 'ml', 'boxes', 'packets', 'bottles'
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-[#09090b] dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Basic Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Barcode
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Pricing & Inventory</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unit
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    name="reorderLevel"
                    value={formData.reorderLevel}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Stock Level
                  </label>
                  <input
                    type="number"
                    name="maxStockLevel"
                    value={formData.maxStockLevel}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    GST Rate (%)
                  </label>
                  <select
                    name="gstRate"
                    value={formData.gstRate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-[#18181b] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                product ? 'Update Product' : 'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductModal;