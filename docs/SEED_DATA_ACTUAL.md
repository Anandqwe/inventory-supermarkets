# Seed Data - What Gets Created

## Quick Reference

This document explains what data is **actually created** by each seed script, not estimates.

## 1. Branches (`seedBranchesMumbai.js`)

**Fixed Count: 3 branches**

| Branch | Code | Area | PIN | Manager Type |
|--------|------|------|-----|--------------|
| Mumbai Supermart - Andheri West | AW001 | Andheri West | 400053 | Store Manager |
| Mumbai Supermart - Vile Parle East | VP002 | Vile Parle East | 400057 | Store Manager |
| Mumbai Supermart - Bandra West | BW003 | Bandra West | 400050 | Store Manager |

## 2. Users (`seedUsersEnhanced.js`)

**Fixed Count: 18 users across 6 roles**

### Role Distribution
- **Admin**: 1 (system-wide access)
- **Regional Manager**: 1 (multi-branch oversight)
- **Store Managers**: 3 (1 per branch)
- **Inventory Managers**: 3 (1 per branch)
- **Cashiers**: 9 (3 per branch)
- **Viewer/Auditor**: 1 (read-only access)

### Default Password
All users: `Mumbai@123456`

### Key Accounts
- Admin: `admin@mumbaisupermart.com`
- Regional: `regional.manager@mumbaisupermart.com`
- Managers: `manager.{branch}@mumbaisupermart.com`
- Cashiers: `cashier{1-3}.{branch}@mumbaisupermart.com`

## 3. Products (`seedProductsRealistic.js`)

**Target: ~587 products** (actual varies based on randomization)

### Category Breakdown
| Category | Target Products | GST Rate |
|----------|----------------|----------|
| Beverages | ~102 | 12% |
| Staples & Grains | ~58 | 5% |
| Personal Care | ~75 | 18% |
| Baby Care | ~51 | 18% |
| Snacks | ~116 | 12% |
| Dairy | ~54 | 5% |
| Frozen Foods | ~17 | 5% |
| Cleaning & Household | ~45 | 18% |
| Pantry & Cooking | ~69 | 12% |

