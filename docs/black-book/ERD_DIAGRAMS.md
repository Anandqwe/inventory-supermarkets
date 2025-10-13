# Entity Relationship Diagrams (ERD)

## Overview
Entity Relationship Diagrams (ERD) illustrate the database structure of the Supermarket Inventory Management System. These diagrams show entities (tables), their attributes, and relationships, providing a comprehensive view of data organization and dependencies.

---

## Complete ERD - System Overview

### Description
The complete ERD shows all major entities in the system with their relationships. This includes User, Branch, Product, Sale, Purchase, Inventory operations, and master data entities. The diagram demonstrates one-to-many and many-to-many relationships throughout the database.

### Diagram Code (PlantUML)
```
@startuml
!define PK <u>
!define FK <i>

entity "User" as User {
  PK _id : ObjectId
  --
  firstName : String
  lastName : String
  email : String
  password : String
  role : String
  permissions : Array
  FK branch : ObjectId
  phone : String
  isActive : Boolean
  lastLogin : Date
  createdAt : Date
  updatedAt : Date
}

entity "Branch" as Branch {
  PK _id : ObjectId
  --
  name : String
  code : String
  address : Object
  phone : String
  email : String
  FK manager : ObjectId
  type : String
  isActive : Boolean
  createdAt : Date
  updatedAt : Date
}

entity "Product" as Product {
  PK _id : ObjectId
  --
  name : String
  description : String
  sku : String
  barcode : String
  FK category : ObjectId
  FK brand : ObjectId
  FK unit : ObjectId
  stocks : Array
  price : Number
  cost : Number
  tax : Number
  expiryDate : Date
  isActive : Boolean
  createdAt : Date
  updatedAt : Date
}

entity "Category" as Category {
  PK _id : ObjectId
  --
  name : String
  description : String
  isActive : Boolean
  createdAt : Date
  updatedAt : Date
}

entity "Brand" as Brand {
  PK _id : ObjectId
  --
  name : String
  description : String
  isActive : Boolean
  createdAt : Date
  updatedAt : Date
}

entity "Unit" as Unit {
  PK _id : ObjectId
  --
  name : String
  symbol : String
  description : String
  isActive : Boolean
  createdAt : Date
  updatedAt : Date
}

entity "Sale" as Sale {
  PK _id : ObjectId
  --
  saleNumber : String
  items : Array
  FK customer : ObjectId
  FK branch : ObjectId
  FK cashier : ObjectId
  paymentMethod : String
  subtotal : Number
  tax : Number
  discount : Number
  total : Number
  status : String
  date : Date
  createdAt : Date
  updatedAt : Date
}

entity "Customer" as Customer {
  PK _id : ObjectId
  --
  name : String
  phone : String
  email : String
  address : String
  totalPurchases : Number
  createdAt : Date
  updatedAt : Date
}

entity "Purchase" as Purchase {
  PK _id : ObjectId
  --
  purchaseNumber : String
  FK supplier : ObjectId
  items : Array
  FK branch : ObjectId
  subtotal : Number
  tax : Number
  total : Number
  status : String
  date : Date
  createdAt : Date
  updatedAt : Date
}

entity "Supplier" as Supplier {
  PK _id : ObjectId
  --
  name : String
  company : String
  email : String
  phone : String
  address : String
  rating : Number
  totalOrders : Number
  createdAt : Date
  updatedAt : Date
}

entity "Adjustment" as Adjustment {
  PK _id : ObjectId
  --
  FK product : ObjectId
  FK branch : ObjectId
  type : String
  quantity : Number
  reason : String
  FK adjustedBy : ObjectId
  date : Date
  createdAt : Date
  updatedAt : Date
}

entity "Transfer" as Transfer {
  PK _id : ObjectId
  --
  FK fromBranch : ObjectId
  FK toBranch : ObjectId
  items : Array
  status : String
  FK requestedBy : ObjectId
  FK approvedBy : ObjectId
  date : Date
  createdAt : Date
  updatedAt : Date
}

' Relationships
Branch ||--o{ User : "has employees"
Branch ||--o{ Sale : "processes"
Branch ||--o{ Purchase : "receives"
Branch ||--o{ Adjustment : "records"
Branch ||--o{ Transfer : "sends/receives"

User ||--o{ Sale : "cashier processes"
User ||--o{ Adjustment : "performs"
User ||--o{ Transfer : "requests/approves"

Product }o--|| Category : "belongs to"
Product }o--|| Brand : "belongs to"
Product }o--|| Unit : "measured in"
Product ||--o{ Adjustment : "adjusted"

Sale }o--|| Customer : "made by"
Sale }o--|| Branch : "at"
Sale }o--|| User : "processed by"

Purchase }o--|| Supplier : "from"
Purchase }o--|| Branch : "received at"

Transfer }o--|| Branch : "from"
Transfer }o--|| Branch : "to"
@enduml
```

