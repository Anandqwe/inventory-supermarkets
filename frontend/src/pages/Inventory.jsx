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
import { inventoryAPI, purchaseAPI, masterDataAPI, productsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { PERMISSIONS } from '../../../shared/permissions';

const getBranchIdFromUser = (user) => {
  if (!user || !user.branch) {
    return null;
  }

  if (typeof user.branch === 'string') {
    return user.branch;
  }

  if (typeof user.branch === 'object') {
    if (user.branch._id) {
      return typeof user.branch._id === 'string'
        ? user.branch._id
        : user.branch._id.toString();
    }

    if (typeof user.branch.toString === 'function') {
      return user.branch.toString();
    }
  }

  return null;
};

// Inventory Operations Component
function Inventory() {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const userBranchId = useMemo(() => getBranchIdFromUser(user), [user]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(userBranchId || 'all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (userBranchId && selectedBranch === 'all') {
      setSelectedBranch(userBranchId);
    } else if (!user && selectedBranch !== 'all') {
      setSelectedBranch('all');
    }
  }, [userBranchId, selectedBranch, user]);

  const canCreateAdjustments = hasPermission(PERMISSIONS.INVENTORY.ADJUST) ||
    hasPermission(PERMISSIONS.INVENTORY.UPDATE) ||
    hasPermission(PERMISSIONS.INVENTORY.CREATE);
  const canInitiateTransfers = hasPermission(PERMISSIONS.INVENTORY.TRANSFER);
  const canCreatePurchaseOrders = hasPermission(PERMISSIONS.PURCHASES.CREATE);

  // Build filter params
  const filterParams = useMemo(() => {
    const params = {};
    if (selectedBranch && selectedBranch !== 'all') {
      params.branch = selectedBranch;
    }
    if (dateRange.startDate) {
      params.startDate = dateRange.startDate;
    }
    if (dateRange.endDate) {
      params.endDate = dateRange.endDate;
    }
    return params;
  }, [selectedBranch, dateRange]);

  // Queries
  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['low-stock-alerts', filterParams],
    queryFn: () => inventoryAPI.getLowStockAlerts(filterParams)
  });

  const { data: reorderData, isLoading: reorderLoading } = useQuery({
    queryKey: ['reorder-suggestions', filterParams],
    queryFn: () => inventoryAPI.getReorderSuggestions(filterParams)
  });

  const { data: adjustmentsData, isLoading: adjustmentsLoading } = useQuery({
    queryKey: ['adjustments', filterParams],
    queryFn: () => inventoryAPI.getAdjustments(filterParams),
    enabled: activeTab === 'adjustments' || activeTab === 'overview'
  });

  const { data: transfersData, isLoading: transfersLoading } = useQuery({
    queryKey: ['transfers', filterParams],
    queryFn: () => inventoryAPI.getTransfers(filterParams),
    enabled: activeTab === 'transfers' || activeTab === 'overview'
  });

  const { data: purchaseOrdersData, isLoading: purchaseOrdersLoading } = useQuery({
    queryKey: ['purchase-orders', filterParams],
    queryFn: () => purchaseAPI.getOrders(filterParams),
    enabled: activeTab === 'purchase-orders' || activeTab === 'overview'
  });

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
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
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
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
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
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
    const lowStockCount = lowStockData?.data?.products?.length || 0;
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
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] })}
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {lowStockLoading ? (
        <LoadingSpinner />
      ) : lowStockData?.data?.products?.length > 0 ? (
        <div className="grid gap-4">
          {lowStockData.data.products.map((item) => (
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
                        SKU: {item.sku} | Current Stock: {item.stockQuantity}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={item.urgency === 'critical' ? 'destructive' : 'warning'}>
                    {item.stockQuantity} / {item.reorderLevel}
                  </Badge>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {item.urgency === 'critical' ? 'Critical' : 'Low Stock'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <CubeIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No low stock items found</p>
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
        {canCreatePurchaseOrders && (
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowPurchaseOrderModal(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create PO
          </Button>
        )}
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
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewStats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>

            {/* Inventory Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Critical Items Card */}
              <Card className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Critical Items
                  </h3>
                  <ExclamationTriangleIcon className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Out of Stock</span>
                    <Badge variant="destructive">
                      {lowStockData?.data?.summary?.criticalItems || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Below Reorder</span>
                    <Badge variant="warning">
                      {lowStockData?.data?.summary?.totalLowStockItems || 0}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setActiveTab('alerts')}
                  >
                    View All Alerts
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </Card>

              {/* Recent Activity Card */}
              <Card className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Recent Activity
                  </h3>
                  <ClockIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {adjustmentsData?.data?.length || 0} Adjustments
                      </p>
                      <p className="text-xs text-slate-500">Today</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {transfersData?.data?.length || 0} Transfers
                      </p>
                      <p className="text-xs text-slate-500">This week</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-orange-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {purchaseOrdersData?.data?.length || 0} Purchase Orders
                      </p>
                      <p className="text-xs text-slate-500">Pending</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Top Suppliers Card */}
              <Card className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Reorder Summary
                  </h3>
                  <ShoppingCartIcon className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                </div>
                <div className="space-y-3">
                  {reorderData?.data?.slice(0, 3).map((supplier, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {supplier.supplierName}
                      </span>
                      <Badge variant="secondary">
                        {supplier.totalProducts} items
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No reorder needed
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setActiveTab('alerts')}
                  >
                    View Suggestions
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        );
        
      case 'alerts':
        return (
          <div className="space-y-6">
            {/* Filters Bar - For Admin/Regional Manager */}
            {(user?.role === 'Admin' || user?.role === 'Regional Manager') && (
              <Card className="p-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-3 sm:gap-4">
                  <div className="flex-1 min-w-full sm:min-w-[180px] lg:min-w-[200px]">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Branch
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Branches</option>
                      {branchesData?.data?.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1 min-w-full sm:min-w-[160px] lg:min-w-[180px]">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      max={dateRange.endDate || undefined}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-full sm:min-w-[160px] lg:min-w-[180px]">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      min={dateRange.startDate || undefined}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex sm:flex-shrink-0 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setSelectedBranch('all');
                        setDateRange({ startDate: '', endDate: '' });
                      }}
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Alerts Header with Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Critical Items</p>
                    <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">
                      {lowStockData?.data?.summary?.criticalItems || 0}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-300 mt-1">Out of stock</p>
                  </div>
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Low Stock</p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-2">
                      {lowStockData?.data?.summary?.totalLowStockItems || 0}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">Below reorder level</p>
                  </div>
                  <ArrowTrendingDownIcon className="h-12 w-12 text-orange-500" />
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Reorder Required</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                      {reorderData?.data?.reduce((sum, s) => sum + s.totalProducts, 0) || 0}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">Total products</p>
                  </div>
                  <ShoppingCartIcon className="h-12 w-12 text-blue-500" />
                </div>
              </Card>
            </div>

            {/* Alerts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
              {/* Low Stock Alerts */}
              <Card className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <ExclamationTriangleIcon className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Low Stock Alerts
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 sm:flex-initial"
                      onClick={() => queryClient.invalidateQueries(['low-stock-alerts'])}
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {lowStockLoading ? (
                  <LoadingSpinner />
                ) : lowStockData?.data?.products?.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {lowStockData.data.products.map((item) => (
                      <Card key={item._id} className={`p-4 ${
                        item.urgency === 'critical' 
                          ? 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10' 
                          : 'border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10'
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                {item.name}
                              </h4>
                              <Badge 
                                variant={item.urgency === 'critical' ? 'destructive' : 'warning'}
                                className="flex-shrink-0"
                              >
                                {item.urgency === 'critical' ? 'CRITICAL' : 'LOW'}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                SKU: <span className="font-mono">{item.sku}</span>
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Branch: {item.branchName}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="text-sm">
                                  <span className="text-slate-600 dark:text-slate-400">Current: </span>
                                  <span className="font-semibold text-red-600 dark:text-red-400">
                                    {item.stockQuantity}
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-slate-600 dark:text-slate-400">Reorder at: </span>
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {item.reorderLevel}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {canCreatePurchaseOrders && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(item);
                                setShowPurchaseOrderModal(true);
                              }}
                            >
                              Order Now
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-900 dark:text-slate-100">All Good!</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      No low stock items found
                    </p>
                  </div>
                )}
              </Card>

              {/* Quick Order from Suppliers */}
              <Card className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Quick Order from Suppliers
                    </h3>
                  </div>
                  {canCreatePurchaseOrders && (
                    <Button 
                      variant="primary" 
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => setShowPurchaseOrderModal(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create PO
                    </Button>
                  )}
                </div>

                {suppliersLoading ? (
                  <LoadingSpinner />
                ) : suppliersData?.data?.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {suppliersData.data.map((supplier, idx) => (
                      <Card 
                        key={`${supplier._id}-${idx}`}
                        className="p-3 md:p-4 hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-blue-500"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h5 className="font-medium text-sm md:text-base text-slate-900 dark:text-slate-100 truncate">
                                {supplier.name}
                              </h5>
                              {supplier.isActive && (
                                <Badge variant="success" className="text-xs flex-shrink-0">Active</Badge>
                              )}
                            </div>
                            {(supplier.contactInfo?.email || supplier.contactInfo?.phone) && (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-1.5">
                                {supplier.contactInfo?.phone && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                    <PhoneIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate">{supplier.contactInfo.phone}</span>
                                  </div>
                                )}
                                {supplier.contactInfo?.email && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                    <EnvelopeIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate">{supplier.contactInfo.email}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full sm:w-auto sm:flex-shrink-0 px-3 md:px-4"
                            onClick={() => {
                              setSelectedProduct({ supplier: supplier._id });
                              setShowPurchaseOrderModal(true);
                            }}
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Order
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No suppliers available</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        );
        
      case 'adjustments':
        return (
          <div className="space-y-6">
            {/* Adjustments Header with Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Card className="p-3 md:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Total Adjustments</p>
                    <p className="text-xl md:text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                      {adjustmentsData?.data?.length || 0}
                    </p>
                  </div>
                  <DocumentTextIcon className="h-7 w-7 md:h-8 md:w-8 text-blue-500" />
                </div>
              </Card>
              
              <Card className="p-3 md:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-800 dark:text-green-200">Stock Increased</p>
                    <p className="text-xl md:text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                      {adjustmentsData?.data?.filter(a => a.type === 'increase').length || 0}
                    </p>
                  </div>
                  <ArrowTrendingUpIcon className="h-7 w-7 md:h-8 md:w-8 text-green-500" />
                </div>
              </Card>
              
              <Card className="p-3 md:p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-red-800 dark:text-red-200">Stock Decreased</p>
                    <p className="text-xl md:text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                      {adjustmentsData?.data?.filter(a => a.type === 'decrease').length || 0}
                    </p>
                  </div>
                  <ArrowTrendingDownIcon className="h-7 w-7 md:h-8 md:w-8 text-red-500" />
                </div>
              </Card>
              
              <Card className="p-3 md:p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-orange-800 dark:text-orange-200">Pending Review</p>
                    <p className="text-xl md:text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                      {adjustmentsData?.data?.filter(a => a.status === 'pending').length || 0}
                    </p>
                  </div>
                  <ClockIcon className="h-7 w-7 md:h-8 md:w-8 text-orange-500" />
                </div>
              </Card>
            </div>

            {/* Adjustments Table Card */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <PencilIcon className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Stock Adjustments History
                    </h3>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                      Track and manage inventory adjustments
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['adjustments'] })}
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </Button>
                  {canCreateAdjustments && (
                    <Button 
                      variant="primary"
                      className="flex-1 sm:flex-initial"
                      onClick={() => setShowAdjustmentModal(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">New Adjustment</span>
                      <span className="sm:hidden">New</span>
                    </Button>
                  )}
                </div>
              </div>
              
              {adjustmentsLoading ? (
                <div className="py-12">
                  <LoadingSpinner />
                </div>
              ) : adjustmentsData?.data?.length > 0 ? (
                <div className="overflow-x-auto -mx-4 md:-mx-6">
                  <div className="inline-block min-w-full align-middle px-4 md:px-6">
                    <DataTable
                      data={adjustmentsData.data}
                      columns={adjustmentsColumns}
                      searchKey="adjustmentNumber"
                      pagination={{
                        pageIndex: 0,
                        pageSize: 10
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-900 dark:text-slate-100">No Adjustments Yet</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4">
                    Start by creating your first stock adjustment
                  </p>
                  {canCreateAdjustments && (
                    <Button 
                      variant="primary"
                      onClick={() => setShowAdjustmentModal(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create First Adjustment
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>
        );
        
      case 'transfers':
        return (
          <div className="space-y-6">
            {/* Transfers Header with Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Card className="p-3 md:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-purple-800 dark:text-purple-200">Total Transfers</p>
                    <p className="text-xl md:text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                      {transfersData?.data?.length || 0}
                    </p>
                  </div>
                  <TruckIcon className="h-7 w-7 md:h-8 md:w-8 text-purple-500" />
                </div>
              </Card>
              
              <Card className="p-3 md:p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-orange-800 dark:text-orange-200">Pending</p>
                    <p className="text-xl md:text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                      {transfersData?.data?.filter(t => t.status === 'pending').length || 0}
                    </p>
                  </div>
                  <ClockIcon className="h-7 w-7 md:h-8 md:w-8 text-orange-500" />
                </div>
              </Card>
              
              <Card className="p-3 md:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200">In Transit</p>
                    <p className="text-xl md:text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                      {transfersData?.data?.filter(t => t.status === 'in-transit').length || 0}
                    </p>
                  </div>
                  <ArrowPathIcon className="h-7 w-7 md:h-8 md:w-8 text-blue-500 animate-spin-slow" />
                </div>
              </Card>
              
              <Card className="p-3 md:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-800 dark:text-green-200">Completed</p>
                    <p className="text-xl md:text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                      {transfersData?.data?.filter(t => t.status === 'completed').length || 0}
                    </p>
                  </div>
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
              </Card>
            </div>

            {/* Transfers Table Card */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <TruckIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Stock Transfers
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Track inventory movements between branches
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['transfers'] })}
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </Button>
                  {canInitiateTransfers && (
                    <Button 
                      variant="primary"
                      onClick={() => setShowTransferModal(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      New Transfer
                    </Button>
                  )}
                </div>
              </div>
              
              {transfersLoading ? (
                <div className="py-12">
                  <LoadingSpinner />
                </div>
              ) : transfersData?.data?.length > 0 ? (
                <DataTable
                  data={transfersData.data}
                  columns={transfersColumns}
                  searchKey="transferNumber"
                  pagination={{
                    pageIndex: 0,
                    pageSize: 10
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <TruckIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-900 dark:text-slate-100">No Transfers Yet</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4">
                    Start moving inventory between your branches
                  </p>
                  {canInitiateTransfers && (
                    <Button 
                      variant="primary"
                      onClick={() => setShowTransferModal(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create First Transfer
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>
        );
        
      case 'purchase-orders':
        return (
          <div className="space-y-6">
            {/* Purchase Orders Header with Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Card className="p-3 md:p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-indigo-800 dark:text-indigo-200">Total Orders</p>
                    <p className="text-xl md:text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">
                      {purchaseOrdersData?.data?.length || 0}
                    </p>
                  </div>
                  <ShoppingCartIcon className="h-7 w-7 md:h-8 md:w-8 text-indigo-500" />
                </div>
              </Card>
              
              <Card className="p-3 md:p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Draft</p>
                    <p className="text-xl md:text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">
                      {purchaseOrdersData?.data?.filter(po => po.status === 'draft').length || 0}
                    </p>
                  </div>
                  <DocumentTextIcon className="h-7 w-7 md:h-8 md:w-8 text-yellow-500" />
                </div>
              </Card>
              
              <Card className="p-3 md:p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-orange-800 dark:text-orange-200">Pending</p>
                    <p className="text-xl md:text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                      {purchaseOrdersData?.data?.filter(po => po.status === 'pending').length || 0}
                    </p>
                  </div>
                  <ClockIcon className="h-7 w-7 md:h-8 md:w-8 text-orange-500" />
                </div>
              </Card>
              
              <Card className="p-3 md:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-800 dark:text-green-200">Received</p>
                    <p className="text-xl md:text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                      {purchaseOrdersData?.data?.filter(po => po.status === 'received').length || 0}
                    </p>
                  </div>
                  <CheckCircleIcon className="h-7 w-7 md:h-8 md:w-8 text-green-500" />
                </div>
              </Card>
            </div>

            {/* Purchase Orders Table Card */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                    <ShoppingCartIcon className="h-4 w-4 md:h-5 md:w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Purchase Orders
                    </h3>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                      Manage supplier orders and procurement
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })}
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </Button>
                  {canCreatePurchaseOrders && (
                    <Button 
                      variant="primary"
                      onClick={() => setShowPurchaseOrderModal(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      New Purchase Order
                    </Button>
                  )}
                </div>
              </div>
              
              {purchaseOrdersLoading ? (
                <div className="py-12">
                  <LoadingSpinner />
                </div>
              ) : purchaseOrdersData?.data?.length > 0 ? (
                <div className="space-y-4">
                  {purchaseOrdersData.data.map((po) => (
                    <Card key={po._id} className="p-5 hover:shadow-lg transition-shadow border-l-4" 
                      style={{
                        borderLeftColor: 
                          po.status === 'received' ? '#10b981' :
                          po.status === 'pending' || po.status === 'sent' ? '#f59e0b' :
                          po.status === 'draft' ? '#6b7280' :
                          po.status === 'rejected' ? '#ef4444' :
                          '#6366f1'
                      }}
                    >
                      <div className="space-y-4">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {po.poNumber}
                              </h4>
                              <Badge variant={
                                po.status === 'draft' ? 'secondary' :
                                po.status === 'pending' || po.status === 'sent' ? 'warning' :
                                po.status === 'approved' ? 'primary' :
                                po.status === 'received' ? 'success' :
                                'destructive'
                              }>
                                {po.status?.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <UserIcon className="h-4 w-4" />
                              <span className="font-medium">{po.supplier?.name || 'N/A'}</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                              ₹{po.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Total Amount
                            </div>
                          </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                              <CubeIcon className="h-3.5 w-3.5" />
                              <span>Items</span>
                            </div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {po.totalItems || po.items?.length || 0}
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                              <CalendarDaysIcon className="h-3.5 w-3.5" />
                              <span>Order Date</span>
                            </div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {po.createdAt ? new Date(po.createdAt).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short' 
                              }) : '-'}
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                              <ClockIcon className="h-3.5 w-3.5" />
                              <span>Expected</span>
                            </div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short' 
                              }) : 'Not set'}
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                              <MapPinIcon className="h-3.5 w-3.5" />
                              <span>Branch</span>
                            </div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {po.branch?.name || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            {po.supplier?.contactInfo?.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                <PhoneIcon className="h-3.5 w-3.5" />
                                <span>{po.supplier.contactInfo.phone}</span>
                              </div>
                            )}
                            {po.supplier?.contactInfo?.email && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                <EnvelopeIcon className="h-3.5 w-3.5" />
                                <span className="truncate max-w-[150px]">{po.supplier.contactInfo.email}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {canCreatePurchaseOrders && (
                              <Button 
                                variant="primary"
                                onClick={() => setShowPurchaseOrderModal(true)}
                              >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Create Purchase Order
                              </Button>
                            )}
                            {(po.status === 'pending' || po.status === 'sent') && (
                              <Button variant="primary" size="sm">
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Mark Received
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCartIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-900 dark:text-slate-100">No Purchase Orders Yet</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4">
                    Create your first purchase order to restock inventory
                  </p>
                  {canCreatePurchaseOrders && (
                    <Button 
                      variant="primary"
                      onClick={() => setShowPurchaseOrderModal(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create First PO
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>
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
      {canCreateAdjustments && (
        <StockAdjustmentModal
          isOpen={canCreateAdjustments && showAdjustmentModal}
          onClose={() => setShowAdjustmentModal(false)}
          onSubmit={(data) => createAdjustmentMutation.mutate(data)}
          isLoading={createAdjustmentMutation.isPending}
        />
      )}

      {canInitiateTransfers && (
        <StockTransferModal
          isOpen={canInitiateTransfers && showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSubmit={(data) => createTransferMutation.mutate(data)}
          isLoading={createTransferMutation.isPending}
          branches={branchesData?.data || []}
        />
      )}

      {canCreatePurchaseOrders && (
        <PurchaseOrderModal
          isOpen={canCreatePurchaseOrders && showPurchaseOrderModal}
          onClose={() => {
            setShowPurchaseOrderModal(false);
            setSelectedProduct(null);
          }}
          onSubmit={(data) => createPurchaseOrderMutation.mutate(data)}
          isLoading={createPurchaseOrderMutation.isPending}
          suppliers={suppliersData?.data || []}
          reorderSuggestions={reorderData?.data || []}
          selectedProduct={selectedProduct}
        />
      )}

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
function PurchaseOrderModal({ isOpen, onClose, onSubmit, isLoading, suppliers, reorderSuggestions, selectedProduct }) {
  const [formData, setFormData] = useState({
    supplier: '',
    expectedDate: '',
    notes: '',
    items: []
  });

  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Handle selectedProduct from "Order Now" button
  useEffect(() => {
    if (selectedProduct && isOpen) {
      // Find the supplier for this product
      const productSupplier = selectedProduct.supplier;
      
      if (productSupplier) {
        const supplierId = typeof productSupplier === 'object' ? productSupplier._id : productSupplier;
        
        // Calculate quantity needed to reach max stock level or reorder level * 2
        const quantityNeeded = Math.max(
          (selectedProduct.maxStockLevel || selectedProduct.reorderLevel * 2) - selectedProduct.stockQuantity,
          selectedProduct.reorderLevel
        );
        
        // Set the supplier and add the product
        setFormData(prev => ({
          ...prev,
          supplier: supplierId,
          items: [{
            productId: selectedProduct._id,
            name: selectedProduct.name,
            sku: selectedProduct.sku,
            currentStock: selectedProduct.stockQuantity,
            suggestedQuantity: quantityNeeded,
            quantity: quantityNeeded,
            unitPrice: selectedProduct.costPrice || selectedProduct.sellingPrice || 0
          }]
        }));
      }
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        supplier: '',
        expectedDate: '',
        notes: '',
        items: []
      });
      setSelectedSuggestion(null);
    }
  }, [selectedProduct, isOpen]);

  // Fetch products when supplier is selected
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', { supplier: formData.supplier }],
    queryFn: () => productsAPI.getAll({ supplier: formData.supplier }),
    enabled: !!formData.supplier
  });

  useEffect(() => {
    if (productsData?.data) {
      const arr = Array.isArray(productsData.data?.products)
        ? productsData.data.products
        : Array.isArray(productsData.data)
        ? productsData.data
        : [];
      setAvailableProducts(arr);
    } else {
      setAvailableProducts([]);
    }
  }, [productsData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Transform data to match backend expectations
    const transformedData = {
      supplier: formData.supplier,
      expectedDeliveryDate: formData.expectedDate,
      notes: formData.notes,
      items: formData.items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        unitCost: item.unitPrice
      }))
    };
    
    console.log('Submitting purchase order:', transformedData);
    onSubmit(transformedData);
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
  const selectedSupplier = suppliers.find(s => s._id === formData.supplier);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Purchase Order" size="large">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier Selection Card */}
        <Card className="p-5 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Supplier Information</h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">Select supplier and delivery details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.supplier}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-indigo-300 dark:border-indigo-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100 font-medium transition-all"
                required
              >
                <option value="">Select supplier...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name} {supplier.code && `(${supplier.code})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
                Expected Delivery Date
              </label>
              <Input
                type="date"
                value={formData.expectedDate}
                onChange={(e) => handleChange('expectedDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="border-2 border-indigo-300 dark:border-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Supplier Contact Info */}
          {selectedSupplier && selectedSupplier.contactInfo && (
            <div className="mt-4 pt-4 border-t border-indigo-300 dark:border-indigo-700">
              <div className="flex flex-wrap gap-4 text-sm">
                {selectedSupplier.contactInfo.phone && (
                  <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
                    <PhoneIcon className="h-4 w-4" />
                    <span>{selectedSupplier.contactInfo.phone}</span>
                  </div>
                )}
                {selectedSupplier.contactInfo.email && (
                  <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
                    <EnvelopeIcon className="h-4 w-4" />
                    <span>{selectedSupplier.contactInfo.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Reorder Suggestion Banner */}
        {selectedSuggestion && (
          <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-green-500 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Auto-Filled from Reorder Suggestions
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {selectedSuggestion.totalProducts} product{selectedSuggestion.totalProducts !== 1 ? 's' : ''} from this supplier need{selectedSuggestion.totalProducts === 1 ? 's' : ''} reordering. 
                  Review quantities and prices below.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Order Items Section */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <CubeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Order Items</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {formData.items.length} item{formData.items.length !== 1 ? 's' : ''} added
                </p>
              </div>
            </div>
            <Button 
              type="button" 
              variant="primary" 
              size="sm"
              onClick={() => setShowProductSelector(true)}
              disabled={!formData.supplier}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* Product Selector Modal */}
          {showProductSelector && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                  Select Products from {selectedSupplier?.name}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowProductSelector(false);
                    setProductSearchQuery('');
                  }}
                >
                  <XCircleIcon className="h-5 w-5" />
                </Button>
              </div>

              {/* Search Input */}
              <div className="mb-3">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Products List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {productsLoading ? (
                  <div className="text-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  (Array.isArray(availableProducts) ? availableProducts : [])
                    .filter(product => {
                      const query = productSearchQuery.toLowerCase();
                      return (
                        product.name.toLowerCase().includes(query) ||
                        product.sku.toLowerCase().includes(query)
                      );
                    })
                    .map((product, idx) => {
                      const alreadyAdded = formData.items.some(item => item.productId === product._id);
                      const stockInfo = product.stockByBranch?.[0] || {};
                      
                      return (
                        <Card
                          key={`${product._id}-${idx}`}
                          className={`p-3 cursor-pointer transition-all ${
                            alreadyAdded 
                              ? 'bg-slate-200 dark:bg-slate-700 opacity-60 cursor-not-allowed' 
                              : 'hover:shadow-md hover:border-blue-400'
                          }`}
                          onClick={() => {
                            if (!alreadyAdded) {
                              const newItem = {
                                productId: product._id,
                                name: product.name,
                                sku: product.sku,
                                currentStock: stockInfo.quantity || 0,
                                suggestedQuantity: stockInfo.reorderLevel || 10,
                                quantity: stockInfo.reorderLevel || 10,
                                unitPrice: product.price || 0
                              };
                              setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
                              setShowProductSelector(false);
                              setProductSearchQuery('');
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {product.name}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 dark:text-slate-400">
                                <span className="font-mono">{product.sku}</span>
                                <span>Stock: {stockInfo.quantity || 0}</span>
                                <span>₹{product.price?.toFixed(2) || '0.00'}</span>
                              </div>
                            </div>
                            {alreadyAdded ? (
                              <Badge variant="secondary">Already Added</Badge>
                            ) : (
                              <Button type="button" variant="outline" size="sm">
                                <PlusIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })
                )}
                {!productsLoading && (Array.isArray(availableProducts) ? availableProducts : []).filter(product => {
                  const query = productSearchQuery.toLowerCase();
                  return (
                    product.name.toLowerCase().includes(query) ||
                    product.sku.toLowerCase().includes(query)
                  );
                }).length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No products found for this supplier
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {formData.items.map((item, index) => (
              <Card key={index} className="p-4 bg-slate-50 dark:bg-slate-800/50 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Product Info */}
                  <div className="md:col-span-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      {item.name || 'New Item'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      {item.sku && (
                        <div className="flex items-center gap-1">
                          <span className="font-mono">{item.sku}</span>
                        </div>
                      )}
                      {item.currentStock !== undefined && (
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <ExclamationTriangleIcon className="h-3 w-3" />
                          <span>Current Stock: {item.currentStock}</span>
                        </div>
                      )}
                      {item.suggestedQuantity !== undefined && (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <ArrowTrendingUpIcon className="h-3 w-3" />
                          <span>Suggested: {item.suggestedQuantity}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(index, e.target.value)}
                      placeholder="Qty"
                      min="1"
                      className="text-sm font-semibold"
                    />
                  </div>

                  {/* Unit Price Input */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Unit Price (₹)
                    </label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItemPrice(index, e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="text-sm font-semibold"
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Subtotal
                    </label>
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="md:col-span-1 flex items-end justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            
            {formData.items.length === 0 && (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                <CubeIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">No items added yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formData.supplier 
                    ? 'Click "Add Item" to add products manually'
                    : 'Select a supplier to see reorder suggestions or add items manually'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Total Summary */}
          {formData.items.length > 0 && (
            <div className="mt-5 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border-2 border-indigo-200 dark:border-indigo-700">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Amount</div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Items</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {formData.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Notes Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <DocumentTextIcon className="h-4 w-4" />
            Notes & Instructions
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Add any special instructions or notes for this purchase order..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100 transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose} className="px-6">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
           disabled={isLoading || formData.items.length === 0 || !formData.supplier}
            className="px-6"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Creating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
                <span>Create Purchase Order</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default Inventory;