import { useState } from 'react'
import { Download, Calendar, BarChart3, FileText, TrendingUp } from 'lucide-react'

function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [selectedReport, setSelectedReport] = useState('sales')

  const reportTypes = [
    { id: 'sales', name: 'Sales Report', icon: BarChart3, description: 'Daily, weekly, and monthly sales analysis' },
    { id: 'inventory', name: 'Inventory Report', icon: FileText, description: 'Current stock levels and movements' },
    { id: 'trends', name: 'Trend Analysis', icon: TrendingUp, description: 'Product performance and seasonal trends' },
  ]

  const periods = [
    { id: 'today', name: 'Today' },
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'quarter', name: 'This Quarter' },
    { id: 'year', name: 'This Year' },
  ]

  // Mock data for charts (placeholder)
  const mockChartData = {
    sales: [
      { date: '2024-01-01', value: 1250 },
      { date: '2024-01-02', value: 1380 },
      { date: '2024-01-03', value: 1420 },
      { date: '2024-01-04', value: 1180 },
      { date: '2024-01-05', value: 1350 },
      { date: '2024-01-06', value: 1480 },
      { date: '2024-01-07', value: 1620 },
    ]
  }

  const handleDownloadReport = () => {
    // TODO: Implement PDF report generation
    console.log(`Downloading ${selectedReport} report for ${selectedPeriod}`)
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="mt-1 text-sm text-gray-600">
              Generate and analyze business reports
            </p>
          </div>
          <button 
            onClick={handleDownloadReport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </button>
        </div>

        {/* Report Type Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {reportTypes.map((report) => {
            const Icon = report.icon
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`p-4 text-left border rounded-lg transition-colors ${
                  selectedReport === report.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <Icon className="h-5 w-5 text-primary-600 mr-2" />
                  <h3 className="font-medium text-gray-900">{report.name}</h3>
                </div>
                <p className="text-sm text-gray-500">{report.description}</p>
              </button>
            )
          })}
        </div>

        {/* Period Selection */}
        <div className="flex items-center space-x-4 mb-6">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div className="flex space-x-2">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedPeriod === period.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Placeholder */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {reportTypes.find(r => r.id === selectedReport)?.name} - {periods.find(p => p.id === selectedPeriod)?.name}
          </h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart visualization will be displayed here</p>
              <p className="text-sm text-gray-400 mt-1">Integration with Chart.js or similar coming soon</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Summary Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total Revenue</span>
              <span className="text-lg font-bold text-green-600">$9,847.32</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total Transactions</span>
              <span className="text-lg font-bold text-blue-600">347</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Average Sale</span>
              <span className="text-lg font-bold text-purple-600">$28.39</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Items Sold</span>
              <span className="text-lg font-bold text-orange-600">1,247</span>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Selling Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Growth
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Bread - White</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">156</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$466.44</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+12%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Milk - 1L</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">98</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$342.02</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+8%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Apples - Red</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">67</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$334.33</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-3%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
