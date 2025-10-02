import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserIcon, 
  Cog6ToothIcon as SettingsIcon, 
  BuildingOfficeIcon as Building2, 
  CalculatorIcon as Calculator, 
  ShieldCheckIcon as Shield, 
  BellIcon as Bell, 
  SwatchIcon as Palette, 
  GlobeAltIcon as Globe, 
  BookmarkIcon as Save, 
  ArrowUpTrayIcon as Upload, 
  XMarkIcon as X, 
  PlusIcon as Plus, 
  PencilIcon as Edit, 
  TrashIcon as Trash2, 
  EyeIcon as Eye, 
  EyeSlashIcon as EyeOff,
  KeyIcon as Key, 
  EnvelopeIcon as Mail, 
  PhoneIcon as Phone, 
  MapPinIcon as MapPin, 
  CreditCardIcon as CreditCard, 
  PercentBadgeIcon as Percent, 
  CheckIcon as Check,
  ComputerDesktopIcon as Monitor, 
  MoonIcon as Moon, 
  SunIcon as Sun, 
  ArrowPathIcon as RefreshCw, 
  ArrowDownTrayIcon as Download, 
  ArchiveBoxIcon as Archive
} from '@heroicons/react/24/outline';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import { PageHeader } from '../components/shell/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { settingsAPI, masterDataAPI } from '../utils/api';

// Legacy mock API functions - TODO: Remove after full migration  
const legacySettingsAPI = {
  getUserProfile: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      phone: '+1 234 567 8900',
      avatar: null,
      role: 'manager',
      branch: 'main-store',
      address: '123 Business St, City, State 12345',
      dateJoined: '2023-01-15',
      lastLogin: '2024-01-15T10:30:00Z',
      permissions: ['manage_products', 'view_reports', 'manage_sales'],
      preferences: {
        theme: 'system',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          lowStock: true,
          salesAlerts: true
        },
        dashboard: {
          defaultView: 'overview',
          autoRefresh: true,
          refreshInterval: 300
        }
      }
    };
  },

  updateUserProfile: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },

  getSystemSettings: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      company: {
        name: 'SuperMart Solutions',
        address: '456 Corporate Blvd, Business City, State 54321',
        phone: '+1 555 123 4567',
        email: 'info@supermart.com',
        website: 'www.supermart.com',
        logo: null,
        taxId: 'TAX123456789'
      },
      currency: {
        code: 'INR',
        symbol: '₹',
        decimalPlaces: 2
      },
      tax: {
        defaultGstRate: 18,
        includeInPrice: false,
        categories: [
          { name: 'Food Items', rate: 5 },
          { name: 'Electronics', rate: 18 },
          { name: 'Clothing', rate: 12 }
        ]
      },
      receipt: {
        showLogo: true,
        showCompanyInfo: true,
        showTaxInfo: true,
        footerMessage: 'Thank you for shopping with us!',
        template: 'standard'
      },
      backup: {
        autoBackup: true,
        frequency: 'daily',
        retention: 30
      }
    };
  },

  updateSystemSettings: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },

  getBranches: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: 'main-store',
        name: 'Main Store',
        code: 'MS001',
        address: '123 Main St, City, State 12345',
        phone: '+1 234 567 8901',
        email: 'main@supermart.com',
        manager: 'John Doe',
        isActive: true,
        createdAt: '2023-01-01'
      },
      {
        id: 'downtown',
        name: 'Downtown Branch',
        code: 'DT002',
        address: '789 Downtown Ave, City, State 12345',
        phone: '+1 234 567 8902',
        email: 'downtown@supermart.com',
        manager: 'Jane Smith',
        isActive: true,
        createdAt: '2023-06-15'
      }
    ];
  },

  createBranch: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },

  updateBranch: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },

  getUsers: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@company.com',
        role: 'manager',
        branch: 'Main Store',
        isActive: true,
        lastLogin: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        role: 'cashier',
        branch: 'Downtown',
        isActive: true,
        lastLogin: '2024-01-14T16:45:00Z'
      }
    ];
  }
};

