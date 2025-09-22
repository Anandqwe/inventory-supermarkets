import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CubeIcon, 
  TruckIcon, 
  ExclamationTriangleIcon, 
  ShoppingCartIcon, 
  PlusIcon, 
  ArrowPathIcon,
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  EyeIcon, 
  ChartBarIcon, 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  PencilIcon, 
  TrashIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowRightIcon,
  FunnelIcon, 
  MagnifyingGlassIcon, 
  CalendarDaysIcon, 
  MapPinIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon
} from '@heroicons/react/24/outline';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { StatCard } from '../components/ui/StatCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import { PageHeader } from '../components/shell/PageHeader';
import { inventoryAPI, purchaseAPI, masterDataAPI } from '../utils/api';

// Inventory Operations Component
function Inventory() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({});

  const queryClient = useQueryClient();

  // Queries
  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: inventoryAPI.getLowStockAlerts
  });

  const { data: reorderData, isLoading: reorderLoading } = useQuery({
    queryKey: ['reorder-suggestions'],
    queryFn: inventoryAPI.getReorderSuggestions
  });

  const { data: adjustmentsData, isLoading: adjustmentsLoading } = useQuery({
    queryKey: ['adjustments', filters],
    queryFn: () => inventoryAPI.getAdjustments(filters),
    enabled: activeTab === 'adjustments'
  });

  const { data: transfersData, isLoading: transfersLoading } = useQuery({
    queryKey: ['transfers', filters],
    queryFn: () => inventoryAPI.getTransfers(filters),
    enabled: activeTab === 'transfers'
  });

  const { data: purchaseOrdersData, isLoading: purchaseOrdersLoading } = useQuery({
    queryKey: ['purchase-orders', filters],
    queryFn: () => purchaseAPI.getOrders(filters),
    enabled: activeTab === 'purchase-orders'
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: masterDataAPI.getSuppliers
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: masterDataAPI.getBranches
  });

  // Mutations
  const createAdjustmentMutation = useMutation({
    mutationFn: inventoryAPI.createAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries(['adjustments']);
      setShowAdjustmentModal(false);
      setToast({ type: 'success', message: 'Stock adjustment created successfully' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: error.message });
    }
  });

  const createTransferMutation = useMutation({
    mutationFn: inventoryAPI.createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries(['transfers']);
      setShowTransferModal(false);
      setToast({ type: 'success', message: 'Stock transfer created successfully' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: error.message });
    }
  });

  const createPurchaseOrderMutation = useMutation({
    mutationFn: purchaseAPI.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['purchase-orders']);
      setShowPurchaseOrderModal(false);
      setToast({ type: 'success', message: 'Purchase order created successfully' });
    },
    onError: (error) => {
      setToast({ type: 'error', message: error.message });
    }
  });

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'alerts', label: 'Alerts', icon: ExclamationTriangleIcon },
    { id: 'adjustments', label: 'Adjustments', icon: PencilIcon },
    { id: 'transfers', label: 'Transfers', icon: TruckIcon },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCartIcon }
  ];

  // Overview Statistics
  const overviewStats = useMemo(() => {
    const lowStockCount = lowStockData?.data?.length || 0;
    const reorderCount = reorderData?.data?.reduce((acc, supplier) => acc + supplier.totalProducts, 0) || 0;
    
    return [
      {
        title: 'Low Stock Items',
        value: lowStockCount,
        change: '-12%',
        trend: 'down',
        icon: ExclamationTriangleIcon,
        color: 'red'
      },
      {
        title: 'Reorder Required',
        value: reorderCount,
        change: '+8%',
        trend: 'up',
        icon: ShoppingCartIcon,
        color: 'orange'
      },
      {
        title: 'Pending Adjustments',
        value: adjustmentsData?.data?.filter(adj => adj.status === 'pending')?.length || 0,
        change: '+15%',
        trend: 'up',
        icon: PencilIcon,
        color: 'blue'
      },
      {
        title: 'Active Transfers',
        value: transfersData?.data?.filter(transfer => transfer.status === 'shipped')?.length || 0,
        change: '-5%',
        trend: 'down',
        icon: TruckIcon,
        color: 'green'
      }
    ];
  }, [lowStockData, reorderData, adjustmentsData, transfersData]);

  // Low Stock Alerts Component
  const LowStockAlerts = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
          Low Stock Alerts
        </h3>
        <Button variant="outline" size="sm">
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {lowStockLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4">
          {lowStockData?.data?.map((item) => (
            <Card key={item._id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <CubeIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {item.name}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        SKU: {item.sku} | Current Stock: {item.currentStock}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">
                    {item.currentStock} / {item.minLevel}
                  </Badge>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Branch: {item.branch?.name}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Reorder Suggestions Component
  const ReorderSuggestions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
          Reorder Suggestions
        </h3>
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => setShowPurchaseOrderModal(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create PO
        </Button>
      </div>

      {reorderLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4">
          {reorderData?.data?.map((supplier) => (
            <Card key={supplier._id} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      {supplier.supplierName}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {supplier.totalProducts} products need reordering
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {supplier.products?.slice(0, 3).map((product) => (
                    <div key={product._id} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                      <div>
                        <span className="font-medium text-sm">{product.name}</span>
                        <span className="text-xs text-slate-500 ml-2">({product.sku})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-red-600">
                          Stock: {product.currentStock}
                        </span>
                        <span className="text-xs text-slate-500 block">
                          Suggested: {product.suggestedQuantity}
                        </span>
                      </div>
                    </div>
                  ))}
                  {supplier.products?.length > 3 && (
                    <p className="text-sm text-slate-500 text-center pt-2">
                      +{supplier.products.length - 3} more products
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Stock Adjustments Table
  const adjustmentsColumns = [
    {
      accessorKey: 'adjustmentNumber',
      header: 'Adjustment #',
    },
    {
      accessorKey: 'product.name',
      header: 'Product',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.product?.name}</div>
          <div className="text-sm text-slate-500">{row.original.product?.sku}</div>
        </div>
      )
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ getValue }) => (
        <Badge variant={getValue() === 'increase' ? 'success' : 'destructive'}>
          {getValue()}
        </Badge>
      )
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => (
        <span className={row.original.type === 'increase' ? 'text-green-600' : 'text-red-600'}>
          {row.original.type === 'increase' ? '+' : '-'}{row.original.quantity}
        </span>
      )
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue();
        const variants = {
          pending: 'warning',
          approved: 'success',
          rejected: 'destructive'
        };
        return <Badge variant={variants[status]}>{status}</Badge>;
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ getValue }) => new Date(getValue()).toLocaleDateString()
    }
  ];

  // Stock Transfers Table
  const transfersColumns = [
    {
      accessorKey: 'transferNumber',
      header: 'Transfer #',
    },
    {
      accessorKey: 'fromBranch.name',
      header: 'From',
    },
    {
      accessorKey: 'toBranch.name',
      header: 'To',
    },
    {
      accessorKey: 'totalItems',
      header: 'Items',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue();
        const variants = {
          pending: 'secondary',
          shipped: 'warning',
          received: 'success',
          cancelled: 'destructive'
        };
        return <Badge variant={variants[status]}>{status}</Badge>;
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ getValue }) => new Date(getValue()).toLocaleDateString()
    }
  ];

  // Purchase Orders Table
  const purchaseOrdersColumns = [
    {
      accessorKey: 'poNumber',
      header: 'PO Number',
    },
    {
      accessorKey: 'supplier.name',
      header: 'Supplier',
    },
    {
      accessorKey: 'totalItems',
      header: 'Items',
    },
    {
      accessorKey: 'totalAmount',
      header: 'Amount',
      cell: ({ getValue }) => `₹${getValue()?.toFixed(2)}`
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue();
        const variants = {
          draft: 'secondary',
          pending: 'warning',
          approved: 'success',
          rejected: 'destructive',
          sent: 'primary'
        };
        return <Badge variant={variants[status]}>{status}</Badge>;
      }
    },
    {
      accessorKey: 'expectedDate',
      header: 'Expected Date',
      cell: ({ getValue }) => getValue() ? new Date(getValue()).toLocaleDateString() : '-'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewStats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <LowStockAlerts />
              </Card>
              <Card className="p-6">
                <ReorderSuggestions />
              </Card>
            </div>
          </div>
        );
        
      case 'alerts':
        return (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <LowStockAlerts />
            </Card>
            <Card className="p-6">
              <ReorderSuggestions />
            </Card>
          </div>
        );
        
      case 'adjustments':
        return (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Stock Adjustments</h3>
              <Button 
                variant="primary"
                onClick={() => setShowAdjustmentModal(true)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Adjustment
              </Button>
            </div>
            
            {adjustmentsLoading ? (
              <LoadingSpinner />
            ) : (
              <DataTable
                data={adjustmentsData?.data || []}
                columns={adjustmentsColumns}
                searchKey="adjustmentNumber"
                pagination={{
                  pageIndex: 0,
                  pageSize: 10
                }}
              />
            )}
          </Card>
        );
        
      case 'transfers':
        return (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Stock Transfers</h3>
              <Button 
                variant="primary"
                onClick={() => setShowTransferModal(true)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Transfer
              </Button>
            </div>
            
            {transfersLoading ? (
              <LoadingSpinner />
            ) : (
              <DataTable
                data={transfersData?.data || []}
                columns={transfersColumns}
                searchKey="transferNumber"
                pagination={{
                  pageIndex: 0,
                  pageSize: 10
                }}
              />
            )}
          </Card>
        );
        
      case 'purchase-orders':
        return (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Purchase Orders</h3>
              <Button 
                variant="primary"
                onClick={() => setShowPurchaseOrderModal(true)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Purchase Order
              </Button>
            </div>
            
            {purchaseOrdersLoading ? (
              <LoadingSpinner />
            ) : (
              <DataTable
                data={purchaseOrdersData?.data || []}
                columns={purchaseOrdersColumns}
                searchKey="poNumber"
                pagination={{
                  pageIndex: 0,
                  pageSize: 10
                }}
              />
            )}
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Operations"
        description="Manage stock levels, transfers, and purchase orders"
      >
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="primary">
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Sync Inventory
          </Button>
        </div>
      </PageHeader>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Modals */}
      <StockAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        onSubmit={(data) => createAdjustmentMutation.mutate(data)}
        isLoading={createAdjustmentMutation.isPending}
      />

      <StockTransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSubmit={(data) => createTransferMutation.mutate(data)}
        isLoading={createTransferMutation.isPending}
        branches={branchesData?.data || []}
      />

      <PurchaseOrderModal
        isOpen={showPurchaseOrderModal}
        onClose={() => setShowPurchaseOrderModal(false)}
        onSubmit={(data) => createPurchaseOrderMutation.mutate(data)}
        isLoading={createPurchaseOrderMutation.isPending}
        suppliers={suppliersData?.data || []}
        reorderSuggestions={reorderData?.data || []}
      />

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

// Stock Adjustment Modal Component
function StockAdjustmentModal({ isOpen, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    product: '',
    type: 'increase',
    quantity: '',
    reason: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Adjustment">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Product
            </label>
            <Input
              type="text"
              value={formData.product}
              onChange={(e) => handleChange('product', e.target.value)}
              placeholder="Search product..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
              required
            >
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Quantity
            </label>
            <Input
              type="number"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              placeholder="Enter quantity"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Reason
            </label>
            <select
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
              required
            >
              <option value="">Select reason...</option>
              <option value="damaged">Damaged goods</option>
              <option value="expired">Expired products</option>
              <option value="theft">Theft/Loss</option>
              <option value="receiving">Receiving discrepancy</option>
              <option value="counting">Stock count correction</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional notes..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : 'Create Adjustment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Stock Transfer Modal Component
function StockTransferModal({ isOpen, onClose, onSubmit, isLoading, branches }) {
  const [formData, setFormData] = useState({
    fromBranch: '',
    toBranch: '',
    items: [],
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Transfer">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              From Branch
            </label>
            <select
              value={formData.fromBranch}
              onChange={(e) => handleChange('fromBranch', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
              required
            >
              <option value="">Select branch...</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              To Branch
            </label>
            <select
              value={formData.toBranch}
              onChange={(e) => handleChange('toBranch', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
              required
            >
              <option value="">Select branch...</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Transfer notes..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : 'Create Transfer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Purchase Order Modal Component
function PurchaseOrderModal({ isOpen, onClose, onSubmit, isLoading, suppliers, reorderSuggestions }) {
  const [formData, setFormData] = useState({
    supplier: '',
    expectedDate: '',
    notes: '',
    items: []
  });

  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSupplierChange = (supplierId) => {
    setFormData(prev => ({ ...prev, supplier: supplierId, items: [] }));
    
    // Find supplier's reorder suggestions
    const suggestion = reorderSuggestions.find(s => s._id === supplierId);
    setSelectedSuggestion(suggestion);
    
    // Auto-populate items from reorder suggestions
    if (suggestion && suggestion.products) {
      const items = suggestion.products.map(product => ({
        productId: product._id,
        name: product.name,
        sku: product.sku,
        currentStock: product.currentStock,
        suggestedQuantity: product.suggestedQuantity,
        quantity: product.suggestedQuantity,
        unitPrice: 0
      }));
      setFormData(prev => ({ ...prev, items }));
    }
  };

  const updateItemQuantity = (index, quantity) => {
    const updatedItems = [...formData.items];
    updatedItems[index].quantity = parseInt(quantity) || 0;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const updateItemPrice = (index, price) => {
    const updatedItems = [...formData.items];
    updatedItems[index].unitPrice = parseFloat(price) || 0;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Purchase Order" size="large">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Supplier *
            </label>
            <select
              value={formData.supplier}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
              required
            >
              <option value="">Select supplier...</option>
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name} ({supplier.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Expected Delivery Date
            </label>
            <Input
              type="date"
              value={formData.expectedDate}
              onChange={(e) => handleChange('expectedDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {selectedSuggestion && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                Reorder Suggestions Available
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {selectedSuggestion.totalProducts} products from this supplier need reordering. 
              Items have been auto-populated below.
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Order Items
            </label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => {
                const newItem = {
                  productId: '',
                  name: '',
                  sku: '',
                  quantity: 1,
                  unitPrice: 0
                };
                setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
              }}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="col-span-4">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.sku}</div>
                  {item.currentStock !== undefined && (
                    <div className="text-xs text-red-600">
                      Current: {item.currentStock}
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItemQuantity(index, e.target.value)}
                    placeholder="Qty"
                    min="1"
                    className="text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItemPrice(index, e.target.value)}
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    className="text-sm"
                  />
                </div>
                <div className="col-span-3 text-right">
                  <div className="font-medium text-sm">
                    ₹{(item.quantity * item.unitPrice).toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {formData.items.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No items added yet. Select a supplier to see reorder suggestions or add items manually.
              </div>
            )}
          </div>

          {formData.items.length > 0 && (
            <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="text-lg font-bold text-blue-600">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {formData.items.length} item{formData.items.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Purchase order notes..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isLoading || formData.items.length === 0 || !formData.supplier}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Create Purchase Order'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default Inventory;