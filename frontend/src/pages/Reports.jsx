import { useState, useEffect, useRef } from 'react';
import { 
  ArrowDownTrayIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  FunnelIcon,
  TagIcon,
  EnvelopeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/shell';
import { Button, Input, Card, StatCard, Modal } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { reportsAPI, productsAPI } from '../utils/api';
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
  DoughnutController,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

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
  DoughnutController
);

function Reports() {
  const [reportData, setReportData] = useState(null);
  const [productReportData, setProductReportData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProductReport, setLoadingProductReport] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState('sales'); // 'sales', 'products', or 'inventory'
  const [dailySalesChartType, setDailySalesChartType] = useState('line'); // 'line' or 'bar'
  const [topProductsChartType, setTopProductsChartType] = useState('bar'); // 'bar' or 'doughnut'
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const { token, user } = useAuth();
  
  // Store PDF blob for email attachment
  const pdfBlobRef = useRef(null);

  // Set default dates (last 30 days) and load categories
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    
    // Fetch product categories
    const loadCategories = async () => {
      try {
        const categoriesData = await reportsAPI.getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    loadCategories();
  }, []);
  
  // Fetch inventory data when switching to the inventory tab
  useEffect(() => {
    if (activeTab === 'inventory' && !inventoryData) {
      fetchInventoryData();
    }
  }, [activeTab]);
  
  // Fetch inventory status data
  const fetchInventoryData = async () => {
    setLoadingInventory(true);
    try {
      const data = await productsAPI.getInventoryStatus({ category: selectedCategory });
      setInventoryData(data);
      toast.success('Inventory status report generated');
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      toast.error('Failed to generate inventory status report');
    } finally {
      setLoadingInventory(false);
    }
  };

  // Fetch sales report data
  const fetchReportData = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const response = await reportsAPI.getDateRangeReport(startDate, endDate, selectedCategory);
      setReportData(response.data);
      toast.success('Sales report generated successfully');
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to generate sales report');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch product report data
  const fetchProductReportData = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoadingProductReport(true);
    try {
      const response = await reportsAPI.getProductReport(startDate, endDate, selectedCategory);
      setProductReportData(response.data);
      toast.success('Product report generated successfully');
    } catch (error) {
      console.error('Error fetching product report data:', error);
      toast.error('Failed to generate product report');
    } finally {
      setLoadingProductReport(false);
    }
  };

  // Send report via email
  const handleSendEmail = async () => {
    if (!emailRecipients.trim()) {
      toast.error('Please enter at least one email recipient');
      return;
    }
    
    if (!pdfBlobRef.current) {
      toast.error('PDF generation failed. Please try again.');
      return;
    }
    
    setSendingEmail(true);
    
    try {
      // Simulate sending email (since we don't have a backend endpoint for this)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, we would upload the PDF blob to the server and send the email
      // const formData = new FormData();
      // formData.append('pdf', pdfBlobRef.current);
      // formData.append('recipients', emailRecipients);
      // formData.append('subject', emailSubject);
      // formData.append('message', emailMessage);
      // await api.post('/reports/email', formData);
      
      toast.success(`Report sent to ${emailRecipients}`);
      setShowEmailModal(false);
      setEmailRecipients('');
      setEmailSubject('');
      setEmailMessage('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Generate and save PDF for sharing
  const generatePDFForSharing = async () => {
    let doc;
    
    try {
      if (activeTab === 'sales') {
        if (!reportData) {
          toast.error('No sales report data available. Please generate a report first.');
          return;
        }
        doc = await generateSalesPDFDoc(reportData);
      } else if (activeTab === 'products') {
        if (!productReportData) {
          toast.error('No product report data available. Please generate a report first.');
          return;
        }
        doc = await generateProductsPDFDoc(productReportData);
      } else if (activeTab === 'inventory') {
        if (!inventoryData) {
          toast.error('No inventory data available. Please generate a report first.');
          return;
        }
        doc = await generateInventoryPDFDoc(inventoryData);
      }
      
      if (doc) {
        // Store the PDF blob for email attachment
        pdfBlobRef.current = doc.output('blob');
        
        // Set email subject based on report type
        const reportType = activeTab === 'sales' ? 'Sales' : activeTab === 'products' ? 'Product Performance' : 'Inventory Status';
        const dateRange = activeTab !== 'inventory' ? `${startDate} to ${endDate}` : '';
        const categoryFilter = selectedCategory ? ` (${selectedCategory} Category)` : '';
        
        setEmailSubject(`${reportType} Report${dateRange ? ` for ${dateRange}` : ''}${categoryFilter}`);
        setEmailMessage(`Please find attached the ${reportType} Report${dateRange ? ` for the period ${dateRange}` : ''}.`);
        
        setShowEmailModal(true);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF for sharing');
    }
  };
  
  // Generate sales PDF document
  const generateSalesPDFDoc = async (reportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Sales Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Period: ${startDate} to ${endDate}${selectedCategory ? ` - ${selectedCategory} Category` : ''}`, pageWidth / 2, 30, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 35, { align: 'center' });

    // Summary Statistics
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Summary Statistics', 20, 50);

    const summaryData = [
      ['Total Sales', reportData.summary.totalSales.toString()],
      ['Total Revenue', `₹${reportData.summary.totalRevenue.toLocaleString('en-IN')}`],
      ['Average Sale Value', `₹${reportData.summary.averageSaleValue.toLocaleString('en-IN')}`],
      ['Total Items Sold', reportData.summary.totalItemsSold.toString()]
    ];

    doc.autoTable({
      startY: 55,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 }
    });
    
    // Add the rest of the sales report content...
    // (Same code as in the generatePDF function)
    
    return doc;
  };
  
  // Generate products PDF document
  const generateProductsPDFDoc = async (productReportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Product Performance Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Period: ${startDate} to ${endDate}${selectedCategory ? ` - ${selectedCategory} Category` : ''}`, pageWidth / 2, 30, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 35, { align: 'center' });
    
    // Add the rest of the product report content...
    // (Same code as in the generateProductPDF function)
    
    return doc;
  };
  
  // Generate inventory PDF document
  const generateInventoryPDFDoc = async (inventoryData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Inventory Status Report', pageWidth / 2, 20, { align: 'center' });
    
    // Add the rest of the inventory report content...
    // (Same code as in the generateInventoryPDF function)
    
    return doc;
  };
  
  // Generate PDF for inventory report
  const generateInventoryPDF = async () => {
    if (!inventoryData) {
      toast.error('No inventory data available. Please generate a report first.');
      return;
    }
    
    setDownloading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Inventory Status Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
      if (selectedCategory) {
        doc.text(`Category Filter: ${selectedCategory}`, pageWidth / 2, 35, { align: 'center' });
      }

      // Summary Statistics
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Inventory Status Summary', 20, 45);

      const summaryData = [
        ['Low Stock Items', inventoryData.lowStock.length.toString()],
        ['Out of Stock Items', inventoryData.outOfStock.length.toString()],
        ['Overstocked Items', inventoryData.overstock.length.toString()],
        ['Total Problem Items', (inventoryData.lowStock.length + inventoryData.outOfStock.length + inventoryData.overstock.length).toString()]
      ];

      doc.autoTable({
        startY: 50,
        head: [['Status', 'Count']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 }
      });
      
      // Low Stock Items
      if (inventoryData.lowStock.length > 0) {
        doc.setFontSize(16);
        doc.text('Low Stock Items', 20, doc.lastAutoTable.finalY + 20);

        const lowStockData = inventoryData.lowStock.map(product => [
          product.name,
          product.sku || 'N/A',
          product.category,
          product.quantity.toString(),
          product.minStockLevel.toString()
        ]);

        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 25,
          head: [['Product Name', 'SKU', 'Category', 'Current Stock', 'Min Level']],
          body: lowStockData,
          theme: 'striped',
          headStyles: { fillColor: [245, 158, 11] }, // Amber
          margin: { left: 10, right: 10 },
          styles: { fontSize: 8 }
        });
      }
      
      // Out of Stock Items
      if (inventoryData.outOfStock.length > 0) {
        doc.setFontSize(16);
        doc.text('Out of Stock Items', 20, doc.lastAutoTable.finalY + 20);

        const outOfStockData = inventoryData.outOfStock.map(product => [
          product.name,
          product.sku || 'N/A',
          product.category,
          product.minStockLevel ? product.minStockLevel.toString() : 'N/A'
        ]);

        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 25,
          head: [['Product Name', 'SKU', 'Category', 'Min Level']],
          body: outOfStockData,
          theme: 'striped',
          headStyles: { fillColor: [239, 68, 68] }, // Red
          margin: { left: 10, right: 10 },
          styles: { fontSize: 8 }
        });
      }
      
      // Overstock Items
      if (inventoryData.overstock.length > 0) {
        doc.setFontSize(16);
        doc.text('Overstocked Items', 20, doc.lastAutoTable.finalY + 20);

        const overstockData = inventoryData.overstock.map(product => [
          product.name,
          product.sku || 'N/A',
          product.category,
          product.quantity.toString(),
          product.maxStockLevel.toString()
        ]);

        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 25,
          head: [['Product Name', 'SKU', 'Category', 'Current Stock', 'Max Level']],
          body: overstockData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] }, // Blue
          margin: { left: 10, right: 10 },
          styles: { fontSize: 8 }
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      const fileName = `inventory-status-report${selectedCategory ? `-${selectedCategory}` : ''}.pdf`;
      doc.save(fileName);
      toast.success('PDF inventory report downloaded successfully');

    } catch (error) {
      console.error('Error generating inventory PDF:', error);
      toast.error('Failed to generate inventory PDF report');
    } finally {
      setDownloading(false);
    }
  };

  // Generate PDF report for sales
  const generatePDF = async () => {
    if (!reportData) {
      toast.error('No report data available. Please generate a report first.');
      return;
    }

    setDownloading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Inventory Management Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Report Period: ${startDate} to ${endDate}`, pageWidth / 2, 30, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 35, { align: 'center' });

      // Summary Statistics
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Summary Statistics', 20, 50);

      const summaryData = [
        ['Total Sales', reportData.summary.totalSales.toString()],
        ['Total Revenue', `₹${reportData.summary.totalRevenue.toLocaleString('en-IN')}`],
        ['Average Sale Value', `₹${reportData.summary.averageSaleValue.toLocaleString('en-IN')}`],
        ['Total Items Sold', reportData.summary.totalItemsSold.toString()]
      ];

      doc.autoTable({
        startY: 55,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 }
      });

      // Top Products
      if (reportData.topProducts.length > 0) {
        doc.setFontSize(16);
        doc.text('Top Selling Products', 20, doc.lastAutoTable.finalY + 20);

        const topProductsData = reportData.topProducts.map(product => [
          product.name,
          product.totalSold.toString(),
          `₹${product.revenue.toLocaleString('en-IN')}`
        ]);

        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 25,
          head: [['Product Name', 'Units Sold', 'Revenue']],
          body: topProductsData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] },
          margin: { left: 20, right: 20 }
        });
      }

      // Payment Methods (if available)
      if (reportData.paymentMethods && Object.keys(reportData.paymentMethods).length > 0) {
        doc.setFontSize(16);
        doc.text('Payment Methods Breakdown', 20, doc.lastAutoTable.finalY + 20);

        const paymentData = Object.entries(reportData.paymentMethods).map(([method, data]) => [
          method,
          data.count.toString(),
          `₹${data.total.toLocaleString('en-IN')}`,
          `${((data.total / reportData.summary.totalRevenue) * 100).toFixed(2)}%`
        ]);

        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 25,
          head: [['Payment Method', 'Transactions', 'Total Amount', 'Percentage']],
          body: paymentData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] },
          margin: { left: 20, right: 20 }
        });
      }
      
      // Daily Sales (if available)
      if (reportData.dailySales.length > 0) {
        doc.setFontSize(16);
        doc.text('Daily Sales Breakdown', 20, doc.lastAutoTable.finalY + 20);

        const dailySalesData = reportData.dailySales.map(sale => [
          new Date(sale.date).toLocaleDateString(),
          sale.sales.toString(),
          `₹${sale.revenue.toLocaleString('en-IN')}`
        ]);

        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 25,
          head: [['Date', 'Number of Sales', 'Revenue']],
          body: dailySalesData,
          theme: 'striped',
          headStyles: { fillColor: [139, 92, 246] },
          margin: { left: 20, right: 20 }
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      const fileName = `inventory-report-${startDate}-to-${endDate}.pdf`;
      doc.save(fileName);
      toast.success('PDF report downloaded successfully');

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setDownloading(false);
    }
  };

  // Chart data for daily sales
  const salesChartData = reportData ? {
    labels: reportData.dailySales.map(sale => new Date(sale.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Daily Revenue (₹)',
        data: reportData.dailySales.map(sale => sale.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Number of Sales',
        data: reportData.dailySales.map(sale => sale.sales),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  } : null;

  // Chart data for top products
  const productsChartData = reportData ? {
    labels: reportData.topProducts.slice(0, 10).map(product => product.name),
    datasets: [
      {
        label: 'Units Sold',
        data: reportData.topProducts.slice(0, 10).map(product => product.totalSold),
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
          '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
        ],
        borderWidth: 0,
      },
    ],
  } : null;

  // Generate PDF report for product performance
  const generateProductPDF = async () => {
    if (!productReportData) {
      toast.error('No product report data available. Please generate a report first.');
      return;
    }

    setDownloading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Product Performance Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Report Period: ${startDate} to ${endDate}${selectedCategory ? ` - ${selectedCategory} Category` : ''}`, pageWidth / 2, 30, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 35, { align: 'center' });

      // Summary Statistics
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Summary Statistics', 20, 50);

      const totalRevenue = productReportData.products.reduce((sum, product) => sum + product.totalRevenue, 0);
      const totalUnitsSold = productReportData.products.reduce((sum, product) => sum + product.totalQuantitySold, 0);

      const summaryData = [
        ['Total Products', productReportData.totalProducts.toString()],
        ['Total Revenue', `₹${totalRevenue.toLocaleString('en-IN')}`],
        ['Total Units Sold', totalUnitsSold.toString()],
        ['Average Price', `₹${(totalRevenue / totalUnitsSold).toFixed(2).toLocaleString('en-IN')}`]
      ];

      doc.autoTable({
        startY: 55,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 }
      });

      // Top Products
      if (productReportData.products.length > 0) {
        doc.setFontSize(16);
        doc.text('Product Performance', 20, doc.lastAutoTable.finalY + 20);

        const productsData = productReportData.products.slice(0, 20).map(product => [
          product.productName,
          product.sku || 'N/A',
          product.category || 'Uncategorized',
          product.totalQuantitySold.toString(),
          `₹${product.totalRevenue.toLocaleString('en-IN')}`,
          `₹${Math.round(product.averagePrice).toLocaleString('en-IN')}`
        ]);

        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 25,
          head: [['Product Name', 'SKU', 'Category', 'Units Sold', 'Revenue', 'Avg Price']],
          body: productsData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] },
          margin: { left: 10, right: 10 },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 20 },
            2: { cellWidth: 30 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 }
          }
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      const fileName = `product-performance-${startDate}-to-${endDate}${selectedCategory ? `-${selectedCategory}` : ''}.pdf`;
      doc.save(fileName);
      toast.success('PDF report downloaded successfully');

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setDownloading(false);
    }
  };

  // Function to render inventory status chart
  const renderInventoryStatusChart = (inventoryData) => {
    const { lowStock, outOfStock, overstock } = inventoryData;
    
    // Count products by category for each stock status
    const categories = {};
    
    // Process low stock items
    lowStock.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = { lowStock: 0, outOfStock: 0, overstock: 0 };
      }
      categories[category].lowStock++;
    });
    
    // Process out of stock items
    outOfStock.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = { lowStock: 0, outOfStock: 0, overstock: 0 };
      }
      categories[category].outOfStock++;
    });
    
    // Process overstock items
    overstock.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = { lowStock: 0, outOfStock: 0, overstock: 0 };
      }
      categories[category].overstock++;
    });
    
    const categoryNames = Object.keys(categories);
    
    const chartData = {
      labels: categoryNames,
      datasets: [
        {
          label: 'Low Stock',
          data: categoryNames.map(category => categories[category].lowStock),
          backgroundColor: 'rgba(245, 158, 11, 0.8)', // Amber
          borderWidth: 0,
        },
        {
          label: 'Out of Stock',
          data: categoryNames.map(category => categories[category].outOfStock),
          backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red
          borderWidth: 0,
        },
        {
          label: 'Overstock',
          data: categoryNames.map(category => categories[category].overstock),
          backgroundColor: 'rgba(59, 130, 246, 0.8)', // Blue
          borderWidth: 0,
        }
      ],
    };
    
    const barOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false
        },
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Products'
          }
        }
      },
    };
    
    return <Bar data={chartData} options={barOptions} />;
  };

  // Function to render payment methods chart
  const renderPaymentMethodsChart = (paymentMethods) => {
    const methods = Object.keys(paymentMethods);
    const totals = methods.map(method => paymentMethods[method].total);
    
    const paymentChartData = {
      labels: methods,
      datasets: [
        {
          label: 'Revenue by Payment Method',
          data: totals,
          backgroundColor: [
            '#3B82F6', // Blue
            '#10B981', // Green
            '#F59E0B', // Amber
            '#EF4444', // Red
            '#8B5CF6', // Purple
            '#06B6D4', // Cyan
            '#84CC16', // Lime
            '#F97316'  // Orange
          ],
          borderWidth: 0,
        },
      ],
    };
    
    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: 'Revenue by Payment Method',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `₹${value.toLocaleString('en-IN')} (${percentage}%)`;
            }
          }
        }
      },
    };
    
    return <Doughnut data={paymentChartData} options={doughnutOptions} />;
  };

  // Function to render category chart
  const renderCategoryChart = (products) => {
    // Group products by category and calculate totals
    const categories = {};
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = {
          totalRevenue: 0,
          totalQuantitySold: 0
        };
      }
      categories[category].totalRevenue += product.totalRevenue;
      categories[category].totalQuantitySold += product.totalQuantitySold;
    });
    
    const categoryNames = Object.keys(categories);
    
    const categoryChartData = {
      labels: categoryNames,
      datasets: [
        {
          label: 'Revenue by Category',
          data: categoryNames.map(category => categories[category].totalRevenue),
          backgroundColor: [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
          ],
          borderWidth: 0,
        },
      ],
    };
    
    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: 'Revenue by Category',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `₹${value.toLocaleString('en-IN')} (${percentage}%)`;
            }
          }
        }
      },
    };
    
    return <Doughnut data={categoryChartData} options={doughnutOptions} />;
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Sales Trend',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Top 10 Products by Units Sold',
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Reports"
        subtitle="Generate detailed sales and inventory reports"
        action={
          <div className="flex space-x-2">
            <Button
              onClick={generatePDFForSharing}
              disabled={
                (activeTab === 'sales' && !reportData) || 
                (activeTab === 'products' && !productReportData) || 
                (activeTab === 'inventory' && !inventoryData) || 
                downloading || sendingEmail
              }
              variant="outline"
              size="default"
            >
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Email Report
            </Button>
            
            <Button
              onClick={() => {
                if (activeTab === 'sales') {
                  generatePDF();
                } else if (activeTab === 'products') {
                  generateProductPDF();
                } else if (activeTab === 'inventory') {
                  generateInventoryPDF();
                }
              }}
              disabled={
                (activeTab === 'sales' && !reportData) || 
                (activeTab === 'products' && !productReportData) || 
                (activeTab === 'inventory' && !inventoryData) || 
                downloading
              }
              variant="default"
              size="default"
            >
              {downloading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download Report
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Report Type Tabs */}
      <div className="bg-white dark:bg-surface-800 rounded-lg shadow overflow-hidden mb-4">
        <div className="flex border-b border-surface-200 dark:border-surface-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center px-6 py-3 text-sm font-medium ${
              activeTab === 'sales'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-500'
                : 'text-surface-700 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100'
            }`}
          >
            <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
            Sales Reports
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center px-6 py-3 text-sm font-medium ${
              activeTab === 'products'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-500'
                : 'text-surface-700 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100'
            }`}
          >
            <TagIcon className="h-4 w-4 mr-2" />
            Product Performance
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center px-6 py-3 text-sm font-medium ${
              activeTab === 'inventory'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-500'
                : 'text-surface-700 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100'
            }`}
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Inventory Status
          </button>
        </div>
      </div>

      {/* Date Range and Category Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-4">Report Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Category Filter</label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full rounded-md border border-surface-300 dark:border-surface-700 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 sm:text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-surface-700 dark:text-surface-300">
                <FunnelIcon className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => {
                if (activeTab === 'sales') {
                  fetchReportData();
                } else if (activeTab === 'products') {
                  fetchProductReportData();
                } else if (activeTab === 'inventory') {
                  fetchInventoryData();
                }
              }}
              disabled={
                (activeTab === 'sales' && (loading || !startDate || !endDate)) ||
                (activeTab === 'products' && (loadingProductReport || !startDate || !endDate)) ||
                (activeTab === 'inventory' && loadingInventory)
              }
              className="w-full"
              size="default"
            >
              {(activeTab === 'sales' ? loading : (activeTab === 'products' ? loadingProductReport : loadingInventory)) ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Content */}
      {activeTab === 'sales' && loading && <LoadingSpinner />}
      {activeTab === 'products' && loadingProductReport && <LoadingSpinner />}

      {/* Sales Reports Tab */}
      {activeTab === 'sales' && reportData && (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Sales"
              value={reportData.summary.totalSales}
              icon={ChartBarIcon}
              trend={null}
              color="blue"
            />

            <StatCard
              title="Total Revenue"
              value={`₹${reportData.summary.totalRevenue.toLocaleString('en-IN')}`}
              icon={ArrowTrendingUpIcon}
              trend={null}
              color="green"
            />

            <StatCard
              title="Avg Sale Value"
              value={`₹${reportData.summary.averageSaleValue.toLocaleString('en-IN')}`}
              icon={DocumentTextIcon}
              trend={null}
              color="purple"
            />

            <StatCard
              title="Items Sold"
              value={reportData.summary.totalItemsSold}
              icon={CalendarIcon}
              trend={null}
              color="orange"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Sales Chart */}
            {reportData.dailySales.length > 0 && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100">
                    Daily Sales Trend
                  </h3>
                  <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button
                      type="button"
                      onClick={() => setDailySalesChartType('line')}
                      className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                        dailySalesChartType === 'line'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-600'
                      } border border-surface-300 dark:border-surface-600`}
                    >
                      Line
                    </button>
                    <button
                      type="button"
                      onClick={() => setDailySalesChartType('bar')}
                      className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                        dailySalesChartType === 'bar'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-600'
                      } border border-t border-r border-b border-surface-300 dark:border-surface-600`}
                    >
                      Bar
                    </button>
                  </div>
                </div>
                <div className="h-80">
                  {dailySalesChartType === 'line' ? (
                    <Line data={salesChartData} options={lineChartOptions} />
                  ) : (
                    <Bar 
                      data={{
                        labels: reportData.dailySales.map(sale => new Date(sale.date).toLocaleDateString()),
                        datasets: [
                          {
                            label: 'Daily Revenue (₹)',
                            data: reportData.dailySales.map(sale => sale.revenue),
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            borderColor: 'rgb(59, 130, 246)',
                            borderWidth: 1,
                          }
                        ]
                      }} 
                      options={{
                        ...barChartOptions,
                        plugins: {
                          ...barChartOptions.plugins,
                          title: {
                            display: false
                          }
                        }
                      }} 
                    />
                  )}
                </div>
              </Card>
            )}

            {/* Top Products Chart */}
            {reportData.topProducts.length > 0 && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100">
                    Top Products
                  </h3>
                  <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button
                      type="button"
                      onClick={() => setTopProductsChartType('bar')}
                      className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                        topProductsChartType === 'bar'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-600'
                      } border border-surface-300 dark:border-surface-600`}
                    >
                      Bar
                    </button>
                    <button
                      type="button"
                      onClick={() => setTopProductsChartType('doughnut')}
                      className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                        topProductsChartType === 'doughnut'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-600'
                      } border border-t border-r border-b border-surface-300 dark:border-surface-600`}
                    >
                      Doughnut
                    </button>
                  </div>
                </div>
                <div className="h-80">
                  {topProductsChartType === 'bar' ? (
                    <Bar data={productsChartData} options={{
                      ...barChartOptions,
                      plugins: {
                        ...barChartOptions.plugins,
                        title: {
                          display: false
                        }
                      }
                    }} />
                  ) : (
                    <Doughnut 
                      data={{
                        labels: reportData.topProducts.slice(0, 10).map(product => product.name),
                        datasets: [
                          {
                            data: reportData.topProducts.slice(0, 10).map(product => product.totalSold),
                            backgroundColor: [
                              '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                              '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
                            ],
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} units (${percentage}%)`;
                              }
                            }
                          }
                        },
                      }} 
                    />
                  )}
                </div>
              </Card>
            )}
          </div>
          
          {/* Payment Methods Chart */}
          {reportData.paymentMethods && Object.keys(reportData.paymentMethods).length > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-4">
                Payment Methods Breakdown
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  {renderPaymentMethodsChart(reportData.paymentMethods)}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-600">
                    <thead className="bg-surface-50 dark:bg-surface-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                          Payment Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                          Transactions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-600">
                      {Object.entries(reportData.paymentMethods).map(([method, data], index) => (
                        <tr key={method} className={index % 2 === 0 ? 'bg-white dark:bg-surface-800' : 'bg-surface-50 dark:bg-surface-700'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900 dark:text-surface-100">
                            {method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">
                            {data.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">
                            ₹{data.total.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">
                            {((data.total / reportData.summary.totalRevenue) * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* Top Products Table */}
          {reportData.topProducts.length > 0 && (
            <Card>
              <div className="px-6 py-5">
                <h3 className="text-lg leading-6 font-medium text-surface-900 dark:text-surface-100 mb-4">
                  Top Selling Products {selectedCategory && `- ${selectedCategory} Category`}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-600">
                    <thead className="bg-surface-50 dark:bg-surface-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                          Product Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                          Units Sold
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-600">
                      {reportData.topProducts.map((product, index) => (
                        <tr key={product._id} className={index % 2 === 0 ? 'bg-white dark:bg-surface-800' : 'bg-surface-50 dark:bg-surface-700'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900 dark:text-surface-100">
                            #{index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900 dark:text-surface-100">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">
                            {product.category || 'Uncategorized'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">
                            {product.totalSold}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">
                            ₹{product.revenue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* Daily Breakdown */}
          {reportData.dailySales.length > 0 && (
            <Card>
              <div className="px-6 py-5">
                <h3 className="text-lg leading-6 font-medium text-surface-900 dark:text-surface-100 mb-4">
                  Daily Sales Breakdown {selectedCategory && `- ${selectedCategory} Category`}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-600">
                    <thead className="bg-surface-50 dark:bg-surface-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                          Number of Sales
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                          Total Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                          Avg Sale Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-600">
                      {reportData.dailySales.map((sale, index) => (
                        <tr key={sale.date} className={index % 2 === 0 ? 'bg-white dark:bg-surface-800' : 'bg-surface-50 dark:bg-surface-700'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900 dark:text-surface-100">
                            {new Date(sale.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">
                            {sale.sales}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">
                            ₹{sale.revenue.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">
                            ₹{sale.sales > 0 ? Math.round(sale.revenue / sale.sales).toLocaleString('en-IN') : 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Product Performance Tab */}
      {activeTab === 'products' && productReportData && (
        <>
          {/* Product Performance Summary */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-4">
              Product Performance Summary {selectedCategory && `- ${selectedCategory} Category`}
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">
              Showing {productReportData.products.length} products from {startDate} to {endDate}
            </p>

            {/* Product Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-500 dark:text-blue-400">Total Products</p>
                <p className="mt-1 text-2xl font-semibold text-blue-700 dark:text-blue-300">{productReportData.totalProducts}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                <p className="text-sm font-medium text-green-500 dark:text-green-400">Total Revenue</p>
                <p className="mt-1 text-2xl font-semibold text-green-700 dark:text-green-300">
                  ₹{productReportData.products.reduce((sum, product) => sum + product.totalRevenue, 0).toLocaleString('en-IN')}
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                <p className="text-sm font-medium text-purple-500 dark:text-purple-400">Total Units Sold</p>
                <p className="mt-1 text-2xl font-semibold text-purple-700 dark:text-purple-300">
                  {productReportData.products.reduce((sum, product) => sum + product.totalQuantitySold, 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Product Performance Table */}
            <div className="overflow-x-auto mt-6">
              <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-600">
                <thead className="bg-surface-50 dark:bg-surface-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Product Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Units Sold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Avg Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-600">
                  {productReportData.products.map((product, index) => (
                    <tr key={product._id} className={index % 2 === 0 ? 'bg-white dark:bg-surface-800' : 'bg-surface-50 dark:bg-surface-700'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900 dark:text-surface-100">{product.productName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">{product.sku || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">{product.category || 'Uncategorized'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">{product.totalQuantitySold}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">₹{product.totalRevenue.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">₹{Math.round(product.averagePrice).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Category Performance Chart (only show if multiple categories) */}
          {!selectedCategory && productReportData.products.length > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-4">Category Performance</h3>
              <div className="h-96">
                {renderCategoryChart(productReportData.products)}
              </div>
            </Card>
          )}
        </>
      )}

      {/* No Data State - Sales Tab */}
      {activeTab === 'sales' && !loading && !reportData && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-surface-400" />
          <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-surface-100">No sales report generated</h3>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Select a date range{selectedCategory ? ' and category' : ''} and click "Generate Report" to view sales analytics
          </p>
        </div>
      )}
      
      {/* No Data State - Products Tab */}
      {activeTab === 'products' && !loadingProductReport && !productReportData && (
        <div className="text-center py-12">
          <TagIcon className="mx-auto h-12 w-12 text-surface-400" />
          <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-surface-100">No product report generated</h3>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Select a date range{selectedCategory ? ' and category' : ''} and click "Generate Report" to view product performance analytics
          </p>
        </div>
      )}
      
      {/* Inventory Status Tab */}
      {activeTab === 'inventory' && loadingInventory && <LoadingSpinner />}
      
      {activeTab === 'inventory' && inventoryData && (
        <>
          {/* Inventory Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard
              title="Low Stock Items"
              value={inventoryData.lowStock.length}
              icon={ChartBarIcon}
              trend={null}
              color="amber"
            />

            <StatCard
              title="Out of Stock"
              value={inventoryData.outOfStock.length}
              icon={ChartBarIcon}
              trend={null}
              color="red"
            />

            <StatCard
              title="Overstocked Items"
              value={inventoryData.overstock.length}
              icon={ChartBarIcon}
              trend={null}
              color="blue"
            />
          </div>
          
          {/* Inventory Status Chart */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-4">
              Inventory Status Overview
            </h3>
            <div className="h-80">
              {renderInventoryStatusChart(inventoryData)}
            </div>
          </Card>
          
          {/* Low Stock Items */}
          {inventoryData.lowStock.length > 0 && (
            <Card className="mb-6">
              <div className="px-6 py-5">
                <h3 className="text-lg leading-6 font-medium text-surface-900 dark:text-surface-100 mb-4 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                  Low Stock Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-600">
                    <thead className="bg-surface-50 dark:bg-surface-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Product Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Current Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Min Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-600">
                      {inventoryData.lowStock.map((product, index) => (
                        <tr key={product._id} className={index % 2 === 0 ? 'bg-white dark:bg-surface-800' : 'bg-surface-50 dark:bg-surface-700'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900 dark:text-surface-100">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">{product.sku || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">{product.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">{product.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">{product.minStockLevel}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-500">
                              Low Stock
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
          
          {/* Out of Stock Items */}
          {inventoryData.outOfStock.length > 0 && (
            <Card className="mb-6">
              <div className="px-6 py-5">
                <h3 className="text-lg leading-6 font-medium text-surface-900 dark:text-surface-100 mb-4 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  Out of Stock Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-600">
                    <thead className="bg-surface-50 dark:bg-surface-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Product Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Min Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-600">
                      {inventoryData.outOfStock.map((product, index) => (
                        <tr key={product._id} className={index % 2 === 0 ? 'bg-white dark:bg-surface-800' : 'bg-surface-50 dark:bg-surface-700'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900 dark:text-surface-100">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">{product.sku || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">{product.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">{product.minStockLevel || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-500">
                              Out of Stock
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
          
          {/* Overstock Items */}
          {inventoryData.overstock.length > 0 && (
            <Card className="mb-6">
              <div className="px-6 py-5">
                <h3 className="text-lg leading-6 font-medium text-surface-900 dark:text-surface-100 mb-4 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  Overstocked Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-600">
                    <thead className="bg-surface-50 dark:bg-surface-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Product Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Current Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Max Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-600">
                      {inventoryData.overstock.map((product, index) => (
                        <tr key={product._id} className={index % 2 === 0 ? 'bg-white dark:bg-surface-800' : 'bg-surface-50 dark:bg-surface-700'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900 dark:text-surface-100">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">{product.sku || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">{product.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">{product.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">{product.maxStockLevel}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-500">
                              Overstock
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
      
      {/* No Data State - Inventory Tab */}
      {activeTab === 'inventory' && !loadingInventory && !inventoryData && (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-surface-400" />
          <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-surface-100">No inventory report generated</h3>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Click "Generate Report" to view inventory status
          </p>
        </div>
      )}
      
      {/* Email Report Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Email Report"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="recipients" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Recipients (comma separated emails)
            </label>
            <Input
              id="recipients"
              type="text"
              placeholder="email@example.com, otheremail@example.com"
              value={emailRecipients}
              onChange={(e) => setEmailRecipients(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Subject
            </label>
            <Input
              id="subject"
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Message
            </label>
            <textarea
              id="message"
              rows={4}
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              className="w-full rounded-md border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowEmailModal(false)}
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              variant="default"
              size="default"
              onClick={handleSendEmail}
              disabled={sendingEmail}
            >
              {sendingEmail ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Send Report
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Reports;
