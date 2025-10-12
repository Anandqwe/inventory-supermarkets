import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  ChartPieIcon, 
  DocumentTextIcon, 
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

// Import actual API functions
import { reportsAPI, masterDataAPI } from '../utils/api';

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
  const [toast, setToast] = useState(null);
  const [showCategoryTable, setShowCategoryTable] = useState(false);

  const queryClient = useQueryClient();

  // Queries for different analytics
  const { data: salesData, isLoading: salesLoading, error: salesError, refetch: refetchSales } = useQuery({
    queryKey: ['sales-analytics', dateRange.startDate, dateRange.endDate, filters.branch, filters.category],
    queryFn: async () => {
      try {
        const params = { 
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate,
          groupBy: 'day'
        };
        
        // Only add branchId if a specific branch is selected (not empty string)
        if (filters.branch && filters.branch.trim() !== '') {
          params.branchId = filters.branch;
        }
        
        // Only add categoryId if a specific category is selected
        if (filters.category && filters.category.trim() !== '') {
          params.categoryId = filters.category;
        }
        
        const response = await reportsAPI.getSalesReport(params);
        return response.data;
      } catch (error) {
        console.error('Sales report error:', error.response?.data);
        if (error.response?.data?.errors) {
          console.error('Validation errors:', error.response.data.errors);
        }
        throw error;
      }
    },
    enabled: activeTab === 'sales',
    retry: false
  });

  const { data: profitData, isLoading: profitLoading, error: profitError, refetch: refetchProfit } = useQuery({
    queryKey: ['profit-analytics', dateRange.startDate, dateRange.endDate, filters.branch, filters.category],
    queryFn: async () => {
      try {
        const params = { 
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate,
          groupBy: 'day'
        };
        
        // Only add branchId if a specific branch is selected
        if (filters.branch && filters.branch.trim() !== '') {
          params.branchId = filters.branch;
        }
        
        // Only add categoryId if a specific category is selected
        if (filters.category && filters.category.trim() !== '') {
          params.categoryId = filters.category;
        }
        
        const response = await reportsAPI.getProfitAnalysis(params);
        return response.data;
      } catch (error) {
        console.error('Profit analysis error:', error.response?.data || error.message);
        throw error;
      }
    },
    enabled: activeTab === 'financial',
    retry: false
  });

  const { data: inventoryData, isLoading: inventoryLoading, error: inventoryError, refetch: refetchInventory } = useQuery({
    queryKey: ['inventory-analytics', dateRange.startDate, dateRange.endDate, filters.branch, filters.category],
    queryFn: async () => {
      try {
        const params = {
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate
        };
        
        // Only add branchId if a specific branch is selected
        if (filters.branch && filters.branch.trim() !== '') {
          params.branchId = filters.branch;
        }
        
        // Only add categoryId if a specific category is selected
        if (filters.category && filters.category.trim() !== '') {
          params.categoryId = filters.category;
        }
        
        const response = await reportsAPI.getInventoryReport(params);
        return response.data;
      } catch (error) {
        console.error('Inventory report error:', error.response?.data || error.message);
        throw error;
      }
    },
    enabled: activeTab === 'inventory',
    retry: false
  });

  const { data: customerData, isLoading: customerLoading, error: customerError, refetch: refetchCustomer } = useQuery({
    queryKey: ['customer-analytics', dateRange.startDate, dateRange.endDate, filters.branch, filters.category],
    queryFn: async () => {
      try {
        const params = { 
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate
        };
        
        // Only add branchId if a specific branch is selected
        if (filters.branch && filters.branch.trim() !== '') {
          params.branchId = filters.branch;
        }
        
        // Only add categoryId if a specific category is selected
        if (filters.category && filters.category.trim() !== '') {
          params.categoryId = filters.category;
        }
        
        const response = await reportsAPI.getCustomerAnalysis(params);
        return response.data;
      } catch (error) {
        console.error('Customer analysis error:', error.response?.data || error.message);
        throw error;
      }
    },
    enabled: activeTab === 'customer',
    retry: false
  });

  // Fetch branches for filter dropdown
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await masterDataAPI.getBranches({ limit: 100 });
      // Backend returns { success, data: [...branches array...], pagination }
      // So we need to wrap it to match our expected structure
      return { branches: response.data };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch categories for filter dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await reportsAPI.getAllCategories();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Tab configuration
  const tabs = [
    { id: 'sales', label: 'Sales Analytics', icon: ArrowTrendingUpIcon },
    { id: 'financial', label: 'Financial', icon: CurrencyDollarIcon },
    { id: 'inventory', label: 'Inventory', icon: CubeIcon },
    { id: 'customer', label: 'Customer', icon: UsersIcon }
  ];

  // Refresh data function
  const handleRefreshData = () => {
    setToast({ type: 'info', message: 'Refreshing data...' });
    
    // Invalidate and refetch all queries
    if (activeTab === 'sales') {
      refetchSales();
    } else if (activeTab === 'financial') {
      refetchProfit();
    } else if (activeTab === 'inventory') {
      refetchInventory();
    } else if (activeTab === 'customer') {
      refetchCustomer();
    }
    
    setToast({ type: 'success', message: 'Data refreshed successfully' });
  };

  // Sales Analytics Tab
  const SalesAnalyticsTab = () => {
    if (salesLoading) return <LoadingSpinner />;
    if (salesError) {
      const errorData = salesError.response?.data;
      return (
        <div className="text-center py-12 px-6">
          <div className="text-red-500 font-semibold mb-2">Error loading sales data</div>
          <div className="text-sm text-slate-600 mb-4">
            {errorData?.message || salesError.message}
          </div>
          {errorData?.validationErrors && errorData.validationErrors.length > 0 && (
            <div className="mt-4 text-left max-w-2xl mx-auto">
              <div className="text-sm font-medium mb-2">Validation Errors:</div>
              <ul className="text-xs text-slate-600 space-y-1">
                {errorData.validationErrors.map((err, idx) => (
                  <li key={idx} className="bg-red-50 dark:bg-red-900/10 p-2 rounded">
                    <span className="font-medium">{err.field}:</span> {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {errorData?.errors && errorData.errors.length > 0 && (
            <div className="mt-4 text-left max-w-2xl mx-auto">
              <div className="text-sm font-medium mb-2">Errors:</div>
              <ul className="text-xs text-slate-600 space-y-1">
                {errorData.errors.map((err, idx) => (
                  <li key={idx} className="bg-red-50 dark:bg-red-900/10 p-2 rounded">
                    {typeof err === 'string' ? err : JSON.stringify(err)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {salesError.response?.status === 403 && (
            <div className="mt-4 text-sm text-orange-600">
              You need Manager or Admin permissions to view reports
            </div>
          )}
        </div>
      );
    }
    if (!salesData) return null;

    // Transform backend data for charts
    const revenueChartData = {
      labels: salesData.timeGroupedData?.map(d => d.label || d.date || d.period) || [],
      datasets: [
        {
          label: 'Revenue',
          data: salesData.timeGroupedData?.map(d => d.revenue || 0) || [],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Profit',
          data: salesData.timeGroupedData?.map(d => d.profit || 0) || [],
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    const categoryChartData = {
      labels: Object.keys(salesData.categoryAnalysis || {}),
      datasets: [{
        data: Object.values(salesData.categoryAnalysis || {}).map(c => c.revenue || 0),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ]
      }]
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <StatCard
            title="Total Revenue"
            value={salesData.summary?.totalRevenue || 0}
            format="currency"
            icon={CurrencyDollarIcon}
            color="green"
          />
          <StatCard
            title="Gross Profit"
            value={salesData.summary?.grossProfit || 0}
            format="currency"
            icon={ArrowTrendingUpIcon}
            color="blue"
          />
          <StatCard
            title="Profit Margin"
            value={(salesData.summary?.profitMargin || 0).toFixed(1)}
            format="percentage"
            icon={SparklesIcon}
            color="purple"
          />
          <StatCard
            title="Total Sales"
            value={salesData.summary?.totalSales || 0}
            icon={ChartBarIcon}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Revenue & Profit Trends */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium mb-4 sm:mb-6">Revenue & Profit Trends</h3>
            {revenueChartData.labels.length > 0 ? (
              <div className="h-64 sm:h-72 md:h-80">
                <Line data={revenueChartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { 
                      position: 'top',
                      labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: { size: 11 }
                      }
                    },
                    title: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        font: { size: 10 },
                        callback: function(value) {
                          return '₹' + value.toLocaleString('en-IN');
                        }
                      }
                    },
                    x: {
                      ticks: {
                        font: { size: 10 },
                        maxRotation: 45,
                        minRotation: 0
                      }
                    }
                  }
                }} />
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">No trend data available</div>
            )}
          </Card>

          {/* Category Performance */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-medium">Category Performance</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCategoryTable(!showCategoryTable)}
                title="Toggle view"
                className="h-8 w-8 p-0"
              >
                <EyeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
            {categoryChartData.labels.length > 0 ? (
              showCategoryTable ? (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="w-full text-xs sm:text-sm min-w-[300px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Category</th>
                        <th className="text-right py-2 px-2">Items Sold</th>
                        <th className="text-right py-2 px-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(salesData.categoryAnalysis || {}).map(([category, data]) => (
                        <tr key={category} className="border-b">
                          <td className="py-2 px-2">{category}</td>
                          <td className="text-right py-2 px-2">{data.itemsSold?.toLocaleString('en-IN') || 0}</td>
                          <td className="text-right py-2 px-2">₹{(data.revenue || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-64 sm:h-72 md:h-80">
                  <Doughnut data={categoryChartData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          padding: 8,
                          font: { size: 10 }
                        }
                      }
                    }
                  }} />
                </div>
              )
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">No category data available</div>
            )}
          </Card>
        </div>

        {/* Payment Methods */}
        {salesData.paymentMethodAnalysis && Object.keys(salesData.paymentMethodAnalysis).length > 0 && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Payment Methods</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {Object.entries(salesData.paymentMethodAnalysis).map(([method, data]) => (
                <div key={method} className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{method}</div>
                  <div className="text-xl sm:text-2xl font-bold mt-1">₹{(data.amount || 0).toLocaleString('en-IN')}</div>
                  <div className="text-xs sm:text-sm text-slate-500 mt-1">{data.count || 0} transactions</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Cashier Performance */}
        {salesData.cashierPerformance && salesData.cashierPerformance.length > 0 && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Cashier Performance</h3>
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Cashier
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Sales Count
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Avg Order Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {salesData.cashierPerformance.map((cashier, index) => (
                    <tr key={index}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                        {cashier.cashier?.name || cashier.cashier?.email || 'Unknown'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        {cashier.salesCount || 0}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        ₹{(cashier.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        ₹{(cashier.avgOrderValue || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    );
  };

  // Financial Analytics Tab
  const FinancialAnalyticsTab = () => {
    if (profitLoading) return <LoadingSpinner />;
    if (profitError) {
      return (
        <div className="text-center py-12">
          <div className="text-red-500 font-semibold mb-2">Error loading profit data</div>
          <div className="text-sm text-slate-600">
            {profitError.response?.data?.message || profitError.message}
          </div>
          {profitError.response?.status === 403 && (
            <div className="mt-4 text-sm text-orange-600">
              You need Manager or Admin permissions to view reports
            </div>
          )}
        </div>
      );
    }
    if (!profitData) return null;

    const profitTrendData = {
      labels: profitData.groupedData?.map(t => t.period) || [],
      datasets: [
        {
          label: 'Revenue',
          data: profitData.groupedData?.map(t => t.revenue || 0) || [],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true
        },
        {
          label: 'Cost',
          data: profitData.groupedData?.map(t => t.cost || 0) || [],
          borderColor: 'rgb(245, 101, 101)',
          backgroundColor: 'rgba(245, 101, 101, 0.1)',
          fill: true
        },
        {
          label: 'Profit',
          data: profitData.groupedData?.map(t => t.netProfit || 0) || [],
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
            title="Total Revenue"
            value={profitData.summary?.totalRevenue || 0}
            format="currency"
            icon={CurrencyDollarIcon}
            color="green"
          />
          <StatCard
            title="Gross Profit"
            value={profitData.summary?.grossProfit || 0}
            format="currency"
            icon={ArrowTrendingUpIcon}
            color="blue"
          />
          <StatCard
            title="Net Profit"
            value={profitData.summary?.netProfit || 0}
            format="currency"
            icon={SparklesIcon}
            color="purple"
          />
          <StatCard
            title="Profit Margin"
            value={(profitData.summary?.averageMargin || 0).toFixed(1)}
            format="percentage"
            icon={ChartBarIcon}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Profit Trends */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium mb-4 sm:mb-6">Revenue, Cost & Profit Trends</h3>
            {profitTrendData.labels.length > 0 ? (
              <div className="h-64 sm:h-72 md:h-80 lg:h-96">
                <Line data={profitTrendData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { 
                      position: 'top',
                      labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: { size: 11 }
                      }
                    },
                    title: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        font: { size: 10 },
                        callback: function(value) {
                          return '₹' + value.toLocaleString('en-IN');
                        }
                      }
                    },
                    x: {
                      ticks: {
                        font: { size: 10 },
                        maxRotation: 45,
                        minRotation: 0
                      }
                    }
                  }
                }} />
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">No trend data available</div>
            )}
          </Card>
        </div>

        {/* Top Profitable Sales */}
        {profitData.details && profitData.details.length > 0 && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Recent Profitable Sales</h3>
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Gross Profit
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Net Profit
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Margin
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {profitData.details.slice(0, 10).map((sale, index) => (
                    <tr key={index}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        {new Date(sale.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        ₹{(sale.totalRevenue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        ₹{(sale.totalCost || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        ₹{(sale.grossProfit || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        ₹{(sale.netProfit || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <Badge variant={(sale.profitMargin || 0) > 20 ? 'success' : 'warning'} className="text-xs">
                          {(sale.profitMargin || 0).toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    );
  };

  // Inventory Analytics Tab
  const InventoryAnalyticsTab = () => {
    if (inventoryLoading) return <LoadingSpinner />;
    if (inventoryError) {
      return (
        <div className="text-center py-12">
          <div className="text-red-500 font-semibold mb-2">Error loading inventory data</div>
          <div className="text-sm text-slate-600">
            {inventoryError.response?.data?.message || inventoryError.message}
          </div>
          {inventoryError.response?.status === 403 && (
            <div className="mt-4 text-sm text-orange-600">
              You need Manager or Admin permissions to view reports
            </div>
          )}
        </div>
      );
    }
    if (!inventoryData) return null;

    return (
      <div className="space-y-6">
        {/* Inventory KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Products"
            value={inventoryData.summary?.totalProducts || 0}
            icon={CubeIcon}
            color="blue"
          />
          <StatCard
            title="Total Value"
            value={inventoryData.summary?.totalStockValue || 0}
            format="currency"
            icon={CurrencyDollarIcon}
            color="green"
          />
          <StatCard
            title="Low Stock Items"
            value={inventoryData.summary?.lowStockProducts || 0}
            icon={ExclamationCircleIcon}
            color="orange"
          />
          <StatCard
            title="Out of Stock"
            value={inventoryData.summary?.outOfStockProducts || 0}
            icon={ExclamationCircleIcon}
            color="red"
          />
        </div>

        {/* Category Stock Distribution */}
        {inventoryData.categoryWise && Object.keys(inventoryData.categoryWise).length > 0 && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Stock by Category (Click to filter)</h3>
            <div className="space-y-2 sm:space-y-3">
              {Object.entries(inventoryData.categoryWise).map(([categoryName, data]) => {
                // Find the category ID from categoriesData
                const categoryObj = categoriesData?.find(cat => cat.name === categoryName);
                const isActive = filters.category === categoryObj?._id;
                
                return (
                  <button
                    key={categoryName}
                    onClick={() => {
                      if (categoryObj) {
                        setFilters(prev => ({
                          ...prev,
                          category: isActive ? '' : categoryObj._id
                        }));
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-lg transition-all text-left ${
                      isActive 
                        ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' 
                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    disabled={!categoryObj}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className={`font-medium text-sm sm:text-base truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                        {categoryName}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500 mt-1">
                        {data.productCount || 0} products | Total: {data.totalStock || 0} units
                      </div>
                      {(data.lowStockCount > 0 || data.outOfStockCount > 0) && (
                        <div className="text-xs text-orange-600 mt-1">
                          {data.lowStockCount > 0 && `${data.lowStockCount} low stock`}
                          {data.lowStockCount > 0 && data.outOfStockCount > 0 && ' | '}
                          {data.outOfStockCount > 0 && `${data.outOfStockCount} out of stock`}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`font-bold text-sm sm:text-base ${isActive ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                        ₹{(data.stockValue || 0).toLocaleString('en-IN')}
                      </div>
                      {isActive && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          ✓ Filtered
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Low Stock Products */}
        {inventoryData.products && inventoryData.products.filter(p => p.isLowStock || p.isOutOfStock).length > 0 && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Low Stock Alert</h3>
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Reorder Point
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {inventoryData.products.filter(p => p.isLowStock || p.isOutOfStock).slice(0, 10).map((product, index) => (
                    <tr key={index}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                        {product.productName || 'Unknown'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        {product.sku || '-'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        {product.totalStock || 0}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        {product.reorderPoint || 0}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <Badge variant={product.isOutOfStock ? 'error' : 'warning'} className="text-xs">
                          {product.isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    );
  };

  // Customer Analytics Tab
  const CustomerAnalyticsTab = () => {
    if (customerLoading) return <LoadingSpinner />;
    if (customerError) {
      return (
        <div className="text-center py-12">
          <div className="text-red-500 font-semibold mb-2">Error loading customer data</div>
          <div className="text-sm text-slate-600">
            {customerError.response?.data?.message || customerError.message}
          </div>
          {customerError.response?.status === 403 && (
            <div className="mt-4 text-sm text-orange-600">
              You need Manager or Admin permissions to view reports
            </div>
          )}
        </div>
      );
    }
    if (!customerData) return null;

    return (
      <div className="space-y-6">
        {/* Customer KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Customers"
            value={customerData.summary?.totalCustomers || 0}
            icon={UsersIcon}
            color="blue"
          />
          <StatCard
            title="Registered"
            value={customerData.summary?.registeredCustomers || 0}
            icon={UsersIcon}
            color="green"
          />
          <StatCard
            title="Avg Order Value"
            value={customerData.summary?.averageOrderValue || 0}
            format="currency"
            icon={CurrencyDollarIcon}
            color="purple"
          />
          <StatCard
            title="Total Revenue"
            value={customerData.summary?.totalRevenue || 0}
            format="currency"
            icon={ChartBarIcon}
            color="orange"
          />
        </div>

        {/* Customer Segmentation */}
        {customerData.summary?.segmentation && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Customer Segmentation</h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">VIP Customers</div>
                <div className="text-xl sm:text-2xl font-bold mt-1">{customerData.summary.segmentation.vip || 0}</div>
                <div className="text-xs text-slate-500 mt-1">Spent &gt; ₹10,000</div>
              </div>
              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Loyal Customers</div>
                <div className="text-xl sm:text-2xl font-bold mt-1">{customerData.summary.segmentation.loyal || 0}</div>
                <div className="text-xs text-slate-500 mt-1">10+ purchases</div>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-xs sm:text-sm text-green-600 dark:text-green-400">Regular Customers</div>
                <div className="text-xl sm:text-2xl font-bold mt-1">{customerData.summary.segmentation.regular || 0}</div>
                <div className="text-xs text-slate-500 mt-1">3-9 purchases</div>
              </div>
              <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-xs sm:text-sm text-orange-600 dark:text-orange-400">Occasional</div>
                <div className="text-xl sm:text-2xl font-bold mt-1">{customerData.summary.segmentation.occasional || 0}</div>
                <div className="text-xs text-slate-500 mt-1">&lt; 3 purchases</div>
              </div>
            </div>
          </Card>
        )}

        {/* Top Customers */}
        {customerData.topCustomers && customerData.topCustomers.length > 0 && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Top Customers</h3>
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total Purchases
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Avg Order
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Preferred Payment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {customerData.topCustomers.slice(0, 10).map((customer, index) => (
                    <tr key={index}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                        {customer.customer?.name || 'Walk-in Customer'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        {customer.totalPurchases || 0}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        ₹{(customer.totalSpent || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        ₹{(customer.averageOrderValue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <Badge className="text-xs">{customer.mostPreferredPayment || 'N/A'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
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
    <div className="space-y-4 sm:space-y-6 pb-6">
      <PageHeader
        title="Advanced Reports & Analytics"
        description="Comprehensive business intelligence and performance insights"
      >
        <Button 
          variant="primary" 
          onClick={handleRefreshData}
          className="w-full sm:w-auto"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          <span className="hidden xs:inline">Refresh Data</span>
          <span className="xs:hidden">Refresh</span>
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
              Start Date
            </label>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
              End Date
            </label>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
              Branch
            </label>
            <select
              value={filters.branch}
              onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
            >
              <option value="">All Branches</option>
              {branchesData?.branches?.map(branch => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
            >
              <option value="">All Categories</option>
              {categoriesData?.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 sm:py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

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

export default EnhancedReports;