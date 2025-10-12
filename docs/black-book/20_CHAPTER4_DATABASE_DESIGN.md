# CHAPTER 4: SYSTEM DESIGN

## 4.2 Database Design

The database design for the Supermarket Inventory and Sales Management System utilizes MongoDB, a NoSQL document database, to provide flexible, scalable, and high-performance data storage. This section provides comprehensive coverage of the database schema design, relationships, indexing strategies, and optimization techniques.

### 4.2.1 Database Design Principles

#### NoSQL Design Philosophy

**Document-Oriented Approach:**
- **Flexible Schema**: Adaptable document structure for evolving business requirements
- **JSON-Native Storage**: Natural alignment with JavaScript application development
- **Embedded Documents**: Related data storage within single documents for performance
- **Array Support**: Native support for lists and complex data structures
- **Rich Query Language**: Powerful querying capabilities with aggregation framework

**Scalability Considerations:**
- **Horizontal Scaling**: Sharding capabilities for large dataset distribution
- **Replica Sets**: Built-in replication for high availability and read scaling
- **Indexing**: Comprehensive indexing strategies for query optimization
- **Memory Management**: Efficient memory usage and caching mechanisms
- **Connection Pooling**: Optimized database connection management

#### Data Modeling Strategy

**Embedding vs. Referencing Decisions:**
- **Embed**: Related data accessed together (order items, address information)
- **Reference**: Large documents or many-to-many relationships (users, categories)
- **Hybrid Approach**: Combination based on access patterns and data size
- **Denormalization**: Strategic data duplication for query performance
- **Consistency**: Balance between performance and data consistency requirements

### 4.2.2 Core Collection Schemas

#### Users Collection

**Collection Name:** `users`
**Purpose:** Store user authentication, profile, and role information

