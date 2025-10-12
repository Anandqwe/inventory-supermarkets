# CHAPTER 4: SYSTEM DESIGN

## 4.5 Entity Relationship Diagram (ERD)

The Entity Relationship Diagram provides a conceptual representation of the data structure and relationships within the Supermarket Inventory and Sales Management System. This diagram illustrates the entities, their attributes, and the relationships between them, serving as the foundation for the database design.

### 4.5.1 ERD Concepts and Notation

#### Entity Types

**Strong Entities:**
- Entities that can exist independently
- Have their own primary key
- Represented by rectangles
- Examples: User, Product, Branch, Customer

**Weak Entities:**
- Entities that depend on other entities for existence
- Cannot exist without their owner entity
- Represented by double rectangles
- Examples: SaleItem (depends on Sale), Stock (depends on Product)

#### Attributes

**Simple Attributes:**
- Atomic, indivisible attributes
- Represented by ovals
- Examples: firstName, email, price

**Composite Attributes:**
- Can be divided into smaller parts
- Represented by ovals with connected sub-ovals
- Examples: address (street, city, state, zipCode)

**Multi-valued Attributes:**
- Can have multiple values
- Represented by double ovals
- Examples: phoneNumbers, emailAddresses

**Derived Attributes:**
- Calculated from other attributes
- Represented by dashed ovals
- Examples: age (from birthDate), totalValue (from quantity × price)

#### Relationships

**One-to-One (1:1):**
- Each entity instance relates to exactly one instance of another entity
- Represented by straight line
- Examples: User ←→ Profile

**One-to-Many (1:M):**
- One entity instance relates to many instances of another entity
- Represented by line with crow's foot
- Examples: Branch ←→ Users, Category ←→ Products

**Many-to-Many (M:N):**
- Many instances of one entity relate to many instances of another
- Represented by lines with crow's feet on both ends
- Examples: Products ←→ Suppliers (through junction table)

### 4.5.2 Conceptual ERD

The Conceptual ERD shows the high-level entities and their relationships without implementation details.

```
                    [BRANCH]
                        │1
                        │
                        │M
                    [USER] ──1──── [AUDIT_LOG]
                        │M           │M
                        │            │
                        │1           │1
                    [SALE] ────M──── [PRODUCT]
                        │M           │1
                        │            │
                        │1           │M
                [SALE_ITEM]       [STOCK]
                        │            │
                        │M           │M
                        │            │
                        │1           │1
                  [CUSTOMER]     [CATEGORY]
                                     │1
                                     │
                                     │M
                                 [BRAND]
```

#### Core Business Entities

**BRANCH**
- Represents physical store locations
- Central entity for multi-branch operations
- Contains location and management information

**USER**
- Represents system users (admins, managers, cashiers)
- Contains authentication and authorization data
- Associated with specific branches

**PRODUCT**
- Represents items sold in the supermarket
- Contains product information and pricing
- Linked to categories and brands

**SALE**
- Represents customer transactions
- Contains transaction details and totals
- Links customers, users, and products

**CUSTOMER**
- Represents people who make purchases
- Contains contact and demographic information
- Linked to sales history

### 4.5.3 Logical ERD

The Logical ERD includes all entities, attributes, and relationships with cardinalities and constraints.

#### Branch Entity

```
[BRANCH]
├── branch_id (PK)
├── name
├── code (UK)
├── type (Hypermarket/Supermarket/Convenience)
├── address
│   ├── street
│   ├── city
│   ├── state
│   ├── pinCode
│   └── country
├── contactInfo
│   ├── phone
│   ├── email
│   └── website
├── manager_id (FK → User)
├── settings
│   ├── taxRate
│   ├── currency
│   └── businessHours
├── isActive
├── establishedDate
├── area (derived)
└── timestamps
    ├── createdAt
    └── updatedAt
```

**Relationships:**
- Branch (1) ←→ (M) User (branch assignment)
- Branch (1) ←→ (M) Sale (transaction location)
- Branch (1) ←→ (M) Stock (inventory per branch)
- Branch (1) ←→ (M) Transfer (source/destination)

#### User Entity

