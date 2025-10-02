# Part 4: Frontend UX Guide & Security

## Frontend UX Guide

### App Shell Architecture

**Layout Structure (`frontend/src/components/shell/`):**
```
┌─────────────────────────────────────┐
│ TopBar (User menu, notifications)   │ ← AppHeader.jsx
├─────────────────┬───────────────────┤
│ Sidebar         │ Main Content      │
│ - Dashboard     │ ┌───────────────┐ │
│ - Products      │ │ Page Content  │ │ ← Dynamic routes
│ - Sales         │ │               │ │
│ - Inventory     │ └───────────────┘ │
│ - Reports       │ Breadcrumbs       │ ← Navigation.jsx
│ - Settings      │                   │
└─────────────────┴───────────────────┘
```

**Key Components:**
- **AppShell** (`frontend/src/components/shell/AppShell.jsx`): Main layout wrapper with sidebar + content
- **Sidebar** (`frontend/src/components/shell/Sidebar.jsx`): Navigation menu with role-based visibility
- **TopBar**: User profile, notifications, logout button
- **Breadcrumbs**: Dynamic page navigation trail

### Protected Routes Implementation

**Route Guard Pattern (`frontend/src/App.jsx`):**
```jsx
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return (
    <ErrorBoundary>
      <AppShell>{children}</AppShell>
    </ErrorBoundary>
  );
}
```

**JWT Storage & Axios Integration:**
- **Storage**: `localStorage.setItem('token', jwt)` in `AuthContext.jsx`
- **Axios Interceptor** (`frontend/src/utils/api.js`):
  ```javascript
  // Automatic token attachment
  api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Auto-logout on 401
  api.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
  ```

### Reusable Component Library

**Design System Components (`frontend/src/components/ui/`):**

**Button Component** - Variant-based styling
```jsx
// Usage examples
<Button variant="primary" size="lg">Save Product</Button>
<Button variant="danger" onClick={handleDelete}>Delete</Button>
<Button variant="ghost" disabled={loading}>Cancel</Button>

// File: frontend/src/components/ui/Button.jsx
// Variants: primary, secondary, danger, ghost, outline
// Sizes: sm, md, lg
```

**Input Component** - Form field with validation
```jsx
// Usage with validation
<Input
  label="Product Name"
  name="name"
  value={formData.name}
  onChange={handleChange}
  error={errors.name}
  helperText="Enter unique product name"
  required
/>

// File: frontend/src/components/ui/Input.jsx
// Features: validation states, helper text, icons, disabled state
```

**Table Component** - Data display with sorting
```jsx
// Usage with pagination
<Table
  columns={[
    { key: 'name', label: 'Product Name', sortable: true },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'stock', label: 'Stock', render: (value) => <Badge>{value}</Badge> }
  ]}
  data={products}
  loading={isLoading}
  onSort={handleSort}
  emptyMessage="No products found"
/>

// File: frontend/src/components/ui/Table.jsx
// Features: sorting, custom renderers, loading states, empty states
```

**Modal Component** - Overlay dialogs
```jsx
// Usage for forms
<Modal
  isOpen={showProductModal}
  onClose={() => setShowProductModal(false)}
  title="Add New Product"
  size="lg"
>
  <ProductForm onSubmit={handleSubmit} />
</Modal>

// File: frontend/src/components/ui/Modal.jsx
// Features: backdrop click, ESC key, focus trap, sizes (sm, md, lg, xl)
```

**Toast Notifications** - User feedback
```jsx
// Usage in components
import { toast } from 'react-hot-toast';

const handleSave = async () => {
  try {
    await api.post('/products', formData);
    toast.success('Product created successfully');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Operation failed');
  }
};

// File: frontend/src/components/Toast.jsx
// Types: success, error, warning, info
// Features: auto-dismiss, action buttons, positioning
```

### Page Architecture & Routing

**Core Pages (`frontend/src/pages/`):**