---

## User-Branch-Role ERD

### Description
This ERD focuses on the user management system, showing the relationship between Users, Branches, Roles, and Permissions. It illustrates the role-based access control (RBAC) structure and how users are assigned to specific branches.

### Diagram Code (PlantUML)
```
@startuml
!define PK <u>
!define FK <i>

entity "User" as User {
  PK _id : ObjectId
  --
  firstName : String
  lastName : String
  email : String
  password : String
  role : String
  permissions : Array[String]
  FK branch : ObjectId
  phone : String
  isActive : Boolean
  lastLogin : Date
  createdAt : Date
  updatedAt : Date
}

entity "Branch" as Branch {
  PK _id : ObjectId
  --
  name : String
  code : String
  address : Object
  phone : String
  email : String
  FK manager : ObjectId
  type : String
  isActive : Boolean
  createdAt : Date
  updatedAt : Date
}

entity "Role" as Role {
  role : String
  --
  ADMIN
  MANAGER
  CASHIER
  INVENTORY_CLERK
}

entity "Permission" as Permission {
  permission : String
  --
  VIEW_PRODUCTS
  MANAGE_PRODUCTS
  MAKE_SALES
  MANAGE_INVENTORY
  VIEW_REPORTS
  MANAGE_USERS
}

Branch ||--o{ User : "has employees"
Branch ||--|| User : "managed by"
User }o--|| Role : "has role"
User }o--o{ Permission : "has permissions"
@enduml
```

---

## Product-Inventory ERD

### Description
This ERD illustrates the product and inventory management structure. It shows how products are related to categories, brands, units, and how stock is tracked across multiple branches with adjustments and transfers.

### Diagram Code (PlantUML)
```
@startuml
!define PK <u>
!define FK <i>

entity "Product" as Product {
  PK _id : ObjectId
  --
  name : String
  description : String
  sku : String
  barcode : String
  FK category : ObjectId
  FK brand : ObjectId
  FK unit : ObjectId
  stocks : Array[Stock]
  price : Number
  cost : Number
  tax : Number
  expiryDate : Date
  isActive : Boolean
  createdAt : Date
  updatedAt : Date
}

entity "Stock" as Stock {
  FK branch : ObjectId
  quantity : Number
  reorderLevel : Number
  lastUpdated : Date
}

entity "Category" as Category {
  PK _id : ObjectId
  --
  name : String
  description : String
  isActive : Boolean
  createdAt : Date
  updatedAt : Date
}

entity "Brand" as Brand {
  PK _id : ObjectId
  --
  name : String
  description : String
  isActive : Boolean
  createdAt : Date
  updatedAt : Date
}

entity "Unit" as Unit {
  PK _id : ObjectId
  --
  name : String
  symbol : String
  description : String
  isActive : Boolean
  createdAt : Date
  updatedAt : Date
}

entity "Adjustment" as Adjustment {
  PK _id : ObjectId
  --
  FK product : ObjectId
  FK branch : ObjectId
  type : String
  quantity : Number
  reason : String
  FK adjustedBy : ObjectId
  date : Date
  createdAt : Date
  updatedAt : Date
}

entity "Transfer" as Transfer {
  PK _id : ObjectId
  --
  FK fromBranch : ObjectId
  FK toBranch : ObjectId
  items : Array[TransferItem]
  status : String
  FK requestedBy : ObjectId
  FK approvedBy : ObjectId
  date : Date
  createdAt : Date
  updatedAt : Date
}

entity "Branch" as Branch {
  PK _id : ObjectId
  --
  name : String
  code : String
}

Product }o--|| Category : "belongs to"
Product }o--|| Brand : "belongs to"
Product }o--|| Unit : "measured in"
Product ||--o{ Stock : "has stock at"
Product ||--o{ Adjustment : "adjusted"
Product ||--o{ Transfer : "transferred"
Stock }o--|| Branch : "at branch"
Adjustment }o--|| Branch : "at branch"
Transfer }o--|| Branch : "from/to"
@enduml
```

---

## Sales-Transaction ERD

### Description
This ERD focuses on the sales processing system, showing how sales transactions are recorded with customers, cashiers, branches, and sale items. It demonstrates the complete sales flow from transaction to payment.

