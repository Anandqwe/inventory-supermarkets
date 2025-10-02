# Part 7: How-to Recipes + Demo Script + FAQ + Glossary

## How-to Playbook (Step-by-Step Recipes)

### Recipe 1: Add a New Field to Product

**Scenario**: Add "expiryDate" field to track perishable items

**Step 1: Update Database Model** (`backend/src/models/Product.js`)
```javascript
// Find the existing schema around line 80-100
description: {
  type: String,
  trim: true,
  maxlength: [500, 'Description cannot exceed 500 characters']
},
// ADD THIS NEW FIELD:
expiryDate: {
  type: Date,
  required: false,
  index: true,
  validate: {
    validator: function(date) {
      return !date || date > new Date();
    },
    message: 'Expiry date must be in the future'
  }
},
isActive: {
  type: Boolean,
  default: true,
  index: true
}
```

**Step 2: Update Controller Validation** (`backend/src/controllers/productController.js`)
```javascript
// In the create product method, add validation
const { name, sku, costPrice, sellingPrice, expiryDate } = req.body;

// Add expiry date validation
if (expiryDate && new Date(expiryDate) <= new Date()) {
  return ResponseUtils.error(res, 'Expiry date must be in the future', 400);
}
```

**Step 3: Update Frontend Form** (`frontend/src/pages/Products.jsx`)
```jsx
// In the form state initialization
const [formData, setFormData] = useState({
  name: '',
  sku: '',
  costPrice: '',
  sellingPrice: '',
  expiryDate: '', // ADD NEW FIELD
  // ... other fields
});

// In the form JSX, add input field
<Input
  label="Expiry Date"
  name="expiryDate"
  type="date"
  value={formData.expiryDate}
  onChange={handleInputChange}
  helperText="Leave empty for non-perishable items"
/>
```

**Step 4: Update Table Display** (`frontend/src/pages/Products.jsx`)
```jsx
// In the columns definition
const columns = [
  { key: 'name', label: 'Product Name', sortable: true },
  { key: 'sku', label: 'SKU', sortable: true },
  { 
    key: 'expiryDate', 
    label: 'Expiry Date',
    render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
  },
  // ... other columns
];
```

### Recipe 2: Add a New API Endpoint

**Scenario**: Create endpoint to get low-stock products

**Step 1: Create Route** (`backend/src/routes/inventoryRoutes.js`)
```javascript
// Add to existing routes
router.get('/low-stock', 
  authenticateToken, 
  requirePermission('view_inventory'),
  inventoryController.getLowStockProducts
);
```

**Step 2: Create Controller Method** (`backend/src/controllers/inventoryController.js`)
```javascript
// Add this method to the existing controller class
static getLowStockProducts = asyncHandler(async (req, res) => {
  const { branch, limit = 50 } = req.query;
  
  // Build aggregation pipeline
  const pipeline = [
    {
      $match: {
        isActive: true,
        ...(branch && { 'stocks.branch': mongoose.Types.ObjectId(branch) })
      }
    },
    {
      $addFields: {
        hasLowStock: {
          $anyElementTrue: {
            $map: {
              input: '$stocks',
              as: 'stock',
              in: { $lte: ['$$stock.quantity', '$$stock.reorderLevel'] }
            }
          }
        }
      }
    },
    {
      $match: { hasLowStock: true }
    },
    {
      $limit: parseInt(limit)
    }
  ];
  
  const lowStockProducts = await Product.aggregate(pipeline);
  
  ResponseUtils.success(res, lowStockProducts, 'Low stock products retrieved');
});
```

**Step 3: Add Service Layer** (`backend/src/services/inventoryService.js` - create if not exists)
```javascript
class InventoryService {
  static async getLowStockProducts(branchId = null, limit = 50) {
    const filter = {
      isActive: true,
      $expr: {
        $anyElementTrue: {
          $map: {
            input: '$stocks',
            as: 'stock',
            in: {
              $and: [
                ...(branchId ? [{ $eq: ['$$stock.branch', branchId] }] : []),
                { $lte: ['$$stock.quantity', '$$stock.reorderLevel'] }
              ]
            }
          }
        }
      }
    };
    
    return await Product.find(filter)
      .populate('category', 'name')
      .populate('brand', 'name')
      .limit(limit)
      .lean();
  }
}

module.exports = InventoryService;
```

