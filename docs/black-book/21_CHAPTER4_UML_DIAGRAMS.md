# CHAPTER 4: SYSTEM DESIGN

## 4.3 UML Diagrams

This section presents comprehensive Unified Modeling Language (UML) diagrams that illustrate the system's structure, behavior, and interactions. These diagrams provide visual representations of the system architecture, user interactions, data flow, and component relationships for the Supermarket Inventory and Sales Management System.

### 4.3.1 Use Case Diagram

The Use Case Diagram identifies the primary actors and their interactions with the system, showcasing the functional requirements from a user perspective.

#### System Actors

**Primary Actors:**
- **Admin**: System administrator with full access
- **Store Manager**: Branch-level management and oversight
- **Inventory Manager**: Stock and inventory management
- **Cashier**: Sales transaction processing
- **Customer**: End customer receiving services

**Secondary Actors:**
- **Email System**: Automated notification delivery
- **Payment Gateway**: Transaction processing (future)
- **Backup System**: Data protection and recovery

#### Use Cases by Actor

**Admin Use Cases:**
```
Admin
├── Manage Users
│   ├── Create User Account
│   ├── Update User Profile
│   ├── Deactivate User
│   └── Assign User Roles
├── Manage Branches
│   ├── Add New Branch
│   ├── Update Branch Information
│   ├── Configure Branch Settings
│   └── View Branch Performance
├── System Configuration
│   ├── Configure Global Settings
│   ├── Manage Permissions
│   ├── Setup Email Templates
│   └── Configure Backup Settings
└── Advanced Reports
    ├── Generate System Reports
    ├── Export Data
    ├── View Audit Logs
    └── Performance Analytics
```

**Store Manager Use Cases:**
```
Store Manager
├── Inventory Management
│   ├── View Stock Levels
│   ├── Approve Stock Adjustments
│   ├── Manage Reorder Levels
│   └── Transfer Stock Between Branches
├── Sales Management
│   ├── View Sales Reports
│   ├── Process Refunds
│   ├── Monitor Cashier Performance
│   └── Analyze Sales Trends
├── Staff Management
│   ├── Manage Branch Staff
│   ├── Assign Shifts
│   ├── Monitor User Activity
│   └── Generate Staff Reports
└── Business Intelligence
    ├── Generate Branch Reports
    ├── Monitor KPIs
    ├── Forecast Demand
    └── Analyze Customer Behavior
```

**Inventory Manager Use Cases:**
```
Inventory Manager
├── Product Management
│   ├── Add New Products
│   ├── Update Product Information
│   ├── Manage Categories and Brands
│   └── Upload Product Images
├── Stock Operations
│   ├── Adjust Stock Levels
│   ├── Track Stock Movements
│   ├── Monitor Low Stock Items
│   └── Generate Stock Reports
├── Supplier Management
│   ├── Manage Supplier Information
│   ├── Track Purchase Orders
│   ├── Monitor Supplier Performance
│   └── Process Deliveries
└── Inventory Analytics
    ├── Analyze Stock Turnover
    ├── Identify Slow-Moving Items
    ├── Optimize Stock Levels
    └── Generate Inventory Reports
```

**Cashier Use Cases:**
```
Cashier
├── Sales Processing
│   ├── Process Sale Transaction
│   ├── Add Items to Cart
│   ├── Apply Discounts
│   └── Complete Payment
├── Customer Service
│   ├── Register New Customer
│   ├── Update Customer Information
│   ├── Process Returns
│   └── Handle Customer Queries
├── Transaction Management
│   ├── Generate Receipt
│   ├── View Transaction History
│   ├── Cancel Transaction
│   └── Process Refunds
└── Basic Reports
    ├── View Daily Sales Summary
    ├── Check Stock Availability
    ├── Print Sales Reports
    └── Monitor Transaction Status
```

**Customer Use Cases:**
```
Customer
├── Shopping Experience
│   ├── Browse Products
│   ├── Check Product Availability
│   ├── View Product Details
│   └── Compare Prices
├── Transaction Activities
│   ├── Make Purchase
│   ├── Choose Payment Method
│   ├── Receive Receipt
│   └── Request Refund
├── Account Management
│   ├── Register Account
│   ├── Update Profile
│   ├── View Purchase History
│   └── Manage Loyalty Points
└── Customer Service
    ├── Report Issues
    ├── Provide Feedback
    ├── Request Support
    └── Track Complaints
```

#### Use Case Relationships

**Include Relationships:**
- All transaction use cases include "Authenticate User"
- Sales processing includes "Update Inventory"
- Report generation includes "Validate Permissions"

