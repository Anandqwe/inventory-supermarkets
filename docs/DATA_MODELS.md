# Data Models

This document outlines the core data models for the supermarket inventory and sales management system.

## User Schema

```javascript
{
  _id: ObjectId,
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['admin', 'manager', 'cashier'], default: 'cashier'),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

### User Roles
- **Admin**: Full system access, user management, system configuration
- **Manager**: Inventory management, reports, sales oversight
- **Cashier**: Sales transactions, basic inventory viewing

## Product Schema

```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String,
  sku: String (required, unique), // Stock Keeping Unit
  barcode: String (unique),
  category: {
    _id: ObjectId,
    name: String (required),
    description: String
  },
  price: {
    cost: Number (required), // Cost price
    selling: Number (required), // Selling price
    currency: String (default: 'USD')
  },
  stock: {
    current: Number (required, default: 0),
    minimum: Number (required, default: 10), // Low stock threshold
    maximum: Number, // Maximum stock capacity
    reserved: Number (default: 0) // Reserved for pending orders
  },
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  images: [String], // URLs to product images
  specifications: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: String (default: 'cm')
    },
    expiryDate: Date, // For perishable items
    batchNumber: String
  },
  tax: {
    rate: Number (default: 0), // Tax percentage
    inclusive: Boolean (default: false)
  },
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

## Sale Schema

```javascript
{
  _id: ObjectId,
  saleNumber: String (required, unique), // Auto-generated sale number
  items: [{
    product: {
      _id: ObjectId (ref: 'Product'),
      name: String,
      sku: String,
      price: Number
    },
    quantity: Number (required),
    unitPrice: Number (required),
    discount: {
      type: String (enum: ['percentage', 'fixed']),
      value: Number (default: 0)
    },
    subtotal: Number (required),
    tax: {
      rate: Number,
      amount: Number
    }
  }],
  customer: {
    name: String,
    email: String,
    phone: String,
    loyaltyNumber: String
  },
  totals: {
    subtotal: Number (required),
    tax: Number (required),
    discount: Number (default: 0),
    total: Number (required)
  },
  payment: {
    method: String (enum: ['cash', 'card', 'mobile', 'check'], required),
    status: String (enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed'),
    transactionId: String, // For electronic payments
    amountPaid: Number (required),
    change: Number (default: 0)
  },
  cashier: {
    _id: ObjectId (ref: 'User'),
    name: String
  },
  notes: String,
  status: String (enum: ['completed', 'voided', 'returned'], default: 'completed'),
  voidReason: String, // If status is 'voided'
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

## Category Schema

```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  description: String,
  parent: ObjectId (ref: 'Category'), // For subcategories
  image: String, // URL to category image
  isActive: Boolean (default: true),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

## Inventory Movement Schema

```javascript
{
  _id: ObjectId,
  product: ObjectId (ref: 'Product', required),
  type: String (enum: ['in', 'out', 'adjustment'], required),
  quantity: Number (required),
  reason: String (enum: ['purchase', 'sale', 'return', 'damage', 'theft', 'adjustment'], required),
  reference: {
    type: String, // 'sale', 'purchase', 'adjustment'
    id: ObjectId // Reference to Sale, Purchase, or Adjustment document
  },
  previousStock: Number (required),
  newStock: Number (required),
  notes: String,
  performedBy: ObjectId (ref: 'User'),
  createdAt: Date (default: Date.now)
}
```

## Low Stock Alert Schema

```javascript
{
  _id: ObjectId,
  product: ObjectId (ref: 'Product', required),
  currentStock: Number (required),
  minimumStock: Number (required),
  status: String (enum: ['active', 'resolved', 'ignored'], default: 'active'),
  alertedUsers: [ObjectId] (ref: 'User'),
  resolvedBy: ObjectId (ref: 'User'),
  resolvedAt: Date,
  createdAt: Date (default: Date.now)
}
```

## Report Schema

```javascript
{
  _id: ObjectId,
  type: String (enum: ['sales', 'inventory', 'profit', 'tax'], required),
  period: {
    start: Date (required),
    end: Date (required)
  },
  filters: {
    categories: [ObjectId] (ref: 'Category'),
    products: [ObjectId] (ref: 'Product'),
    users: [ObjectId] (ref: 'User')
  },
  data: Object, // Generated report data
  fileUrl: String, // URL to generated PDF file
  generatedBy: ObjectId (ref: 'User'),
  createdAt: Date (default: Date.now)
}
```

## Database Relationships

### One-to-Many Relationships
- User → Sales (One user can have many sales)
- Category → Products (One category can have many products)
- Product → Sale Items (One product can be in many sale items)
- Product → Inventory Movements (One product can have many movements)

### Many-to-Many Relationships
- Products ↔ Sales (Through Sale Items)

### Indexes for Performance
```javascript
// Products
{ sku: 1 } // Unique index
{ barcode: 1 } // Unique index
{ 'category._id': 1 }
{ name: 'text', description: 'text' } // Text search

// Sales
{ saleNumber: 1 } // Unique index
{ createdAt: -1 } // Sort by date
{ 'cashier._id': 1 }
{ 'payment.method': 1 }

// Users
{ email: 1 } // Unique index

// Inventory Movements
{ product: 1, createdAt: -1 } // Compound index
{ type: 1 }
```

## Validation Rules

### Business Logic Validations
1. **Stock Management**: Stock cannot go below 0
2. **Price Validation**: Selling price should be greater than cost price
3. **Sale Validation**: Cannot sell more items than available in stock
4. **User Permissions**: Role-based access control
5. **SKU/Barcode**: Must be unique across all products
6. **Date Validation**: Future dates not allowed for sales
7. **Payment Validation**: Amount paid must equal or exceed total amount

### Data Integrity
- All monetary values stored as decimals with 2 decimal places
- Dates stored in UTC format
- All references validated before saving
- Soft deletes preferred over hard deletes for audit trail