**Step 4: Add Validation Middleware** (`backend/src/middleware/validation.js`)
```javascript
const validateLowStockQuery = [
  query('branch').optional().isMongoId().withMessage('Invalid branch ID'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  handleValidationErrors
];
```

### Recipe 3: Add a New Page in React

**Scenario**: Create "Suppliers" management page

**Step 1: Create Page Component** (`frontend/src/pages/Suppliers.jsx`)
```jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Table, Modal, Input, EmptyState } from '../components/ui';
import { supplierAPI } from '../utils/api';
import { toast } from 'react-hot-toast';

function Suppliers() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', contact: '', email: '' });
  const queryClient = useQueryClient();
  
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: supplierAPI.getAll
  });
  
  const createSupplierMutation = useMutation({
    mutationFn: supplierAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      setShowModal(false);
      setFormData({ name: '', contact: '', email: '' });
      toast.success('Supplier created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create supplier');
    }
  });
  
  const columns = [
    { key: 'name', label: 'Supplier Name', sortable: true },
    { key: 'contact', label: 'Contact', sortable: false },
    { key: 'email', label: 'Email', sortable: false },
    { 
      key: 'actions', 
      label: 'Actions',
      render: (_, supplier) => (
        <Button variant="outline" size="sm">Edit</Button>
      )
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <Button onClick={() => setShowModal(true)}>Add Supplier</Button>
      </div>
      
      <Table 
        columns={columns}
        data={suppliers?.data || []}
        loading={isLoading}
        emptyState={<EmptyState title="No suppliers found" />}
      />
      
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Supplier"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          createSupplierMutation.mutate(formData);
        }}>
          <div className="space-y-4">
            <Input
              label="Supplier Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <Input
              label="Contact Number"
              value={formData.contact}
              onChange={(e) => setFormData({...formData, contact: e.target.value})}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createSupplierMutation.isLoading}>
                Create Supplier
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Suppliers;
```

**Step 2: Add Route** (`frontend/src/App.jsx`)
```jsx
// Import the new page
const Suppliers = React.lazy(() => import('./pages/Suppliers'));

// Add route in the Routes component
<Route path="/suppliers" element={<Suppliers />} />
```

**Step 3: Add Sidebar Link** (`frontend/src/components/shell/Sidebar.jsx`)
```jsx
// In the navigation items array
const navigationItems = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Products', href: '/products', icon: PackageIcon },
  { name: 'Sales', href: '/sales', icon: ShoppingCartIcon },
  { name: 'Suppliers', href: '/suppliers', icon: TruckIcon }, // ADD THIS
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
];
```

### Recipe 4: Change Chart to Show 30/90 Days

**Step 1: Update Backend Controller** (`backend/src/controllers/dashboardController.js`)
```javascript
// Find the sales chart method and modify
static getSalesChart = asyncHandler(async (req, res) => {
  const { period = '7d' } = req.query; // ADD QUERY PARAM SUPPORT
  
  // Calculate date range based on period
  const periodDays = {
    '7d': 7,
    '30d': 30,
    '90d': 90
  };
  
  const days = periodDays[period] || 7;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const salesData = await Sale.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalSales: { $sum: '$total' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
  
  ResponseUtils.success(res, salesData, 'Sales chart data retrieved');
});
```

**Step 2: Update Frontend Component** (`frontend/src/pages/Dashboard.jsx`)
```jsx
// Add period state
const [chartPeriod, setChartPeriod] = useState('7d');

// Update query to include period
const { data: chartData } = useQuery({
  queryKey: ['sales-chart', chartPeriod],
  queryFn: () => dashboardAPI.getSalesChart(chartPeriod)
});

// Add period selector in JSX
<div className="flex justify-between items-center mb-4">
  <h3 className="text-lg font-semibold">Sales Trend</h3>
  <div className="flex space-x-2">
    {['7d', '30d', '90d'].map(period => (
      <Button
        key={period}
        variant={chartPeriod === period ? 'primary' : 'outline'}
        size="sm"
        onClick={() => setChartPeriod(period)}
      >
        {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
      </Button>
    ))}
  </div>
</div>
```