**Extend Relationships:**
- "Process Payment" extends "Complete Transaction"
- "Send Email Notification" extends "Stock Adjustment"
- "Generate Receipt" extends "Complete Sale"

### 4.3.2 Activity Diagram

Activity Diagrams show the workflow and business process flows within the system, illustrating the sequence of activities and decision points.

#### User Login Process Activity Diagram

```
[Start] → [Enter Credentials] → [Validate Credentials] 
    ↓
[Decision: Valid?]
    ├── No → [Display Error] → [Return to Login]
    └── Yes → [Check Account Status]
        ↓
    [Decision: Account Active?]
        ├── No → [Display Account Disabled] → [End]
        └── Yes → [Generate JWT Token]
            ↓
        [Set User Session] → [Redirect to Dashboard] → [End]
```

#### Sales Transaction Processing Activity Diagram

```
[Start Transaction] → [Scan/Enter Product] → [Check Product Availability]
    ↓
[Decision: Available?]
    ├── No → [Display Out of Stock] → [Select Alternative Product]
    └── Yes → [Add to Cart] → [Update Cart Display]
        ↓
[Decision: More Items?]
    ├── Yes → [Return to Scan Product]
    └── No → [Calculate Total] → [Apply Discounts]
        ↓
[Display Final Total] → [Select Payment Method] → [Process Payment]
    ↓
[Decision: Payment Success?]
    ├── No → [Display Payment Error] → [Retry Payment]
    └── Yes → [Update Inventory] → [Generate Receipt]
        ↓
[Print Receipt] → [Complete Transaction] → [Send Email Notification] → [End]
```

#### Inventory Adjustment Process Activity Diagram

```
[Start Adjustment] → [Select Product] → [Enter Adjustment Details]
    ↓
[Specify Reason] → [Enter Quantity Change] → [Calculate New Stock Level]
    ↓
[Decision: Requires Approval?]
    ├── Yes → [Send for Approval] → [Wait for Approval]
        ↓
    [Decision: Approved?]
        ├── No → [Reject Adjustment] → [Notify User] → [End]
        └── Yes → [Apply Adjustment]
    └── No → [Apply Adjustment] → [Update Stock Level]
        ↓
[Log Adjustment] → [Check Reorder Level] → [Decision: Below Reorder?]
    ├── Yes → [Generate Low Stock Alert] → [Send Notification]
    └── No → [Update Dashboard] → [End]
```

### 4.3.3 Sequence Diagram

Sequence Diagrams illustrate the interactions between different objects/components over time, showing the message flow and method calls.

#### User Authentication Sequence Diagram

```
User → Frontend: Enter credentials
Frontend → AuthController: POST /api/auth/login
AuthController → UserService: validateUser(email, password)
UserService → Database: findUser(email)
Database → UserService: user data
UserService → AuthController: validation result
AuthController → TokenService: generateToken(user)
TokenService → AuthController: JWT token
AuthController → Frontend: { success: true, token, user }
Frontend → LocalStorage: store token and user
Frontend → Dashboard: redirect to dashboard
```

#### Product Management Sequence Diagram

```
InventoryManager → Frontend: Create new product
Frontend → ProductController: POST /api/products
ProductController → ValidationService: validateProductData(data)
ValidationService → ProductController: validation result
ProductController → ProductService: createProduct(data)
ProductService → Database: insert product
Database → ProductService: created product
ProductService → CacheService: invalidateCache('products')
CacheService → ProductService: cache cleared
ProductService → ProductController: success response
ProductController → Frontend: { success: true, product }
Frontend → InventoryManager: display success message
```

#### Sales Transaction Sequence Diagram

```
Cashier → Frontend: Start sale transaction
Frontend → SalesController: POST /api/sales
SalesController → ValidationService: validateSaleData(data)
ValidationService → SalesController: validation result
SalesController → SalesService: processSale(data)
SalesService → InventoryService: checkStockAvailability(items)
InventoryService → Database: query stock levels
Database → InventoryService: stock data
InventoryService → SalesService: availability confirmed
SalesService → Database: create sale record
Database → SalesService: sale created
SalesService → InventoryService: updateStock(items)
InventoryService → Database: update product stocks
Database → InventoryService: stock updated
InventoryService → SalesService: stock update confirmed
SalesService → EmailService: sendReceipt(customer, sale)
EmailService → SalesService: email sent
SalesService → SalesController: transaction completed
SalesController → Frontend: { success: true, sale }
Frontend → Cashier: display success and receipt
```

### 4.3.4 Class Diagram

