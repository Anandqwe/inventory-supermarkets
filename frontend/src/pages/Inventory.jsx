import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
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
  const [selectedBranch, setSelectedBranch] = useState(userBranchId || 'all');
  const [exportLoading, setExportLoading] = useState(false);
  const [alertTypeFilter, setAlertTypeFilter] = useState('all');
  
  // Adjustments tab state
  const [adjustmentSearch, setAdjustmentSearch] = useState('');
  const [adjustmentStatusFilter, setAdjustmentStatusFilter] = useState('all');
  const [adjustmentTypeFilter, setAdjustmentTypeFilter] = useState('all');
  const [adjustmentPagination, setAdjustmentPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [showAdjustmentDetailsModal, setShowAdjustmentDetailsModal] = useState(false);

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
    if (alertTypeFilter && alertTypeFilter !== 'all') {
      params.alertType = alertTypeFilter;
    }
    return params;
  }, [selectedBranch, alertTypeFilter]);

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
      // Invalidate all adjustments queries regardless of filter params
      queryClient.invalidateQueries({ queryKey: ['adjustments'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
      setShowAdjustmentModal(false);
      toast.success('Stock adjustment created successfully');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create adjustment';
      toast.error(errorMessage);
      console.error('Adjustment creation error:', error);
    }
  });

  const createTransferMutation = useMutation({
    mutationFn: inventoryAPI.createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
      setShowTransferModal(false);
      toast.success('Stock transfer created successfully');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create transfer';
      toast.error(errorMessage);
      console.error('Transfer creation error:', error);
    }
  });

  const createPurchaseOrderMutation = useMutation({
    mutationFn: purchaseAPI.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setShowPurchaseOrderModal(false);
      toast.success('Purchase order created successfully');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create purchase order';
      toast.error(errorMessage);
      console.error('Purchase order creation error:', error);
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

  // Filter low stock items by alert type
  const filteredLowStockItems = useMemo(() => {
    if (!lowStockData?.data?.products) return [];
    
    const items = lowStockData.data.products;
    
    if (alertTypeFilter === 'all') {
      return items;
    } else if (alertTypeFilter === 'critical') {
      return items.filter(item => item.urgency === 'critical');
    } else if (alertTypeFilter === 'low-stock') {
      return items.filter(item => item.urgency !== 'critical');
    } else if (alertTypeFilter === 'reorder') {
      // Items that need reorder (this could be all low stock items or items below certain level)
      return items.filter(item => item.stockQuantity <= item.reorderLevel);
    }
    
    return items;
  }, [lowStockData, alertTypeFilter]);

  // Filter adjustments by search, status, and type
  const filteredAdjustments = useMemo(() => {
    if (!adjustmentsData?.data) return [];
    
    let filtered = adjustmentsData.data;
    
    // Filter by search term
    if (adjustmentSearch.trim()) {
      const searchLower = adjustmentSearch.toLowerCase();
      filtered = filtered.filter(adj => 
        adj.adjustmentNumber?.toLowerCase().includes(searchLower) ||
        adj.product?.name?.toLowerCase().includes(searchLower) ||
        adj.product?.sku?.toLowerCase().includes(searchLower) ||
        adj.reason?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by status
    if (adjustmentStatusFilter !== 'all') {
      filtered = filtered.filter(adj => adj.status === adjustmentStatusFilter);
    }
    
    // Filter by type
    if (adjustmentTypeFilter !== 'all') {
      filtered = filtered.filter(adj => adj.type === adjustmentTypeFilter);
    }
    
    return filtered;
  }, [adjustmentsData, adjustmentSearch, adjustmentStatusFilter, adjustmentTypeFilter]);

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
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue()}</span>
      )
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
      accessorKey: 'branch',
      header: 'Branch',
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue()?.name || 'N/A'}</span>
      )
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ getValue }) => (
        <Badge variant={getValue() === 'increase' ? 'success' : 'destructive'}>
          {getValue() === 'increase' ? '➕ Add' : '➖ Remove'}
        </Badge>
      )
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => (
        <span className={`font-semibold ${row.original.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
          {row.original.type === 'increase' ? '+' : '-'}{row.original.quantity}
        </span>
      )
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ getValue }) => (
        <span className="text-sm capitalize">{getValue()?.replace(/-/g, ' ')}</span>
      )
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
      cell: ({ getValue }) => (
        <div className="text-sm">
          <div>{new Date(getValue()).toLocaleDateString()}</div>
          <div className="text-xs text-slate-500">{new Date(getValue()).toLocaleTimeString()}</div>
        </div>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedAdjustment(row.original);
              setShowAdjustmentDetailsModal(true);
            }}
            className="h-8 w-8 p-0"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Stock Transfers Table
  const transfersColumns = [
    {
      accessorKey: 'transferNumber',
      header: 'Transfer #',
    },
    {
      accessorKey: 'fromBranch',
      header: 'From',
      cell: ({ getValue }) => getValue()?.name || 'N/A'
    },
    {
      accessorKey: 'toBranch',
      header: 'To',
      cell: ({ getValue }) => getValue()?.name || 'N/A'
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
            {/* Filters Card - Matching Products page style */}
            <Card className="p-4 sm:p-5 border-0 shadow-sm bg-gradient-to-r from-white to-slate-50 dark:from-surface-900 dark:to-zinc-900 sticky top-0 z-10">
              <div className="flex flex-col gap-4">
                {/* Header with Title and Filter Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FunnelIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                      Search & Filters
                    </h3>
                  </div>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Branch Filter (Admin/Regional Manager Only) */}
                  {(user?.role === 'Admin' || user?.role === 'Regional Manager') && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-600 uppercase tracking-wide">
                        Branch
                      </label>
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="h-10 px-3 border-2 border-zinc-400 dark:border-zinc-900 rounded-lg bg-white dark:bg-zinc-950 text-sm text-zinc-950 dark:text-zinc-100 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-colors cursor-pointer hover:border-zinc-500 dark:hover:border-zinc-800"
                      >
                        <option value="all">All Branches</option>
                        {branchesData?.data?.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Alert Type Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-600 uppercase tracking-wide">
                      Alert Type
                    </label>
                    <select
                      value={alertTypeFilter}
                      onChange={(e) => setAlertTypeFilter(e.target.value)}
                      className="h-10 px-3 border-2 border-zinc-400 dark:border-zinc-900 rounded-lg bg-white dark:bg-zinc-950 text-sm text-zinc-950 dark:text-zinc-100 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-colors cursor-pointer hover:border-zinc-500 dark:hover:border-zinc-800"
                    >
                      <option value="all">All Alerts</option>
                      <option value="critical">🔴 Critical (Out of Stock)</option>
                      <option value="low-stock">🟠 Low Stock</option>
                      <option value="reorder">🔵 Reorder Required</option>
                    </select>
                  </div>

                  {/* Clear Button */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBranch('all');
                        setAlertTypeFilter('all');
                      }}
                      className="w-full h-10"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

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
                ) : filteredLowStockItems?.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredLowStockItems.map((item) => (
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

            {/* Filters Card */}
            <Card className="p-4 sm:p-5 border-0 shadow-sm bg-gradient-to-r from-white to-slate-50 dark:from-surface-900 dark:to-zinc-900">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                    Search & Filters
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-600 uppercase tracking-wide">
                      Search
                    </label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                      <input
                        type="text"
                        value={adjustmentSearch}
                        onChange={(e) => setAdjustmentSearch(e.target.value)}
                        placeholder="Adjustment #, Product..."
                        className="w-full h-10 pl-10 pr-3 border-2 border-zinc-400 dark:border-zinc-900 rounded-lg bg-white dark:bg-zinc-950 text-sm text-zinc-950 dark:text-zinc-100 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-600 uppercase tracking-wide">
                      Status
                    </label>
                    <select
                      value={adjustmentStatusFilter}
                      onChange={(e) => setAdjustmentStatusFilter(e.target.value)}
                      className="h-10 px-3 border-2 border-zinc-400 dark:border-zinc-900 rounded-lg bg-white dark:bg-zinc-950 text-sm text-zinc-950 dark:text-zinc-100 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-colors cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">⏳ Pending</option>
                      <option value="approved">✅ Approved</option>
                      <option value="rejected">❌ Rejected</option>
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-600 uppercase tracking-wide">
                      Type
                    </label>
                    <select
                      value={adjustmentTypeFilter}
                      onChange={(e) => setAdjustmentTypeFilter(e.target.value)}
                      className="h-10 px-3 border-2 border-zinc-400 dark:border-zinc-900 rounded-lg bg-white dark:bg-zinc-950 text-sm text-zinc-950 dark:text-zinc-100 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-colors cursor-pointer"
                    >
                      <option value="all">All Types</option>
                      <option value="increase">➕ Increase</option>
                      <option value="decrease">➖ Decrease</option>
                    </select>
                  </div>

                  {/* Clear Button */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAdjustmentSearch('');
                        setAdjustmentStatusFilter('all');
                        setAdjustmentTypeFilter('all');
                      }}
                      className="w-full h-10"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

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
                      {filteredAdjustments.length} of {adjustmentsData?.data?.length || 0} adjustments
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
                    <ArrowPathIcon className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Refresh</span>
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
              ) : filteredAdjustments.length > 0 ? (
                <div className="overflow-x-auto -mx-4 md:-mx-6">
                  <div className="inline-block min-w-full align-middle px-4 md:px-6">
                    <DataTable
                      data={filteredAdjustments}
                      columns={adjustmentsColumns}
                      pagination={adjustmentPagination}
                      onPaginationChange={setAdjustmentPagination}
                      totalRows={filteredAdjustments.length}
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

  const handleExportInventory = async () => {
    try {
      setExportLoading(true);
      
      // Helper function to convert array of objects to CSV
      const convertToCSV = (data) => {
        if (!data || data.length === 0) return '';
        
        const keys = Object.keys(data[0]);
        const headers = keys.join(',');
        const rows = data.map(obj =>
          keys.map(key => {
            const value = obj[key];
            // Escape commas and quotes in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        );
        
        return [headers, ...rows].join('\n');
      };
      
      // Determine what data to export based on active tab
      if (activeTab === 'adjustments' && adjustmentsData?.data?.length > 0) {
        // Export adjustments as CSV
        const csvData = adjustmentsData.data.map(adj => ({
          'Date': new Date(adj.createdAt).toLocaleDateString(),
          'Product': adj.product?.name || 'N/A',
          'SKU': adj.product?.sku || 'N/A',
          'Type': adj.type || '',
          'Quantity': adj.quantity || 0,
          'Reason': adj.reason || '',
          'Branch': adj.branch?.name || 'N/A'
        }));
        
        const csv = convertToCSV(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = `inventory-adjustments-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Adjustments exported successfully');
      } else if (activeTab === 'transfers' && transfersData?.data?.length > 0) {
        // Export transfers as CSV
        const csvData = transfersData.data.map(transfer => ({
          'Date': new Date(transfer.createdAt).toLocaleDateString(),
          'From Branch': transfer.fromBranch?.name || 'N/A',
          'To Branch': transfer.toBranch?.name || 'N/A',
          'Status': transfer.status || '',
          'Total Items': transfer.items?.length || 0,
          'Created By': transfer.createdBy?.fullName || 'N/A'
        }));
        
        const csv = convertToCSV(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = `inventory-transfers-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Transfers exported successfully');
      } else if (activeTab === 'purchase-orders' && purchaseOrdersData?.data?.length > 0) {
        // Export purchase orders as CSV
        const csvData = purchaseOrdersData.data.map(po => ({
          'PO Number': po.poNumber || '',
          'Date': new Date(po.createdAt).toLocaleDateString(),
          'Supplier': po.supplier?.name || 'N/A',
          'Branch': po.branch?.name || 'N/A',
          'Total Items': po.items?.length || 0,
          'Total Amount': po.total || 0,
          'Status': po.status || '',
          'Expected Delivery': po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : 'N/A'
        }));
        
        const csv = convertToCSV(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = `inventory-purchase-orders-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Purchase Orders exported successfully');
      } else if (activeTab === 'alerts' || activeTab === 'overview') {
        // Export Low Stock Items as CSV
        if (!lowStockData?.data?.products || lowStockData.data.products.length === 0) {
          toast.info('No low stock items to export');
          return;
        }

        const csvData = lowStockData.data.products.map(product => ({
          'Product Name': product.name || '',
          'SKU': product.sku || '',
          'Barcode': product.barcode || '',
          'Category': product.category?.name || '',
          'Current Quantity': product.stockByBranch?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0,
          'Reorder Level': product.stockByBranch?.[0]?.reorderLevel || 0,
          'Selling Price': product.pricing?.sellingPrice || 0,
          'Branch': product.stockByBranch?.[0]?.branch?.name || 'N/A'
        }));
        
        const csv = convertToCSV(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = `low-stock-items-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Low stock items exported successfully');
      } else {
        toast.info('No data available to export');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Failed to export inventory');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Operations"
        description="Manage stock levels, transfers, and purchase orders"
      >
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={handleExportInventory}
            disabled={exportLoading}
          >
            <ArrowDownTrayIcon className={`h-4 w-4 mr-2 ${exportLoading ? 'animate-spin' : ''}`} />
            {exportLoading ? 'Exporting...' : 'Export'}
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

      {/* Adjustment Details Modal */}
      <AdjustmentDetailsModal
        isOpen={showAdjustmentDetailsModal}
        onClose={() => {
          setShowAdjustmentDetailsModal(false);
          setSelectedAdjustment(null);
        }}
        adjustment={selectedAdjustment}
      />
    </div>
  );
}

// Stock Adjustment Modal Component
function StockAdjustmentModal({ isOpen, onClose, onSubmit, isLoading }) {
  const { user } = useAuth();
  const userBranchId = useMemo(() => getBranchIdFromUser(user), [user]);
  const [formData, setFormData] = useState({
    product: null,
    quantity: '',
    reason: '',
    notes: '',
    branch: userBranchId || ''
  });
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Fetch all products WITHOUT branch filter to show all available products
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products-for-adjustment'],
    queryFn: async () => {
      // Fetch all products without branch filter to allow selection from all inventory
      try {
        const response = await productsAPI.getAll({ 
          limit: 500,  // Increased limit to get more products
          page: 1
        });
        console.log('API Response:', response);
        return response;
      } catch (error) {
        console.error('Products API Error:', error);
        throw error;
      }
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch all branches
  const { data: branchesData } = useQuery({
    queryKey: ['branches-for-adjustment'],
    queryFn: () => masterDataAPI.getBranches(),
    enabled: isOpen
  });

  // Determine type based on reason
  const getAdjustmentType = (reasonValue) => {
    const increaseReasons = ['return', 'transfer-in', 'correction-add', 'found'];
    return increaseReasons.includes(reasonValue) ? 'increase' : 'decrease';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError('');
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.product?._id) newErrors.product = 'Please select a product';
    if (!formData.quantity || formData.quantity < 1) newErrors.quantity = 'Please enter a valid quantity';
    if (!formData.reason) newErrors.reason = 'Please select a reason';
    if (!formData.branch) newErrors.branch = 'Please select a branch';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const adjustmentType = getAdjustmentType(formData.reason);

    // Format data to match backend API expectation
    const submitData = {
      branch: formData.branch,
      type: adjustmentType,
      reason: formData.reason,
      notes: formData.notes,
      items: [
        {
          product: formData.product._id,
          adjustedQuantity: parseInt(formData.quantity),
          productName: formData.product.name,
          sku: formData.product.sku,
          unit: formData.product.unit?.symbol || 'pcs'
        }
      ]
    };

    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleProductSelect = (product) => {
    handleChange('product', product);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const handleClose = () => {
    setFormData({
      product: null,
      quantity: '',
      reason: '',
      notes: '',
      branch: userBranchId || ''
    });
    setProductSearch('');
    setShowProductDropdown(false);
    setErrors({});
    setSubmitError('');
    onClose();
  };

  // Adjustment reasons - organized by type with better descriptions
  const adjustmentReasons = [
    { value: 'damaged', label: '🔴 Damaged goods - Remove from inventory' },
    { value: 'expired', label: '⏰ Expired products - Remove from inventory' },
    { value: 'theft', label: '⚠️ Theft/Loss - Remove from inventory' },
    { value: 'receiving', label: '📦 Receiving discrepancy - Adjust to correct count' },
    { value: 'counting', label: '🔍 Stock count correction - Physical stock verification' },
    { value: 'return', label: '↩️ Customer return - Add back to inventory' },
    { value: 'transfer-in', label: '➡️ Transfer received - Add from another branch' },
    { value: 'correction-add', label: '✅ Stock correction (Add) - Increase inventory' },
    { value: 'found', label: '🎁 Found stock - Add to inventory' },
    { value: 'other', label: '📝 Other - Specify in notes' }
  ];

  // Filter products based on search - done locally
  const filteredProducts = useMemo(() => {
    if (!productsData) {
      console.log('productsData is null/undefined');
      return [];
    }
    
    console.log('Full productsData structure:', productsData);
    
    // The API response structure is { success, message, data: {...}, timestamp }
    // We need to extract the actual products array from the nested data object
    let allProducts = [];
    
    if (Array.isArray(productsData)) {
      allProducts = productsData;
    } else if (Array.isArray(productsData?.data)) {
      // If productsData.data is already an array
      allProducts = productsData.data;
    } else if (productsData?.data && typeof productsData.data === 'object') {
      // If productsData.data is an object with nested structure
      // Check common patterns: data.data, data.products, data.items
      if (Array.isArray(productsData.data.data)) {
        allProducts = productsData.data.data;
      } else if (Array.isArray(productsData.data.products)) {
        allProducts = productsData.data.products;
      } else if (Array.isArray(productsData.data.items)) {
        allProducts = productsData.data.items;
      } else {
        // If data is an object, try to extract values as array
        const values = Object.values(productsData.data).filter(v => Array.isArray(v));
        if (values.length > 0) {
          allProducts = values[0];
        }
      }
    }
    
    console.log('Extracted allProducts count:', allProducts.length, 'Sample:', allProducts[0]);
    
    // If no search term, return all products
    if (!productSearch.trim()) {
      console.log('No search, returning all products:', allProducts.length);
      return allProducts;
    }
    
    // Filter by search term
    const searchLower = productSearch.toLowerCase().trim();
    const filtered = allProducts.filter(product => {
      const name = product.name?.toLowerCase() || '';
      const sku = product.sku?.toLowerCase() || '';
      const barcode = product.barcode?.toLowerCase() || '';
      
      return name.includes(searchLower) || sku.includes(searchLower) || barcode.includes(searchLower);
    });
    
    console.log('Filtered products:', filtered.length, 'search term:', searchLower);
    return filtered;
  }, [productsData, productSearch]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Stock Adjustment">
      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{submitError}</p>
          </div>
        )}

        {/* Branch Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
            Branch <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.branch}
            onChange={(e) => handleChange('branch', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 transition-colors ${
              errors.branch 
                ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            <option value="">Select a branch...</option>
            {branchesData?.data?.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
          {errors.branch && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.branch}</p>}
        </div>

        {/* Product Selection with Search */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
            Product <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div
              className={`w-full px-3 py-2 border rounded-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 transition-colors flex items-center justify-between ${
                errors.product 
                  ? 'border-red-500 dark:border-red-500 focus-within:ring-red-500' 
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              <div className="flex-1">
                {formData.product ? (
                  <div className="flex items-center gap-2">
                    <CubeIcon className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{formData.product.name}</p>
                      <p className="text-xs text-slate-500">SKU: {formData.product.sku}</p>
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Search by name, SKU, or barcode..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="w-full bg-transparent focus:outline-none placeholder-slate-400"
                  />
                )}
              </div>
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
            </div>

            {/* Product Dropdown */}
            {showProductDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {formData.product && (
                  <button
                    type="button"
                    onClick={() => handleProductSelect(null)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border-b border-slate-200 dark:border-slate-600"
                  >
                    ✕ Clear selection
                  </button>
                )}
                
                {productsLoading ? (
                  <div className="px-3 py-3 text-sm text-slate-500 text-center">
                    <p>Loading products...</p>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => handleProductSelect(product)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center justify-between border-b border-slate-100 dark:border-slate-600 last:border-0 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{product.name}</p>
                        <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                      </div>
                      {product.stocks && product.stocks.length > 0 && (
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">
                          Stock: {product.stocks[0]?.quantity || 0}
                        </Badge>
                      )}
                    </button>
                  ))
                ) : productSearch.trim().length > 0 ? (
                  <div className="px-3 py-3 text-sm text-slate-500 text-center">
                    <p>No products found matching "{productSearch}"</p>
                  </div>
                ) : (
                  <div className="px-3 py-3 text-sm text-slate-500 text-center">
                    <p>Start typing to search products...</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {errors.product && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.product}</p>}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
            Quantity <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            placeholder="Enter quantity"
            min="1"
            className={errors.quantity ? 'border-red-500' : ''}
          />
          {errors.quantity && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.quantity}</p>}
        </div>

        {/* Reason - determines type automatically */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 transition-colors ${
              errors.reason 
                ? 'border-red-500 dark:border-red-500 focus:ring-red-500' 
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            <option value="">Select a reason...</option>
            {adjustmentReasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
          {errors.reason && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.reason}</p>}
          
          {formData.reason && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              Type: <span className="font-medium">
                {getAdjustmentType(formData.reason) === 'increase' ? '➕ ADD to inventory' : '➖ REMOVE from inventory'}
              </span>
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Add any additional details..."
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 resize-none"
          />
        </div>

        {/* Summary */}
        {formData.product && formData.reason && (
          <div className={`p-3 rounded-lg border ${
            getAdjustmentType(formData.reason) === 'increase'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <p className={`text-sm font-medium ${
              getAdjustmentType(formData.reason) === 'increase'
                ? 'text-green-900 dark:text-green-100'
                : 'text-red-900 dark:text-red-100'
            }`}>
              {getAdjustmentType(formData.reason) === 'increase' ? '➕ Adding' : '➖ Removing'} {formData.quantity || '0'} units of <span className="font-semibold">{formData.product.name}</span>
            </p>
            <p className={`text-xs mt-1 ${
              getAdjustmentType(formData.reason) === 'increase'
                ? 'text-green-700 dark:text-green-200'
                : 'text-red-700 dark:text-red-200'
            }`}>
              Reason: {adjustmentReasons.find(r => r.value === formData.reason)?.label}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Creating...</span>
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Adjustment
              </>
            )}
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
    expectedDate: '',
    priority: 'normal',
    items: [],
    notes: ''
  });
  
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [errors, setErrors] = useState({});

  // Fetch products with stock info for the selected source branch
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products-for-transfer', formData.fromBranch],
    queryFn: async () => {
      if (!formData.fromBranch) return null;
      try {
        const response = await productsAPI.getAll({ 
          limit: 500,
          page: 1
        });
        console.log('Products API response for transfer:', response);
        return response;
      } catch (error) {
        console.error('Error fetching products for transfer:', error);
        throw error;
      }
    },
    enabled: isOpen && !!formData.fromBranch,
    retry: 1
  });

  // Filter products based on search and branch
  const filteredProducts = useMemo(() => {
    if (!productsData) {
      console.log('No productsData available');
      return [];
    }
    
    // Extract products array from various possible response structures
    let allProducts = [];
    if (Array.isArray(productsData)) {
      allProducts = productsData;
    } else if (Array.isArray(productsData.data)) {
      allProducts = productsData.data;
    } else if (productsData.data && Array.isArray(productsData.data.data)) {
      allProducts = productsData.data.data;
    } else if (productsData.data && Array.isArray(productsData.data.products)) {
      allProducts = productsData.data.products;
    }
    
    console.log('Extracted products:', allProducts.length);
    
    // Filter by branch - only show products that have stock at the selected branch
    let branchProducts = allProducts.filter(product => {
      if (!product.stockByBranch && !product.stocks) return false;
      
      const stockArray = product.stockByBranch || product.stocks || [];
      const branchStock = stockArray.find(s => {
        const stockBranchId = typeof s.branch === 'object' ? s.branch._id : s.branch;
        return stockBranchId === formData.fromBranch;
      });
      
      return branchStock && branchStock.quantity > 0;
    });
    
    console.log('Products with stock at branch:', branchProducts.length);
    
    // Filter by search term
    if (!productSearch.trim()) return branchProducts;
    
    const searchLower = productSearch.toLowerCase();
    return branchProducts.filter(p => 
      p.name?.toLowerCase().includes(searchLower) ||
      p.sku?.toLowerCase().includes(searchLower)
    );
  }, [productsData, productSearch, formData.fromBranch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.fromBranch) newErrors.fromBranch = 'Please select source branch';
    if (!formData.toBranch) newErrors.toBranch = 'Please select destination branch';
    if (formData.fromBranch === formData.toBranch) {
      newErrors.toBranch = 'Cannot transfer to the same branch';
    }
    if (formData.items.length === 0) newErrors.items = 'Please add at least one item';
    if (!formData.expectedDate) newErrors.expectedDate = 'Please select expected date';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Format data for API - match backend expectations
    const submitData = {
      fromBranch: formData.fromBranch,
      toBranch: formData.toBranch,
      expectedDeliveryDate: formData.expectedDate,
      reason: 'restock', // Required by backend model - map priority to reason
      notes: formData.notes || '',
      items: formData.items.map(item => ({
        product: item.productId,
        quantity: parseInt(item.quantity),
        unitCost: 0
      }))
    };

    console.log('Submitting transfer:', submitData);
    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear items if source branch changes
    if (field === 'fromBranch' && value !== formData.fromBranch) {
      setFormData(prev => ({ ...prev, items: [] }));
    }
  };

  const addProduct = (product) => {
    // Check if already added
    if (formData.items.some(item => item.productId === product._id)) {
      toast.info('Product already added');
      return;
    }

    // Get stock info for this product at source branch
    const stockInfo = product.stockByBranch?.find(s => s.branch === formData.fromBranch) || 
                     product.stocks?.find(s => s.branch === formData.fromBranch);
    const availableQty = stockInfo?.quantity || 0;

    if (availableQty === 0) {
      toast.error('No stock available at source branch');
      return;
    }

    const newItem = {
      productId: product._id,
      name: product.name,
      sku: product.sku,
      availableQuantity: availableQty,
      quantity: Math.min(availableQty, 1)
    };

    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setShowProductSearch(false);
    setProductSearch('');
    if (errors.items) {
      setErrors(prev => ({ ...prev, items: '' }));
    }
  };

  const updateItemQuantity = (index, quantity) => {
    const qty = parseInt(quantity) || 0;
    const item = formData.items[index];
    
    if (qty > item.availableQuantity) {
      toast.error(`Only ${item.availableQuantity} units available`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, quantity: qty } : item
      )
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleClose = () => {
    setFormData({
      fromBranch: '',
      toBranch: '',
      expectedDate: '',
      priority: 'normal',
      items: [],
      notes: ''
    });
    setProductSearch('');
    setShowProductSearch(false);
    setErrors({});
    onClose();
  };

  const totalItems = formData.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Stock Transfer" size="large">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branch Selection */}
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                From Branch (Source) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.fromBranch}
                onChange={(e) => handleChange('fromBranch', e.target.value)}
                className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-slate-100 ${
                  errors.fromBranch ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                <option value="">Select source branch...</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {errors.fromBranch && <p className="mt-1 text-xs text-red-600">{errors.fromBranch}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                To Branch (Destination) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.toBranch}
                onChange={(e) => handleChange('toBranch', e.target.value)}
                className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-slate-100 ${
                  errors.toBranch ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
                disabled={!formData.fromBranch}
              >
                <option value="">Select destination branch...</option>
                {branches
                  .filter(b => b._id !== formData.fromBranch)
                  .map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
              </select>
              {errors.toBranch && <p className="mt-1 text-xs text-red-600">{errors.toBranch}</p>}
            </div>
          </div>
        </Card>

        {/* Transfer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Expected Delivery Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.expectedDate}
              onChange={(e) => handleChange('expectedDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={errors.expectedDate ? 'border-red-500' : ''}
            />
            {errors.expectedDate && <p className="mt-1 text-xs text-red-600">{errors.expectedDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="low">🟢 Low - Standard delivery</option>
              <option value="normal">🟡 Normal - Regular priority</option>
              <option value="high">🟠 High - Expedited</option>
              <option value="urgent">🔴 Urgent - Immediate</option>
            </select>
          </div>
        </div>

        {/* Products Section */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Transfer Items
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {formData.fromBranch ? 'Add products to transfer' : 'Select source branch first'}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowProductSearch(!showProductSearch)}
              disabled={!formData.fromBranch}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {errors.items && <p className="mb-3 text-sm text-red-600">{errors.items}</p>}

          {/* Product Search */}
          {showProductSearch && formData.fromBranch && (
            <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
              <div className="relative mb-3">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products by name or SKU..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {productsLoading ? (
                  <div className="text-center py-4">
                    <LoadingSpinner size="sm" />
                    <p className="text-xs text-slate-500 mt-2">Loading products...</p>
                  </div>
                ) : productsError ? (
                  <div className="text-center py-4 text-red-600">
                    <p className="text-sm">Error loading products</p>
                    <p className="text-xs mt-1">{productsError.message}</p>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map(product => {
                    const stockInfo = product.stockByBranch?.find(s => s.branch === formData.fromBranch) || 
                                     product.stocks?.find(s => s.branch === formData.fromBranch);
                    const availableQty = stockInfo?.quantity || 0;
                    const alreadyAdded = formData.items.some(item => item.productId === product._id);

                    return (
                      <Card
                        key={product._id}
                        className={`p-3 cursor-pointer transition-all ${
                          alreadyAdded 
                            ? 'bg-slate-100 dark:bg-slate-700 opacity-50' 
                            : 'hover:shadow-md hover:border-purple-300'
                        }`}
                        onClick={() => !alreadyAdded && addProduct(product)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 dark:text-slate-400">
                              <span className="font-mono">{product.sku}</span>
                              <span className={availableQty > 0 ? 'text-green-600' : 'text-red-600'}>
                                Available: {availableQty}
                              </span>
                            </div>
                          </div>
                          {alreadyAdded ? (
                            <Badge variant="secondary">Added</Badge>
                          ) : availableQty === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : (
                            <Button type="button" variant="ghost" size="sm">
                              <PlusIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    {productSearch ? 'No products found' : 'No products available at this branch'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-3">
            {formData.items.map((item, index) => (
              <Card key={index} className="p-4 bg-slate-50 dark:bg-slate-800/50 border-l-4 border-l-purple-500">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-1">{item.sku}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Available: {item.availableQuantity} units
                    </p>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Transfer Quantity
                    </label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(index, e.target.value)}
                      min="1"
                      max={item.availableQuantity}
                      className="text-sm font-semibold"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <div className="text-center">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Remaining</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {item.availableQuantity - item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {formData.items.length === 0 && (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                <TruckIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">No items added</p>
                <p className="text-sm text-slate-500">
                  {formData.fromBranch 
                    ? 'Click "Add Item" to select products for transfer'
                    : 'Select source branch to begin'}
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          {formData.items.length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Items</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {totalItems}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Product Types</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {formData.items.length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
            Transfer Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Add any special instructions or notes for this transfer..."
            rows={3}
            className="w-full px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isLoading || formData.items.length === 0}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Creating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5" />
                <span>Create Transfer</span>
              </div>
            )}
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

// Adjustment Details Modal Component
function AdjustmentDetailsModal({ isOpen, onClose, adjustment }) {
  if (!adjustment) return null;

  const getAdjustmentTypeIcon = (type) => {
    return type === 'increase' ? '➕' : '➖';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100',
      approved: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
      rejected: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
    };
    return colors[status] || colors.pending;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const createdDate = formatDate(adjustment.createdAt);
  const updatedDate = adjustment.updatedAt ? formatDate(adjustment.updatedAt) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjustment Details">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {adjustment.adjustmentNumber || 'N/A'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {createdDate.date} at {createdDate.time}
            </p>
          </div>
          <Badge variant={
            adjustment.status === 'approved' ? 'success' :
            adjustment.status === 'rejected' ? 'destructive' : 'warning'
          }>
            {adjustment.status?.toUpperCase()}
          </Badge>
        </div>

        {/* Status Banner */}
        <div className={`p-4 rounded-lg border ${getStatusColor(adjustment.status)}`}>
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {adjustment.status === 'approved' && '✅'}
              {adjustment.status === 'rejected' && '❌'}
              {adjustment.status === 'pending' && '⏳'}
            </div>
            <div>
              <p className="font-semibold">
                {adjustment.status === 'approved' && 'Adjustment Approved'}
                {adjustment.status === 'rejected' && 'Adjustment Rejected'}
                {adjustment.status === 'pending' && 'Pending Approval'}
              </p>
              <p className="text-sm opacity-80 mt-0.5">
                {adjustment.status === 'approved' && 'This adjustment has been applied to inventory'}
                {adjustment.status === 'rejected' && 'This adjustment was not applied'}
                {adjustment.status === 'pending' && 'Waiting for manager approval'}
              </p>
            </div>
          </div>
        </div>

        {/* Product Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            Product Information
          </h4>
          <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Product Name</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {adjustment.product?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">SKU</p>
                <p className="font-mono text-sm text-slate-900 dark:text-slate-100">
                  {adjustment.product?.sku || 'N/A'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Adjustment Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            Adjustment Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className={`p-4 ${
              adjustment.type === 'increase' 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
            }`}>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Type</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getAdjustmentTypeIcon(adjustment.type)}</span>
                <span className={`font-semibold text-lg ${
                  adjustment.type === 'increase' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {adjustment.type === 'increase' ? 'Increase' : 'Decrease'}
                </span>
              </div>
            </Card>

            <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Quantity</p>
              <p className={`text-2xl font-bold ${
                adjustment.type === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {adjustment.type === 'increase' ? '+' : '-'}{adjustment.quantity || 0}
              </p>
            </Card>

            <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Branch</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {adjustment.branch?.name || 'N/A'}
              </p>
            </Card>

            <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Reason</p>
              <p className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                {adjustment.reason?.replace(/-/g, ' ') || 'N/A'}
              </p>
            </Card>
          </div>
        </div>

        {/* Notes */}
        {adjustment.notes && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Notes
            </h4>
            <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {adjustment.notes}
              </p>
            </Card>
          </div>
        )}

        {/* User Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            User Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Created By</p>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-slate-500" />
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {adjustment.createdBy?.fullName || adjustment.createdBy?.username || 'N/A'}
                </p>
              </div>
            </Card>

            {adjustment.approvedBy && (
              <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  {adjustment.status === 'approved' ? 'Approved By' : 'Reviewed By'}
                </p>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-slate-500" />
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {adjustment.approvedBy?.fullName || adjustment.approvedBy?.username || 'N/A'}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            Timeline
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Created</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {createdDate.date} at {createdDate.time}
                </p>
              </div>
            </div>
            {updatedDate && (
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                  adjustment.status === 'approved' ? 'bg-green-500' : 
                  adjustment.status === 'rejected' ? 'bg-red-500' : 'bg-orange-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {adjustment.status === 'approved' ? 'Approved' : 
                     adjustment.status === 'rejected' ? 'Rejected' : 'Updated'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {updatedDate.date} at {updatedDate.time}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default Inventory;
