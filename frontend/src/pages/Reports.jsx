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
  SparklesIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
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
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
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
  const [toastState, setToastState] = useState(null);
  const [showCategoryTable, setShowCategoryTable] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
  const { data: branchesData, isLoading: branchesLoading, error: branchesError } = useQuery({
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
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await reportsAPI.getAllCategories();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Ensure categoriesData is always an array
  const categoriesData = Array.isArray(categoriesResponse) 
    ? categoriesResponse 
    : Array.isArray(categoriesResponse?.data) 
    ? categoriesResponse.data 
    : [];

  // Tab configuration
  const tabs = [
    { id: 'sales', label: 'Sales Analytics', icon: ArrowTrendingUpIcon },
    { id: 'financial', label: 'Financial', icon: CurrencyDollarIcon },
    { id: 'customer', label: 'Customer', icon: UsersIcon }
  ];

  // Refresh data function
  const handleRefreshData = () => {
    setToastState({ type: 'info', message: 'Refreshing data...' });
    
    // Invalidate and refetch all queries
    if (activeTab === 'sales') {
      refetchSales();
    } else if (activeTab === 'financial') {
      refetchProfit();
    } else if (activeTab === 'customer') {
      refetchCustomer();
    }
    
    setToastState({ type: 'success', message: 'Data refreshed successfully' });
  };

  // Helper function to format dates
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    // If it's already a formatted date string (YYYY-MM-DD)
    if (typeof dateValue === 'string') {
      // Check if it's already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }
      // Check if it starts with "Week of" or similar text
      if (dateValue.includes('Week of') || dateValue.includes('Month of')) {
        return dateValue;
      }
    }
    
    // If it's a Date object or timestamp, convert it
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return String(dateValue); // Return as-is if can't parse
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    } catch (error) {
      return String(dateValue); // Return as-is if error
    }
  };

  // Export functions
  const getCurrentData = () => {
    switch (activeTab) {
      case 'sales':
        return salesData;
      case 'financial':
        return profitData;
      case 'customer':
        return customerData;
      default:
        return null;
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const data = getCurrentData();
      if (!data) {
        toast.error('No data available to export');
        return;
      }

      let csvContent = '';
      const tabName = tabs.find(t => t.id === activeTab)?.label || 'Report';
      
      // Add header
      csvContent += `${tabName} Report\n`;
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `Date Range: ${dateRange.startDate} to ${dateRange.endDate}\n`;
      if (filters.branch) csvContent += `Branch: ${branchesData?.branches?.find(b => b._id === filters.branch)?.name || 'Selected'}\n`;
      if (filters.category) csvContent += `Category: ${categoriesData?.find(c => c._id === filters.category)?.name || 'Selected'}\n`;
      csvContent += '\n';

      // Export based on active tab
      if (activeTab === 'sales' && data.summary) {
        // Summary Section
        csvContent += '=== SUMMARY ===\n';
        csvContent += `Total Revenue,₹${data.summary.totalRevenue?.toLocaleString('en-IN') || 0}\n`;
        csvContent += `Gross Profit,₹${data.summary.grossProfit?.toLocaleString('en-IN') || 0}\n`;
        csvContent += `Net Profit,₹${data.summary.netProfit?.toLocaleString('en-IN') || 0}\n`;
        csvContent += `Profit Margin,${(data.summary.profitMargin || 0).toFixed(2)}%\n`;
        csvContent += `Total Sales,${data.summary.totalSales || 0}\n`;
        csvContent += `Average Order Value,₹${data.summary.averageOrderValue?.toLocaleString('en-IN') || 0}\n\n`;

        // Time Series Data
        if (data.timeGroupedData && data.timeGroupedData.length > 0) {
          csvContent += '=== TIME SERIES DATA ===\n';
          csvContent += 'Date,Revenue,Profit,Cost,Sales Count\n';
          data.timeGroupedData.forEach((item) => {
            const dateStr = item.period || item.label || item.date || 'N/A';
            // Add tab character to prevent Excel from treating as date
            csvContent += `${dateStr}\t,${item.revenue || 0},${item.profit || 0},${item.cost || 0},${item.sales || 0}\n`;
          });
          csvContent += '\n';
        }

        // Category Analysis
        if (data.categoryAnalysis && Object.keys(data.categoryAnalysis).length > 0) {
          csvContent += '=== CATEGORY PERFORMANCE ===\n';
          csvContent += 'Category,Items Sold,Revenue\n';
          Object.entries(data.categoryAnalysis).forEach(([category, stats]) => {
            csvContent += `${category},${stats.itemsSold || 0},₹${stats.revenue?.toLocaleString('en-IN') || 0}\n`;
          });
          csvContent += '\n';
        }

        // Payment Method Analysis
        if (data.paymentMethodAnalysis && Object.keys(data.paymentMethodAnalysis).length > 0) {
          csvContent += '=== PAYMENT METHODS ===\n';
          csvContent += 'Method,Count,Amount,Percentage\n';
          Object.entries(data.paymentMethodAnalysis).forEach(([method, stats]) => {
            csvContent += `${method},${stats.count || 0},₹${stats.amount?.toLocaleString('en-IN') || 0},${(stats.percentage || 0).toFixed(2)}%\n`;
          });
          csvContent += '\n';
        }

        // Cashier Performance
        if (data.cashierPerformance && data.cashierPerformance.length > 0) {
          csvContent += '=== CASHIER PERFORMANCE ===\n';
          csvContent += 'Cashier,Sales Count,Total Amount,Avg Order Value\n';
          data.cashierPerformance.forEach(perf => {
            csvContent += `${perf.cashier?.name || 'Unknown'},${perf.salesCount || 0},₹${perf.totalAmount?.toLocaleString('en-IN') || 0},₹${perf.avgOrderValue?.toLocaleString('en-IN') || 0}\n`;
          });
        }

      } else if (activeTab === 'financial' && data.summary) {
        csvContent += '=== FINANCIAL SUMMARY ===\n';
        csvContent += `Total Revenue,₹${data.summary.totalRevenue?.toLocaleString('en-IN') || 0}\n`;
        csvContent += `Total Cost,₹${data.summary.totalCost?.toLocaleString('en-IN') || 0}\n`;
        csvContent += `Gross Profit,₹${data.summary.grossProfit?.toLocaleString('en-IN') || 0}\n`;
        csvContent += `Net Profit,₹${data.summary.netProfit?.toLocaleString('en-IN') || 0}\n`;
        csvContent += `Profit Margin,${(data.summary.profitMargin || 0).toFixed(2)}%\n\n`;

        if (data.timeGroupedData && data.timeGroupedData.length > 0) {
          csvContent += '=== PROFIT TRENDS ===\n';
          csvContent += 'Date,Revenue,Cost,Profit,Margin %\n';
          data.timeGroupedData.forEach(item => {
            const dateStr = item.period || item.label || item.date || 'N/A';
            const margin = item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(2) : 0;
            csvContent += `${dateStr}\t,${item.revenue || 0},${item.cost || 0},${item.profit || 0},${margin}\n`;
          });
        }

      } else if (activeTab === 'customer' && data.summary) {
        csvContent += '=== CUSTOMER SUMMARY ===\n';
        csvContent += `Total Customers,${data.summary.totalCustomers || 0}\n`;
        csvContent += `Registered Customers,${data.summary.registeredCustomers || 0}\n`;
        csvContent += `Active Customers,${data.summary.activeCustomers || 0}\n`;
        csvContent += `Average Order Value,₹${data.summary.averageOrderValue?.toLocaleString('en-IN') || 0}\n`;
        csvContent += `Total Revenue,₹${data.summary.totalRevenue?.toLocaleString('en-IN') || 0}\n\n`;

        // Customer segmentation
        if (data.summary.segmentation) {
          csvContent += '=== CUSTOMER SEGMENTATION ===\n';
          csvContent += 'Segment,Count\n';
          csvContent += `VIP (>₹10,000),${data.summary.segmentation.vip || 0}\n`;
          csvContent += `Loyal (10+ purchases),${data.summary.segmentation.loyal || 0}\n`;
          csvContent += `Regular (3-9 purchases),${data.summary.segmentation.regular || 0}\n`;
          csvContent += `Occasional (<3 purchases),${data.summary.segmentation.occasional || 0}\n\n`;
        }

        // Top customers
        if (data.topCustomers && data.topCustomers.length > 0) {
          csvContent += '=== TOP CUSTOMERS ===\n';
          csvContent += 'Customer,Total Purchases,Total Spent,Avg Order,Preferred Payment\n';
          data.topCustomers.slice(0, 20).forEach(customer => {
            csvContent += `${customer.customer?.name || 'Walk-in'},${customer.totalPurchases || 0},₹${customer.totalSpent?.toLocaleString('en-IN') || 0},₹${customer.averageOrderValue?.toLocaleString('en-IN') || 0},${customer.mostPreferredPayment || 'N/A'}\n`;
          });
        }
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${tabName.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Comprehensive CSV exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const data = getCurrentData();
      if (!data) {
        toast.error('No data available to export');
        return;
      }

      // Create HTML table for Excel with comprehensive data
      let htmlContent = `<html><head><meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { color: #2c3e50; }
          h2 { color: #34495e; margin-top: 20px; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; }
          th { background-color: #4CAF50; color: white; padding: 8px; text-align: left; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .summary-table th { background-color: #2196F3; }
          .category-table th { background-color: #FF9800; }
          .payment-table th { background-color: #9C27B0; }
        </style>
      </head><body>`;
      
      const tabName = tabs.find(t => t.id === activeTab)?.label || 'Report';
      
      htmlContent += `<h1>${tabName} Report</h1>`;
      htmlContent += `<p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>`;
      htmlContent += `<p><strong>Date Range:</strong> ${dateRange.startDate} to ${dateRange.endDate}</p>`;
      if (filters.branch) htmlContent += `<p><strong>Branch:</strong> ${branchesData?.branches?.find(b => b._id === filters.branch)?.name || 'Selected'}</p>`;
      if (filters.category) htmlContent += `<p><strong>Category:</strong> ${categoriesData?.find(c => c._id === filters.category)?.name || 'Selected'}</p>`;

      if (activeTab === 'sales' && data.summary) {
        // Summary
        htmlContent += '<h2>Summary</h2><table class="summary-table">';
        htmlContent += '<tr><th>Metric</th><th>Value</th></tr>';
        htmlContent += `<tr><td>Total Revenue</td><td>₹${(data.summary.totalRevenue || 0).toLocaleString('en-IN')}</td></tr>`;
        htmlContent += `<tr><td>Gross Profit</td><td>₹${(data.summary.grossProfit || 0).toLocaleString('en-IN')}</td></tr>`;
        htmlContent += `<tr><td>Net Profit</td><td>₹${(data.summary.netProfit || 0).toLocaleString('en-IN')}</td></tr>`;
        htmlContent += `<tr><td>Profit Margin</td><td>${(data.summary.profitMargin || 0).toFixed(2)}%</td></tr>`;
        htmlContent += `<tr><td>Total Sales</td><td>${data.summary.totalSales || 0}</td></tr>`;
        htmlContent += `<tr><td>Average Order Value</td><td>₹${(data.summary.averageOrderValue || 0).toLocaleString('en-IN')}</td></tr>`;
        htmlContent += '</table>';

        // Time Series
        if (data.timeGroupedData && data.timeGroupedData.length > 0) {
          htmlContent += '<h2>Time Series Data</h2><table>';
          htmlContent += '<tr><th>Date</th><th>Revenue</th><th>Profit</th><th>Cost</th><th>Sales</th></tr>';
          data.timeGroupedData.forEach(item => {
            const dateStr = formatDate(item.label || item.period || item.date);
            htmlContent += `<tr>
              <td>${dateStr}</td>
              <td>₹${(item.revenue || 0).toLocaleString('en-IN')}</td>
              <td>₹${(item.profit || 0).toLocaleString('en-IN')}</td>
              <td>₹${(item.cost || 0).toLocaleString('en-IN')}</td>
              <td>${item.sales || 0}</td>
            </tr>`;
          });
          htmlContent += '</table>';
        }

        // Category Performance
        if (data.categoryAnalysis && Object.keys(data.categoryAnalysis).length > 0) {
          htmlContent += '<h2>Category Performance</h2><table class="category-table">';
          htmlContent += '<tr><th>Category</th><th>Items Sold</th><th>Revenue</th></tr>';
          Object.entries(data.categoryAnalysis).forEach(([category, stats]) => {
            htmlContent += `<tr>
              <td>${category}</td>
              <td>${stats.itemsSold || 0}</td>
              <td>₹${(stats.revenue || 0).toLocaleString('en-IN')}</td>
            </tr>`;
          });
          htmlContent += '</table>';
        }

        // Payment Methods
        if (data.paymentMethodAnalysis && Object.keys(data.paymentMethodAnalysis).length > 0) {
          htmlContent += '<h2>Payment Methods</h2><table class="payment-table">';
          htmlContent += '<tr><th>Method</th><th>Count</th><th>Amount</th><th>Percentage</th></tr>';
          Object.entries(data.paymentMethodAnalysis).forEach(([method, stats]) => {
            htmlContent += `<tr>
              <td>${method}</td>
              <td>${stats.count || 0}</td>
              <td>₹${(stats.amount || 0).toLocaleString('en-IN')}</td>
              <td>${(stats.percentage || 0).toFixed(2)}%</td>
            </tr>`;
          });
          htmlContent += '</table>';
        }

      }

      htmlContent += '</body></html>';

      // Create and download file
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${tabName.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Comprehensive Excel file exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export Excel file');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const data = getCurrentData();
      if (!data) {
        toast.error('No data available to export');
        return;
      }

      const tabName = tabs.find(t => t.id === activeTab)?.label || 'Report';
      
      // Create a printable HTML content
      const printWindow = window.open('', '_blank');
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${tabName} Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
            .meta { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .summary-box { background: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${tabName} Report</h1>
          <div class="meta">
            <strong>Date Range:</strong> ${dateRange.startDate} to ${dateRange.endDate}<br>
            <strong>Generated:</strong> ${new Date().toLocaleString()}
          </div>
      `;

      if (activeTab === 'sales' && data.summary) {
        htmlContent += '<div class="summary-box">';
        htmlContent += '<h2>Summary</h2>';
        htmlContent += `<p><strong>Total Revenue:</strong> ₹${(data.summary.totalRevenue || 0).toLocaleString('en-IN')}</p>`;
        htmlContent += `<p><strong>Gross Profit:</strong> ₹${(data.summary.grossProfit || 0).toLocaleString('en-IN')}</p>`;
        htmlContent += `<p><strong>Profit Margin:</strong> ${(data.summary.profitMargin || 0).toFixed(2)}%</p>`;
        htmlContent += `<p><strong>Total Sales:</strong> ${data.summary.totalSales || 0}</p>`;
        htmlContent += '</div>';

        if (data.timeGroupedData && data.timeGroupedData.length > 0) {
          htmlContent += '<h2>Time Series Data</h2>';
          htmlContent += '<table><thead><tr><th>Date</th><th>Revenue</th><th>Profit</th><th>Sales Count</th></tr></thead><tbody>';
          data.timeGroupedData.forEach(item => {
            const dateStr = formatDate(item.label || item.period || item.date);
            htmlContent += `<tr>
              <td>${dateStr}</td>
              <td>₹${(item.revenue || 0).toLocaleString('en-IN')}</td>
              <td>₹${(item.profit || 0).toLocaleString('en-IN')}</td>
              <td>${item.salesCount || item.sales || 0}</td>
            </tr>`;
          });
          htmlContent += '</tbody></table>';
        }
      } else if (activeTab === 'financial' && data.summary) {
        htmlContent += '<div class="summary-box">';
        htmlContent += '<h2>Financial Summary</h2>';
        htmlContent += `<p><strong>Total Revenue:</strong> ₹${(data.summary.totalRevenue || 0).toLocaleString('en-IN')}</p>`;
        htmlContent += `<p><strong>Total Cost:</strong> ₹${(data.summary.totalCost || 0).toLocaleString('en-IN')}</p>`;
        htmlContent += `<p><strong>Gross Profit:</strong> ₹${(data.summary.grossProfit || 0).toLocaleString('en-IN')}</p>`;
        htmlContent += `<p><strong>Profit Margin:</strong> ${(data.summary.profitMargin || 0).toFixed(2)}%</p>`;
        htmlContent += '</div>';
      } else if (activeTab === 'customer' && data.summary) {
        htmlContent += '<div class="summary-box">';
        htmlContent += '<h2>Customer Summary</h2>';
        htmlContent += `<p><strong>Total Customers:</strong> ${data.summary.totalCustomers || 0}</p>`;
        htmlContent += `<p><strong>Active Customers:</strong> ${data.summary.activeCustomers || 0}</p>`;
        htmlContent += `<p><strong>Average Order Value:</strong> ₹${(data.summary.averageOrderValue || 0).toLocaleString('en-IN')}</p>`;
        htmlContent += '</div>';
      }

      htmlContent += `
          <div style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
              Print / Save as PDF
            </button>
            <button onclick="window.close()" style="background: #666; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-left: 10px;">
              Close
            </button>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      toast.success('PDF preview opened. Use browser print to save as PDF');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
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
        <div className="flex gap-2">
          {/* Export Dropdown */}
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="w-full sm:w-auto"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Export</span>
              <span className="xs:hidden">Export</span>
            </Button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
                <div className="py-1">
                  <button
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                    Export as PDF
                  </button>
                  <button
                    onClick={exportToCSV}
                    disabled={isExporting}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    Export as CSV
                  </button>
                  <button
                    onClick={exportToExcel}
                    disabled={isExporting}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <ChartBarIcon className="h-4 w-4" />
                    Export as Excel
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button 
            variant="primary" 
            onClick={handleRefreshData}
            className="w-full sm:w-auto"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Refresh Data</span>
            <span className="xs:hidden">Refresh</span>
          </Button>
        </div>
      </PageHeader>

      {/* Filters */}
      <Card className="p-4 sm:p-5 border-0 shadow-sm bg-gradient-to-r from-white to-slate-50 dark:from-surface-900 dark:to-zinc-900 sticky top-0 z-10">
        <div className="flex flex-col gap-4">
          {/* Header with Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                Report Filters
              </h3>
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Start Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-600 uppercase tracking-wide">
                Start Date
              </label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="h-10 text-sm border-2 border-zinc-400 dark:border-zinc-900 rounded-lg focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-600 uppercase tracking-wide">
                End Date
              </label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="h-10 text-sm border-2 border-zinc-400 dark:border-zinc-900 rounded-lg focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
              />
            </div>

            {/* Branch Filter - Only for Admin and Regional Manager */}
            {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'regional manager') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-600 uppercase tracking-wide">
                  Branch
                </label>
                <select
                  value={filters.branch}
                  onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
                  disabled={branchesLoading}
                  className="h-10 px-3 border-2 border-zinc-400 dark:border-zinc-900 rounded-lg bg-white dark:bg-zinc-950 text-sm text-zinc-950 dark:text-zinc-100 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-colors cursor-pointer hover:border-zinc-500 dark:hover:border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {branchesLoading ? 'Loading branches...' : branchesError ? 'Error loading branches' : 'All Branches'}
                  </option>
                  {branchesData?.branches?.map(branch => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-600 uppercase tracking-wide">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="h-10 px-3 border-2 border-zinc-400 dark:border-zinc-900 rounded-lg bg-white dark:bg-zinc-950 text-sm text-zinc-950 dark:text-zinc-100 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-colors cursor-pointer hover:border-zinc-500 dark:hover:border-zinc-800"
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

          {/* Active Filters Summary */}
          {(filters.branch || filters.category) && (
            <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-zinc-300 dark:border-zinc-900">
              <span className="text-xs text-zinc-700 dark:text-zinc-600 font-medium">Active Filters:</span>
              {filters.branch && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {branchesData?.branches?.find(b => b._id === filters.branch)?.name || 'Branch'}
                  <button 
                    onClick={() => setFilters(prev => ({ ...prev, branch: '' }))}
                    className="ml-1 hover:text-red-600"
                  >
                    ✕
                  </button>
                </Badge>
              )}
              {filters.category && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {categoriesData?.find(c => c._id === filters.category)?.name || 'Category'}
                  <button 
                    onClick={() => setFilters(prev => ({ ...prev, category: '' }))}
                    className="ml-1 hover:text-red-600"
                  >
                    ✕
                  </button>
                </Badge>
              )}
            </div>
          )}
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
      {toastState && (
        <Toast
          type={toastState.type}
          message={toastState.message}
          onClose={() => setToastState(null)}
        />
      )}
    </div>
  );
}

export default EnhancedReports;