The Class Diagram shows the static structure of the system, including classes, their attributes, methods, and relationships.

#### Core System Classes

**User Class:**
```
User
─────────────────────
- _id: ObjectId
- firstName: String
- lastName: String
- email: String
- password: String
- role: String
- permissions: Array<String>
- branch: ObjectId
- isActive: Boolean
- lastLogin: Date
─────────────────────
+ authenticate(password): Boolean
+ hasPermission(permission): Boolean
+ updateProfile(data): Boolean
+ generateToken(): String
+ validatePassword(password): Boolean
+ getBranchAccess(): Branch
```

**Product Class:**
```
Product
─────────────────────
- _id: ObjectId
- name: String
- description: String
- sku: String
- barcode: String
- category: ObjectId
- brand: ObjectId
- price: Object
- stocks: Array<Stock>
- images: Array<Image>
- isActive: Boolean
─────────────────────
+ getStockLevel(branchId): Number
+ updateStock(branchId, quantity): Boolean
+ checkAvailability(branchId, quantity): Boolean
+ calculateProfit(): Number
+ isLowStock(branchId): Boolean
+ getStockValue(): Number
```

**Sale Class:**
```
Sale
─────────────────────
- _id: ObjectId
- saleNumber: String
- items: Array<SaleItem>
- customer: ObjectId
- branch: ObjectId
- cashier: ObjectId
- paymentMethod: String
- totals: Object
- status: String
- saleDate: Date
─────────────────────
+ calculateTotal(): Number
+ addItem(product, quantity): Boolean
+ removeItem(productId): Boolean
+ applyDiscount(amount): Boolean
+ processPayment(): Boolean
+ generateReceipt(): String
```

**SaleItem Class:**
```
SaleItem
─────────────────────
- product: ObjectId
- productName: String
- sku: String
- quantity: Number
- unitPrice: Number
- discount: Number
- tax: Number
- subtotal: Number
─────────────────────
+ calculateSubtotal(): Number
+ applyDiscount(amount): Number
+ calculateTax(): Number
+ validateQuantity(): Boolean
```

**Branch Class:**
```
Branch
─────────────────────
- _id: ObjectId
- name: String
- code: String
- type: String
- address: Object
- contactInfo: Object
- manager: ObjectId
- settings: Object
- isActive: Boolean
─────────────────────
+ getUsers(): Array<User>
+ getProducts(): Array<Product>
+ getTotalSales(period): Number
+ getInventoryValue(): Number
+ getPerformanceMetrics(): Object
```

#### Service Classes

**AuthenticationService Class:**
```
AuthenticationService
─────────────────────
+ login(email, password): Object
+ register(userData): Object
+ logout(token): Boolean
+ refreshToken(token): String
+ resetPassword(email): Boolean
+ validateToken(token): Boolean
+ generateToken(user): String
+ hashPassword(password): String
```

**InventoryService Class:**
```
InventoryService
─────────────────────
+ checkStockLevel(productId, branchId): Number
+ updateStock(productId, branchId, quantity): Boolean
+ adjustStock(adjustment): Boolean
+ transferStock(transfer): Boolean
+ getLowStockItems(branchId): Array<Product>
+ calculateInventoryValue(branchId): Number
+ generateStockReport(branchId): Object
```

**SalesService Class:**
```
SalesService
─────────────────────
+ processSale(saleData): Object
+ calculateTotals(items): Object
+ validatePayment(paymentData): Boolean
+ processRefund(saleId, amount): Boolean
+ generateSalesReport(period, branchId): Object
+ getTopSellingProducts(period): Array<Product>
+ getCustomerPurchaseHistory(customerId): Array<Sale>
```

#### Utility Classes

**ValidationService Class:**
```
ValidationService
─────────────────────
+ validateUser(userData): Object
+ validateProduct(productData): Object
+ validateSale(saleData): Object
+ validateEmail(email): Boolean
+ validatePhone(phone): Boolean
+ sanitizeInput(input): String
```

**EmailService Class:**
```
EmailService
─────────────────────
+ sendWelcomeEmail(user): Boolean
+ sendPasswordReset(user, token): Boolean
+ sendLowStockAlert(products, branch): Boolean
+ sendSalesReport(report, recipients): Boolean
+ sendReceiptEmail(customer, sale): Boolean
```

#### Class Relationships

**Inheritance Relationships:**
- `StoreManager`, `InventoryManager`, `Cashier` extend `User`
- `Product`, `Category`, `Brand` extend `BaseEntity`

