import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  UserIcon, 
  Cog6ToothIcon as SettingsIcon, 
  BuildingOfficeIcon as Building2, 
  ShieldCheckIcon as Shield, 
  BellIcon as Bell, 
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
  CheckIcon as Check,
  ComputerDesktopIcon as Monitor, 
  MoonIcon as Moon, 
  SunIcon as Sun, 
  ArrowPathIcon as RefreshCw, 
  BookmarkIcon as Save,
  UserPlusIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PageHeader } from '../components/shell/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { settingsAPI, masterDataAPI, authAPI } from '../utils/api';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';


// Settings & Configuration Component
function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if user has admin/manager permissions (case-insensitive)
  // Roles: Admin, Regional Manager, Store Manager, Inventory Manager, Cashier, Viewer
  const userRole = user?.role?.toLowerCase();
  const canManageUsers = userRole === 'admin' || userRole?.includes('manager');
  const isAdmin = userRole === 'admin';

  // Queries
  const { data: userProfile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      console.log('Fetching user profile...');
      const result = await settingsAPI.getUserProfile();
      console.log('User profile data:', result);
      return result;
    },
    enabled: activeTab === 'profile'
  });

  const { data: branchesData, isLoading: branchesLoading, refetch: refetchBranches } = useQuery({
    queryKey: ['branches-all'],
    queryFn: async () => {
      console.log('Fetching branches...');
      const result = await masterDataAPI.getBranches({ limit: 100 });
      console.log('Branches data:', result);
      return result;
    },
    enabled: activeTab === 'branches'
  });

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['users-all'],
    queryFn: async () => {
      console.log('Fetching users...');
      const result = await authAPI.getAllUsers();
      console.log('Users data:', result);
      return result;
    },
    enabled: activeTab === 'users' && canManageUsers
  });

  const branches = branchesData?.data || [];
  const users = usersData?.data || [];

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data) => {
      console.log('Updating profile with data:', data);
      return settingsAPI.updateUserProfile(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile']);
      toast.success('Profile updated successfully');
      console.log('Profile update successful');
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  const createBranchMutation = useMutation({
    mutationFn: (data) => {
      console.log('Creating branch with data:', data);
      return masterDataAPI.createBranch(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['branches-all']);
      setShowBranchModal(false);
      setSelectedBranch(null);
      toast.success('Branch created successfully');
      console.log('Branch created successfully');
    },
    onError: (error) => {
      console.error('Branch creation error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create branch');
    }
  });

  const updateBranchMutation = useMutation({
    mutationFn: ({ id, data }) => {
      console.log('Updating branch ID:', id, 'with data:', data);
      return masterDataAPI.updateBranch(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['branches-all']);
      setShowBranchModal(false);
      setSelectedBranch(null);
      toast.success('Branch updated successfully');
      console.log('Branch updated successfully');
    },
    onError: (error) => {
      console.error('Branch update error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update branch');
    }
  });

  const deleteBranchMutation = useMutation({
    mutationFn: (id) => {
      console.log('Deleting branch ID:', id);
      return masterDataAPI.deleteBranch(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['branches-all']);
      toast.success('Branch deleted successfully');
      console.log('Branch deleted successfully');
    },
    onError: (error) => {
      console.error('Branch deletion error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to delete branch');
    }
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: (userId) => {
      console.log('Toggling status for user ID:', userId);
      return authAPI.toggleUserStatus(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users-all']);
      toast.success('User status updated successfully');
      console.log('User status toggled successfully');
    },
    onError: (error) => {
      console.error('Toggle user status error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  });

  // Tab configuration
  const tabs = [
    { id: 'profile', label: 'My Profile', icon: UserIcon, show: true },
    { id: 'system', label: 'System Settings', icon: SettingsIcon, show: isAdmin },
    { id: 'branches', label: 'Branches', icon: Building2, show: canManageUsers },
    { id: 'users', label: 'User Management', icon: Shield, show: canManageUsers }
  ].filter(tab => tab.show);


  // Profile Tab
  const ProfileTab = () => {
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: ''
    });

    useEffect(() => {
      if (userProfile?.data) {
        setFormData({
          firstName: userProfile.data.firstName || '',
          lastName: userProfile.data.lastName || '',
          email: userProfile.data.email || '',
          phone: userProfile.data.phone || '',
          address: userProfile.data.address || ''
        });
      }
    }, [userProfile]);

    const handleSubmit = (e) => {
      e.preventDefault();
      // Only send fields that can be updated (exclude email)
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address
      };
      updateProfileMutation.mutate(updateData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (profileLoading) {
      return (
        <div className="space-y-6">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      );
    }

    const profile = userProfile?.data;

    return (
      <div className="space-y-6">
        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  Personal Information
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Update your personal details and contact information
                </p>
              </div>
              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
                className="flex items-center gap-2"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  First Name
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Last Name
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Enter last name"
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
                  placeholder="Enter email"
                  disabled
                  className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Email cannot be changed. Contact an administrator if needed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 9876543210 or 9876543210"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Indian mobile number (10 digits). Formats: 9876543210, +91 9876543210
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Enter address"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </Card>

          {/* Account Information */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-6">
              Account Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 capitalize">
                    {profile?.role || 'N/A'}
                  </p>
                </div>
                <Badge variant={
                  profile?.role?.toLowerCase() === 'admin' ? 'primary' : 
                  profile?.role?.toLowerCase().includes('manager') ? 'warning' : 
                  'secondary'
                }>
                  {profile?.role?.toUpperCase() || 'N/A'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Branch</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {profile?.branch?.name || 'N/A'}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {profile?.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <Badge variant={profile?.isActive ? 'success' : 'secondary'}>
                  {profile?.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Login</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {profile?.lastLogin 
                      ? new Date(profile.lastLogin).toLocaleString() 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">Security</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Change your account password to keep your account secure
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center gap-2"
                >
                  <Key className="h-4 w-4" />
                  Change Password
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    );
  };


  // System Settings Tab
  const SystemTab = () => {
    const [formData, setFormData] = useState({
      companyName: 'Mumbai Supermart',
      companyAddress: '123 Business Street, Mumbai, Maharashtra 400001',
      companyPhone: '+91 22 1234 5678',
      companyEmail: 'info@mumbaisupermart.com',
      companyWebsite: 'www.mumbaisupermart.com',
      taxId: 'GST123456789',
      currency: 'INR',
      defaultGstRate: 18,
      lowStockThreshold: 10,
      receiptFooter: 'Thank you for shopping with us! Visit again!',
      emailNotifications: true,
      lowStockAlerts: true,
      autoBackup: true,
      backupFrequency: 'daily'
    });

    const [saving, setSaving] = useState(false);

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
      
      // Simulate API call (replace with actual API when backend is ready)
      setTimeout(() => {
        toast.success('System settings saved successfully');
        setSaving(false);
      }, 1000);
    };

    return (
      <div className="space-y-6">
        <form onSubmit={handleSubmit}>
          {/* Company Information */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Company Information
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Configure your company details and contact information
                </p>
              </div>
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Company Name
                </label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  GST/Tax ID
                </label>
                <Input
                  value={formData.taxId}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                  placeholder="Enter GST/Tax ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone Number
                </label>
                <Input
                  value={formData.companyPhone}
                  onChange={(e) => handleChange('companyPhone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => handleChange('companyEmail', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Website
                </label>
                <Input
                  value={formData.companyWebsite}
                  onChange={(e) => handleChange('companyWebsite', e.target.value)}
                  placeholder="www.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Company Address
                </label>
                <textarea
                  value={formData.companyAddress}
                  onChange={(e) => handleChange('companyAddress', e.target.value)}
                  placeholder="Enter complete address"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </Card>

          {/* Business Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Business Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Default GST Rate (%)
                </label>
                <Input
                  type="number"
                  value={formData.defaultGstRate}
                  onChange={(e) => handleChange('defaultGstRate', parseFloat(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Default tax rate applied to products (can be overridden per product)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Low Stock Alert Threshold
                </label>
                <Input
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value))}
                  min="1"
                  max="1000"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Alert when product quantity falls below this number
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Receipt Footer Message
                </label>
                <Input
                  value={formData.receiptFooter}
                  onChange={(e) => handleChange('receiptFooter', e.target.value)}
                  placeholder="Thank you message for receipts"
                  maxLength={100}
                />
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Notification Settings
            </h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">Email Notifications</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Receive general system notifications via email
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">Low Stock Alerts</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Get notified when products are running low
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.lowStockAlerts}
                  onChange={(e) => handleChange('lowStockAlerts', e.target.checked)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
              </label>
            </div>
          </Card>

          {/* Backup Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Backup & Data Management
            </h3>

            <div className="space-y-6">
              <label className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">Automatic Backups</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Enable scheduled automatic database backups
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoBackup}
                  onChange={(e) => handleChange('autoBackup', e.target.checked)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
              </label>

              {formData.autoBackup && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Backup Frequency
                  </label>
                  <select
                    value={formData.backupFrequency}
                    onChange={(e) => handleChange('backupFrequency', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button type="button" variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Create Backup Now
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    );
  };

  // Branches Tab
  const BranchesTab = () => {
    const handleEdit = (branch) => {
      setSelectedBranch(branch);
      setShowBranchModal(true);
    };

    const handleDelete = async (branchId) => {
      if (window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
        deleteBranchMutation.mutate(branchId);
      }
    };

    if (branchesLoading) {
      return (
        <div className="space-y-4">
          <Skeleton variant="card" />
          <Skeleton variant="table" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Branch Management
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage store locations across different cities
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setSelectedBranch(null);
                setShowBranchModal(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Branch
            </Button>
          </div>

          {branches.length === 0 ? (
            <EmptyState
              title="No branches found"
              description="Create your first branch to start managing multiple store locations"
              icon={Building2}
              action={
                <Button
                  onClick={() => {
                    setSelectedBranch(null);
                    setShowBranchModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Branch
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Branch Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {branches.map((branch) => (
                    <tr key={branch._id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {branch.name}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {branch.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 dark:text-slate-100">
                          {branch.phone}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {branch.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary">
                          {branch.type || 'Supermarket'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={branch.isActive ? 'success' : 'secondary'}>
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(branch)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(branch._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  };


  // Users Tab
  const UsersTab = () => {
    const handleToggleStatus = async (userId) => {
      if (window.confirm('Are you sure you want to change this user\'s status?')) {
        toggleUserStatusMutation.mutate(userId);
      }
    };

    if (usersLoading) {
      return (
        <div className="space-y-4">
          <Skeleton variant="card" />
          <Skeleton variant="table" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                User Management
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage user accounts, roles, and permissions
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-2"
            >
              <UserPlusIcon className="h-4 w-4" />
              Add User
            </Button>
          </div>

          {users.length === 0 ? (
            <EmptyState
              title="No users found"
              description="Add users to manage access to the system"
              icon={Shield}
              action={
                <Button onClick={() => setShowUserModal(true)}>
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Add First User
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={
                            user.role?.toLowerCase() === 'admin' ? 'primary' : 
                            user.role?.toLowerCase().includes('manager') ? 'warning' : 
                            'secondary'
                          }
                        >
                          {user.role?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {user.branch?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={user.isActive ? 'success' : 'secondary'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString() 
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin && user._id !== userProfile?.data?._id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(user._id)}
                              className={user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
      case 'users':
        return <UsersTab />;
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
        <Button 
          variant="outline"
          onClick={() => {
            refetchProfile();
            refetchBranches();
            refetchUsers();
          }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <nav className="-mb-px flex space-x-8 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="px-4">
        {renderTabContent()}
      </div>

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
            updateBranchMutation.mutate({ id: selectedBranch._id, data });
          } else {
            createBranchMutation.mutate(data);
          }
        }}
        isLoading={createBranchMutation.isPending || updateBranchMutation.isPending}
      />
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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await settingsAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      toast.success('Password changed successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
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
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
              placeholder="Enter new password (min 8 characters)"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Changing...
              </>
            ) : (
              'Change Password'
            )}
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
    type: 'Supermarket',
    manager: '',
    isActive: true
  });

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        code: branch.code || '',
        address: branch.address || '',
        phone: branch.phone || '',
        email: branch.email || '',
        type: branch.type || 'Supermarket',
        manager: branch.manager || '',
        isActive: branch.isActive !== undefined ? branch.isActive : true
      });
    } else {
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        type: 'Supermarket',
        manager: '',
        isActive: true
      });
    }
  }, [branch, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={branch ? 'Edit Branch' : 'Add New Branch'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Mumbai Central"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Branch Code <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder="e.g., MUM001"
              required
              maxLength={10}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
            required
          >
            <option value="Hypermarket">Hypermarket</option>
            <option value="Supermarket">Supermarket</option>
            <option value="Convenience Store">Convenience Store</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Enter complete branch address"
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+91 XXXXXXXXXX"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="branch@company.com"
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
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
          />
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Active Branch
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                {branch ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{branch ? 'Update Branch' : 'Create Branch'}</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default Settings;