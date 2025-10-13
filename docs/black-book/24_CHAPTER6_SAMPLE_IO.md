# CHAPTER 6: RESULTS AND DISCUSSION

## 6.1 Sample Input and Output

### 6.1.1 User Authentication

#### Sample Input - Login Request
**Input Format**: JSON
```json
{
  "email": "admin@supermarket.com",
  "password": "Admin@123456"
}
```

**Input Description**:
- Email: Registered user email address
- Password: User's secure password (minimum 8 characters)

#### Sample Output - Login Response
**Output Format**: JSON
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "6501a2b3c4d5e6f7g8h9i0j1",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@supermarket.com",
      "role": "admin",
      "branch": {
        "_id": "6501a2b3c4d5e6f7g8h9i0j2",
        "name": "Main Branch - Delhi"
      },
      "permissions": ["view_products", "manage_products", "make_sales", "manage_inventory", "view_reports", "manage_users"]
    }
  },
  "timestamp": "2025-10-13T10:30:45.123Z"
}
```

**Output Description**:
- Success status indicating authentication result
- JWT token for subsequent API requests (valid for 24 hours)
- User profile with role and permissions
- Assigned branch information
- Timestamp of authentication

---

### 6.1.2 Product Creation

#### Sample Input - Create Product
**Input Format**: JSON
```json
{
  "name": "Amul Taaza Toned Milk",
  "description": "Fresh toned milk, 1 liter pack",
  "sku": "MILK-AMUL-1L-001",
  "barcode": "8901430100123",
  "category": "6501a2b3c4d5e6f7g8h9i0j3",
  "brand": "6501a2b3c4d5e6f7g8h9i0j4",
  "unit": "6501a2b3c4d5e6f7g8h9i0j5",
  "price": 48.00,
  "cost": 42.00,
  "tax": 5,
  "stocks": [
    {
      "branch": "6501a2b3c4d5e6f7g8h9i0j2",
      "quantity": 150,
      "reorderLevel": 30
    }
  ],
  "expiryDate": "2025-10-20T00:00:00.000Z"
}
```

**Input Fields Explanation**:
- Name: Product display name
- SKU: Unique stock keeping unit identifier
- Barcode: Product barcode for scanning
- Category/Brand/Unit: References to master data
- Price: Selling price in INR
- Cost: Purchase cost for margin calculation
- Tax: GST percentage
- Stocks: Branch-wise inventory with reorder levels
- Expiry Date: For perishable items tracking

#### Sample Output - Product Created
**Output Format**: JSON
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "6501a2b3c4d5e6f7g8h9i0j6",
    "name": "Amul Taaza Toned Milk",
    "description": "Fresh toned milk, 1 liter pack",
    "sku": "MILK-AMUL-1L-001",
    "barcode": "8901430100123",
    "category": {
      "_id": "6501a2b3c4d5e6f7g8h9i0j3",
      "name": "Dairy & Eggs"
    },
    "brand": {
      "_id": "6501a2b3c4d5e6f7g8h9i0j4",
      "name": "Amul"
    },
    "unit": {
      "_id": "6501a2b3c4d5e6f7g8h9i0j5",
      "name": "Liter",
      "symbol": "L"
    },
    "price": 48.00,
    "cost": 42.00,
    "tax": 5,
    "margin": 12.50,
    "stocks": [
      {
        "branch": "6501a2b3c4d5e6f7g8h9i0j2",
        "quantity": 150,
        "reorderLevel": 30,
        "lastUpdated": "2025-10-13T10:35:22.456Z"
      }
    ],
    "expiryDate": "2025-10-20T00:00:00.000Z",
    "isActive": true,
    "createdAt": "2025-10-13T10:35:22.456Z",
    "updatedAt": "2025-10-13T10:35:22.456Z"
  },
  "timestamp": "2025-10-13T10:35:22.456Z"
}
```

**Output Features**:
- Auto-calculated margin percentage
- Populated references (category, brand, unit names)
- System-generated timestamps
- Active status initialization

---

### 6.1.3 Sales Transaction Processing