**Association Relationships:**
- `User` → `Branch` (many-to-one)
- `Product` → `Category` (many-to-one)
- `Product` → `Brand` (many-to-one)
- `Sale` → `User` (many-to-one)
- `Sale` → `Customer` (many-to-one)
- `Sale` → `Branch` (many-to-one)

**Composition Relationships:**
- `Sale` contains `SaleItem` (one-to-many)
- `Product` contains `Stock` (one-to-many)
- `User` contains `Address` (one-to-one)

**Aggregation Relationships:**
- `Branch` aggregates `User` (one-to-many)
- `Category` aggregates `Product` (one-to-many)
- `Customer` aggregates `Sale` (one-to-many)

### 4.3.5 Component Diagram

The Component Diagram illustrates the organization and dependencies among software components in the system.

#### Frontend Components

**React Application Components:**
```
Frontend Application
├── Core Components
│   ├── App.jsx (Root Component)
│   ├── Router.jsx (Navigation Routing)
│   ├── AuthProvider.jsx (Authentication Context)
│   └── ThemeProvider.jsx (UI Theme Management)
├── Layout Components
│   ├── Header.jsx (Top Navigation)
│   ├── Sidebar.jsx (Side Navigation)
│   ├── Footer.jsx (Footer Information)
│   └── Breadcrumbs.jsx (Navigation Path)
├── Page Components
│   ├── Dashboard.jsx (Overview Dashboard)
│   ├── Products.jsx (Product Management)
│   ├── Sales.jsx (Sales Processing)
│   ├── Inventory.jsx (Stock Management)
│   ├── Reports.jsx (Business Intelligence)
│   ├── Users.jsx (User Management)
│   └── Settings.jsx (System Configuration)
├── Feature Components
│   ├── ProductForm.jsx (Product CRUD)
│   ├── SalesForm.jsx (Transaction Processing)
│   ├── InventoryTable.jsx (Stock Display)
│   ├── ReportGenerator.jsx (Report Creation)
│   ├── UserForm.jsx (User Management)
│   └── ChartComponents.jsx (Data Visualization)
└── UI Components
    ├── Button.jsx (Action Buttons)
    ├── Input.jsx (Form Inputs)
    ├── Modal.jsx (Dialog Modals)
    ├── Table.jsx (Data Tables)
    ├── Loading.jsx (Loading States)
    └── ErrorBoundary.jsx (Error Handling)
```

#### Backend Components

**Node.js Application Components:**
```
Backend Application
├── Server Configuration
│   ├── app.js (Express Application)
│   ├── server.js (Server Startup)
│   ├── config/ (Configuration Files)
│   └── middleware/ (Express Middleware)
├── API Layer
│   ├── routes/ (Route Definitions)
│   ├── controllers/ (Request Handlers)
│   ├── middleware/ (Authentication & Validation)
│   └── validators/ (Input Validation)
├── Business Logic Layer
│   ├── services/ (Business Logic)
│   ├── models/ (Data Models)
│   ├── utils/ (Utility Functions)
│   └── helpers/ (Helper Functions)
├── Data Access Layer
│   ├── database/ (Database Connection)
│   ├── repositories/ (Data Access Objects)
│   ├── migrations/ (Schema Changes)
│   └── seeders/ (Test Data)
└── External Integrations
    ├── email/ (Email Service)
    ├── cache/ (Redis Cache)
    ├── storage/ (File Storage)
    └── monitoring/ (Logging & Monitoring)
```

#### Database Components

**MongoDB Database Structure:**
```
Database Layer
├── Collections
│   ├── users (User Data)
│   ├── products (Product Catalog)
│   ├── sales (Transaction Records)
│   ├── categories (Product Categories)
│   ├── brands (Brand Information)
│   ├── branches (Store Locations)
│   ├── customers (Customer Data)
│   └── audit_logs (Activity Logs)
├── Indexes
│   ├── Primary Indexes
│   ├── Compound Indexes
│   ├── Text Indexes
│   └── Geospatial Indexes
├── Aggregation Pipelines
│   ├── Sales Reports
│   ├── Inventory Analysis
│   ├── User Analytics
│   └── Performance Metrics
└── Database Operations
    ├── CRUD Operations
    ├── Bulk Operations
    ├── Transaction Management
    └── Backup & Recovery
```

#### Component Dependencies

**Frontend Dependencies:**
- React Application → API Layer (HTTP/REST)
- Page Components → UI Components (React Props)
- Feature Components → State Management (Context/Redux)
- UI Components → Styling Framework (Tailwind CSS)

**Backend Dependencies:**
- API Layer → Business Logic Layer (Function Calls)
- Business Logic → Data Access Layer (Database Queries)
- Controllers → Services (Business Logic Calls)
- Services → Models (Data Operations)

