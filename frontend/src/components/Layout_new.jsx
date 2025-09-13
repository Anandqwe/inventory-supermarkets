import { Outlet, Link, useNavigate, Navigate } from 'react-router-dom'
import { 
  Home, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  LogOut,
  Menu,
  User,
  AlertTriangle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import { productsAPI } from '../utils/api'
import Badge from './Badge'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    // Fetch low stock count
    const fetchLowStockCount = async () => {
      try {
        const response = await productsAPI.getLowStock();
        setLowStockCount(response.data?.length || 0);
      } catch (error) {
        console.error('Error fetching low stock count:', error);
      }
    };

    fetchLowStockCount();
    // Refresh every 5 minutes
    const interval = setInterval(fetchLowStockCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Products', href: '/products', icon: Package, badge: lowStockCount > 0 ? lowStockCount : null },
    { name: 'Sales', href: '/sales', icon: ShoppingCart },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ]

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center h-16 bg-orange-600">
          <h1 className="text-xl font-bold text-white">Inventory System</h1>
        </div>
        <nav className="mt-8">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center justify-between px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-orange-600"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center">
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </div>
                {item.badge && (
                  <Badge variant="danger" size="xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>
        
        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <div className="mx-4 mt-8 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">
                {lowStockCount} item{lowStockCount > 1 ? 's' : ''} low on stock
              </p>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-700">{user?.firstName} {user?.lastName}</span>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-6 py-4 bg-white shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800">Supermarket Inventory System</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-700">{user?.firstName} {user?.lastName}</span>
              <Badge variant="info" size="xs">{user?.role}</Badge>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black opacity-25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default Layout