### Recipe 5: Add CSV Import Button

**Step 1: Add Frontend Upload Component** (`frontend/src/pages/Products.jsx`)
```jsx
// Add import state
const [showImportModal, setShowImportModal] = useState(false);
const [importFile, setImportFile] = useState(null);

// Add import mutation
const importProductsMutation = useMutation({
  mutationFn: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return productAPI.importCSV(formData);
  },
  onSuccess: (response) => {
    queryClient.invalidateQueries(['products']);
    setShowImportModal(false);
    toast.success(`Imported ${response.data.imported} products successfully`);
  }
});

// Add import button in JSX
<div className="flex justify-between items-center">
  <h1 className="text-2xl font-bold">Products</h1>
  <div className="space-x-2">
    <Button variant="outline" onClick={() => setShowImportModal(true)}>
      Import CSV
    </Button>
    <Button onClick={() => setShowAddModal(true)}>Add Product</Button>
  </div>
</div>

// Add import modal
<Modal
  isOpen={showImportModal}
  onClose={() => setShowImportModal(false)}
  title="Import Products from CSV"
>
  <div className="space-y-4">
    <input
      type="file"
      accept=".csv"
      onChange={(e) => setImportFile(e.target.files[0])}
      className="block w-full"
    />
    <div className="flex justify-end space-x-2">
      <Button variant="outline" onClick={() => setShowImportModal(false)}>
        Cancel
      </Button>
      <Button 
        onClick={() => importProductsMutation.mutate(importFile)}
        disabled={!importFile}
        loading={importProductsMutation.isLoading}
      >
        Import
      </Button>
    </div>
  </div>
</Modal>
```

**Step 2: Add Backend Endpoint** (`backend/src/routes/productRoutes.js`)
```javascript
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/import-csv', 
  authenticateToken,
  requirePermission('manage_products'),
  upload.single('file'),
  productController.importFromCSV
);
```

**Step 3: Add Controller Method** (`backend/src/controllers/productController.js`)
```javascript
const csv = require('csv-parser');
const fs = require('fs');

static importFromCSV = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ResponseUtils.error(res, 'No file uploaded', 400);
  }
  
  const results = [];
  const errors = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      let imported = 0;
      
      for (const row of results) {
        try {
          // Validate required fields
          if (!row.name || !row.sku || !row.costPrice) {
            errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
            continue;
          }
          
          // Create product
          await Product.create({
            name: row.name,
            sku: row.sku,
            costPrice: parseFloat(row.costPrice),
            sellingPrice: parseFloat(row.sellingPrice),
            category: await Category.findOne({ name: row.category }),
            // ... other fields
          });
          
          imported++;
        } catch (error) {
          errors.push(`Failed to import ${row.name}: ${error.message}`);
        }
      }
      
      // Cleanup uploaded file
      fs.unlinkSync(req.file.path);
      
      ResponseUtils.success(res, { 
        imported, 
        errors: errors.slice(0, 10) // Limit error list
      }, `Import completed: ${imported} products imported`);
    });
});
```

---

## 2-Minute Demo Script

**Professional Demo Walkthrough** (College-friendly talking points)

### Opening (15 seconds)
*"Today I'll demonstrate our comprehensive supermarket inventory management system built with modern web technologies. This system handles the complete retail workflow from product management to sales processing and business analytics."*

### 1. Dashboard Overview (20 seconds)
*"Starting with our dashboard, we can see real-time business metrics:"*
- **Point to KPIs**: "Today's sales of ₹15,750, total inventory of 1,247 products"
- **Point to Chart**: "7-day sales trend showing consistent growth"
- **Point to Alerts**: "23 low-stock items requiring attention"

**Professional Note**: *"The dashboard uses Chart.js for visualization and React Query for real-time data updates."*

### 2. Product Management (25 seconds)
*"Let's examine our product catalog:"*
- **Search**: Type "Amul" in search → "Real-time search across 1200+ products"
- **Show Low Stock Badge**: Point to red badges → "Visual indicators for inventory alerts" 
- **Click Product**: "Each product has unique SKU, barcode, and multi-branch stock tracking"