#### Sample Input - Process Sale
**Input Format**: JSON
```json
{
  "items": [
    {
      "productId": "6501a2b3c4d5e6f7g8h9i0j6",
      "quantity": 2
    },
    {
      "productId": "6501a2b3c4d5e6f7g8h9i0j7",
      "quantity": 1
    }
  ],
  "customerId": "6501a2b3c4d5e6f7g8h9i0j8",
  "branchId": "6501a2b3c4d5e6f7g8h9i0j2",
  "paymentMethod": "cash",
  "discount": 10.00
}
```

**Input Description**:
- Items array with product IDs and quantities
- Optional customer ID for tracking
- Branch where sale is processed
- Payment method (cash, card, upi)
- Optional discount amount

#### Sample Output - Sale Completed
**Output Format**: JSON
```json
{
  "success": true,
  "message": "Sale processed successfully",
  "data": {
    "sale": {
      "_id": "6501a2b3c4d5e6f7g8h9i0j9",
      "saleNumber": "SALE-2025-10-13-0001",
      "items": [
        {
          "product": "6501a2b3c4d5e6f7g8h9i0j6",
          "productName": "Amul Taaza Toned Milk",
          "sku": "MILK-AMUL-1L-001",
          "quantity": 2,
          "unitPrice": 48.00,
          "tax": 4.80,
          "subtotal": 96.00,
          "total": 100.80
        },
        {
          "product": "6501a2b3c4d5e6f7g8h9i0j7",
          "productName": "Amul Butter 500g",
          "sku": "BUTR-AMUL-500G-002",
          "quantity": 1,
          "unitPrice": 285.00,
          "tax": 14.25,
          "subtotal": 285.00,
          "total": 299.25
        }
      ],
      "customer": {
        "_id": "6501a2b3c4d5e6f7g8h9i0j8",
        "name": "Rajesh Kumar",
        "phone": "+91-9876543210"
      },
      "branch": "6501a2b3c4d5e6f7g8h9i0j2",
      "cashier": "6501a2b3c4d5e6f7g8h9i0j1",
      "paymentMethod": "cash",
      "subtotal": 381.00,
      "tax": 19.05,
      "discount": 10.00,
      "total": 390.05,
      "status": "completed",
      "date": "2025-10-13T10:40:15.789Z"
    },
    "inventoryUpdated": true,
    "stockReductions": [
      {
        "productId": "6501a2b3c4d5e6f7g8h9i0j6",
        "newQuantity": 148
      },
      {
        "productId": "6501a2b3c4d5e6f7g8h9i0j7",
        "newQuantity": 45
      }
    ]
  },
  "timestamp": "2025-10-13T10:40:15.789Z"
}
```

**Output Features**:
- Auto-generated unique sale number
- Detailed breakdown of items with calculations
- Tax and discount applied correctly
- Inventory automatically updated
- Customer and cashier information linked

---

### 6.1.4 Inventory Adjustment

#### Sample Input - Adjust Stock
**Input Format**: JSON
```json
{
  "productId": "6501a2b3c4d5e6f7g8h9i0j6",
  "branchId": "6501a2b3c4d5e6f7g8h9i0j2",
  "type": "remove",
  "quantity": 5,
  "reason": "Damaged packaging during handling"
}
```

**Input Fields**:
- Product ID and Branch ID for location
- Type: add, remove, damage, set
- Quantity to adjust
- Mandatory reason for audit trail

#### Sample Output - Stock Adjusted
**Output Format**: JSON
```json
{
  "success": true,
  "message": "Stock adjusted successfully",
  "data": {
    "adjustment": {
      "_id": "6501a2b3c4d5e6f7g8h9i0k1",
      "product": {
        "_id": "6501a2b3c4d5e6f7g8h9i0j6",
        "name": "Amul Taaza Toned Milk"
      },
      "branch": {
        "_id": "6501a2b3c4d5e6f7g8h9i0j2",
        "name": "Main Branch - Delhi"
      },
      "type": "remove",
      "quantity": 5,
      "previousQuantity": 148,
      "newQuantity": 143,
      "reason": "Damaged packaging during handling",
      "adjustedBy": {
        "_id": "6501a2b3c4d5e6f7g8h9i0j1",
        "name": "Admin User"
      },
      "date": "2025-10-13T11:15:30.123Z"
    },
    "currentStock": 143,
    "alertSent": false
  },
  "timestamp": "2025-10-13T11:15:30.123Z"
}
```

