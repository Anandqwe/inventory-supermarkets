import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  InformationCircleIcon,
  CurrencyDollarIcon,
  CubeIcon,
  TagIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

function ProductModal({ product, onSave, onClose }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    unit: '',
    sku: '',
    pricing: {
      costPrice: '',
      sellingPrice: '',
      mrp: '',
      taxRate: '18'
    },
    branchStocks: [],
    supplier: '',
    taxSettings: {
      gstRate: 18,
      hsnCode: '',
      taxable: true
    },
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch categories from API
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/products/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  // Fetch brands from API
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/master-data/brands', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch brands');
      return response.json();
    },
  });

  // Fetch units from API
  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/master-data/units', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch units');
      return response.json();
    },
  });

  // Fetch suppliers from API
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/master-data/suppliers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      return response.json();
    },
  });

  // Fetch branches from API
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/master-data/branches', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch branches');
      return response.json();
    },
  });

  const categories = categoriesData?.data || [];
  const brands = brandsData?.data || [];
  const units = unitsData?.data || [];
  const suppliers = suppliersData?.data || [];
  const branches = branchesData?.data || [];

  // Populate form with existing product data when editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category?._id || product.category || '',
        brand: product.brand?._id || product.brand || '',
        unit: product.unit?._id || product.unit || '',
        sku: product.sku || '',
        pricing: {
          costPrice: product.pricing?.costPrice || product.costPrice || '',
          sellingPrice: product.pricing?.sellingPrice || product.price || '',
          mrp: product.pricing?.mrp || product.mrp || '',
          taxRate: product.pricing?.taxRate || product.gstRate || '18'
        },
        branchStocks: product.stockByBranch || product.branchStocks || [],
        supplier: product.supplier?._id || product.supplier || '',
        taxSettings: {
          gstRate: product.taxSettings?.gstRate || product.gstRate || 18,
          hsnCode: product.taxSettings?.hsnCode || '',
          taxable: product.taxSettings?.taxable !== false
        },
        isActive: product.isActive !== false
      });
    } else {
      // Initialize branch stocks for new products
      if (branches.length > 0 && formData.branchStocks.length === 0) {
        setFormData(prev => ({
          ...prev,
          branchStocks: branches.map(branch => ({
            branchId: branch._id,
            quantity: 0,
            reorderLevel: 10,
            maxStockLevel: 1000
          }))
        }));
      }
    }
  }, [product, branches]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('pricing.')) {
      const pricingField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          [pricingField]: value
        }
      }));
    } else if (name.startsWith('taxSettings.')) {
      const taxField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        taxSettings: {
          ...prev.taxSettings,
          [taxField]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBranchStockChange = (branchId, field, value) => {
    setFormData(prev => ({
      ...prev,
      branchStocks: prev.branchStocks.map(stock =>
        stock.branchId === branchId || stock.branch?._id === branchId
          ? { ...stock, [field]: value }
          : stock
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) newErrors.name = 'Product name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (!formData.sku?.trim()) newErrors.sku = 'SKU is required';
    if (!formData.pricing.sellingPrice || parseFloat(formData.pricing.sellingPrice) <= 0) {
      newErrors.sellingPrice = 'Valid selling price is required';
    }
    if (formData.pricing.costPrice && parseFloat(formData.pricing.costPrice) > parseFloat(formData.pricing.sellingPrice)) {
      newErrors.costPrice = 'Cost price cannot be greater than selling price';
    }
    if (formData.pricing.mrp && parseFloat(formData.pricing.mrp) < parseFloat(formData.pricing.sellingPrice)) {
      newErrors.mrp = 'MRP cannot be less than selling price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setActiveTab('basic'); // Switch to basic tab if there are errors
      return;
    }

    setLoading(true);

    // Prepare data for API
    const productData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      category: formData.category,
      brand: formData.brand || undefined,
      unit: formData.unit,
      sku: formData.sku.trim().toUpperCase(),
      pricing: {
        costPrice: parseFloat(formData.pricing.costPrice) || 0,
        sellingPrice: parseFloat(formData.pricing.sellingPrice),
        mrp: parseFloat(formData.pricing.mrp) || parseFloat(formData.pricing.sellingPrice),
        taxRate: parseFloat(formData.pricing.taxRate) || 18
      },
      branchStocks: formData.branchStocks.map(stock => ({
        branchId: stock.branchId || stock.branch?._id,
        quantity: parseInt(stock.quantity) || 0,
        reorderLevel: parseInt(stock.reorderLevel) || 10,
        maxStockLevel: parseInt(stock.maxStockLevel) || 1000
      })),
      supplier: formData.supplier || undefined,
      taxSettings: {
        gstRate: parseFloat(formData.taxSettings.gstRate) || 18,
        hsnCode: formData.taxSettings.hsnCode?.trim() || '',
        taxable: formData.taxSettings.taxable
      },
      isActive: formData.isActive
    };

    try {
      await onSave(productData);
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: InformationCircleIcon },
    { id: 'pricing', name: 'Pricing', icon: CurrencyDollarIcon },
    { id: 'inventory', name: 'Inventory', icon: CubeIcon },
    { id: 'tax', name: 'Tax & Compliance', icon: TagIcon },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] overflow-hidden">
      <div className="h-full w-full overflow-y-auto overflow-x-hidden">
        <div className="min-h-full sm:min-h-0 flex items-start sm:items-center justify-center p-0 sm:p-4">
          <div className="relative w-full sm:max-w-5xl bg-white dark:bg-black sm:rounded-xl shadow-2xl border-0 sm:border border-surface-200 dark:border-zinc-900 min-h-screen sm:min-h-0 sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-surface-200 dark:border-zinc-900 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-zinc-950 dark:to-black">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 bg-blue-600 dark:bg-purple-600 rounded-lg shrink-0 shadow-lg dark:shadow-purple-950/50">
              <CubeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-surface-900 dark:text-zinc-100 truncate">
                {product ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="text-xs sm:text-sm text-surface-600 dark:text-zinc-500 hidden sm:block">
                {product ? 'Update product information' : 'Create a new product in your inventory'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-surface-400 hover:text-surface-600 dark:text-zinc-500 dark:hover:text-zinc-100 hover:bg-surface-100 dark:hover:bg-zinc-900 rounded-lg transition-colors shrink-0"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-surface-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 overflow-x-auto scrollbar-hide">
          <nav className="flex space-x-0 sm:space-x-1 px-3 sm:px-6 w-full sm:w-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap flex-1 sm:flex-initial
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:border-purple-500 dark:text-purple-400'
                    : 'border-transparent text-surface-600 dark:text-zinc-500 hover:text-surface-900 dark:hover:text-zinc-100 hover:border-surface-300 dark:hover:border-zinc-800'
                  }
                `}
              >
                <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 max-w-full dark:bg-black">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4 sm:space-y-6 max-w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
                  {/* Product Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Amul Milk 1L"
                      className={`
                        w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-zinc-950 
                        text-surface-900 dark:text-zinc-100 placeholder-surface-400 dark:placeholder-zinc-700
                        focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 dark:focus:ring-purple-500 focus:border-transparent transition-all
                        ${errors.name ? 'border-red-500' : 'border-surface-300 dark:border-zinc-900'}
                      `}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`
                        w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-zinc-950 
                        text-surface-900 dark:text-zinc-100
                        focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent transition-all
                        ${errors.category ? 'border-red-500' : 'border-surface-300 dark:border-zinc-900'}
                      `}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                    )}
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                      Brand
                    </label>
                    <select
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select Brand (Optional)</option>
                      {brands.map(brand => (
                        <option key={brand._id} value={brand._id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="e.g., AMUL-MILK-1L"
                      className={`
                        w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-zinc-950 
                        text-surface-900 dark:text-zinc-100 placeholder-surface-400
                        focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent transition-all
                        ${errors.sku ? 'border-red-500' : 'border-surface-300 dark:border-zinc-900'}
                      `}
                    />
                    {errors.sku && (
                      <p className="mt-1 text-sm text-red-500">{errors.sku}</p>
                    )}
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className={`
                        w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-zinc-950 
                        text-surface-900 dark:text-zinc-100
                        focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent transition-all
                        ${errors.unit ? 'border-red-500' : 'border-surface-300 dark:border-zinc-900'}
                      `}
                    >
                      <option value="">Select Unit</option>
                      {units.map(unit => (
                        <option key={unit._id} value={unit._id}>{unit.name} ({unit.symbol})</option>
                      ))}
                    </select>
                    {errors.unit && (
                      <p className="mt-1 text-sm text-red-500">{errors.unit}</p>
                    )}
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                      Supplier
                    </label>
                    <select
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select Supplier (Optional)</option>
                      {suppliers.map(supplier => (
                        <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Enter product description..."
                      className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-surface-900 dark:text-zinc-100 placeholder-surface-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Active Status */}
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded border-surface-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-surface-700 dark:text-zinc-300 group-hover:text-surface-900 dark:group-hover:text-surface-100">
                        Product is active and available for sale
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <InformationCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium">Indian Retail Pricing (GST Inclusive)</p>
                      <p className="mt-1">MRP and Selling Price are <strong>inclusive of GST</strong>. Retailers can sell at MRP or below, never above. Cost Price may or may not include GST depending on supplier.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Cost Price */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                      Cost Price (₹)
                      <span className="text-xs font-normal text-surface-500 ml-2">(From Supplier)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-500">₹</span>
                      <input
                        type="number"
                        name="pricing.costPrice"
                        value={formData.pricing.costPrice}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className={`
                          w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-zinc-950 
                          text-surface-900 dark:text-zinc-100 placeholder-surface-400
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent transition-all
                          ${errors.costPrice ? 'border-red-500' : 'border-surface-300 dark:border-zinc-900'}
                        `}
                      />
                    </div>
                    {errors.costPrice && (
                      <p className="mt-1 text-sm text-red-500">{errors.costPrice}</p>
                    )}
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                      Selling Price (₹) <span className="text-red-500">*</span>
                      <span className="text-xs font-normal text-surface-500 ml-2">(Incl. GST)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-500">₹</span>
                      <input
                        type="number"
                        name="pricing.sellingPrice"
                        value={formData.pricing.sellingPrice}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className={`
                          w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-zinc-950 
                          text-surface-900 dark:text-zinc-100 placeholder-surface-400
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent transition-all
                          ${errors.sellingPrice ? 'border-red-500' : 'border-surface-300 dark:border-zinc-900'}
                        `}
                      />
                    </div>
                    {errors.sellingPrice && (
                      <p className="mt-1 text-sm text-red-500">{errors.sellingPrice}</p>
                    )}
                  </div>

                  {/* MRP */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                      MRP (₹)
                      <span className="text-xs font-normal text-surface-500 ml-2">(Max Retail Price - Incl. GST)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-500">₹</span>
                      <input
                        type="number"
                        name="pricing.mrp"
                        value={formData.pricing.mrp}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className={`
                          w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-zinc-950 
                          text-surface-900 dark:text-zinc-100 placeholder-surface-400
                          focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent transition-all
                          ${errors.mrp ? 'border-red-500' : 'border-surface-300 dark:border-zinc-900'}
                        `}
                      />
                    </div>
                    {errors.mrp && (
                      <p className="mt-1 text-sm text-red-500">{errors.mrp}</p>
                    )}
                  </div>

                  {/* Tax Rate */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                      GST Rate (%)
                      <span className="text-xs font-normal text-surface-500 ml-2">(For reporting only)</span>
                    </label>
                    <select
                      name="pricing.taxRate"
                      value={formData.pricing.taxRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="0">0% (Exempt)</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                </div>

                {/* Profit Margin Display */}
                {formData.pricing.costPrice && formData.pricing.sellingPrice && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Profit Margin
                      </span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ₹{(parseFloat(formData.pricing.sellingPrice) - parseFloat(formData.pricing.costPrice)).toFixed(2)} 
                        ({((parseFloat(formData.pricing.sellingPrice) - parseFloat(formData.pricing.costPrice)) / parseFloat(formData.pricing.costPrice) * 100).toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <InformationCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                    <div className="text-xs sm:text-sm text-purple-800 dark:text-purple-200">
                      <p className="font-medium">Branch Stock Management</p>
                      <p className="mt-1">Set stock levels for each branch. The system will alert when stock falls below reorder level.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {formData.branchStocks.map((stock, index) => {
                    const branch = branches.find(b => b._id === stock.branchId || b._id === stock.branch?._id);
                    return (
                      <div key={stock.branchId || index} className="bg-surface-50 dark:bg-zinc-950 border border-surface-200 dark:border-zinc-900 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <h4 className="text-sm sm:text-base font-medium text-surface-900 dark:text-zinc-100 flex items-center">
                            <TruckIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 shrink-0" />
                            <span className="truncate">{branch?.name || 'Unknown Branch'}</span>
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                              Current Quantity
                            </label>
                            <input
                              type="number"
                              value={stock.quantity || 0}
                              onChange={(e) => handleBranchStockChange(stock.branchId || stock.branch?._id, 'quantity', e.target.value)}
                              min="0"
                              className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-zinc-900 bg-white dark:bg-black text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                              Reorder Level
                            </label>
                            <input
                              type="number"
                              value={stock.reorderLevel || 10}
                              onChange={(e) => handleBranchStockChange(stock.branchId || stock.branch?._id, 'reorderLevel', e.target.value)}
                              min="0"
                              className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-zinc-900 bg-white dark:bg-black text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                              Max Stock Level
                            </label>
                            <input
                              type="number"
                              value={stock.maxStockLevel || 1000}
                              onChange={(e) => handleBranchStockChange(stock.branchId || stock.branch?._id, 'maxStockLevel', e.target.value)}
                              min="0"
                              className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-zinc-900 bg-white dark:bg-black text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tax & Compliance Tab */}
            {activeTab === 'tax' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* GST Rate */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                      GST Rate (%)
                    </label>
                    <select
                      name="taxSettings.gstRate"
                      value={formData.taxSettings.gstRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500"
                    >
                      <option value="0">0% (Exempt)</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>

                  {/* HSN Code */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">
                      HSN Code
                    </label>
                    <input
                      type="text"
                      name="taxSettings.hsnCode"
                      value={formData.taxSettings.hsnCode}
                      onChange={handleInputChange}
                      placeholder="e.g., 0401"
                      className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-surface-900 dark:text-zinc-100 placeholder-surface-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500"
                    />
                  </div>

                  {/* Taxable */}
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="taxSettings.taxable"
                        checked={formData.taxSettings.taxable}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded border-surface-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-surface-700 dark:text-zinc-300 group-hover:text-surface-900 dark:group-hover:text-surface-100">
                        This product is taxable
                      </span>
                    </label>
                  </div>
                </div>

                {/* Tax Calculation Display */}
                {formData.pricing.sellingPrice && formData.taxSettings.taxable && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 sm:mb-3 text-sm sm:text-base">Tax Calculation</h4>
                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-800 dark:text-blue-200">Price (excl. tax):</span>
                        <span className="font-medium">₹{parseFloat(formData.pricing.sellingPrice).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-800 dark:text-blue-200">GST ({formData.taxSettings.gstRate}%):</span>
                        <span className="font-medium">₹{(parseFloat(formData.pricing.sellingPrice) * parseFloat(formData.taxSettings.gstRate) / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-300 dark:border-blue-700">
                        <span className="text-blue-900 dark:text-blue-100 font-semibold">Total (incl. tax):</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          ₹{(parseFloat(formData.pricing.sellingPrice) * (1 + parseFloat(formData.taxSettings.gstRate) / 100)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-6 border-t border-surface-200 dark:border-zinc-900 bg-surface-50 dark:bg-zinc-950/50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 sm:px-6 py-2.5 border border-surface-300 dark:border-zinc-900 rounded-lg text-sm font-medium text-surface-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 hover:bg-surface-50 dark:hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-purple-500 disabled:opacity-50 transition-all w-full sm:w-auto"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  {product ? 'Update Product' : 'Create Product'}
                </>
              )}
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;