**Dashboard.jsx** - Business metrics overview
- **Purpose**: KPIs, charts, quick actions, recent activity
- **Key Features**: Real-time data, responsive charts, role-based widgets
- **Data Sources**: `/api/dashboard/overview`, `/api/dashboard/sales-chart`

**Products.jsx** - Inventory management
- **Purpose**: Product CRUD, search, bulk operations
- **Key Features**: Advanced filtering, barcode scanning, CSV import/export
- **Data Sources**: `/api/products`, `/api/categories`, `/api/brands`

**Sales.jsx** - Point-of-sale interface
- **Purpose**: Transaction processing, cart management, receipt printing
- **Key Features**: Product search, barcode scanning, payment methods
- **Data Sources**: `/api/sales`, `/api/products/search`

**Reports.jsx** - Analytics and reporting
- **Purpose**: Business intelligence, PDF generation, data export
- **Key Features**: Date range selection, chart visualization, email delivery
- **Data Sources**: `/api/reports/sales`, `/api/reports/inventory`

### UI Conventions & Standards

**Loading States:**
```jsx
// Skeleton placeholders during data fetch
{isLoading ? (
  <SkeletonTable rows={5} columns={4} />
) : (
  <Table data={products} columns={columns} />
)}

// Button loading state
<Button loading={submitting} disabled={submitting}>
  {submitting ? 'Saving...' : 'Save Product'}
</Button>
```

**Empty States:**
```jsx
// No data scenarios
<EmptyState
  icon={PackageIcon}
  title="No products found"
  message="Get started by adding your first product"
  action={
    <Button onClick={() => setShowAddModal(true)}>
      Add Product
    </Button>
  }
/>
```

**Error States:**
```jsx
// Error boundaries with retry
<ErrorBoundary
  fallback={({error, retry}) => (
    <ErrorState
      title="Something went wrong"
      message={error.message}
      action={<Button onClick={retry}>Try Again</Button>}
    />
  )}
>
  <ProductsList />
</ErrorBoundary>
```

**Status Badges:**
```jsx
// Low stock indication
<Badge 
  variant={stock <= reorderLevel ? 'danger' : 'success'}
  size="sm"
>
  {stock <= reorderLevel ? 'Low Stock' : 'In Stock'}
</Badge>

// User role display
<Badge variant="outline">{user.role.toUpperCase()}</Badge>
```

### How to Add New Form Field

**Example: Adding "Description" field to Product form**

1. **Update Product Model** (`backend/src/models/Product.js`):
```javascript
description: {
  type: String,
  trim: true,
  maxlength: [500, 'Description cannot exceed 500 characters']
}
```

2. **Update Frontend Form** (`frontend/src/pages/Products.jsx`):
```jsx
const [formData, setFormData] = useState({
  name: '',
  sku: '',
  description: '', // Add new field
  // ... other fields
});

// In the form JSX
<Input
  label="Description"
  name="description"
  value={formData.description}
  onChange={handleInputChange}
  helperText="Optional product description"
  multiline
  rows={3}
/>
```

3. **Update Table Display** (if needed):
```jsx
const columns = [
  { key: 'name', label: 'Product Name', sortable: true },
  { key: 'sku', label: 'SKU', sortable: true },
  { 
    key: 'description', 
    label: 'Description',
    render: (value) => value ? value.substring(0, 50) + '...' : '-'
  },
  // ... other columns
];
```

---

## Security & Quality

### Authentication & Authorization

**Password Security:**
- **Hashing**: bcrypt with 12 salt rounds in `backend/src/models/User.js`
- **JWT Strategy**: Access tokens (7d) + refresh tokens (30d)
- **Token Verification**: `backend/src/middleware/auth.js` validates every protected request

**Role-Based Access Control (RBAC):**
```javascript
// Backend middleware (backend/src/middleware/auth.js)
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return ResponseUtils.forbidden(res, 'Admin access required');
  }
  next();
};

// Frontend component visibility
const canManageUsers = user?.role === 'admin';
{canManageUsers && (
  <Button onClick={openUserModal}>Add User</Button>
)}
```