```
[USER]
├── user_id (PK)
├── personalInfo
│   ├── firstName
│   ├── lastName
│   ├── email (UK)
│   ├── phone (UK)
│   └── dateOfBirth
├── authentication
│   ├── password (hashed)
│   ├── role (Admin/Manager/Cashier/Inventory)
│   └── permissions []
├── employmentInfo
│   ├── employeeId (UK)
│   ├── designation
│   ├── department
│   ├── hireDate
│   └── salary (encrypted)
├── branch_id (FK → Branch)
├── address
│   ├── street
│   ├── city
│   ├── state
│   └── pinCode
├── profileImage
├── isActive
├── lastLogin
├── loginAttempts
└── timestamps
    ├── createdAt
    └── updatedAt
```

**Relationships:**
- User (M) ←→ (1) Branch (employment location)
- User (1) ←→ (M) Sale (cashier assignment)
- User (1) ←→ (M) AuditLog (activity tracking)
- User (1) ←→ (M) Adjustment (inventory changes)

#### Product Entity

```
[PRODUCT]
├── product_id (PK)
├── basicInfo
│   ├── name
│   ├── description
│   ├── sku (UK)
│   ├── barcode (UK)
│   └── slug
├── classification
│   ├── category_id (FK → Category)
│   ├── brand_id (FK → Brand)
│   ├── unit_id (FK → Unit)
│   └── tags []
├── pricing
│   ├── costPrice
│   ├── sellingPrice
│   ├── mrp
│   ├── marginPercentage (derived)
│   └── discountPercentage
├── inventory
│   ├── reorderLevel
│   ├── maxStockLevel
│   └── trackInventory
├── productDetails
│   ├── weight
│   ├── dimensions
│   │   ├── length
│   │   ├── width
│   │   └── height
│   ├── color
│   └── size
├── images []
│   ├── url
│   ├── altText
│   └── isPrimary
├── dateInfo
│   ├── expiryDate
│   ├── manufacturingDate
│   └── shelfLife
├── taxInfo
│   ├── taxCategory
│   ├── gstRate
│   └── hsnCode
├── isActive
├── isFeatured
└── timestamps
    ├── createdAt
    └── updatedAt
```

**Relationships:**
- Product (M) ←→ (1) Category (product classification)
- Product (M) ←→ (1) Brand (brand association)
- Product (M) ←→ (1) Unit (measurement unit)
- Product (1) ←→ (M) Stock (branch-wise inventory)
- Product (1) ←→ (M) SaleItem (sales transactions)
- Product (M) ←→ (M) Supplier (supply relationships)

#### Sale Entity

```
[SALE]
├── sale_id (PK)
├── saleNumber (UK)
├── transactionInfo
│   ├── saleDate
│   ├── saleTime
│   └── saleType (Regular/Return/Exchange)
├── parties
│   ├── customer_id (FK → Customer)
│   ├── cashier_id (FK → User)
│   └── branch_id (FK → Branch)
├── paymentInfo
│   ├── paymentMethod (Cash/Card/UPI/Wallet)
│   ├── paymentStatus (Pending/Completed/Failed)
│   ├── transactionId
│   └── paymentReference
├── amounts
│   ├── subtotal
│   ├── taxAmount
│   ├── discountAmount
│   ├── roundingAdjustment
│   └── grandTotal
├── additionalInfo
│   ├── notes
│   ├── reasonForDiscount
│   └── approvedBy
├── status (Draft/Completed/Cancelled/Returned)
├── receiptInfo
│   ├── receiptNumber
│   ├── receiptPrinted
│   └── emailSent
└── timestamps
    ├── createdAt
    └── updatedAt
```

**Relationships:**
- Sale (M) ←→ (1) Customer (transaction ownership)
- Sale (M) ←→ (1) User (cashier assignment)
- Sale (M) ←→ (1) Branch (transaction location)
- Sale (1) ←→ (M) SaleItem (purchased products)

#### SaleItem Entity (Weak Entity)

```
[SALE_ITEM]
├── saleitem_id (PK)
├── sale_id (FK → Sale) (Identifying relationship)
├── product_id (FK → Product)
├── productInfo (snapshot)
│   ├── productName
│   ├── productSku
│   └── productBarcode
├── quantity
├── unitInfo
│   ├── unitPrice
│   ├── originalPrice
│   └── costPrice
├── calculations
│   ├── lineDiscount
│   ├── lineDiscountPercentage
│   ├── lineTax
│   ├── lineTaxPercentage
│   └── lineTotal (derived)
├── notes
└── timestamps
    ├── createdAt
    └── updatedAt
```

**Relationships:**
- SaleItem (M) ←→ (1) Sale (identifying relationship)
- SaleItem (M) ←→ (1) Product (product reference)

#### Stock Entity (Weak Entity)

