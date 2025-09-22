import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  CubeIcon, 
  ShoppingCartIcon, 
  ExclamationTriangleIcon, 
  ArrowTrendingUpIcon, 
  CurrencyRupeeIcon,
  PlusIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ClockIcon,
  UsersIcon,
  TruckIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/shell';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { 
  StatCard, 
  Card, 
  Button, 
  EmptyState, 
  Badge,
  Input,
  SkeletonDashboard
} from '../components/ui';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { cn } from '../utils/cn';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [dateRange, setDateRange] = useState('7days');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);

  // API fetch functions with React Query
  const fetchDashboardOverview = async () => {
    const response = await fetch('http://localhost:5000/api/dashboard/overview', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    return response.json();
  };

  const fetchSalesChartData = async (period) => {
    const response = await fetch(`http://localhost:5000/api/dashboard/sales-chart?period=${period}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sales chart data');
    }

    return response.json();
  };

  const fetchInventoryAnalytics = async () => {
    const response = await fetch('http://localhost:5000/api/dashboard/inventory-analytics', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch inventory analytics');
    }

    return response.json();
  };

  // React Query hooks with real-time updates
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard,
    isRefetching: isRefreshingDashboard
  } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: fetchDashboardOverview,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 25000,
    retry: 3,
  });

  const { 
    data: salesChartData, 
    isLoading: isSalesChartLoading,
    refetch: refetchSalesChart
  } = useQuery({
    queryKey: ['sales-chart', dateRange],
    queryFn: () => fetchSalesChartData(dateRange),
    refetchInterval: autoRefresh ? refreshInterval : false,
    enabled: !!dashboardData,
    retry: 2,
  });

  const { 
    data: inventoryData, 
    isLoading: isInventoryLoading,
    refetch: refetchInventory
  } = useQuery({
    queryKey: ['inventory-analytics'],
    queryFn: fetchInventoryAnalytics,
    refetchInterval: autoRefresh ? refreshInterval * 2 : false, // Slower refresh for inventory
    enabled: !!dashboardData,
    retry: 2,
  });

  // Handle errors with user-friendly messages
  useEffect(() => {
    if (dashboardError) {
      toast.error('Failed to load dashboard data. Please check your connection.');
    }
  }, [dashboardError]);

  // Manual refresh all data
  const handleRefreshAll = () => {
    refetchDashboard();
    refetchSalesChart();
    refetchInventory();
    toast.success('Dashboard refreshed');
  };

  // Loading state
  if (isDashboardLoading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Executive Dashboard" 
          subtitle="Real-time business insights and analytics"
        />
        <SkeletonDashboard />
      </div>
    );
  }

  // Error state
  if (dashboardError || !dashboardData?.success) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Executive Dashboard" 
          subtitle="Real-time business insights and analytics"
        />
        <EmptyState
          icon={ExclamationTriangleIcon}
          title="Failed to load dashboard data"
          description="We couldn't fetch your dashboard information. Please try again."
          action={
            <div className="flex gap-2">
              <Button onClick={refetchDashboard} variant="primary">
                Retry
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const data = dashboardData.data;

  // Enhanced KPI stats with trends and comparisons
  const kpiStats = [
    {
      title: 'Total Revenue',
      value: `₹${(data.kpis.totalRevenue || 0).toLocaleString('en-IN')}`,
      icon: CurrencyRupeeIcon,
      trend: '+15.3%',
      trendType: 'increase',
      comparison: 'vs last month',
      description: 'Monthly revenue performance',
      onClick: () => navigate('/reports'),
      color: 'emerald'
    },
    {
      title: 'Today\'s Sales',
      value: `₹${(data.kpis.todaySales?.amount || 0).toLocaleString('en-IN')}`,
      icon: ShoppingCartIcon,
      trend: `${data.kpis.todaySales?.count || 0} transactions`,
      trendType: 'neutral',
      comparison: 'today',
      description: 'Daily sales activity',
      onClick: () => navigate('/sales'),
      color: 'blue'
    },
    {
      title: 'Products in Stock',
      value: (data.kpis.totalProducts || 0).toLocaleString(),
      icon: CubeIcon,
      trend: data.kpis.lowStockCount > 0 ? `${data.kpis.lowStockCount} low stock` : 'All good',
      trendType: data.kpis.lowStockCount > 0 ? 'warning' : 'increase',
      comparison: 'active products',
      description: 'Inventory status overview',
      onClick: () => navigate('/products'),
      color: 'purple'
    },
    {
      title: 'Average Order Value',
      value: `₹${Math.round(data.kpis.last7Days?.averageOrderValue || 0).toLocaleString('en-IN')}`,
      icon: ArrowTrendingUpIcon,
      trend: '+8.2%',
      trendType: 'increase',
      comparison: 'vs last week',
      description: 'Per transaction average',
      onClick: () => navigate('/reports'),
      color: 'amber'
    },
    {
      title: '7-Day Revenue',
      value: `₹${(data.kpis.last7Days?.revenue || 0).toLocaleString('en-IN')}`,
      icon: CalendarDaysIcon,
      trend: `${data.kpis.last7Days?.sales || 0} sales`,
      trendType: 'neutral',
      comparison: 'last 7 days',
      description: 'Weekly performance',
      onClick: () => navigate('/reports'),
      color: 'cyan'
    },
    {
      title: 'Active Alerts',
      value: ((data.alerts?.lowStockItems?.length || 0) + (data.alerts?.pendingOrders || 0)).toString(),
      icon: ExclamationTriangleIcon,
      trend: (data.alerts?.lowStockItems?.length || 0) > 0 ? 'Needs attention' : 'All clear',
      trendType: (data.alerts?.lowStockItems?.length || 0) > 0 ? 'decrease' : 'increase',
      comparison: 'system alerts',
      description: 'Operations monitoring',
      onClick: () => navigate('/products'),
      color: (data.alerts?.lowStockItems?.length || 0) > 0 ? 'red' : 'green'
    }
  ];

  // Chart configurations with professional styling
  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 }
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        ticks: { 
          font: { size: 11 },
          callback: (value) => `₹${value.toLocaleString()}`
        }
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  // Generate chart data from API response
  const generateSalesChartData = (chartData) => {
    if (!chartData?.success) return null;
    
    const data = chartData.data.chartData || [];
    
    return {
      labels: data.map(item => {
        const date = new Date(item.date);
        return dateRange === '7days' 
          ? date.toLocaleDateString('en-US', { weekday: 'short' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Revenue (₹)',
          data: data.map(item => item.revenue),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Sales Count',
          data: data.map(item => item.sales),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y1',
        },
      ],
    };
  };

  // Category distribution chart from API data
  const generateCategoryChartData = () => {
    if (!data.charts?.topCategories) return null;
    
    return {
      labels: data.charts.topCategories.map(cat => cat.categoryName || cat._id),
      datasets: [
        {
          data: data.charts.topCategories.map(cat => cat.totalRevenue),
          backgroundColor: [
            '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4',
            '#EC4899', '#84CC16', '#F97316', '#6366F1', '#14B8A6'
          ],
          borderWidth: 0,
          hoverBorderWidth: 2,
          hoverBorderColor: '#fff',
        },
      ],
    };
  };

  // Top products data from recent sales
  const getTopProducts = () => {
    if (!data.alerts?.recentSales || data.alerts.recentSales.length === 0) return [];
    
    // Use top products from charts if available, otherwise use recent sales
    if (data.charts?.topProducts) {
      return data.charts.topProducts.map(product => ({
        name: product.name,
        quantity: product.totalQuantity,
        revenue: product.totalRevenue
      }));
    }
    
    // Fallback: Aggregate product sales from recent sales
    const productSales = {};
    data.alerts.recentSales.forEach(sale => {
      sale.items?.forEach(item => {
        const productName = item.productName || item.product?.name || 'Unknown Product';
        if (!productSales[productName]) {
          productSales[productName] = { quantity: 0, revenue: 0 };
        }
        productSales[productName].quantity += item.quantity;
        productSales[productName].revenue += (item.total || item.quantity * item.price);
      });
    });
    
    return Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const chartData = generateSalesChartData(salesChartData);
  const categoryData = generateCategoryChartData();
  const topProducts = getTopProducts();

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Executive Dashboard" 
          subtitle={
            <div className="flex items-center gap-2">
              <span>Real-time business insights and analytics</span>
              {isRefreshingDashboard && (
                <div className="flex items-center gap-1 text-xs text-surface-600 dark:text-surface-400">
                  <ArrowPathIcon className="h-3 w-3 animate-spin" />
                  Updating...
                </div>
              )}
            </div>
          }
        />
        
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-sm"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
          
          {/* Auto Refresh Toggle */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          
          {/* Manual Refresh */}
          <Button
            onClick={handleRefreshAll}
            variant="outline"
            size="sm"
            disabled={isRefreshingDashboard}
          >
            <ArrowPathIcon className={cn("h-4 w-4", isRefreshingDashboard && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Enhanced KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiStats.map((stat, index) => (
          <Card
            key={index}
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-105",
              "border-l-4",
              stat.color === 'emerald' && "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/50",
              stat.color === 'blue' && "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/50",
              stat.color === 'purple' && "border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/50",
              stat.color === 'amber' && "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/50",
              stat.color === 'cyan' && "border-l-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/50",
              stat.color === 'red' && "border-l-red-500 bg-red-50/50 dark:bg-red-950/50",
              stat.color === 'green' && "border-l-green-500 bg-green-50/50 dark:bg-green-950/50"
            )}
            onClick={stat.onClick}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="h-5 w-5 text-surface-600 dark:text-surface-400" />
                  <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
                    {stat.title}
                  </span>
                </div>
                
                <div className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-1">
                  {stat.value}
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      stat.trendType === 'increase' ? 'success' :
                      stat.trendType === 'decrease' ? 'destructive' :
                      stat.trendType === 'warning' ? 'warning' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {stat.trendType === 'increase' && <ArrowUpIcon className="h-3 w-3 mr-1" />}
                    {stat.trendType === 'decrease' && <ArrowDownIcon className="h-3 w-3 mr-1" />}
                    {stat.trend}
                  </Badge>
                </div>
                
                <div className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  {stat.comparison}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              Sales Trend
            </h3>
            {isSalesChartLoading && (
              <LoadingSpinner size="sm" />
            )}
          </div>
          
          <div className="h-80">
            {chartData ? (
              <Line data={chartData} options={{
                ...salesChartOptions,
                scales: {
                  ...salesChartOptions.scales,
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { 
                      font: { size: 11 },
                      callback: (value) => `${value}`
                    }
                  },
                }
              }} />
            ) : (
              <div className="flex items-center justify-center h-full text-surface-500">
                No sales data available
              </div>
            )}
          </div>
        </Card>

        {/* Category Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              Top Categories
            </h3>
          </div>
          
          <div className="h-80">
            {categoryData ? (
              <Doughnut 
                data={categoryData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 }
                      },
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const value = context.parsed;
                          return `${context.label}: ₹${value.toLocaleString()}`;
                        }
                      }
                    }
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-surface-500">
                No category data available
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Activity Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              Recent Sales
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/sales')}
            >
              View All
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {data.alerts?.recentSales?.slice(0, 5).map((sale, index) => (
              <div key={sale._id || index} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <ShoppingCartIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-surface-900 dark:text-surface-100">
                      Sale #{sale.saleNumber || sale._id?.slice(-6)}
                    </div>
                    <div className="text-sm text-surface-500 dark:text-surface-400">
                      {sale.customer?.name || 'Walk-in Customer'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-surface-900 dark:text-surface-100">
                    ₹{sale.total?.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-surface-500 dark:text-surface-400">
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            
            {(!data.alerts?.recentSales || data.alerts.recentSales.length === 0) && (
              <div className="text-center py-8 text-surface-500 dark:text-surface-400">
                No recent sales found
              </div>
            )}
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              Low Stock Alerts
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/products')}
            >
              View All
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {data.alerts?.lowStockItems?.slice(0, 5).map((product, index) => (
              <div key={product._id || index} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full">
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="font-medium text-surface-900 dark:text-surface-100">
                      {product.name}
                    </div>
                    <div className="text-sm text-surface-500 dark:text-surface-400">
                      SKU: {product.sku || product.barcode}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="warning" className="text-xs">
                    {product.stock} left
                  </Badge>
                  <div className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                    Min: {product.minStockLevel || 10}
                  </div>
                </div>
              </div>
            ))}
            
            {(!data.alerts?.lowStockItems || data.alerts.lowStockItems.length === 0) && (
              <div className="text-center py-8 text-green-600 dark:text-green-400">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full inline-block mb-2">
                  <CubeIcon className="h-6 w-6" />
                </div>
                <div>All products are well stocked!</div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'New Sale', icon: PlusIcon, action: () => navigate('/sales'), color: 'blue' },
            { label: 'Add Product', icon: CubeIcon, action: () => navigate('/products'), color: 'green' },
            { label: 'View Reports', icon: ChartBarIcon, action: () => navigate('/reports'), color: 'purple' },
            { label: 'Stock Check', icon: TruckIcon, action: () => navigate('/products'), color: 'amber' },
            { label: 'Sales History', icon: DocumentTextIcon, action: () => navigate('/sales'), color: 'cyan' },
            { label: 'Analytics', icon: ChartBarIcon, action: () => navigate('/reports'), color: 'pink' },
          ].map((action, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={action.action}
              className="flex flex-col items-center gap-2 h-20 hover:shadow-md transition-all"
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;