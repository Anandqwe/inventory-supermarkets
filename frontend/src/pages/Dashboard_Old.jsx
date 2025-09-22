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
  ArrowUpIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/shell';
import { 
  StatCard, 
  Card, 
  Button, 
  EmptyState, 
  Badge,
  Input,
  SkeletonDashboard,
  LoadingSpinner
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
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data with token:', token ? 'Token present' : 'No token');
      console.log('Token value:', token);
      
      const response = await fetch('http://localhost:5000/api/dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Dashboard API response status:', response.status);
      console.log('Dashboard API response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dashboard API error response:', errorText);
        
        // If unauthorized, show specific message
        if (response.status === 401) {
          toast.error('Please log in to view dashboard data');
          return;
        }
        
        throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Dashboard data received:', data);
      setDashboardData(data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Dashboard" 
          subtitle="Welcome back! Here's what's happening at your store today." 
        />
        
        {/* Loading skeleton for stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>

        {/* Loading skeleton for charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Dashboard" 
          subtitle="Welcome back! Here's what's happening at your store today." 
        />
        <EmptyState
          icon={ExclamationTriangleIcon}
          title="Failed to load dashboard data"
          description="We couldn't fetch your dashboard information. Please try again."
          action={
            <Button onClick={fetchDashboardData} variant="primary">
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const stats = [
    { 
      title: 'Total Products', 
      value: dashboardData.totalProducts, 
      icon: CubeIcon, 
      trend: '+4.75%', 
      trendType: 'increase',
      onClick: () => navigate('/products')
    },
    { 
      title: 'Low Stock Items', 
      value: dashboardData.lowStockItems.length, 
      icon: ExclamationTriangleIcon, 
      trend: dashboardData.lowStockItems.length > 0 ? 'Action needed' : 'All good', 
      trendType: dashboardData.lowStockItems.length > 0 ? 'decrease' : 'increase',
      onClick: () => navigate('/products')
    },
    { 
      title: 'Today\'s Sales', 
      value: `₹${dashboardData.todaySales.toLocaleString('en-IN')}`, 
      icon: ShoppingCartIcon, 
      trend: '+12.02%', 
      trendType: 'increase',
      onClick: () => navigate('/sales')
    },
    { 
      title: 'Total Revenue', 
      value: `₹${dashboardData.totalRevenue.toLocaleString('en-IN')}`, 
      icon: CurrencyRupeeIcon, 
      trend: '+8.4%', 
      trendType: 'increase',
      onClick: () => navigate('/reports')
    },
  ];

  // Chart data for sales trend (last 7 days)
  const salesChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Daily Sales (₹)',
        data: [12000, 19000, 3000, 5000, 22000, 30000, 25000], // This would come from API
        borderColor: '#3b82f6', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)', // blue with opacity
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Chart data for top categories
  const categoryChartData = {
    labels: dashboardData.topCategories.map(cat => cat._id),
    datasets: [
      {
        data: dashboardData.topCategories.map(cat => cat.count),
        backgroundColor: [
          '#8b5cf6', // violet-500
          '#10b981', // emerald-500
          '#f59e0b', // amber-500
          '#ef4444', // red-500
          '#06b6d4', // cyan-500
        ],
        borderWidth: 0,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#a1a1aa', // zinc-400
        },
      },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3f3f46', // zinc-700
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: '#27272a', // zinc-800
        },
        ticks: {
          color: '#a1a1aa', // zinc-400
        },
      },
      y: {
        grid: {
          color: '#27272a', // zinc-800
        },
        ticks: {
          color: '#a1a1aa', // zinc-400
          callback: function(value) {
            return '₹' + value.toLocaleString();
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          color: '#a1a1aa', // zinc-400
        },
      },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3f3f46', // zinc-700
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="space-y-4" role="main" aria-label="Dashboard">
      <PageHeader 
        title="Dashboard" 
        subtitle="Welcome back! Here's what's happening at your store today."
        showBreadcrumbs={false}
      />

      {/* Stats Cards */}
      <section aria-label="Key Statistics" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            trendType={stat.trendType}
            onClick={stat.onClick}
            role="button"
            tabIndex={0}
            aria-label={`${stat.title}: ${stat.value}. Trend: ${stat.trend}. Click to navigate.`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                stat.onClick();
              }
            }}
          />
        ))}
      </section>

      {/* Charts Row */}
      <section aria-label="Analytics Charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card className="p-6" role="img" aria-label="Sales trend chart showing last 7 days of sales data">
          <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-4">
            Sales Trend (Last 7 Days)
          </h3>
          <div className="h-64" aria-hidden="true">
            <Line data={salesChartData} options={chartOptions} />
          </div>
          <div className="sr-only">
            Sales data for the last 7 days: Monday ₹12,000, Tuesday ₹19,000, Wednesday ₹3,000, Thursday ₹5,000, Friday ₹22,000, Saturday ₹30,000, Sunday ₹25,000
          </div>
        </Card>

        {/* Top Categories Chart */}
        <Card className="p-6" role="img" aria-label="Product categories distribution chart">
          <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-4">
            Product Categories
          </h3>
          <div className="h-64" aria-hidden="true">
            <Doughnut data={categoryChartData} options={doughnutOptions} />
          </div>
          <div className="sr-only">
            Product categories distribution: {dashboardData.topCategories.map(cat => `${cat._id}: ${cat.count} products`).join(', ')}
          </div>
        </Card>
      </section>

      {/* Bottom Row */}
      <section aria-label="Quick Actions and Alerts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-4">
              Quick Actions
            </h3>
            <nav aria-label="Quick navigation actions" className="space-y-3">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full justify-start h-auto p-4"
                onClick={() => navigate('/products')}
                aria-label="Add new product to inventory"
              >
                <div className="flex items-center w-full">
                  <PlusIcon className="h-5 w-5 mr-3" aria-hidden="true" />
                  <div className="text-left">
                    <div className="font-medium">Add New Product</div>
                    <div className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                      Add a new item to inventory
                    </div>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 ml-auto text-surface-400" aria-hidden="true" />
                </div>
              </Button>

              <Button 
                variant="outline" 
                size="lg"
                className="w-full justify-start h-auto p-4"
                onClick={() => navigate('/sales')}
                aria-label="Record new sale transaction"
              >
                <div className="flex items-center w-full">
                  <ShoppingCartIcon className="h-5 w-5 mr-3" aria-hidden="true" />
                  <div className="text-left">
                    <div className="font-medium">Record Sale</div>
                    <div className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                      Process a new sale transaction
                    </div>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 ml-auto text-surface-400" aria-hidden="true" />
                </div>
              </Button>

              <Button 
                variant="outline" 
                size="lg"
                className="w-full justify-start h-auto p-4"
                onClick={() => navigate('/reports')}
                aria-label="Generate inventory or sales report"
              >
                <div className="flex items-center w-full">
                  <DocumentTextIcon className="h-5 w-5 mr-3" aria-hidden="true" />
                  <div className="text-left">
                    <div className="font-medium">Generate Report</div>
                    <div className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                      Create inventory or sales report
                    </div>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 ml-auto text-surface-400" aria-hidden="true" />
                </div>
              </Button>
            </nav>
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-4" id="low-stock-heading">
              Low Stock Alert ({dashboardData.lowStockItems.length})
            </h3>
            {dashboardData.lowStockItems.length === 0 ? (
              <EmptyState
                icon={CubeIcon}
                title="All stocked up!"
                description="All products are well stocked."
                variant="success"
                role="status"
                aria-label="No low stock items found"
              />
            ) : (
              <div 
                className="space-y-3 max-h-64 overflow-y-auto"
                role="region"
                aria-labelledby="low-stock-heading"
                aria-live="polite"
              >
                {dashboardData.lowStockItems.slice(0, 5).map((item, index) => (
                  <div 
                    key={item._id} 
                    className="flex items-center justify-between p-3 border border-danger-200 dark:border-danger-800 rounded-lg bg-danger-50 dark:bg-danger-950 hover:bg-danger-100 dark:hover:bg-danger-900 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-danger-500"
                    onClick={() => navigate('/products')}
                    role="button"
                    tabIndex={0}
                    aria-label={`Low stock alert: ${item.name}. Only ${item.quantity} ${item.unit} left. Reorder level: ${item.reorderLevel || 10}. Click to manage inventory.`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate('/products');
                      }
                    }}
                  >
                    <div>
                      <div className="font-medium text-danger-900 dark:text-danger-100">
                        {item.name}
                      </div>
                      <div className="text-sm text-danger-600 dark:text-danger-400">
                        Only {item.quantity} {item.unit} left (Reorder at: {item.reorderLevel || 10})
                      </div>
                    </div>
                    <ExclamationTriangleIcon className="h-5 w-5 text-danger-500" aria-hidden="true" />
                  </div>
                ))}
                {dashboardData.lowStockItems.length > 5 && (
                  <Button 
                    variant="ghost"
                    className="w-full"
                    onClick={() => navigate('/products')}
                    aria-label={`View ${dashboardData.lowStockItems.length - 5} more low stock items`}
                  >
                    View {dashboardData.lowStockItems.length - 5} more items
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Recent Sales Summary */}
      <section aria-label="Recent Activity Summary">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100">
                Recent Activity
              </h3>
              <Button 
                variant="ghost"
                onClick={() => navigate('/sales')}
                aria-label="View all sales transactions"
              >
                View All Sales
                <ArrowRightIcon className="h-4 w-4 ml-2" aria-hidden="true" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="group" aria-label="Activity metrics">
              <div className="bg-primary-50 dark:bg-primary-950 p-4 rounded-lg border border-primary-200 dark:border-primary-800" role="status" aria-label={`Total sales: ${dashboardData.totalSales}`}>
                <div className="flex items-center">
                  <ShoppingCartIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  <div className="ml-3">
                    <div className="text-sm text-primary-600 dark:text-primary-400">Total Sales</div>
                    <div className="text-xl font-bold text-primary-900 dark:text-primary-100">
                      {dashboardData.totalSales}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-success-50 dark:bg-success-950 p-4 rounded-lg border border-success-200 dark:border-success-800" role="status" aria-label={`Today's revenue: ₹${dashboardData.todaySales.toLocaleString('en-IN')}`}>
                <div className="flex items-center">
                  <CurrencyRupeeIcon className="h-8 w-8 text-success-600 dark:text-success-400" aria-hidden="true" />
                  <div className="ml-3">
                    <div className="text-sm text-success-600 dark:text-success-400">Today's Revenue</div>
                    <div className="text-xl font-bold text-success-900 dark:text-success-100">
                      ₹{dashboardData.todaySales.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-info-50 dark:bg-info-950 p-4 rounded-lg border border-info-200 dark:border-info-800" role="status" aria-label={`Average sale value: ₹${dashboardData.totalSales > 0 ? Math.round(dashboardData.totalRevenue / dashboardData.totalSales).toLocaleString('en-IN') : 0}`}>
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-info-600 dark:text-info-400" aria-hidden="true" />
                  <div className="ml-3">
                    <div className="text-sm text-info-600 dark:text-info-400">Avg. Sale Value</div>
                    <div className="text-xl font-bold text-info-900 dark:text-info-100">
                      ₹{dashboardData.totalSales > 0 ? Math.round(dashboardData.totalRevenue / dashboardData.totalSales).toLocaleString('en-IN') : 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

export default Dashboard;