```
[STOCK]
├── stock_id (PK)
├── product_id (FK → Product) (Identifying relationship)
├── branch_id (FK → Branch) (Identifying relationship)
├── quantities
│   ├── currentStock
│   ├── reservedStock
│   ├── availableStock (derived)
│   └── damagedStock
├── levels
│   ├── reorderLevel
│   ├── maxLevel
│   └── minLevel
├── values
│   ├── stockValue (derived)
│   ├── averageCost
│   └── lastCostPrice
├── movements
│   ├── lastRestockDate
│   ├── lastSaleDate
│   └── turnoverRate (derived)
├── location
│   ├── aisle
│   ├── shelf
│   └── position
└── timestamps
    ├── createdAt
    └── updatedAt
```

**Relationships:**
- Stock (M) ←→ (1) Product (product reference)
- Stock (M) ←→ (1) Branch (location reference)

#### Customer Entity

```
[CUSTOMER]
├── customer_id (PK)
├── personalInfo
│   ├── firstName
│   ├── lastName
│   ├── dateOfBirth
│   └── gender
├── contactInfo
│   ├── primaryPhone (UK)
│   ├── secondaryPhone
│   ├── email
│   └── preferredContact
├── address
│   ├── street
│   ├── area
│   ├── city
│   ├── state
│   ├── pinCode
│   └── country
├── membershipInfo
│   ├── membershipNumber (UK)
│   ├── membershipType (Regular/Premium/VIP)
│   ├── joinDate
│   └── loyaltyPoints
├── preferences
│   ├── preferredBranch
│   ├── communicationPreference
│   └── interests []
├── statistics (derived)
│   ├── totalPurchases
│   ├── totalSpent
│   ├── averageOrderValue
│   ├── lastVisitDate
│   └── visitFrequency
├── isActive
└── timestamps
    ├── createdAt
    └── updatedAt
```

**Relationships:**
- Customer (1) ←→ (M) Sale (purchase history)
- Customer (M) ←→ (1) Branch (preferred branch)

#### Category Entity

```
[CATEGORY]
├── category_id (PK)
├── name
├── description
├── slug (UK)
├── hierarchy
│   ├── parent_id (FK → Category)
│   ├── level
│   └── path
├── displayInfo
│   ├── displayOrder
│   ├── icon
│   ├── color
│   └── image
├── seoInfo
│   ├── metaTitle
│   ├── metaDescription
│   └── keywords []
├── isActive
├── isFeatured
└── timestamps
    ├── createdAt
    └── updatedAt
```

**Relationships:**
- Category (1) ←→ (M) Product (product classification)
- Category (1) ←→ (M) Category (parent-child hierarchy)

#### Brand Entity

```
[BRAND]
├── brand_id (PK)
├── name
├── description
├── slug (UK)
├── companyInfo
│   ├── companyName
│   ├── website
│   ├── country
│   └── establishedYear
├── displayInfo
│   ├── logo
│   ├── banner
│   └── brandColors
├── contactInfo
│   ├── email
│   ├── phone
│   └── address
├── statistics (derived)
│   ├── productCount
│   ├── totalSales
│   └── popularity
├── isActive
├── isFeatured
└── timestamps
    ├── createdAt
    └── updatedAt
```

**Relationships:**
- Brand (1) ←→ (M) Product (brand association)

### 4.5.4 Supporting Entities

#### Supplier Entity

```
[SUPPLIER]
├── supplier_id (PK)
├── companyInfo
│   ├── companyName
│   ├── contactPerson
│   ├── designation
│   └── registrationNumber
├── contactInfo
│   ├── email
│   ├── phone
│   ├── alternatePhone
│   └── website
├── address
│   ├── street
│   ├── city
│   ├── state
│   ├── pinCode
│   └── country
├── businessInfo
│   ├── gstNumber
│   ├── panNumber
│   ├── businessType
│   └── paymentTerms
├── bankInfo
│   ├── bankName
│   ├── accountNumber (encrypted)
│   ├── ifscCode
│   └── accountType
├── performance
│   ├── rating
│   ├── totalOrders
│   ├── onTimeDelivery
│   └── qualityRating
├── isActive
├── isApproved
└── timestamps
    ├── createdAt
    └── updatedAt
```

**Relationships:**
- Supplier (M) ←→ (M) Product (supply relationships)
- Supplier (1) ←→ (M) Purchase (purchase orders)

#### Purchase Entity

