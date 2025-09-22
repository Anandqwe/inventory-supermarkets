import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  ChartPieIcon, 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  CalendarDaysIcon, 
  FunnelIcon, 
  ArrowPathIcon, 
  EnvelopeIcon, 
  ShareIcon, 
  EyeIcon, 
  PresentationChartLineIcon, 
  UsersIcon, 
  ShoppingBagIcon,
  CubeIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  MagnifyingGlassIcon, 
  CogIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';

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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Mock API functions - replace with actual API calls
const reportsAPI = {
  getSalesAnalytics: async (params) => {
    // Mock sales data
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      summary: {
        totalRevenue: 125000,
        totalSales: 450,
        avgOrderValue: 278,
        grossProfit: 45000,
        netProfit: 35000,
        profitMargin: 28,
        cogs: 80000,
        expenses: 10000
      },
      trends: {
        revenue: [25000, 28000, 32000, 30000, 35000, 38000, 42000],
        profit: [8000, 9000, 10500, 9500, 11000, 12000, 13500],
        orders: [85, 92, 105, 98, 115, 125, 140],
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7']
      },
      topProducts: [
        { name: 'Premium Coffee', revenue: 15000, margin: 35, sales: 150 },
        { name: 'Fresh Bread', revenue: 12000, margin: 28, sales: 300 },
        { name: 'Organic Milk', revenue: 8000, margin: 22, sales: 200 }
      ],
      categoryPerformance: [
        { category: 'Beverages', revenue: 35000, profit: 12000, margin: 34 },
        { category: 'Bakery', revenue: 28000, profit: 8000, margin: 29 },
        { category: 'Dairy', revenue: 25000, profit: 6000, margin: 24 }
      ]
    };
  },

  getFinancialAnalytics: async (params) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      cashFlow: {
        operating: 45000,
        investing: -12000,
        financing: -8000,
        netCashFlow: 25000
      },
      profitability: {
        grossProfitMargin: 36,
        operatingMargin: 28,
        netProfitMargin: 28,
        returnOnAssets: 15,
        returnOnEquity: 22
      },
      expenses: [
        { category: 'Cost of Goods', amount: 80000, percentage: 64 },
        { category: 'Rent', amount: 5000, percentage: 4 },
        { category: 'Utilities', amount: 2000, percentage: 1.6 },
        { category: 'Marketing', amount: 3000, percentage: 2.4 }
      ],
      monthlyTrends: {
        revenue: [120000, 125000, 130000, 128000, 135000, 125000],
        expenses: [85000, 90000, 88000, 92000, 87000, 90000],
        profit: [35000, 35000, 42000, 36000, 48000, 35000],
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
      }
    };
  },

  getInventoryAnalytics: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      overview: {
        totalValue: 250000,
        turnoverRate: 6.5,
        deadStock: 15000,
        fastMoving: 45,
        slowMoving: 12,
        outOfStock: 8
      },
      turnoverAnalysis: [
        { product: 'Premium Coffee', turnover: 12.5, value: 15000, status: 'fast' },
        { product: 'Fresh Bread', turnover: 8.2, value: 8000, status: 'fast' },
        { product: 'Specialty Tea', turnover: 1.2, value: 5000, status: 'slow' }
      ],
      agingAnalysis: {
        '0-30': { count: 145, value: 120000 },
        '31-60': { count: 85, value: 85000 },
        '61-90': { count: 35, value: 30000 },
        '90+': { count: 15, value: 15000 }
      }
    };
  },

  getCustomerAnalytics: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      overview: {
        totalCustomers: 1250,
        newCustomers: 85,
        retentionRate: 78,
        avgLifetimeValue: 2400,
        churnRate: 12
      },
      segments: [
        { segment: 'VIP', count: 125, revenue: 75000, avgOrder: 600 },
        { segment: 'Regular', count: 450, revenue: 35000, avgOrder: 78 },
        { segment: 'Occasional', count: 675, revenue: 15000, avgOrder: 22 }
      ],
      trends: {
        acquisition: [15, 22, 18, 25, 19, 28, 35],
        retention: [82, 81, 79, 78, 80, 78, 79],
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7']
      }
    };
  }
};