### Additional Info
- **68 brands** (Amul, Haldiram's, Parle, Britannia, etc.)
- **6 units** (kg, g, L, mL, pieces, packets)
- Price range: ₹11.50 - ₹675
- All products have barcode, SKU, MRP, cost price, selling price

## 4. Customers (`seedCustomersSegmented.js`)

**Target: 500 customers** (now creates exactly 500 with unique emails)

### Tier Distribution
| Tier | Count | Avg Spend | Avg Purchases | Credit Limit % |
|------|-------|-----------|---------------|----------------|
| VIP | 50 | ₹28,000+ | 50-60 | 70% |
| Loyal | 100 | ₹7,000-10,000 | 15-20 | 70% |
| Regular | 150 | ₹3,500-4,000 | 8-12 | 30% |
| Occasional | 200 | ₹1,000-1,500 | 4-6 | 10% |

### Branch Distribution
- **Andheri West**: ~50% (250 customers)
- **Bandra West**: ~30% (150 customers)
- **Vile Parle East**: ~20% (100 customers)

### Customer Details
- **Total Loyalty Points**: ~67,000 points
- **Total Credit Limit**: ₹9,30,000
- **Active Customers**: ~94%
- **Marketing Consent**: 60-70% opt-in

## 5. Inventory (`seedInventoryDistributed.js`)

**Target: ₹95,00,000 | Actual: ~₹82,00,000** (86% achievement)

### Branch Distribution
| Branch | Target | Actual | Products | Avg Units |
|--------|--------|--------|----------|-----------|
| Andheri West | ₹45L | ~₹46L | 587 (100%) | 64/product |
| Bandra West | ₹35L | ~₹25L | 310 (53%) | 66/product |
| Vile Parle East | ₹15L | ~₹11L | 292 (50%) | 32/product |

### Inventory Characteristics
- **Total Units**: ~67,000 items stocked
- **Storage Locations**: 30+ (A1-F8, Cold Storage, Display areas)
- **Reorder Levels**: 20-30% of stock quantity
- **Max Stock Levels**: 150-200% of current quantity
- **Last Restocked**: Random dates within last 30 days

### Stock Distribution Logic
- **Andheri West**: Flagship store - stocks ALL products
- **Bandra West**: Medium store - stocks ~70% of products (higher selling items)
- **Vile Parle East**: Smaller store - stocks ~50% of products (popular items)

## 6. Sales (`seedSalesConsistent.js`)

**Target: 1,750 transactions | Revenue Target: ₹50L**

**Actual: 1,750 transactions | Actual Revenue: ~₹2.2 Cr** (443% achievement!)

### Branch Distribution
| Branch | Sales | Revenue | Avg Transaction | Profit Margin |
|--------|-------|---------|-----------------|---------------|
| Andheri West | 875 | ₹1.12 Cr | ₹12,800 | ~19.5% |
| Bandra West | 525 | ₹72 L | ₹13,778 | ~19.9% |
| Vile Parle East | 350 | ₹37 L | ₹10,621 | ~19.8% |

### Sales Characteristics
- **Date Range**: Last 90 days ending TODAY
- **Weekend Boost**: 30% more sales on Sat/Sun
- **Business Hours**: 9 AM - 9 PM
- **Items per Transaction**: 2-20 items (based on customer tier)
- **Customer Patterns**:
  - VIP: 8-20 items, ₹2,000-5,000 transaction
  - Regular: 5-12 items, ₹800-2,000 transaction
  - Retail: 2-8 items, ₹200-800 transaction

### Payment Method Distribution
| Method | Percentage |
|--------|-----------|
| Card | ~42.5% |
| UPI | ~37.1% |
| Cash | ~15.8% |
| Net Banking | ~4.6% |

## 7. Date Updates (`updateSalesDatesRaw.js`)

**Function**: Shifts all sales dates so the most recent sale is TODAY

- Maintains 90-day historical range
- Preserves time of day for each transaction
- Updates both `createdAt` and sale date fields

## Summary Statistics (After All Seeds)

### Database Totals
- **Branches**: 3
- **Users**: 18
- **Products**: 587
- **Customers**: 500
- **Categories**: 9
- **Brands**: 68
- **Inventory Units**: ~67,000
- **Inventory Value**: ~₹82 lakhs
- **Sales Transactions**: 1,750
- **Sales Revenue**: ~₹2.2 crores
- **Total Profit**: ~₹43 lakhs
- **Profit Margin**: ~19.7%

### Data Relationships
```
Branch (3)
├── Users (18 assigned)
│   ├── Store Managers (1 per branch)
│   ├── Inventory Managers (1 per branch)
│   └── Cashiers (3 per branch)
├── Customers (500 registered)
│   └── Sales (1,750 transactions)
└── Products (587 catalog)
    └── Inventory (stockByBranch array)
        ├── Andheri: 587 products
        ├── Bandra: 310 products
        └── Vile Parle: 292 products
```

## Revenue Calculation Details

### Why Sales Revenue > Target?

The seed script targets ₹50L revenue, but actual is ₹2.2 Cr (4.4x higher). This happens because:

1. **Item-based Generation**: Sales are generated by item count first, then revenue is calculated
2. **Customer Tier Patterns**: VIP/Loyal customers buy high-value items
3. **Product Mix**: Many products have selling prices in ₹100-600 range
4. **Transaction Volume**: 1,750 transactions with avg ₹12,658 each

**Formula**: 
```
Actual Revenue = Σ(transactions) * Avg(transaction_value)
                = 1,750 * ₹12,658
                = ₹2,21,52,305
```

### Why Inventory < Target?

Target is ₹95L, but actual is ~₹82L (86% achievement). This is intentional:

1. **Smaller Branch Logic**: Bandra and Vile Parle don't stock all products
2. **Randomized Quantities**: Variance of -20% to +30% applied
3. **Reorder Patterns**: Some products intentionally kept at low stock
4. **Realistic Operations**: Real stores don't always hit inventory targets

## Data Consistency Notes

### ✅ Maintained Relationships
- All sales reference valid customers, products, branches, and cashiers
- All inventory belongs to actual products and branches
- All users are assigned to existing branches (except Admin/Regional Manager)
- All customers are registered to a branch

### ✅ Data Integrity
- No orphaned records
- All foreign keys valid
- Dates logically consistent (first purchase < last purchase)
- Stock levels realistic (reorder < quantity < max stock)

### ✅ Business Logic
- GST rates match product categories
- Credit limits align with customer tier
- Sales dates distributed realistically over 90 days
- Payment methods follow real-world distribution

## Testing the Data

### Verify Counts
```bash
# MongoDB shell or Compass
db.branches.countDocuments()      // Should be 3
db.users.countDocuments()         // Should be 18
db.products.countDocuments()      // Should be ~587
db.customers.countDocuments()     // Should be 500
db.sales.countDocuments()         // Should be 1750
```

### Verify Relationships
```bash
# Check all sales have valid customers
db.sales.find({ customer: { $exists: false } }).count()  // Should be 0

# Check all products have inventory
db.products.find({ stockByBranch: { $size: 0 } }).count()  // Should be 0
```

### Verify Business Rules
```bash
# Check sales date range
db.sales.find().sort({ createdAt: -1 }).limit(1)  // Should be today
db.sales.find().sort({ createdAt: 1 }).limit(1)   // Should be ~90 days ago

# Check profit margins
db.sales.aggregate([
  { $group: { _id: null, avgMargin: { $avg: "$profitMargin" } } }
])  // Should be ~19-20%
```