**Professional Note**: *"The system supports Indian retail requirements with ₹ INR pricing and category-wise GST rates."*

### 3. POS Sales Transaction (30 seconds)
*"Now the core functionality - processing a sale:"*
- **Add Products**: Scan/add "Amul Milk" + "Tata Tea" → "Barcode scanning integrated"
- **Show Cart**: "Line items with automatic total calculation"
- **Process Payment**: Select "Cash" → "Multiple payment methods supported"
- **Complete Sale**: Click "Complete Sale" → "Real-time stock deduction"

**Professional Note**: *"The system uses MongoDB transactions to ensure data consistency - if payment fails, stock is automatically restored."*

### 4. Invoice & Receipt (15 seconds)
*"Immediately after sale completion:"*
- **Show Invoice**: "Professional invoice with GST breakdown"
- **Point to Tax Summary**: "Automatic CGST/SGST calculation for Indian compliance"
- **Print Option**: "Receipt ready for thermal printer"

### 5. Reports & Analytics (15 seconds)
*"Finally, business intelligence:"*
- **Click Reports**: "Comprehensive analytics dashboard"
- **Generate PDF**: "Today's Sales Report" → "Professional PDF generation"
- **Show Email**: "Automated email delivery to stakeholders"

**Professional Note**: *"Reports use MongoDB aggregation pipelines for efficient data processing and jsPDF for client-side PDF generation."*

### Closing (10 seconds)
*"This system demonstrates modern full-stack development with React frontend, Node.js backend, MongoDB database, and production-ready features like JWT authentication, role-based access control, and comprehensive audit logging."*

**Key Metrics to Mention**:
- "1200+ sample products across Indian retail categories"
- "Real-time inventory tracking with automatic alerts"
- "GST-compliant invoicing for Indian businesses"
- "Complete audit trail for regulatory compliance"

---

## FAQ & Troubleshooting

### Authentication Issues

**Q: JWT Token Expired / 401 Loop**
- **Symptom**: Continuous redirects to login page, "Token expired" errors
- **Fix**: Check `backend/.env` JWT_SECRET matches frontend expectations
- **File to Check**: `frontend/src/utils/api.js` response interceptor
- **Quick Fix**: Clear localStorage: `localStorage.clear()` in browser console

**Q: CORS Error - "Access Blocked"**
- **Symptom**: Network errors, "CORS policy" in console
- **Fix**: Verify `FRONTEND_URL` in `backend/.env` matches actual frontend URL
- **File to Check**: `backend/app.js` corsOptions configuration
- **Quick Fix**: Set `FRONTEND_URL=http://localhost:5173` in backend .env

### Database Issues

**Q: MongoDB Connection Failed**
- **Symptom**: "MongoDB connection failed" in backend logs
- **Fix**: Check `MONGODB_URI` in `backend/.env` - verify username/password/cluster
- **File to Check**: `backend/app.js` mongoose.connect()
- **Quick Fix**: Test connection with MongoDB Compass using same URI

**Q: "Stock Went Negative" Error**
- **Symptom**: 422 error when processing sales, "Insufficient stock" message
- **Fix**: Check product stock levels in database, verify transaction rollback
- **File to Check**: `backend/src/controllers/salesController.js` transaction logic
- **Debug**: Check `products.stocks[].quantity` field in MongoDB

### Frontend Issues

**Q: Chart Empty / No Data Showing**
- **Symptom**: Dashboard charts show empty or loading indefinitely
- **Fix**: Check browser network tab for API errors, verify data format
- **File to Check**: `frontend/src/pages/Dashboard.jsx` Chart.js configuration
- **Quick Fix**: Seed sample data: `npm run seed` in backend

**Q: Modal/Form Not Opening**
- **Symptom**: Buttons not responding, modals not appearing
- **Fix**: Check console for JavaScript errors, verify state management
- **File to Check**: Component state hooks and Modal component props
- **Debug**: Add `console.log` in button onClick handlers

### PDF/Export Issues

**Q: PDF Reports Blank/Empty**
- **Symptom**: PDF downloads but shows empty pages
- **Fix**: Check data availability and jsPDF configuration
- **File to Check**: `backend/src/controllers/reportsController.js` PDF generation
- **Quick Fix**: Test with sample data, check date range filters