### Diagram Code (PlantUML)
```
@startuml
!define PK <u>
!define FK <i>

entity "Sale" as Sale {
  PK _id : ObjectId
  --
  saleNumber : String
  items : Array[SaleItem]
  FK customer : ObjectId
  FK branch : ObjectId
  FK cashier : ObjectId
  paymentMethod : String
  subtotal : Number
  tax : Number
  discount : Number
  total : Number
  status : String
  date : Date
  createdAt : Date
  updatedAt : Date
}

entity "SaleItem" as SaleItem {
  FK product : ObjectId
  productName : String
  sku : String
  quantity : Number
  unitPrice : Number
  discount : Number
  tax : Number
  subtotal : Number
  total : Number
}

entity "Customer" as Customer {
  PK _id : ObjectId
  --
  name : String
  phone : String
  email : String
  address : String
  totalPurchases : Number
  lastPurchaseDate : Date
  createdAt : Date
  updatedAt : Date
}

entity "Branch" as Branch {
  PK _id : ObjectId
  --
  name : String
  code : String
  address : Object
}

entity "User" as User {
  PK _id : ObjectId
  --
  firstName : String
  lastName : String
  email : String
  role : String
}

entity "Product" as Product {
  PK _id : ObjectId
  --
  name : String
  sku : String
  price : Number
}

entity "Invoice" as Invoice {
  PK _id : ObjectId
  --
  FK sale : ObjectId
  invoiceNumber : String
  generatedDate : Date
  pdfUrl : String
}

Sale ||--o{ SaleItem : "contains"
Sale }o--|| Customer : "made by"
Sale }o--|| Branch : "at branch"
Sale }o--|| User : "processed by (cashier)"
Sale ||--|| Invoice : "generates"
SaleItem }o--|| Product : "references"
@enduml
```

---

## Purchase-Supplier ERD

### Description
This ERD illustrates the purchase and supplier management structure. It shows how purchases are recorded from suppliers, including purchase items and their relationship with products and branches.

### Diagram Code (PlantUML)
```
@startuml
!define PK <u>
!define FK <i>

entity "Purchase" as Purchase {
  PK _id : ObjectId
  --
  purchaseNumber : String
  FK supplier : ObjectId
  items : Array[PurchaseItem]
  FK branch : ObjectId
  subtotal : Number
  tax : Number
  total : Number
  status : String
  date : Date
  createdAt : Date
  updatedAt : Date
}

entity "PurchaseItem" as PurchaseItem {
  FK product : ObjectId
  productName : String
  quantity : Number
  unitCost : Number
  tax : Number
  total : Number
}

entity "Supplier" as Supplier {
  PK _id : ObjectId
  --
  name : String
  company : String
  email : String
  phone : String
  address : String
  rating : Number
  totalOrders : Number
  lastOrderDate : Date
  createdAt : Date
  updatedAt : Date
}

entity "Branch" as Branch {
  PK _id : ObjectId
  --
  name : String
  code : String
  address : Object
}

entity "Product" as Product {
  PK _id : ObjectId
  --
  name : String
  sku : String
  cost : Number
}

Purchase }o--|| Supplier : "from supplier"
Purchase }o--|| Branch : "received at"
Purchase ||--o{ PurchaseItem : "contains"
PurchaseItem }o--|| Product : "references"
Supplier ||--o{ Purchase : "supplies"
@enduml
```

---

## Summary

### Core Entities
- **User** - System users with roles and permissions
- **Branch** - Store locations with managers and employees
- **Product** - Product catalog with pricing and stock info
- **Category/Brand/Unit** - Master data for product classification
- **Sale** - Sales transactions with items and payments
- **Customer** - Customer information and purchase history
- **Purchase** - Inventory purchases from suppliers
- **Supplier** - Vendor information and ratings
- **Adjustment** - Inventory adjustments (add/remove/damage)
- **Transfer** - Inter-branch stock transfers

### Key Relationships
- **One-to-Many**: Branch → Users, Branch → Sales, Product → Stock
- **Many-to-One**: Product → Category, Sale → Customer, Purchase → Supplier
- **Self-referencing**: Branch manages Branch (through manager)
- **Embedded Arrays**: Sale contains SaleItems, Product contains Stocks

### Database Design Features
- **Primary Keys** - ObjectId (MongoDB) for all entities
- **Foreign Keys** - References to related entities
- **Embedded Documents** - Stocks in Products, Items in Sales
- **Indexes** - On email, SKU, barcode, saleNumber for performance
- **Timestamps** - createdAt and updatedAt for audit trail
- **Soft Deletes** - isActive flag for logical deletion

### Data Integrity
- **Referential Integrity** - Foreign key relationships maintained
- **Data Validation** - Required fields, unique constraints
- **Business Rules** - Stock validation, role-based permissions
- **Audit Trail** - All transactions logged with user and timestamp