**Cross-Layer Dependencies:**
- Frontend → Backend (HTTP API Calls)
- Backend → Database (Query Operations)
- Backend → External Services (API Integrations)
- Components → Configuration (Environment Variables)

### 4.3.6 Collaboration Diagram

The Collaboration Diagram shows the interactions between objects to accomplish a specific task, focusing on the relationships and message passing.

#### User Authentication Collaboration

```
:User → :LoginForm: enterCredentials()
:LoginForm → :AuthController: submitLogin(credentials)
:AuthController → :UserService: validateUser(email, password)
:UserService → :Database: findUserByEmail(email)
:Database → :UserService: userData
:UserService → :PasswordUtil: verifyPassword(password, hash)
:PasswordUtil → :UserService: isValid
:UserService → :AuthController: validationResult
:AuthController → :TokenService: generateJWT(user)
:TokenService → :AuthController: token
:AuthController → :LoginForm: authResponse
:LoginForm → :SessionManager: storeSession(token, user)
:SessionManager → :Router: redirectToDashboard()
```

#### Sales Transaction Collaboration

```
:Cashier → :SalesForm: addProduct(productId, quantity)
:SalesForm → :ProductService: getProduct(productId)
:ProductService → :Database: findProduct(productId)
:Database → :ProductService: productData
:ProductService → :SalesForm: product
:SalesForm → :CartManager: addToCart(product, quantity)
:CartManager → :PriceCalculator: calculateItemTotal(product, quantity)
:PriceCalculator → :CartManager: itemTotal
:CartManager → :SalesForm: cartUpdated
:SalesForm → :PaymentProcessor: processPayment(total, method)
:PaymentProcessor → :SalesController: paymentSuccess
:SalesController → :InventoryService: updateStock(items)
:InventoryService → :Database: updateProductStock(items)
:Database → :InventoryService: stockUpdated
:InventoryService → :SalesController: inventoryUpdated
:SalesController → :ReceiptGenerator: generateReceipt(sale)
:ReceiptGenerator → :EmailService: sendReceipt(customer, receipt)
```

#### Inventory Management Collaboration

```
:InventoryManager → :InventoryForm: adjustStock(productId, quantity, reason)
:InventoryForm → :ValidationService: validateAdjustment(data)
:ValidationService → :InventoryForm: validationResult
:InventoryForm → :InventoryController: submitAdjustment(data)
:InventoryController → :ApprovalService: requiresApproval(adjustment)
:ApprovalService → :InventoryController: approvalRequired
:InventoryController → :NotificationService: sendApprovalRequest(adjustment)
:NotificationService → :Manager: approvalNotification
:Manager → :ApprovalService: approveAdjustment(adjustmentId)
:ApprovalService → :InventoryService: applyAdjustment(adjustment)
:InventoryService → :Database: updateProductStock(adjustment)
:Database → :InventoryService: stockUpdated
:InventoryService → :AlertService: checkReorderLevel(product)
:AlertService → :NotificationService: sendLowStockAlert(product)
```

### UML Diagram Integration and Consistency

#### Consistency Across Diagrams

**Entity Consistency:**
- Classes in Class Diagrams match entities in Use Cases
- Sequence interactions align with Component dependencies
- Activity flows correspond to Use Case scenarios
- Collaboration patterns reflect Component relationships

**Behavioral Consistency:**
- Activity Diagrams detail Use Case implementations
- Sequence Diagrams show method calls from Class Diagrams
- Collaboration Diagrams complement Sequence Diagrams
- Component interactions support Activity flows

**Structural Consistency:**
- Component organization reflects Class relationships
- Database design aligns with Class attributes
- API structure matches Component interfaces
- Service boundaries correspond to Class groupings

### Conclusion

The comprehensive UML diagram suite provides a complete visual representation of the Supermarket Inventory and Sales Management System. These diagrams serve multiple purposes:

**Design Documentation:**
- Clear visualization of system structure and behavior
- Comprehensive coverage of all system aspects
- Consistent modeling across different perspectives
- Professional documentation for stakeholders

**Development Guidance:**
- Blueprint for implementation teams
- Clear interface and interaction specifications
- Component organization and dependency guidance
- Database and API design foundations

**Communication Tool:**
- Common understanding for all stakeholders
- Visual representation for non-technical audiences
- Detailed specifications for developers
- Documentation for future maintenance and enhancement

The UML diagrams collectively ensure that all stakeholders have a clear, consistent understanding of the system design and can effectively contribute to its successful implementation.