**Permission Matrix:**
| Feature | Admin | Manager | Cashier | Viewer |
|---------|-------|---------|---------|--------|
| User Management | ✅ Create/Edit/Delete | ❌ | ❌ | ❌ |
| Product Management | ✅ Full CRUD | ✅ Full CRUD | 👁️ View Only | 👁️ View Only |
| Sales Processing | ✅ All Operations | ✅ All Operations | ✅ Create/Process | 👁️ View Only |
| Financial Reports | ✅ Full Access | ✅ Full Access | ❌ | ❌ |
| System Settings | ✅ Configure | ❌ | ❌ | ❌ |

### Request Security

**CORS Configuration** (`backend/app.js`):
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

**Rate Limiting** (`backend/src/middleware/advancedRateLimit.js`):
```javascript
// General API rate limit: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later'
});

// Auth endpoints: 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});
```

### Input Validation & Sanitization

**Backend Validation Pipeline:**
1. **Express Validator** (`backend/src/middleware/validation.js`):
```javascript
const validateProduct = [
  body('name').trim().isLength({min: 1, max: 100}).escape(),
  body('sku').matches(/^[A-Z]{3}-[A-Z0-9]+-\d{4}$/),
  body('costPrice').isFloat({min: 0}).toFloat(),
  body('sellingPrice').isFloat({min: 0}).toFloat(),
  handleValidationErrors
];
```

2. **Input Sanitization** (`backend/src/utils/validationUtils.js`):
```javascript
class ValidationUtils {
  static sanitizeString(input) {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static validateSKU(sku) {
    const skuRegex = /^[A-Z]{3}-[A-Z0-9]+-\d{4}$/;
    return skuRegex.test(sku);
  }
}
```

### Centralized Error Handling

**API Response Standards** (`backend/src/utils/responseUtils.js`):
```javascript
class ResponseUtils {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }
  
  static error(res, message, statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }
  
  static validationError(res, errors) {
    return this.error(res, 'Validation failed', 400, errors);
  }
}
```

**Global Error Handler** (`backend/src/middleware/errorHandler.js`):
```javascript
const errorHandler = (err, req, res, next) => {
  // Log error details
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id
  });
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return ResponseUtils.validationError(res, err.errors);
  }
  
  if (err.code === 11000) {
    return ResponseUtils.conflict(res, 'Duplicate entry detected');
  }
  
  return ResponseUtils.error(res, 'Internal server error');
};
```

### Audit Logging

**Audit Trail** (`backend/src/models/AuditLog.js`):
```javascript
const auditSchema = new mongoose.Schema({
  action: { type: String, required: true }, // CREATE, UPDATE, DELETE
  entity: { type: String, required: true }, // Product, Sale, User
  entityId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changes: { type: Object }, // Before/after values
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});
```

**Audit Middleware** (`backend/src/middleware/auditLogger.js`):
```javascript
const auditLogger = (action, entity) => (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode < 400) {
      await AuditLog.create({
        action,
        entity,
        entityId: req.params.id || 'N/A',
        userId: req.user?.id,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
  });
  next();
};
```

### Secrets Management

**Environment Variables Security:**
```bash
# Never commit these to git
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/db
SMTP_PASS=app_specific_password_from_gmail

# Use .env.example for templates
# Add .env to .gitignore
# Use different secrets per environment
```

**Production Security Checklist:**
- [ ] Change all default passwords and secrets
- [ ] Enable MongoDB authentication and firewall rules
- [ ] Use HTTPS with valid SSL certificates
- [ ] Set secure cookie flags for sessions
- [ ] Enable helmet.js security headers
- [ ] Configure proper CORS origins
- [ ] Set up log monitoring and alerting
- [ ] Regular security audits with `npm audit`

---

## Navigation

**← Previous**: [API Catalog & Core Flows](03-api-core-flows.md)  
**→ Next**: [GST & Pricing + Seeding](05-gst-seeding.md)