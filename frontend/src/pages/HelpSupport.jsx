import React, { useState } from 'react';
import {
  QuestionMarkCircleIcon as HelpCircle,
  EnvelopeIcon as Mail,
  PhoneIcon as Phone,
  DocumentTextIcon as FileText,
  ChatBubbleLeftRightIcon as MessageCircle,
  ExclamationTriangleIcon as AlertCircle,
  CheckCircleIcon as CheckCircle
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/shell/PageHeader';
import { toast } from 'react-hot-toast';

function HelpSupport() {
  const [activeTab, setActiveTab] = useState('faq');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const faqs = [
    {
      question: 'How do I add a new product to the inventory?',
      answer: 'Navigate to the Products section, click "Add Product", fill in the required details (name, SKU, category, price, quantity), and click Save. You can also bulk import products using CSV files.'
    },
    {
      question: 'How can I manage multiple branches?',
      answer: 'Go to Settings > Branches to view, create, edit, or delete branches. Each branch can have its own inventory, users, and sales records. Only admins can manage branches.'
    },
    {
      question: 'What should I do if I forget my password?',
      answer: 'Contact your administrator to reset your password. Admins can deactivate and reactivate accounts in Settings > User Management.'
    },
    {
      question: 'How do I generate sales reports?',
      answer: 'Visit the Reports section to view various reports including daily sales, product performance, inventory status, and profit analysis. You can filter by date range and branch.'
    },
    {
      question: 'Can I export inventory data?',
      answer: 'Yes! In the Products section, click the Export button to download product data as CSV. This is useful for backups and analysis.'
    },
    {
      question: 'How do I set up low stock alerts?',
      answer: 'Go to Settings > System Settings and set the "Low Stock Alert Threshold". Products below this quantity will trigger alerts in the Inventory section.'
    },
    {
      question: 'What user roles are available?',
      answer: 'Available roles are: Admin (full access), Regional Manager (multi-branch), Store Manager (single branch), Inventory Manager, Cashier, and Viewer (read-only).'
    },
    {
      question: 'How do I record a sale?',
      answer: 'Go to Sales > New Sale, select products, enter quantities and prices, apply discounts if needed, and complete the transaction. The inventory updates automatically.'
    }
  ];

  const supportChannels = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us an email and we\'ll respond within 24 hours',
      contact: 'support@mumbaisupermart.com'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Call our support team during business hours',
      contact: '+91 22 1234 5678'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      contact: 'Available 9 AM - 6 PM IST'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Your message has been sent! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Support"
        description="Find answers to common questions and get support"
      />

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <nav className="-mb-px flex space-x-8 px-4">
          {[
            { id: 'faq', label: 'FAQ', icon: HelpCircle },
            { id: 'contact', label: 'Contact Us', icon: Mail },
            { id: 'documentation', label: 'Documentation', icon: FileText }
          ].map((tab) => {
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

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6">
                <div className="flex gap-4">
                  <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Contact Us Tab */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Support Channels */}
          <div className="lg:col-span-1 space-y-4">
            {supportChannels.map((channel, index) => {
              const Icon = channel.icon;
              return (
                <Card key={index} className="p-6">
                  <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                    {channel.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {channel.description}
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {channel.contact}
                  </p>
                </Card>
              );
            })}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-6">
                Send us a Message
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Name
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Your name"
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
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Subject
                  </label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    placeholder="What is this about?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full">
                  Send Message
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* Documentation Tab */}
      {activeTab === 'documentation' && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex gap-4">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Getting Started Guide
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Learn the basics of using the Mumbai Supermart Inventory Management System. This guide covers user roles, navigation, and core features.
                </p>
                <Button variant="outline" size="sm">
                  Read Guide
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex gap-4">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Product Management
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Comprehensive guide on managing products, categories, brands, and inventory. Includes bulk import/export procedures.
                </p>
                <Button variant="outline" size="sm">
                  Read Guide
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex gap-4">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Sales & Transactions
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Learn how to record sales, manage transactions, apply discounts, and generate receipts.
                </p>
                <Button variant="outline" size="sm">
                  Read Guide
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex gap-4">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Reports & Analytics
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Understand how to use reports for business insights. Includes daily reports, sales analysis, and profit tracking.
                </p>
                <Button variant="outline" size="sm">
                  Read Guide
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex gap-4">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  User Management & Permissions
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Guide for admins on managing users, assigning roles, setting permissions, and managing branches.
                </p>
                <Button variant="outline" size="sm">
                  Read Guide
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default HelpSupport;