**Output Features**:
- Complete audit trail with before/after quantities
- User who made adjustment tracked
- Alert status if stock below reorder level
- Reason recorded for compliance

---

### 6.1.5 Report Generation

#### Sample Input - Sales Report Request
**Input Format**: Query Parameters
```
GET /api/reports/sales?startDate=2025-10-01&endDate=2025-10-13&branchId=all&groupBy=day
```

**Parameters**:
- Start Date: Report period start
- End Date: Report period end
- Branch ID: Specific branch or 'all'
- Group By: day, week, month aggregation

#### Sample Output - Sales Report
**Output Format**: JSON
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 485720.50,
      "totalTransactions": 1247,
      "averageOrderValue": 389.45,
      "totalItemsSold": 3891,
      "period": {
        "start": "2025-10-01",
        "end": "2025-10-13"
      }
    },
    "dailyData": [
      {
        "date": "2025-10-13",
        "revenue": 45230.00,
        "transactions": 118,
        "averageValue": 383.30,
        "items": 356
      },
      {
        "date": "2025-10-12",
        "revenue": 38940.50,
        "transactions": 95,
        "averageValue": 409.90,
        "items": 298
      }
    ],
    "topProducts": [
      {
        "productId": "6501a2b3c4d5e6f7g8h9i0j6",
        "name": "Amul Taaza Toned Milk",
        "totalQuantity": 456,
        "totalRevenue": 21888.00
      },
      {
        "productId": "6501a2b3c4d5e6f7g8h9i0j7",
        "name": "Amul Butter 500g",
        "totalQuantity": 89,
        "totalRevenue": 25365.00
      }
    ],
    "paymentMethods": {
      "cash": 45.3,
      "card": 32.1,
      "upi": 22.6
    }
  },
  "timestamp": "2025-10-13T11:30:00.000Z"
}
```

**Report Components**:
- Summary statistics for entire period
- Day-by-day breakdown of sales
- Top performing products by revenue
- Payment method distribution percentages
- Export-ready data format

---

### 6.1.6 Product Search with Filters

#### Sample Input - Search Products
**Input Format**: Query Parameters
```
GET /api/products?search=milk&category=dairy&page=1&limit=10&sortBy=price&sortOrder=asc
```

**Search Criteria**:
- Text search in name, description, SKU
- Category filter
- Pagination (page, limit)
- Sorting (field, order)

#### Sample Output - Product List
**Output Format**: JSON
```json
{
  "success": true,
  "data": [
    {
      "_id": "6501a2b3c4d5e6f7g8h9i0j6",
      "name": "Amul Taaza Toned Milk",
      "sku": "MILK-AMUL-1L-001",
      "barcode": "8901430100123",
      "category": {
        "_id": "6501a2b3c4d5e6f7g8h9i0j3",
        "name": "Dairy & Eggs"
      },
      "brand": {
        "_id": "6501a2b3c4d5e6f7g8h9i0j4",
        "name": "Amul"
      },
      "price": 48.00,
      "stock": 143,
      "status": "In Stock"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 24,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-10-13T11:45:00.000Z"
}
```

**Search Results Features**:
- Filtered and sorted product list
- Populated category and brand names
- Current stock status
- Comprehensive pagination metadata

---

### 6.1.7 Error Handling Examples

#### Validation Error - Invalid Input
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "value": "123"
    }
  ],
  "timestamp": "2025-10-13T12:00:00.000Z"
}
```

#### Authentication Error - Invalid Credentials
```json
{
  "success": false,
  "message": "Invalid credentials",
  "timestamp": "2025-10-13T12:05:00.000Z"
}
```

#### Resource Not Found Error
```json
{
  "success": false,
  "message": "Product not found",
  "timestamp": "2025-10-13T12:10:00.000Z"
}
```

#### Insufficient Stock Error
```json
{
  "success": false,
  "message": "Insufficient stock for Amul Taaza Toned Milk. Available: 5, Required: 10",
  "timestamp": "2025-10-13T12:15:00.000Z"
}
```

These sample inputs and outputs demonstrate the system's comprehensive data handling, validation, error management, and response formatting across all major functionalities.