```javascript
{
  _id: ObjectId,
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [emailValidator, 'Invalid email format']
  },
  password: {
    type: String,
    required: true,
    minLength: 8,
    select: false // Exclude from queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'regional_manager', 'store_manager', 'inventory_manager', 'cashier', 'viewer'],
    default: 'cashier'
  },
  permissions: [{
    type: String,
    enum: ['view_products', 'manage_products', 'view_sales', 'make_sales', 
           'view_inventory', 'manage_inventory', 'view_reports', 'generate_reports',
           'view_users', 'manage_users', 'view_branches', 'manage_branches']
  }],
  branch: {
    type: ObjectId,
    ref: 'Branch',
    required: true
  },
  phone: {
    type: String,
    validate: [phoneValidator, 'Invalid phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes:**
- `{ email: 1 }` - Unique index for authentication
- `{ branch: 1, role: 1 }` - Branch-based user queries
- `{ isActive: 1, lastLogin: -1 }` - Active user tracking

#### Products Collection

**Collection Name:** `products`
**Purpose:** Store product catalog, pricing, and inventory information

```javascript
{
  _id: ObjectId,
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    maxLength: 500
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  category: {
    type: ObjectId,
    ref: 'Category',
    required: true
  },
  brand: {
    type: ObjectId,
    ref: 'Brand'
  },
  unit: {
    type: ObjectId,
    ref: 'Unit',
    required: true
  },
  price: {
    cost: {
      type: Number,
      required: true,
      min: 0
    },
    selling: {
      type: Number,
      required: true,
      min: 0
    },
    mrp: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  stocks: [{
    branch: {
      type: ObjectId,
      ref: 'Branch',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    reorderLevel: {
      type: Number,
      default: 10
    },
    maxLevel: {
      type: Number,
      default: 1000
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  specifications: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: 'cm' }
    },
    color: String,
    material: String,
    manufacturer: String
  },
  expiryTracking: {
    hasExpiry: {
      type: Boolean,
      default: false
    },
    expiryDate: Date,
    daysToExpiry: Number
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes:**
- `{ sku: 1 }` - Unique product identification
- `{ name: 'text', description: 'text', tags: 'text' }` - Text search
- `{ category: 1, brand: 1 }` - Category and brand filtering
- `{ 'stocks.branch': 1, 'stocks.quantity': 1 }` - Branch inventory queries
- `{ isActive: 1, createdAt: -1 }` - Active products listing

#### Sales Collection

**Collection Name:** `sales`
**Purpose:** Store sales transactions and payment information

```javascript
{
  _id: ObjectId,
  saleNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: ObjectId,
      ref: 'Product',
      required: true
    },
    productName: String, // Denormalized for performance
    sku: String, // Denormalized for performance
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  customer: {
    type: ObjectId,
    ref: 'Customer'
  },
  customerInfo: {
    name: String,
    phone: String,
    email: String
  },
  branch: {
    type: ObjectId,
    ref: 'Branch',
    required: true
  },
  cashier: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'digital_wallet', 'credit'],
    required: true
  },
  paymentDetails: {
    transactionId: String,
    cardLast4: String,
    upiId: String,
    walletProvider: String
  },
  totals: {
    subtotal: {
      type: Number,
      required: true
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'refunded', 'partial_refund'],
    default: 'completed'
  },
  refundInfo: {
    refundAmount: Number,
    refundDate: Date,
    refundReason: String,
    refundedBy: {
      type: ObjectId,
      ref: 'User'
    }
  },
  notes: String,
  receiptNumber: String,
  saleDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes:**
- `{ saleNumber: 1 }` - Unique sale identification
- `{ branch: 1, saleDate: -1 }` - Branch-wise sales reports
- `{ cashier: 1, saleDate: -1 }` - Cashier performance tracking
- `{ 'items.product': 1, saleDate: -1 }` - Product sales analysis
- `{ customer: 1, saleDate: -1 }` - Customer purchase history

#### Categories Collection

**Collection Name:** `categories`
**Purpose:** Store product categories and hierarchical organization

```javascript
{
  _id: ObjectId,
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50
  },
  description: {
    type: String,
    maxLength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  parent: {
    type: ObjectId,
    ref: 'Category'
  },
  children: [{
    type: ObjectId,
    ref: 'Category'
  }],
  level: {
    type: Number,
    default: 0
  },
  image: {
    url: String,
    alt: String
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  productCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes:**
- `{ slug: 1 }` - Unique category identification
- `{ parent: 1, displayOrder: 1 }` - Hierarchical category queries
- `{ isActive: 1, level: 1 }` - Active category listing

#### Brands Collection

**Collection Name:** `brands`
**Purpose:** Store brand information and supplier relationships

```javascript
{
  _id: ObjectId,
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50
  },
  description: {
    type: String,
    maxLength: 200
  },
  logo: {
    url: String,
    alt: String
  },
  manufacturer: {
    name: String,
    country: String,
    website: String
  },
  contactInfo: {
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  productCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

#### Branches Collection

**Collection Name:** `branches`
**Purpose:** Store branch/store location information

```javascript
{
  _id: ObjectId,
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['hypermarket', 'supermarket', 'convenience_store'],
    default: 'supermarket'
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  manager: {
    type: ObjectId,
    ref: 'User'
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  settings: {
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    currency: {
      type: String,
      default: 'INR'
    },
    taxRate: {
      type: Number,
      default: 0
    },
    loyaltyProgram: {
      enabled: { type: Boolean, default: false },
      pointsPerRupee: { type: Number, default: 1 }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

### 4.2.3 Supporting Collections

#### Inventory Adjustments Collection

**Collection Name:** `inventory_adjustments`
**Purpose:** Track inventory changes and stock adjustments

```javascript
{
  _id: ObjectId,
  product: {
    type: ObjectId,
    ref: 'Product',
    required: true
  },
  branch: {
    type: ObjectId,
    ref: 'Branch',
    required: true
  },
  type: {
    type: String,
    enum: ['addition', 'reduction', 'damage', 'theft', 'expired', 'transfer_in', 'transfer_out'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousQuantity: {
    type: Number,
    required: true
  },
  newQuantity: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxLength: 200
  },
  reference: {
    type: String, // Purchase order, transfer ID, etc.
  },
  adjustedBy: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  adjustmentDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}
```

#### Customers Collection

**Collection Name:** `customers`
**Purpose:** Store customer information and purchase history

```javascript
{
  _id: ObjectId,
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    validate: [emailValidator, 'Invalid email format']
  },
  phone: {
    type: String,
    required: true,
    validate: [phoneValidator, 'Invalid phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  loyaltyInfo: {
    membershipNumber: String,
    points: { type: Number, default: 0 },
    tier: { type: String, default: 'bronze' },
    joinDate: Date
  },
  preferences: {
    categories: [String],
    brands: [String],
    communicationMethod: {
      type: String,
      enum: ['email', 'sms', 'both', 'none'],
      default: 'email'
    }
  },
  statistics: {
    totalPurchases: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    lastPurchaseDate: Date,
    frequentBranch: {
      type: ObjectId,
      ref: 'Branch'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

#### Audit Logs Collection

**Collection Name:** `audit_logs`
**Purpose:** Track system activities and data changes

```javascript
{
  _id: ObjectId,
  user: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import']
  },
  resource: {
    type: String,
    required: true,
    enum: ['user', 'product', 'sale', 'inventory', 'category', 'brand', 'branch', 'customer']
  },
  resourceId: ObjectId,
  changes: {
    before: Object,
    after: Object
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    branch: {
      type: ObjectId,
      ref: 'Branch'
    },
    sessionId: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}
```

### 4.2.4 Database Relationships

#### Relationship Types and Patterns

**One-to-Many Relationships:**
- **Branch → Users**: One branch has many users
- **Category → Products**: One category contains many products
- **Brand → Products**: One brand has many products
- **User → Sales**: One user (cashier) creates many sales
- **Customer → Sales**: One customer makes many purchases

**Many-to-Many Relationships:**
- **Products ↔ Branches**: Products exist in multiple branches with different stock levels
- **Users ↔ Permissions**: Users can have multiple permissions based on roles

**Embedded Relationships:**
- **Sale → Sale Items**: Sale items embedded within sales for performance
- **Product → Stock Levels**: Branch-specific stock embedded in products
- **User → Address**: Address information embedded in user document

#### Referential Integrity Strategies

**Cascade Operations:**
- **Soft Deletes**: Mark records as inactive instead of physical deletion
- **Reference Validation**: Ensure referenced documents exist before creation
- **Cleanup Procedures**: Automated cleanup of orphaned references
- **Data Migration**: Procedures for handling relationship changes

**Consistency Maintenance:**
- **Transaction Support**: Use MongoDB transactions for multi-document operations
- **Validation Rules**: Schema-level validation for relationship constraints
- **Business Logic**: Application-level consistency enforcement
- **Regular Audits**: Periodic data integrity verification

### 4.2.5 Indexing Strategy

#### Performance Optimization Indexes

**Primary Indexes:**
- **Unique Indexes**: Email, SKU, sale numbers for uniqueness constraints
- **Compound Indexes**: Multi-field indexes for complex queries
- **Text Indexes**: Full-text search capabilities for products and customers
- **Geospatial Indexes**: Location-based queries for branches
- **Partial Indexes**: Conditional indexes for specific query patterns

**Query-Specific Indexes:**
```javascript
// Product search and filtering
db.products.createIndex({ 
  name: "text", 
  description: "text", 
  tags: "text" 
});

// Branch-specific inventory queries
db.products.createIndex({ 
  "stocks.branch": 1, 
  "stocks.quantity": 1 
});

// Sales reporting by date and branch
db.sales.createIndex({ 
  branch: 1, 
  saleDate: -1 
});

// User authentication and role queries
db.users.createIndex({ 
  email: 1 
}, { unique: true });

// Category hierarchy queries
db.categories.createIndex({ 
  parent: 1, 
  displayOrder: 1 
});
```

#### Index Monitoring and Optimization

**Performance Monitoring:**
- **Query Analysis**: Regular analysis of slow queries and optimization
- **Index Usage Statistics**: Monitoring index efficiency and usage patterns
- **Memory Usage**: Index memory consumption optimization
- **Background Index Building**: Non-blocking index creation strategies
- **Index Maintenance**: Regular index rebuild and optimization procedures

### 4.2.6 Data Validation and Constraints

#### Schema Validation Rules

**Data Type Validation:**
- **String Length**: Maximum length constraints for text fields
- **Number Ranges**: Minimum and maximum value constraints
- **Date Validation**: Valid date ranges and format constraints
- **Email Validation**: Email format validation using regex patterns
- **Phone Validation**: Phone number format validation for Indian numbers

**Business Rule Validation:**
- **Stock Levels**: Non-negative quantity constraints
- **Price Validation**: Positive price values and logical price relationships
- **User Role Validation**: Valid role and permission combinations
- **Branch Validation**: Active branch requirements for operations
- **Date Logic**: Logical date relationships (created before updated)

#### Data Integrity Enforcement

**Application-Level Constraints:**
- **Unique Constraint Handling**: Graceful handling of duplicate key errors
- **Foreign Key Validation**: Reference existence validation before operations
- **Business Logic Validation**: Complex business rule enforcement
- **Transaction Management**: Multi-document operation consistency
- **Error Handling**: Comprehensive error handling and user feedback

### 4.2.7 Backup and Recovery Strategy

#### Backup Procedures

**Automated Backups:**
- **Daily Full Backups**: Complete database backup every 24 hours
- **Incremental Backups**: Change-based backups every 6 hours
- **Point-in-Time Recovery**: Binary log-based recovery capabilities
- **Geographic Distribution**: Multi-region backup storage
- **Backup Verification**: Regular backup integrity testing

**Recovery Procedures:**
- **Disaster Recovery Plan**: Comprehensive recovery procedures and timelines
- **Data Restoration**: Step-by-step restoration procedures
- **Business Continuity**: Minimal downtime recovery strategies
- **Testing Procedures**: Regular disaster recovery testing and validation
- **Documentation**: Detailed recovery procedure documentation

### Conclusion

The database design provides a robust, scalable, and efficient data storage solution for the Supermarket Inventory and Sales Management System. Key design strengths include:

**Design Excellence:**
- **Flexible Schema**: Adaptable to changing business requirements
- **Performance Optimization**: Strategic indexing and query optimization
- **Data Integrity**: Comprehensive validation and constraint enforcement
- **Scalability**: Horizontal and vertical scaling capabilities
- **Security**: Role-based access control and audit logging

**Technical Advantages:**
- **Modern Technology**: NoSQL advantages with JSON-native storage
- **Cloud Integration**: Seamless MongoDB Atlas integration
- **Development Efficiency**: Natural alignment with JavaScript development
- **Query Performance**: Optimized for common business operations
- **Maintenance**: Simplified administration and monitoring

This database design ensures efficient data operations while maintaining flexibility for future enhancements and business growth.