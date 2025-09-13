import { BarChart3, Package, ShoppingCart, AlertTriangle } from 'lucide-react'

function Dashboard() {
  const stats = [
    { name: 'Total Products', value: '2,651', icon: Package, change: '+4.75%', changeType: 'positive' },
    { name: 'Low Stock Items', value: '23', icon: AlertTriangle, change: '+2', changeType: 'negative' },
    { name: 'Today\'s Sales', value: '₹1,02,450', icon: ShoppingCart, change: '+12.02%', changeType: 'positive' },
    { name: 'Monthly Revenue', value: '₹20,35,400', icon: BarChart3, change: '+8.4%', changeType: 'positive' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back! Here's what's happening at your store today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {item.value}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          item.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                <div className="font-medium text-gray-900">Add New Product</div>
                <div className="text-sm text-gray-500">Add a new item to inventory</div>
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                <div className="font-medium text-gray-900">Record Sale</div>
                <div className="text-sm text-gray-500">Process a new sale transaction</div>
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                <div className="font-medium text-gray-900">Generate Report</div>
                <div className="text-sm text-gray-500">Create inventory or sales report</div>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Low Stock Alert
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-red-200 rounded-md bg-red-50">
                <div>
                  <div className="font-medium text-red-900">Bread - White</div>
                  <div className="text-sm text-red-600">Only 5 units left</div>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex items-center justify-between p-3 border border-yellow-200 rounded-md bg-yellow-50">
                <div>
                  <div className="font-medium text-yellow-900">Milk - 1L</div>
                  <div className="text-sm text-yellow-600">12 units remaining</div>
                </div>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