// Settings & Configuration Component
function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [toast, setToast] = useState(null);
  const { user } = useAuth();

  const queryClient = useQueryClient();

  // Queries
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: settingsAPI.getUserProfile,
    enabled: activeTab === 'profile'
  });

  const { data: systemSettings, isLoading: systemLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: legacySettingsAPI.getSystemSettings, // TODO: Create real system settings API
    enabled: activeTab === 'system' || activeTab === 'tax'
  });

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: masterDataAPI.getBranches,
    enabled: activeTab === 'branches'
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: legacySettingsAPI.getUsers, // TODO: Create user management API
    enabled: activeTab === 'users'
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: settingsAPI.updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile']);
      setToast({ type: 'success', message: 'Profile updated successfully' });
    },
    onError: () => {
      setToast({ type: 'error', message: 'Failed to update profile' });
    }
  });

  const updateSystemMutation = useMutation({
    mutationFn: legacySettingsAPI.updateSystemSettings, // TODO: Create real system settings API
    onSuccess: () => {
      queryClient.invalidateQueries(['system-settings']);
      setToast({ type: 'success', message: 'Settings updated successfully' });
    },
    onError: () => {
      setToast({ type: 'error', message: 'Failed to update settings' });
    }
  });

  const createBranchMutation = useMutation({
    mutationFn: masterDataAPI.createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries(['branches']);
      setShowBranchModal(false);
      setSelectedBranch(null);
      setToast({ type: 'success', message: 'Branch created successfully' });
    },
    onError: () => {
      setToast({ type: 'error', message: 'Failed to create branch' });
    }
  });

  // Tab configuration
  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'system', label: 'System', icon: SettingsIcon },
    { id: 'branches', label: 'Branches', icon: Building2 },
    { id: 'tax', label: 'Tax Config', icon: Calculator },
    { id: 'users', label: 'Users', icon: Shield }
  ];

  // Profile Tab
  const ProfileTab = () => {
    const [formData, setFormData] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
      if (userProfile) {
        setFormData(userProfile);
      }
    }, [userProfile]);

    const handleSubmit = (e) => {
      e.preventDefault();
      updateProfileMutation.mutate(formData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePreferenceChange = (category, field, value) => {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [category]: {
            ...prev.preferences[category],
            [field]: value
          }
        }
      }));
    };

    if (profileLoading) return <LoadingSpinner />;

    return (
      <div className="space-y-6">
        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  First Name
                </label>
                <Input
                  value={formData.firstName || ''}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Last Name
                </label>
                <Input
                  value={formData.lastName || ''}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone
                </label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Enter address"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Password</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Change your account password
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </div>
          </Card>

          {/* Preferences */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-6">Preferences</h3>
            
            <div className="space-y-6">
              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Theme
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'system', label: 'System', icon: Monitor }
                  ].map((theme) => {
                    const Icon = theme.icon;
                    return (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() => handlePreferenceChange('theme', 'theme', theme.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          formData.preferences?.theme === theme.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {theme.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notifications */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Notifications
                </label>
                <div className="space-y-3">
                  {[
                    { key: 'email', label: 'Email Notifications' },
                    { key: 'push', label: 'Push Notifications' },
                    { key: 'lowStock', label: 'Low Stock Alerts' },
                    { key: 'salesAlerts', label: 'Sales Alerts' }
                  ].map((notification) => (
                    <label key={notification.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferences?.notifications?.[notification.key] || false}
                        onChange={(e) => handlePreferenceChange('notifications', notification.key, e.target.checked)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                      />
                      {notification.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Dashboard */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Dashboard Settings
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Default View
                    </label>
                    <select
                      value={formData.preferences?.dashboard?.defaultView || 'overview'}
                      onChange={(e) => handlePreferenceChange('dashboard', 'defaultView', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                    >
                      <option value="overview">Overview</option>
                      <option value="sales">Sales</option>
                      <option value="inventory">Inventory</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferences?.dashboard?.autoRefresh || false}
                        onChange={(e) => handlePreferenceChange('dashboard', 'autoRefresh', e.target.checked)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                      />
                      Auto Refresh Dashboard
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </form>
      </div>
    );
  };

  // System Settings Tab
  const SystemTab = () => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
      if (systemSettings) {
        setFormData(systemSettings);
      }
    }, [systemSettings]);

    const handleSubmit = (e) => {
      e.preventDefault();
      updateSystemMutation.mutate(formData);
    };

    const handleCompanyChange = (field, value) => {
      setFormData(prev => ({
        ...prev,
        company: { ...prev.company, [field]: value }
      }));
    };

    if (systemLoading) return <LoadingSpinner />;

    return (
      <div className="space-y-6">
        <form onSubmit={handleSubmit}>
          {/* Company Information */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Company Information</h3>
              <Button type="submit" disabled={updateSystemMutation.isPending}>
                {updateSystemMutation.isPending ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Company Name
                </label>
                <Input
                  value={formData.company?.name || ''}
                  onChange={(e) => handleCompanyChange('name', e.target.value)}
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tax ID
                </label>
                <Input
                  value={formData.company?.taxId || ''}
                  onChange={(e) => handleCompanyChange('taxId', e.target.value)}
                  placeholder="Enter tax ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone
                </label>
                <Input
                  value={formData.company?.phone || ''}
                  onChange={(e) => handleCompanyChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.company?.email || ''}
                  onChange={(e) => handleCompanyChange('email', e.target.value)}
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Website
                </label>
                <Input
                  value={formData.company?.website || ''}
                  onChange={(e) => handleCompanyChange('website', e.target.value)}
                  placeholder="Enter website URL"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.company?.address || ''}
                  onChange={(e) => handleCompanyChange('address', e.target.value)}
                  placeholder="Enter company address"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                />
              </div>
            </div>
          </Card>

          {/* Currency & Receipt Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-6">Currency & Receipt Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency?.code || 'INR'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    currency: { ...prev.currency, code: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Receipt Template
                </label>
                <select
                  value={formData.receipt?.template || 'standard'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    receipt: { ...prev.receipt, template: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                >
                  <option value="standard">Standard</option>
                  <option value="thermal">Thermal Printer</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Receipt Footer Message
                </label>
                <Input
                  value={formData.receipt?.footerMessage || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    receipt: { ...prev.receipt, footerMessage: e.target.value }
                  }))}
                  placeholder="Thank you message"
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.receipt?.showLogo || false}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    receipt: { ...prev.receipt, showLogo: e.target.checked }
                  }))}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                Show company logo on receipts
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.receipt?.showCompanyInfo || false}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    receipt: { ...prev.receipt, showCompanyInfo: e.target.checked }
                  }))}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                Show company information
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.receipt?.showTaxInfo || false}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    receipt: { ...prev.receipt, showTaxInfo: e.target.checked }
                  }))}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                Show tax information
              </label>
            </div>
          </Card>

          {/* Backup Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-6">Backup Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={formData.backup?.autoBackup || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      backup: { ...prev.backup, autoBackup: e.target.checked }
                    }))}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  Enable automatic backups
                </label>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Backup Frequency
                  </label>
                  <select
                    value={formData.backup?.frequency || 'daily'}
                    disabled={!formData.backup?.autoBackup}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      backup: { ...prev.backup, frequency: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 disabled:opacity-50"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Retention Period (Days)
                </label>
                <Input
                  type="number"
                  value={formData.backup?.retention || 30}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    backup: { ...prev.backup, retention: parseInt(e.target.value) }
                  }))}
                  min="1"
                  max="365"
                />

                <div className="mt-4">
                  <Button type="button" variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Create Backup Now
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </form>
      </div>
    );
  };

  // Branches Tab
  const BranchesTab = () => {
    if (branchesLoading) return <LoadingSpinner />;

    const columns = [
      {
        accessorKey: 'name',
        header: 'Branch Name',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-slate-500">{row.original.code}</div>
          </div>
        )
      },
      {
        accessorKey: 'manager',
        header: 'Manager',
      },
      {
        accessorKey: 'phone',
        header: 'Contact',
        cell: ({ row }) => (
          <div>
            <div className="text-sm">{row.original.phone}</div>
            <div className="text-sm text-slate-500">{row.original.email}</div>
          </div>
        )
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge variant={getValue() ? 'success' : 'secondary'}>
            {getValue() ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedBranch(row.original);
                setShowBranchModal(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    ];

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Branch Management</h3>
            <Button
              variant="primary"
              onClick={() => {
                setSelectedBranch(null);
                setShowBranchModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.accessorKey || column.id}
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {branches?.map((branch) => (
                  <tr key={branch.id}>
                    {columns.map((column) => (
                      <td
                        key={column.accessorKey || column.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100"
                      >
                        {column.cell ? column.cell({ row: { original: branch }, getValue: () => branch[column.accessorKey] }) : branch[column.accessorKey]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'system':
        return <SystemTab />;
      case 'branches':
        return <BranchesTab />;
      case 'tax':
        return <div className="text-center py-12 text-slate-500">Tax Configuration Coming Soon</div>;
      case 'users':
        return <div className="text-center py-12 text-slate-500">User Management Coming Soon</div>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Configuration"
        description="Manage your profile, system settings, and business configuration"
      >
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </PageHeader>

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

      {/* Modals */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      <BranchModal
        isOpen={showBranchModal}
        onClose={() => {
          setShowBranchModal(false);
          setSelectedBranch(null);
        }}
        branch={selectedBranch}
        onSubmit={(data) => {
          if (selectedBranch) {
            // Update branch
          } else {
            createBranchMutation.mutate(data);
          }
        }}
        isLoading={createBranchMutation.isPending}
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

// Password Change Modal
function PasswordChangeModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Handle password change
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Current Password
          </label>
          <div className="relative">
            <Input
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Enter current password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            New Password
          </label>
          <div className="relative">
            <Input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Enter new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <Input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Change Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Branch Modal
function BranchModal({ isOpen, onClose, branch, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    manager: ''
  });

  useEffect(() => {
    if (branch) {
      setFormData(branch);
    } else {
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        manager: ''
      });
    }
  }, [branch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={branch ? 'Edit Branch' : 'Add Branch'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Branch Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter branch name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Branch Code
            </label>
            <Input
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="Enter branch code"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Enter branch address"
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Phone
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter phone number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter email"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Manager
          </label>
          <Input
            value={formData.manager}
            onChange={(e) => handleChange('manager', e.target.value)}
            placeholder="Enter manager name"
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : (branch ? 'Update Branch' : 'Create Branch')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default Settings;