```
[PURCHASE]
├── purchase_id (PK)
├── purchaseNumber (UK)
├── parties
│   ├── supplier_id (FK → Supplier)
│   ├── branch_id (FK → Branch)
│   └── createdBy (FK → User)
├── orderInfo
│   ├── orderDate
│   ├── expectedDelivery
│   ├── actualDelivery
│   └── priority
├── amounts
│   ├── subtotal
│   ├── taxAmount
│   ├── discountAmount
│   ├── shippingCharges
│   └── grandTotal
├── status (Draft/Ordered/Delivered/Cancelled)
├── paymentInfo
│   ├── paymentStatus
│   ├── paymentDue
│   └── paymentTerms
├── notes
└── timestamps
    ├── createdAt
    └── updatedAt
```

**Relationships:**
- Purchase (M) ←→ (1) Supplier (supplier reference)
- Purchase (M) ←→ (1) Branch (delivery location)
- Purchase (M) ←→ (1) User (created by)
- Purchase (1) ←→ (M) PurchaseItem (ordered products)

#### Adjustment Entity

```
[ADJUSTMENT]
├── adjustment_id (PK)
├── adjustmentNumber (UK)
├── productInfo
│   ├── product_id (FK → Product)
│   └── branch_id (FK → Branch)
├── adjustmentDetails
│   ├── type (Increase/Decrease/Damage/Lost/Found)
│   ├── quantity
│   ├── oldQuantity
│   ├── newQuantity
│   └── reason
├── valueInfo
│   ├── unitCost
│   ├── totalValue
│   └── impactValue
├── approvalInfo
│   ├── requiresApproval
│   ├── approvedBy (FK → User)
│   ├── approvalDate
│   └── approvalNotes
├── auditInfo
│   ├── createdBy (FK → User)
│   ├── adjustmentDate
│   └── reference
├── status (Pending/Approved/Rejected)
└── timestamps
    ├── createdAt
    └── updatedAt
```

**Relationships:**
- Adjustment (M) ←→ (1) Product (adjusted product)
- Adjustment (M) ←→ (1) Branch (adjustment location)
- Adjustment (M) ←→ (1) User (created by)
- Adjustment (M) ←→ (1) User (approved by)

#### Transfer Entity

```
[TRANSFER]
├── transfer_id (PK)
├── transferNumber (UK)
├── branchInfo
│   ├── fromBranch_id (FK → Branch)
│   ├── toBranch_id (FK → Branch)
│   └── transferType (Regular/Emergency/Return)
├── requestInfo
│   ├── requestedBy (FK → User)
│   ├── requestDate
│   ├── reason
│   └── priority
├── approvalInfo
│   ├── approvedBy (FK → User)
│   ├── approvalDate
│   └── approvalNotes
├── shippingInfo
│   ├── shippedDate
│   ├── expectedDelivery
│   ├── actualDelivery
│   └── trackingNumber
├── status (Requested/Approved/Shipped/Delivered/Cancelled)
├── totalValue
├── notes
└── timestamps
    ├── createdAt
    └── updatedAt
```

**Relationships:**
- Transfer (M) ←→ (1) Branch (from branch)
- Transfer (M) ←→ (1) Branch (to branch)
- Transfer (M) ←→ (1) User (requested by)
- Transfer (M) ←→ (1) User (approved by)
- Transfer (1) ←→ (M) TransferItem (transferred products)

### 4.5.5 Junction Tables for Many-to-Many Relationships

#### ProductSupplier Entity

```
[PRODUCT_SUPPLIER]
├── product_id (FK → Product) (Composite PK)
├── supplier_id (FK → Supplier) (Composite PK)
├── supplierProductCode
├── supplierProductName
├── costPrice
├── minimumOrderQuantity
├── leadTimeDays
├── isPreferred
├── lastOrderDate
├── totalOrdered
└── timestamps
    ├── createdAt
    └── updatedAt
```

### 4.5.6 Physical ERD Considerations

#### Indexing Strategy

**Primary Indexes:**
- All primary keys automatically indexed
- Composite keys for junction tables
- Foreign key constraints with indexes

