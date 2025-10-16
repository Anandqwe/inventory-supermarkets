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
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // API fetch functions with React Query
  const fetchDashboardOverview = async (period = '7days') => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/overview?period=${period}`, {
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
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/sales-chart?period=${period}`, {
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
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/inventory-analytics`, {
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
    queryKey: ['dashboard-overview', dateRange],
    queryFn: () => fetchDashboardOverview(dateRange),
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
  const getPeriodLabel = (period) => {
    switch (period) {
      case '24hours': return 'Last 24 Hours';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '12months': return 'Last 12 Months';
      default: return 'Selected Period';
    }
  };

  const kpiStats = [
    {
      title: 'Revenue',
      value: `₹${(data.kpis.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: CurrencyRupeeIcon,
      trend: `${data.kpis.totalSales || 0} sales`,
      trendType: 'increase',
      comparison: getPeriodLabel(dateRange).toLowerCase(),
      description: `Revenue performance for ${getPeriodLabel(dateRange).toLowerCase()}`,
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
      value: `₹${Math.round(data.kpis.periodStats?.averageOrderValue || 0).toLocaleString('en-IN')}`,
      icon: ArrowTrendingUpIcon,
      trend: `${getPeriodLabel(dateRange)}`,
      trendType: 'increase',
      comparison: 'per transaction',
      description: `Average order value for ${getPeriodLabel(dateRange).toLowerCase()}`,
      onClick: () => navigate('/reports'),
      color: 'amber'
    },
    {
      title: 'Sales Count',
      value: `${(data.kpis.periodStats?.sales || 0).toLocaleString('en-IN')}`,
      icon: CalendarDaysIcon,
      trend: `₹${Math.round((data.kpis.periodStats?.revenue || 0) / (data.kpis.periodStats?.sales || 1)).toLocaleString('en-IN')} avg`,
      trendType: 'neutral',
      comparison: getPeriodLabel(dateRange).toLowerCase(),
      description: `Total transactions for ${getPeriodLabel(dateRange).toLowerCase()}`,
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
          font: { size: 12 },
          color: isDark ? '#d4d4d4' : '#374151'
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#ffffff' : '#1f2937',
        bodyColor: isDark ? '#e5e5e5' : '#374151',
        borderColor: isDark ? '#262626' : '#e5e7eb',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          font: { size: 11 },
          color: isDark ? '#a3a3a3' : '#6b7280'
        }
      },
      y: {
        beginAtZero: true,
        grid: { 
          color: isDark ? 'rgba(38, 38, 38, 0.3)' : 'rgba(229, 231, 235, 0.5)'
        },
        ticks: { 
          font: { size: 11 },
          color: isDark ? '#a3a3a3' : '#6b7280',
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
    if (!chartData?.success || !chartData.data || !Array.isArray(chartData.data)) return null;
    
    const data = chartData.data;
    
    if (data.length === 0) return null;
    
    return {
      labels: data.map(item => {
        try {
          const date = new Date(item.date);
          if (isNaN(date.getTime())) return 'Invalid Date';
          
          return dateRange === '24hours' 
            ? date.toLocaleDateString('en-US', { hour: 'numeric' })
            : dateRange === '7days' 
            ? date.toLocaleDateString('en-US', { weekday: 'short' })
            : dateRange === '12months'
            ? date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (error) {
          console.warn('Date parsing error:', error);
          return 'Invalid Date';
        }
      }),
      datasets: [
        {
          label: 'Revenue (₹)',
          data: data.map(item => item.revenue || 0),
          borderColor: '#c084fc',
          backgroundColor: 'rgba(192, 132, 252, 0.2)',
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#c084fc',
          pointBorderColor: '#000000',
          pointBorderWidth: 2,
        },
        {
          label: 'Sales Count',
          data: data.map(item => item.sales || 0),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.2)',
          tension: 0.4,
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#38bdf8',
          pointBorderColor: '#000000',
          pointBorderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    };
  };

  // Category distribution chart from API data
  const generateCategoryChartData = () => {
    if (!data?.charts?.topCategories || !Array.isArray(data.charts.topCategories) || data.charts.topCategories.length === 0) {
      return null;
    }
    
    return {
      labels: data.charts.topCategories.map(cat => cat.categoryName || cat.name || cat._id || 'Unknown'),
      datasets: [
        {
          data: data.charts.topCategories.map(cat => cat.totalRevenue || 0),
          backgroundColor: [
            '#c084fc', '#38bdf8', '#34d399', '#fbbf24', '#f87171',
            '#ec4899', '#86efac', '#fb923c', '#8b5cf6', '#06b6d4'
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
    <div className="space-y-4 md:space-y-6">
      {/* Enhanced Header with Controls */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col gap-4">
          <PageHeader 
            title="Executive Dashboard" 
            subtitle={
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm md:text-base">Real-time business insights and analytics</span>
                {isRefreshingDashboard && (
                  <div className="flex items-center gap-1 text-xs text-surface-600 dark:text-surface-400">
                    <ArrowPathIcon className="h-3 w-3 animate-spin" />
                    <span className="hidden sm:inline">Updating...</span>
                  </div>
                )}
              </div>
            }
          />
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-surface-300 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="24hours">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="12months">Last 12 Months</option>
            </select>
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Auto Refresh Toggle */}
              <label className="flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                <span className="hidden sm:inline">Auto-refresh</span>
                <span className="sm:hidden">Auto</span>
              </label>
              
              {/* Manual Refresh */}
              <Button
                onClick={handleRefreshAll}
                variant="outline"
                size="sm"
                disabled={isRefreshingDashboard}
                className="w-full sm:w-auto"
              >
                <ArrowPathIcon className={cn("h-4 w-4 mr-1", isRefreshingDashboard && "animate-spin")} />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Sync</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions - Enhanced Cards */}
        <div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'New Sale', icon: PlusIcon, action: () => navigate('/sales'), gradient: 'from-purple-500 to-purple-600', icon_color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
              { label: 'Add Product', icon: CubeIcon, action: () => navigate('/products'), gradient: 'from-blue-500 to-blue-600', icon_color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
              { label: 'View Reports', icon: ChartBarIcon, action: () => navigate('/reports'), gradient: 'from-violet-500 to-violet-600', icon_color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
              { label: 'Stock Check', icon: TruckIcon, action: () => navigate('/products'), gradient: 'from-indigo-500 to-indigo-600', icon_color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
              { label: 'Sales History', icon: DocumentTextIcon, action: () => navigate('/sales'), gradient: 'from-cyan-500 to-cyan-600', icon_color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/40' },
              { label: 'Analytics', icon: ChartBarIcon, action: () => navigate('/reports'), gradient: 'from-fuchsia-500 to-fuchsia-600', icon_color: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40' },
            ].map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={cn(
                  "relative group overflow-hidden rounded-lg p-4 transition-all duration-300 hover:shadow-lg",
                  action.bg,
                  "border border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600"
                )}
              >
                {/* Gradient background on hover */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                  action.gradient
                )} />
                
                <div className="relative flex flex-col items-center gap-2.5">
                  <div className={cn(
                    "p-2.5 rounded-lg group-hover:shadow-md transition-all duration-300",
                    action.bg
                  )}>
                    <action.icon className={cn(
                      "h-5 w-5 transition-transform group-hover:scale-110",
                      action.icon_color
                    )} />
                  </div>
                  <span className="text-sm font-medium text-surface-900 dark:text-surface-100 text-center">
                    {action.label}
                  </span>
                </div>

                {/* Subtle shine effect */}
                <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Professional KPI Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiStats.map((stat, index) => {
          // Define color classes for each stat
          const colorClasses = {
            emerald: {
              gradient: 'from-emerald-500 to-emerald-600',
              icon: 'text-emerald-600 dark:text-emerald-300',
              bg: 'bg-emerald-50 dark:bg-emerald-950/50',
              ring: 'ring-emerald-200 dark:ring-emerald-800'
            },
            blue: {
              gradient: 'from-blue-500 to-blue-600',
              icon: 'text-blue-600 dark:text-blue-300',
              bg: 'bg-blue-50 dark:bg-blue-950/50',
              ring: 'ring-blue-200 dark:ring-blue-800'
            },
            purple: {
              gradient: 'from-purple-500 to-purple-600',
              icon: 'text-purple-600 dark:text-purple-300',
              bg: 'bg-purple-50 dark:bg-purple-950/50',
              ring: 'ring-purple-200 dark:ring-purple-800'
            },
            amber: {
              gradient: 'from-amber-500 to-amber-600',
              icon: 'text-amber-600 dark:text-amber-300',
              bg: 'bg-amber-50 dark:bg-amber-950/50',
              ring: 'ring-amber-200 dark:ring-amber-800'
            },
            cyan: {
              gradient: 'from-cyan-500 to-cyan-600',
              icon: 'text-cyan-600 dark:text-cyan-300',
              bg: 'bg-cyan-50 dark:bg-cyan-950/50',
              ring: 'ring-cyan-200 dark:ring-cyan-800'
            },
            red: {
              gradient: 'from-red-500 to-red-600',
              icon: 'text-red-600 dark:text-red-300',
              bg: 'bg-red-50 dark:bg-red-950/50',
              ring: 'ring-red-200 dark:ring-red-800'
            },
            green: {
              gradient: 'from-green-500 to-green-600',
              icon: 'text-green-600 dark:text-green-300',
              bg: 'bg-green-50 dark:bg-green-950/50',
              ring: 'ring-green-200 dark:ring-green-800'
            }
          };

          const colors = colorClasses[stat.color] || colorClasses.blue;

          return (
            <div
              key={index}
              onClick={stat.onClick}
              className={cn(
                "group relative overflow-hidden rounded-xl",
                "bg-white dark:bg-zinc-950",
                "border border-surface-200 dark:border-zinc-800",
                "p-5 cursor-pointer",
                "transition-all duration-300",
                "hover:shadow-2xl hover:-translate-y-1",
                "hover:border-surface-300 dark:hover:border-zinc-700"
              )}
            >
              {/* Gradient Bar at Top */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-1",
                "bg-gradient-to-r", colors.gradient
              )} />

              {/* Content */}
              <div className="flex flex-col space-y-3">
                {/* Icon and Title */}
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "p-2 rounded-lg",
                    colors.bg,
                    "dark:border dark:border-surface-600"
                  )}>
                    <stat.icon className={cn("h-5 w-5", colors.icon)} />
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-surface-300 dark:text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Title */}
                <div>
                  <p className="text-sm font-medium text-surface-600 dark:text-surface-400">
                    {stat.title}
                  </p>
                </div>

                {/* Value */}
                <div className="min-h-[2.5rem]">
                  <p className="text-xl lg:text-2xl font-bold text-surface-900 dark:text-surface-100 break-words leading-tight">
                    {stat.value}
                  </p>
                </div>

                {/* Trend Info */}
                <div className="flex items-center justify-between pt-2 border-t border-surface-800 dark:border-surface-700">
                  <div className="flex items-center gap-1.5">
                    {stat.trendType === 'increase' && (
                      <>
                        <div className="p-0.5 rounded bg-green-100 dark:bg-green-900/30">
                          <ArrowUpIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {stat.trend}
                        </span>
                      </>
                    )}
                    {stat.trendType === 'decrease' && (
                      <>
                        <div className="p-0.5 rounded bg-red-100 dark:bg-red-900/30">
                          <ArrowDownIcon className="h-3 w-3 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="text-xs font-medium text-red-600 dark:text-red-400">
                          {stat.trend}
                        </span>
                      </>
                    )}
                    {stat.trendType === 'warning' && (
                      <>
                        <div className="p-0.5 rounded bg-amber-100 dark:bg-amber-900/30">
                          <ExclamationTriangleIcon className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          {stat.trend}
                        </span>
                      </>
                    )}
                    {stat.trendType === 'neutral' && (
                      <span className="text-xs font-medium text-surface-500 dark:text-surface-400">
                        {stat.trend}
                      </span>
                    )}
                  </div>
                </div>

                {/* Comparison Text */}
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {stat.comparison}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid - Responsive */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Sales Trend Chart */}
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-surface-900 dark:text-zinc-100">
              Sales Trend
            </h3>
            {isSalesChartLoading && (
              <LoadingSpinner size="sm" />
            )}
          </div>
          
          <div className="h-64 sm:h-72 md:h-80">
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
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-surface-900 dark:text-zinc-100">
              Top Categories
            </h3>
          </div>
          
          <div className="h-64 sm:h-72 md:h-80">
            {categoryData ? (
              <Doughnut 
                data={categoryData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '45%',
                  plugins: {
                    legend: {
                      position: 'right',
                      align: 'center',
                      labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 16,
                        font: { 
                          size: 13,
                          weight: '500'
                        },
                        color: isDark ? '#e5e5e5' : '#374151',
                        generateLabels: (chart) => {
                          const data = chart.data;
                          if (data.labels.length && data.datasets.length) {
                            return data.labels.map((label, index) => {
                              const value = data.datasets[0].data[index];
                              const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              // Truncate long category names
                              const truncatedLabel = label.length > 15 ? label.substring(0, 15) + '...' : label;
                              return {
                                text: `${truncatedLabel} (${percentage}%)`,
                                fillStyle: data.datasets[0].backgroundColor[index],
                                strokeStyle: data.datasets[0].backgroundColor[index],
                                lineWidth: 0,
                                hidden: false,
                                index: index,
                                fontColor: isDark ? '#e5e5e5' : '#374151'
                              };
                            });
                          }
                          return [];
                        }
                      },
                      maxWidth: 200
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.85)',
                      titleColor: '#fff',
                      bodyColor: '#fff',
                      borderColor: '#4B5563',
                      borderWidth: 1,
                      titleFont: { size: 14, weight: 'bold' },
                      bodyFont: { size: 13 },
                      padding: 12,
                      cornerRadius: 6,
                      callbacks: {
                        title: (context) => context[0].label,
                        label: (context) => {
                          const value = context.parsed;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `Revenue: ₹${value.toLocaleString()} (${percentage}%)`;
                        }
                      }
                    }
                  },
                  elements: {
                    arc: {
                      borderWidth: 2,
                      borderColor: '#fff'
                    }
                  }
                }} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-surface-500">
                <div className="p-3 bg-surface-100 dark:bg-surface-800 rounded-full mb-3">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium">No category data available</p>
                <p className="text-xs text-surface-400 mt-1">Category sales will appear here</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Activity Sections Grid - Responsive */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Sales Activity */}
        <Card className="p-4 md:p-6 dark:bg-zinc-950 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-surface-900 dark:text-zinc-100">
              Recent Sales
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/sales?tab=history')}
              className="text-xs md:text-sm"
            >
              <span className="hidden sm:inline">View All</span>
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="space-y-2 md:space-y-3">
            {data.alerts?.recentSales?.slice(0, 5).map((sale, index) => (
              <div key={sale._id || index} className="flex items-center justify-between p-2 md:p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <div className="p-1.5 md:p-2 bg-blue-100 dark:bg-blue-950/40 rounded-full flex-shrink-0">
                    <ShoppingCartIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-xs md:text-sm text-surface-900 dark:text-surface-100 truncate">
                      Sale #{sale.saleNumber || sale._id?.slice(-6)}
                    </div>
                    <div className="text-xs text-surface-500 dark:text-surface-400 truncate">
                      {sale.customer?.name || 'Walk-in Customer'}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="font-semibold text-xs md:text-sm text-surface-900 dark:text-surface-100 whitespace-nowrap">
                    ₹{sale.total?.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap">
                    {new Date(sale.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
            
            {(!data.alerts?.recentSales || data.alerts.recentSales.length === 0) && (
              <div className="text-center py-6 md:py-8 text-surface-500 dark:text-surface-400 text-sm">
                No recent sales found
              </div>
            )}
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="p-4 md:p-6 dark:bg-zinc-950 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-surface-900 dark:text-zinc-100">
              Low Stock Alerts
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/products?stock=low-stock')}
              className="text-xs md:text-sm"
            >
              <span className="hidden sm:inline">View All</span>
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="space-y-2 md:space-y-3">
            {data.alerts?.lowStockItems?.slice(0, 5).map((product, index) => (
              <div key={product._id || index} className="flex items-center justify-between p-2 md:p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <div className="p-1.5 md:p-2 bg-amber-100 dark:bg-amber-950/40 rounded-full flex-shrink-0">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-xs md:text-sm text-surface-900 dark:text-surface-100 truncate">
                      {product.name}
                    </div>
                    <div className="text-xs text-surface-500 dark:text-surface-400 truncate">
                      SKU: {product.sku} • {product.branchName || 'All Branches'}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <Badge variant="warning" className="text-xs whitespace-nowrap">
                    {product.stock} left
                  </Badge>
                  <div className="text-xs text-surface-500 dark:text-surface-400 mt-1 whitespace-nowrap">
                    Min: {product.minStockLevel || 10}
                  </div>
                </div>
              </div>
            ))}
            
            {(!data.alerts?.lowStockItems || data.alerts.lowStockItems.length === 0) && (
              <div className="text-center py-6 md:py-8 text-green-600 dark:text-green-400">
                <div className="p-2 md:p-3 bg-green-100 dark:bg-green-900 rounded-full inline-block mb-2">
                  <CubeIcon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div className="text-sm md:text-base">All products are well stocked!</div>
              </div>
            )}
          </div>
        </Card>
      </div>


    </div>
  );
}

export default Dashboard;