**Q: Email Reports Not Sending**
- **Symptom**: "Email sent" success but no email received
- **Fix**: Verify SMTP configuration and Gmail app password
- **File to Check**: `backend/src/utils/emailService.js` transporter config
- **Debug**: Check `backend/logs/error.log` for SMTP errors

### Performance Issues

**Q: Slow API Responses**
- **Symptom**: Long loading times, timeouts
- **Fix**: Check database indexes, optimize queries with .lean()
- **File to Check**: `backend/scripts/createIndexes.js` and controller queries
- **Quick Fix**: Run `npm run db:indexes` to create missing indexes

**Q: Frontend App Slow/Laggy**
- **Symptom**: UI freezing, slow navigation
- **Fix**: Check bundle size, implement lazy loading
- **File to Check**: `frontend/src/App.jsx` lazy imports
- **Debug**: Use browser Performance tab to identify bottlenecks

---

## Glossary (Non-Technical)

**SKU (Stock Keeping Unit)**: Unique identifier for each product (e.g., "DAI-AMUL-1001" = Dairy-Amul-Product 1001). Used for inventory tracking and sales processing.

**HSN Code**: Harmonized System of Nomenclature - 4-8 digit code for product classification required for GST compliance in India.

**GST (Goods and Services Tax)**: Indian tax system with different rates (0%, 5%, 12%, 18%, 28%) based on product categories.

**CGST/SGST**: Central GST + State GST applied for intrastate sales (buyer and seller in same state). Combined rate equals GST rate.

**IGST**: Integrated GST applied for interstate sales (buyer and seller in different states). Single tax equal to full GST rate.

**MRP vs Cost**: Maximum Retail Price (customer pays) vs Cost Price (what store paid supplier). Difference is gross profit.

**Reorder Level**: Minimum stock quantity that triggers "low stock" alert. When current stock ≤ reorder level, purchasing is needed.

**POS (Point of Sale)**: The transaction processing interface where cashiers scan products and collect payment from customers.

**Audit Log**: Permanent record of all system activities (who did what, when) for security and compliance purposes.

**Seed Data**: Sample/demo data inserted into database for testing and demonstration purposes.

**Idempotency**: Property where running the same operation multiple times produces the same result. Important for seed scripts and API calls.

**JWT (JSON Web Token)**: Secure way to transmit user authentication information between frontend and backend without storing sessions.

**MongoDB Transaction**: Database feature ensuring multiple operations either all succeed or all fail together (prevents data inconsistency).

**React Query**: Library for managing server data in React apps - handles caching, synchronization, and background updates automatically.

**API Pagination**: Breaking large datasets into smaller pages (e.g., 20 products per page) for better performance and user experience.

---

## Understanding Checklist

**Tick each item to confirm you understand the system:**

- [ ] **Architecture**: I understand how React frontend communicates with Node.js backend via JWT-authenticated APIs
- [ ] **Data Flow**: I know how product creation → stock tracking → sales processing → reporting works end-to-end
- [ ] **Authentication**: I can explain how JWT tokens are generated, stored, and validated for user sessions
- [ ] **Database Design**: I understand the relationships between User, Product, Sale, Category, and Branch models
- [ ] **API Structure**: I know how to find and test any endpoint using the consistent response format
- [ ] **Frontend Components**: I can locate and modify reusable UI components like Button, Modal, Table
- [ ] **Business Logic**: I understand how stock deduction, low-stock alerts, and GST calculations work
- [ ] **Extension Points**: I know where to edit code to add new fields, endpoints, or pages
- [ ] **Testing**: I can run existing tests and write new ones following the established patterns
- [ ] **Deployment**: I understand the environment variables and can set up the system locally

**If you checked all items, you're ready to maintain and extend this system! 🚀**

---

**This completes the comprehensive Owner's Manual. You now have a complete guide to understand, maintain, and extend the Supermarket Inventory & Sales Management System.**

---

## Navigation

**← Previous**: [Testing + Performance + Operations](06-testing-performance-ops.md)  
**→ Next**: [Table of Contents](README.md)