**Secondary Indexes:**
```sql
-- User management
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_branch ON users(branch_id);
CREATE INDEX idx_user_role ON users(role);

-- Product management
CREATE INDEX idx_product_sku ON products(sku);
CREATE INDEX idx_product_barcode ON products(barcode);
CREATE INDEX idx_product_category ON products(category_id);
CREATE INDEX idx_product_brand ON products(brand_id);

-- Sales analysis
CREATE INDEX idx_sale_date ON sales(sale_date);
CREATE INDEX idx_sale_branch ON sales(branch_id);
CREATE INDEX idx_sale_customer ON sales(customer_id);
CREATE INDEX idx_sale_status ON sales(status);

-- Inventory tracking
CREATE INDEX idx_stock_branch_product ON stocks(branch_id, product_id);
CREATE INDEX idx_stock_low_level ON stocks(current_stock, reorder_level);

-- Customer analysis
CREATE INDEX idx_customer_phone ON customers(primary_phone);
CREATE INDEX idx_customer_membership ON customers(membership_number);
```

**Composite Indexes:**
```sql
-- Multi-column searches
CREATE INDEX idx_product_category_brand ON products(category_id, brand_id);
CREATE INDEX idx_sale_branch_date ON sales(branch_id, sale_date);
CREATE INDEX idx_stock_branch_low ON stocks(branch_id, current_stock, reorder_level);
```

#### Partitioning Strategy

**Sales Table Partitioning:**
```sql
-- Monthly partitions for sales data
PARTITION BY RANGE (YEAR(sale_date), MONTH(sale_date))
(
    PARTITION p202401 VALUES LESS THAN (2024, 2),
    PARTITION p202402 VALUES LESS THAN (2024, 3),
    -- Continue for each month
);
```

**Audit Log Partitioning:**
```sql
-- Weekly partitions for audit logs
PARTITION BY RANGE (YEARWEEK(created_at))
(
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    -- Continue for each week
);
```

### 4.5.7 Data Integrity Constraints

#### Referential Integrity

**Foreign Key Constraints:**
- All foreign keys enforce referential integrity
- CASCADE DELETE for dependent entities
- RESTRICT DELETE for referenced entities
- UPDATE CASCADE for key changes

**Check Constraints:**
```sql
-- Price validations
ALTER TABLE products ADD CONSTRAINT chk_price_positive 
CHECK (cost_price >= 0 AND selling_price >= 0);

-- Stock validations  
ALTER TABLE stocks ADD CONSTRAINT chk_stock_non_negative 
CHECK (current_stock >= 0);

-- Quantity validations
ALTER TABLE sale_items ADD CONSTRAINT chk_quantity_positive 
CHECK (quantity > 0);

-- Date validations
ALTER TABLE sales ADD CONSTRAINT chk_sale_date_valid 
CHECK (sale_date <= CURRENT_DATE);
```

#### Business Rules

**Inventory Rules:**
- Stock cannot go below zero
- Reorder level must be less than max level
- Sale quantity cannot exceed available stock

**Financial Rules:**
- All monetary amounts must be non-negative
- Sale totals must equal sum of line items
- Tax calculations must be accurate

**User Rules:**
- Email addresses must be unique
- Users must be assigned to valid branches
- Role permissions must be properly configured

### 4.5.8 ERD Validation and Normalization

#### Normalization Analysis

**First Normal Form (1NF):**
- All attributes contain atomic values
- No repeating groups
- Each record is unique

**Second Normal Form (2NF):**
- Meets 1NF requirements
- No partial dependencies on composite keys
- All non-key attributes depend on entire primary key

**Third Normal Form (3NF):**
- Meets 2NF requirements
- No transitive dependencies
- All non-key attributes depend only on primary key

**Boyce-Codd Normal Form (BCNF):**
- Meets 3NF requirements
- Every determinant is a candidate key
- No anomalies in functional dependencies

#### Denormalization Considerations

**Performance Optimization:**
- Customer statistics stored for quick access
- Product stock summaries for dashboard display
- Cached report data for frequent queries

**Acceptable Redundancy:**
- Product information in sale items (historical accuracy)
- User names in audit logs (reporting convenience)
- Branch information in transactions (query optimization)

### Conclusion

The Entity Relationship Diagram provides a comprehensive data model for the Supermarket Inventory and Sales Management System. Key benefits include:

**Data Structure Foundation:**
- Clear definition of all system entities
- Proper relationship modeling
- Comprehensive attribute specification
- Business rule enforcement

**Database Design Blueprint:**
- Table structure specifications
- Index and constraint definitions
- Partitioning and optimization strategies
- Data integrity enforcement

**System Integration Guide:**
- Clear data flow understanding
- Relationship impact analysis
- Query optimization planning
- Scalability considerations

The ERD ensures that the database design can effectively support all business operations while maintaining data integrity, performance, and scalability for future growth.