// Enhanced Reports Component
function EnhancedReports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    branch: '',
    category: '',
    product: ''
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [toast, setToast] = useState(null);

  const queryClient = useQueryClient();

  // Queries for different analytics
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-analytics', dateRange, filters],
    queryFn: () => reportsAPI.getSalesAnalytics({ ...dateRange, ...filters }),
    enabled: activeTab === 'sales'
  });

  const { data: financialData, isLoading: financialLoading } = useQuery({
    queryKey: ['financial-analytics', dateRange],
    queryFn: () => reportsAPI.getFinancialAnalytics(dateRange),
    enabled: activeTab === 'financial'
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-analytics'],
    queryFn: reportsAPI.getInventoryAnalytics,
    enabled: activeTab === 'inventory'
  });

  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ['customer-analytics', dateRange],
    queryFn: () => reportsAPI.getCustomerAnalytics(dateRange),
    enabled: activeTab === 'customer'
  });

  // Tab configuration
  const tabs = [
    { id: 'sales', label: 'Sales Analytics', icon: ArrowTrendingUpIcon },
    { id: 'financial', label: 'Financial', icon: CurrencyDollarIcon },
    { id: 'inventory', label: 'Inventory', icon: CubeIcon },
    { id: 'customer', label: 'Customer', icon: UsersIcon }
  ];

  // Export functionality
  const handleExport = async (format) => {
    try {
      setToast({ type: 'info', message: `Exporting ${format.toUpperCase()}...` });
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setToast({ type: 'success', message: `${format.toUpperCase()} exported successfully` });
      setShowExportModal(false);
    } catch (error) {
      setToast({ type: 'error', message: 'Export failed' });
    }
  };

  // Sales Analytics Tab
  const SalesAnalyticsTab = () => {
    if (salesLoading) return <LoadingSpinner />;
    if (!salesData) return null;

    const revenueChartData = {
      labels: salesData.trends.labels,
      datasets: [
        {
          label: 'Revenue',
          data: salesData.trends.revenue,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Profit',
          data: salesData.trends.profit,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    const categoryChartData = {
      labels: salesData.categoryPerformance.map(c => c.category),
      datasets: [{
        data: salesData.categoryPerformance.map(c => c.revenue),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(251, 191, 36, 0.8)'
        ]
      }]
    };

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={`₹${salesData.summary.totalRevenue.toLocaleString()}`}
            change="+12.5%"
            trend="up"
            icon={CurrencyDollarIcon}
            color="green"
          />
          <StatCard
            title="Gross Profit"
            value={`₹${salesData.summary.grossProfit.toLocaleString()}`}
            change="+8.3%"
            trend="up"
            icon={ArrowTrendingUpIcon}
            color="blue"
          />
          <StatCard
            title="Profit Margin"
            value={`${salesData.summary.profitMargin}%`}
            change="+2.1%"
            trend="up"
            icon={SparklesIcon}
            color="purple"
          />
          <StatCard
            title="Avg Order Value"
            value={`₹${salesData.summary.avgOrderValue}`}
            change="+5.7%"
            trend="up"
            icon={ChartBarIcon}
            color="orange"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue & Profit Trends */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Revenue & Profit Trends</h3>
              <Button variant="outline" size="sm">
                <ArrowDownTrayIcon className="h-4 w-4" />
              </Button>
            </div>
            <Line data={revenueChartData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: false }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '₹' + value.toLocaleString();
                    }
                  }
                }
              }
            }} />
          </Card>

          {/* Category Performance */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Category Performance</h3>
              <Button variant="outline" size="sm">
                <EyeIcon className="h-4 w-4" />
              </Button>
            </div>
            <Doughnut data={categoryChartData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' }
              }
            }} />
          </Card>
        </div>

        {/* Top Products Table */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Top Performing Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Margin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Sales
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {salesData.topProducts.map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      ₹{product.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={product.margin > 30 ? 'success' : 'warning'}>
                        {product.margin}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {product.sales}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  // Financial Analytics Tab
  const FinancialAnalyticsTab = () => {
    if (financialLoading) return <LoadingSpinner />;
    if (!financialData) return null;

    const cashFlowData = {
      labels: ['Operating', 'Investing', 'Financing', 'Net Cash Flow'],
      datasets: [{
        label: 'Cash Flow',
        data: [
          financialData.cashFlow.operating,
          financialData.cashFlow.investing,
          financialData.cashFlow.financing,
          financialData.cashFlow.netCashFlow
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(59, 130, 246, 0.8)'
        ]
      }]
    };

    const profitTrendData = {
      labels: financialData.monthlyTrends.months,
      datasets: [
        {
          label: 'Revenue',
          data: financialData.monthlyTrends.revenue,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true
        },
        {
          label: 'Expenses',
          data: financialData.monthlyTrends.expenses,
          borderColor: 'rgb(245, 101, 101)',
          backgroundColor: 'rgba(245, 101, 101, 0.1)',
          fill: true
        },
        {
          label: 'Profit',
          data: financialData.monthlyTrends.profit,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true
        }
      ]
    };

    return (
      <div className="space-y-6">
        {/* Financial KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Gross Profit Margin"
            value={`${financialData.profitability.grossProfitMargin}%`}
            change="+1.2%"
            trend="up"
            icon={SparklesIcon}
            color="green"
          />
          <StatCard
            title="Operating Margin"
            value={`${financialData.profitability.operatingMargin}%`}
            change="+0.8%"
            trend="up"
            icon={ChartBarIcon}
            color="blue"
          />
          <StatCard
            title="ROA"
            value={`${financialData.profitability.returnOnAssets}%`}
            change="+2.1%"
            trend="up"
            icon={PresentationChartLineIcon}
            color="purple"
          />
          <StatCard
            title="ROE"
            value={`${financialData.profitability.returnOnEquity}%`}
            change="+3.5%"
            trend="up"
            icon={ArrowTrendingUpIcon}
            color="orange"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Cash Flow Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-6">Cash Flow Analysis</h3>
            <Bar data={cashFlowData} options={{
              responsive: true,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: {
                  ticks: {
                    callback: function(value) {
                      return '₹' + value.toLocaleString();
                    }
                  }
                }
              }
            }} />
          </Card>

          {/* Monthly Profit Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-6">Monthly Profit Trends</h3>
            <Line data={profitTrendData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' }
              },
              scales: {
                y: {
                  ticks: {
                    callback: function(value) {
                      return '₹' + value.toLocaleString();
                    }
                  }
                }
              }
            }} />
          </Card>
        </div>

        {/* Expense Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Expense Breakdown</h3>
          <div className="space-y-4">
            {financialData.expenses.map((expense, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <span className="font-medium">{expense.category}</span>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {expense.percentage}% of total
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">₹{expense.amount.toLocaleString()}</div>
                  <div className="w-32 bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${expense.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  // Inventory Analytics Tab
  const InventoryAnalyticsTab = () => {
    if (inventoryLoading) return <LoadingSpinner />;
    if (!inventoryData) return null;

    const turnoverData = {
      labels: inventoryData.turnoverAnalysis.map(item => item.product),
      datasets: [{
        label: 'Turnover Rate',
        data: inventoryData.turnoverAnalysis.map(item => item.turnover),
        backgroundColor: inventoryData.turnoverAnalysis.map(item => 
          item.status === 'fast' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(245, 101, 101, 0.8)'
        )
      }]
    };

    const agingData = {
      labels: ['0-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
      datasets: [{
        label: 'Value',
        data: [
          inventoryData.agingAnalysis['0-30'].value,
          inventoryData.agingAnalysis['31-60'].value,
          inventoryData.agingAnalysis['61-90'].value,
          inventoryData.agingAnalysis['90+'].value
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(245, 101, 101, 0.8)'
        ]
      }]
    };

    return (
      <div className="space-y-6">
        {/* Inventory KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Value"
            value={`₹${inventoryData.overview.totalValue.toLocaleString()}`}
            change="+5.2%"
            trend="up"
            icon={CubeIcon}
            color="blue"
          />
          <StatCard
            title="Turnover Rate"
            value={`${inventoryData.overview.turnoverRate}x`}
            change="+0.8"
            trend="up"
            icon={ArrowPathIcon}
            color="green"
          />
          <StatCard
            title="Dead Stock"
            value={`₹${inventoryData.overview.deadStock.toLocaleString()}`}
            change="-12%"
            trend="down"
            icon={ExclamationCircleIcon}
            color="red"
          />
          <StatCard
            title="Out of Stock"
            value={inventoryData.overview.outOfStock}
            change="-3"
            trend="down"
            icon={CubeIcon}
            color="orange"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Turnover Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-6">Inventory Turnover</h3>
            <Bar data={turnoverData} options={{
              responsive: true,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: {
                  title: {
                    display: true,
                    text: 'Turnover Rate'
                  }
                }
              }
            }} />
          </Card>

          {/* Aging Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-6">Inventory Aging</h3>
            <Doughnut data={agingData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' }
              }
            }} />
          </Card>
        </div>
      </div>
    );
  };

  // Customer Analytics Tab
  const CustomerAnalyticsTab = () => {
    if (customerLoading) return <LoadingSpinner />;
    if (!customerData) return null;

    const customerTrendsData = {
      labels: customerData.trends.labels,
      datasets: [
        {
          label: 'New Customers',
          data: customerData.trends.acquisition,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true
        },
        {
          label: 'Retention Rate (%)',
          data: customerData.trends.retention,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          yAxisID: 'y1'
        }
      ]
    };

    return (
      <div className="space-y-6">
        {/* Customer KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Customers"
            value={customerData.overview.totalCustomers.toLocaleString()}
            change="+15%"
            trend="up"
            icon={UsersIcon}
            color="blue"
          />
          <StatCard
            title="New Customers"
            value={customerData.overview.newCustomers}
            change="+22%"
            trend="up"
            icon={UsersIcon}
            color="green"
          />
          <StatCard
            title="Retention Rate"
            value={`${customerData.overview.retentionRate}%`}
            change="+3%"
            trend="up"
            icon={ChartBarIcon}
            color="purple"
          />
          <StatCard
            title="Avg LTV"
            value={`₹${customerData.overview.avgLifetimeValue}`}
            change="+8%"
            trend="up"
            icon={CurrencyDollarIcon}
            color="orange"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Customer Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-6">Customer Trends</h3>
            <Line data={customerTrendsData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' }
              },
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left'
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  grid: {
                    drawOnChartArea: false
                  }
                }
              }
            }} />
          </Card>

          {/* Customer Segments */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-6">Customer Segments</h3>
            <div className="space-y-4">
              {customerData.segments.map((segment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <span className="font-medium">{segment.segment}</span>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {segment.count} customers
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">₹{segment.revenue.toLocaleString()}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Avg: ₹{segment.avgOrder}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sales':
        return <SalesAnalyticsTab />;
      case 'financial':
        return <FinancialAnalyticsTab />;
      case 'inventory':
        return <InventoryAnalyticsTab />;
      case 'customer':
        return <CustomerAnalyticsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advanced Reports & Analytics"
        description="Comprehensive business intelligence and performance insights"
      >
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="primary">
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </PageHeader>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Start Date
            </label>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              End Date
            </label>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Branch
            </label>
            <select
              value={filters.branch}
              onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
            >
              <option value="">All Branches</option>
              <option value="main">Main Branch</option>
              <option value="downtown">Downtown</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
            >
              <option value="">All Categories</option>
              <option value="beverages">Beverages</option>
              <option value="snacks">Snacks</option>
            </select>
          </div>
        </div>
      </Card>

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

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
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

// Export Modal Component
function ExportModal({ isOpen, onClose, onExport }) {
  const [exportType, setExportType] = useState('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);

  const handleExport = () => {
    onExport(exportType);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Report">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Export Format
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="pdf"
                checked={exportType === 'pdf'}
                onChange={(e) => setExportType(e.target.value)}
                className="mr-2"
              />
              PDF Document
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="excel"
                checked={exportType === 'excel'}
                onChange={(e) => setExportType(e.target.value)}
                className="mr-2"
              />
              Excel Spreadsheet
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="csv"
                checked={exportType === 'csv'}
                onChange={(e) => setExportType(e.target.value)}
                className="mr-2"
              />
              CSV File
            </label>
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
              className="mr-2"
            />
            Include Charts and Visualizations
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleExport}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default EnhancedReports;