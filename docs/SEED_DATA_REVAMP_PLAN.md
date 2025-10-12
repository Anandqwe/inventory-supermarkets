# Seed Data Revamp Plan - Mumbai Supermarket Chain

## Executive Summary
Complete overhaul of seed data to create a realistic, consistent Mumbai-based supermarket chain with 3 branches, improved user roles, and accurate financial calculations across all pages.

---

## 🎯 Current Problems Identified

### 1. **Branch Issues**
- ❌ Currently 8 branches spread across different cities
- ❌ Inconsistent inventory across branches
- ❌ Unrealistic geographical spread
- ❌ Complex to manage and verify data consistency

### 2. **User Role Issues**
- ❌ Generic Manager and Cashier roles
- ❌ No clear separation of responsibilities
- ❌ Missing important retail roles like Store Manager, Inventory Manager
- ❌ No branch-specific role assignments

### 3. **Data Consistency Issues**
- ❌ Different sales totals shown on different pages
- ❌ Profit calculations don't match across reports
- ❌ Inventory values inconsistent between Dashboard and Reports
- ❌ GST calculations sometimes incorrect
- ❌ Customer data doesn't align with sales data
- ❌ Payment method totals don't add up correctly

### 4. **Product & Pricing Issues**
- ❌ Products have unrealistic pricing (₹0 cost price)
- ❌ Missing GST rates on some products
- ❌ Inconsistent product availability across branches
- ❌ Low stock alerts not realistic
- ❌ No seasonal product variations

---

## ✅ Proposed Solution

### Phase 1: Branch Restructuring (Mumbai Focus)

#### **3 Strategic Branches in Mumbai**

**Branch 1: Andheri West (Flagship Store)**
- Location: Link Road, Andheri West, Mumbai - 400053
- Type: Large format store (3000 sq ft)
- Specialty: Full range - Grocery, Fresh Produce, Personal Care, Electronics
- Staff: 12 employees
- Operating Hours: 8 AM - 11 PM
- Branch Code: AW001

**Branch 2: Vile Parle East (Express Store)**
- Location: Nehru Road, Vile Parle East, Mumbai - 400057
- Type: Express store (1500 sq ft)
- Specialty: Quick essentials - Dairy, Snacks, Beverages, Daily needs
- Staff: 8 employees
- Operating Hours: 7 AM - 10 PM
- Branch Code: VP002

**Branch 3: Bandra West (Premium Store)**
- Location: Turner Road, Bandra West, Mumbai - 400050
- Type: Premium store (2500 sq ft)
- Specialty: Premium products, Organic, Imported items, Gourmet
- Staff: 10 employees
- Operating Hours: 9 AM - 11 PM
- Branch Code: BW003

---

### Phase 2: Enhanced User Roles System

#### **New Role Hierarchy**

**1. Admin (System Level) - 1 user**
- Full system access
- Multi-branch oversight
- Financial reports access
- User management
- System configuration
- Email: `admin@mumbaisupermart.com`

**2. Regional Manager (Multi-Branch) - 1 user**
- Oversees all 3 branches
- Access to all branch data
- Inventory planning across branches
- Inter-branch transfers
- Performance analytics
- Email: `regional.manager@mumbaisupermart.com`

**3. Store Manager (Per Branch) - 3 users**
- Complete control of assigned branch
- Staff management for that branch
- Inventory management
- Sales monitoring
- Customer service oversight
- Local purchasing decisions
- Emails: 
  - `manager.andheri@mumbaisupermart.com`
  - `manager.vileparle@mumbaisupermart.com`
  - `manager.bandra@mumbaisupermart.com`

**4. Inventory Manager (Per Branch) - 3 users**
- Stock management
- Purchase orders
- Stock adjustments
- Reorder point management
- Supplier coordination
- Quality checks
- Emails:
  - `inventory.andheri@mumbaisupermart.com`
  - `inventory.vileparle@mumbaisupermart.com`
  - `inventory.bandra@mumbaisupermart.com`

**5. Cashier/Sales Associate (Per Branch) - 9 users (3 per branch)**
- POS operations
- Sales transactions
- Customer billing
- Payment collection
- Basic inventory lookup
- Shift-based assignment
- Emails:
  - Andheri: `cashier1.andheri@`, `cashier2.andheri@`, `cashier3.andheri@`
  - Vile Parle: `cashier1.vileparle@`, `cashier2.vileparle@`, `cashier3.vileparle@`
  - Bandra: `cashier1.bandra@`, `cashier2.bandra@`, `cashier3.bandra@`

**6. Viewer/Auditor (System Level) - 1 user**
- Read-only access
- All reports viewing
- Audit trail access
- No transaction permissions
- Email: `auditor@mumbaisupermart.com`

**Total Users: 18** (manageable, realistic)

#### **Permission Matrix**

| Permission | Admin | Regional Mgr | Store Mgr | Inventory Mgr | Cashier | Viewer |
|------------|-------|--------------|-----------|---------------|---------|--------|
| View Products | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Products | ✅ | ✅ | ✅ (own branch) | ✅ (own branch) | ❌ | ❌ |
| Make Sales | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| View Sales | ✅ | ✅ | ✅ (own branch) | ✅ (own branch) | ✅ (own sales) | ✅ |
| Manage Inventory | ✅ | ✅ | ✅ (own branch) | ✅ (own branch) | ❌ | ❌ |
| Purchase Orders | ✅ | ✅ | ✅ (own branch) | ✅ (own branch) | ❌ | ❌ |
| Inter-branch Transfer | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ (own branch) | ✅ (own branch) | ❌ | ✅ |
| Financial Reports | ✅ | ✅ | ✅ (own branch) | ❌ | ❌ | ✅ |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### Phase 3: Product Catalog Overhaul

#### **Category-wise Product Distribution**

**1. Beverages (120 products)**
- Soft Drinks: 30 products (Coca-Cola, Pepsi, Local brands)
- Juices: 25 products (Real, Tropicana, Paper Boat)
- Water: 15 products (Bisleri, Kinley, Aquafina)
- Tea/Coffee: 30 products (Tata Tea, Nescafe, Starbucks)
- Energy Drinks: 20 products (Red Bull, Monster, Sting)

**2. Staples & Grains (100 products)**
- Rice: 25 products (Basmati, Regular, Brown rice)
- Wheat/Atta: 20 products (Aashirvaad, Pillsbury, Chakki atta)
- Dal/Pulses: 30 products (Toor, Moong, Chana, Masoor)
- Oil: 15 products (Sunflower, Olive, Mustard)
- Sugar/Salt: 10 products

**3. Personal Care (100 products)**
- Bath & Body: 35 products (Dove, Lux, Dettol)
- Hair Care: 30 products (Pantene, Head & Shoulders, Clinic Plus)
- Oral Care: 20 products (Colgate, Sensodyne, Pepsodent)
- Skincare: 15 products (Nivea, Vaseline, Garnier)

**4. Baby Care (100 products)**
- Diapers: 25 products (Pampers, Huggies, MamyPoko)
- Baby Food: 30 products (Cerelac, Nestum)
- Baby Bath: 20 products (Johnson's, Himalaya)
- Baby Skincare: 25 products

**5. Snacks (150 products)**
- Chips: 40 products (Lays, Kurkure, Bingo)
- Biscuits: 50 products (Parle, Britannia, Sunfeast)
- Namkeen: 30 products (Haldiram's, Bikano)
- Chocolates: 30 products (Cadbury, Nestle, Amul)

**6. Dairy (100 products)**
- Milk: 20 products (Amul, Mother Dairy, Local)
- Curd/Yogurt: 15 products
- Cheese: 20 products
- Butter/Ghee: 25 products
- Paneer: 10 products
- Ice Cream: 10 products

**7. Frozen Foods (80 products)**
- Vegetables: 25 products
- Non-veg: 20 products
- Ready meals: 25 products
- Desserts: 10 products

**8. Cleaning & Household (100 products)**
- Detergents: 30 products (Tide, Surf, Ariel)
- Dishwash: 15 products (Vim, Pril)
- Floor cleaners: 20 products (Lizol, Harpic)
- Air fresheners: 15 products
- Paper products: 20 products

**9. Pantry (150 products)**
- Spices: 50 products (MDH, Everest, Catch)
- Sauces: 30 products (Kissan, Maggi, Del Monte)
- Instant foods: 40 products (Maggi, Top Ramen, MTR)
- Pickles/Chutneys: 30 products

**Total: ~1200 products** (realistic for a small chain)

#### **Realistic Pricing Structure**

All prices will follow this formula:
```
Cost Price (from supplier) = Base cost
GST Amount = Cost Price × GST Rate
MRP = Cost Price + GST + Markup (15-35%)
Selling Price = MRP (or slight discount)

Example: Coca-Cola 1L Bottle
Cost Price: ₹32
GST (18%): ₹5.76
Total Cost: ₹37.76
Markup (25%): ₹9.44
MRP: ₹47 (rounded)
Selling Price: ₹45 (₹2 discount)
Profit: ₹45 - ₹37.76 = ₹7.24 per unit
```

---

### Phase 4: Realistic Sales Data Generation

#### **Sales Volume Distribution (Last 30 days)**

**Total Target: ₹50 Lakhs across 3 branches**

**Branch-wise Split:**
- Andheri (Flagship): ₹25 Lakhs (50%) - 750 transactions
- Bandra (Premium): ₹15 Lakhs (30%) - 400 transactions
- Vile Parle (Express): ₹10 Lakhs (20%) - 600 transactions

**Daily Pattern:**
- Weekdays (Mon-Fri): Average sales
- Weekends (Sat-Sun): 40% higher sales
- Peak hours: 6-9 PM (40% of daily sales)
- Morning: 8-11 AM (25% of daily sales)
- Afternoon: 11 AM-6 PM (35% of daily sales)

**Payment Methods:**
- Cash: 15%
- Card: 45%
- UPI: 35%
- Wallet: 5%

**Average Transaction Values:**
- Andheri: ₹3,333
- Bandra: ₹3,750 (premium products)
- Vile Parle: ₹1,667 (quick purchases)

---

### Phase 5: Customer Data Alignment

#### **Customer Segments**

**Total Registered Customers: 500**

**1. VIP Customers (50 - 10%)**
- Total spend: > ₹10,000 in last 30 days
- Frequency: 15-30 transactions
- Preferred branches: Bandra, Andheri
- Average order: ₹800-1200

**2. Loyal Customers (100 - 20%)**
- Total spend: ₹5,000-10,000
- Frequency: 10-14 transactions
- All branches
- Average order: ₹500-800

**3. Regular Customers (150 - 30%)**
- Total spend: ₹2,000-5,000
- Frequency: 5-9 transactions
- Average order: ₹400-600

**4. Occasional Customers (200 - 40%)**
- Total spend: < ₹2,000
- Frequency: 1-4 transactions
- Average order: ₹300-500

**Walk-in (Non-registered): 30% of transactions**

---

### Phase 6: Inventory Distribution Strategy

#### **Branch-wise Stock Levels**

**Andheri (Flagship) - Full Range**
- All 1200 products available
- High stock levels (avg 100 units per product)
- Total inventory value: ₹45 Lakhs

**Bandra (Premium) - Curated Selection**
- 800 products (premium focus)
- Medium stock levels (avg 60 units per product)
- Total inventory value: ₹35 Lakhs
- More imported/organic products

**Vile Parle (Express) - Essentials**
- 500 products (fast-moving only)
- Lower stock levels (avg 40 units per product)
- Total inventory value: ₹15 Lakhs
- Focus on daily needs

**Low Stock Alerts:**
- 2-3% of products in low stock (24-36 items)
- 1% out of stock (10-15 items)
- Realistic reorder points based on sales velocity

---

### Phase 7: Financial Accuracy Fixes

#### **Calculation Consistency Rules**

**1. Cost Price Calculation**
```javascript
costPrice = supplierPrice + transportCost + handlingCost
```

**2. GST Calculation (Always consistent)**
```javascript
gstAmount = costPrice × (gstRate / 100)
totalCostWithGST = costPrice + gstAmount
```

**3. Selling Price**
```javascript
marginAmount = totalCostWithGST × (marginPercent / 100)
sellingPrice = totalCostWithGST + marginAmount
// OR
sellingPrice = mrp - discount
```

**4. Profit Calculation**
```javascript
grossProfit = sellingPrice - totalCostWithGST
netProfit = grossProfit - operationalExpenses
profitMargin = (grossProfit / sellingPrice) × 100
```

**5. Sales Report Totals**
```javascript
totalRevenue = SUM(all sales.finalAmount)
totalCost = SUM(all sales.items × costPrice)
totalProfit = totalRevenue - totalCost
// MUST MATCH across all pages
```

#### **Database-level Validations**

Add pre-save hooks to ensure:
1. Selling price >= cost price
2. MRP >= selling price
3. GST amount correctly calculated
4. Profit margins within expected range (5-35%)
5. Payment amounts match line items

---

### Phase 8: Implementation Strategy

#### **Step 1: Backup Current Data**
```bash
# Backup existing data
npm run backup:data
```

#### **Step 2: Clear Existing Seed Data**
- Delete all users except admin
- Delete all branches
- Keep product categories (but clear products)
- Clear all sales
- Clear all customers
- Clear all inventory transactions

#### **Step 3: Create New Seed Scripts**

**Files to Create/Update:**
1. `backend/scripts/seedBranchesMumbai.js` - 3 Mumbai branches
2. `backend/scripts/seedUsersEnhanced.js` - 18 users with new roles
3. `backend/scripts/seedProductsRealistic.js` - 1200 products with accurate pricing
4. `backend/scripts/seedCustomersSegmented.js` - 500 customers in segments
5. `backend/scripts/seedSalesConsistent.js` - 1750 sales with accurate calculations
6. `backend/scripts/seedInventoryDistributed.js` - Distributed stock across branches
7. `backend/scripts/seedMasterData.js` - Run all in sequence

**Step 4: Add Validation Script**
```bash
npm run validate:data
```
This will check:
- All sales totals match across tables
- Profit calculations consistent
- Inventory values correct
- Customer spend matches sales
- Payment totals equal sales amounts

#### **Step 5: Update Frontend**
- Update Dashboard to show correct aggregations
- Fix Reports page calculations
- Ensure Sales page uses consistent data sources
- Update Inventory page stock calculations

---

## 📊 Expected Outcomes

### Before (Current State)
- ❌ 8 branches - hard to manage
- ❌ Inconsistent data across pages
- ❌ Sales totals don't match
- ❌ Profit calculations incorrect
- ❌ Inventory values wrong
- ❌ Generic user roles

### After (New State)
- ✅ 3 Mumbai branches - focused, realistic
- ✅ Consistent data across all pages
- ✅ Sales totals match everywhere
- ✅ Accurate profit calculations
- ✅ Correct inventory values
- ✅ Specialized user roles with clear responsibilities
- ✅ 1200 products with realistic pricing
- ✅ 500 customers with proper segmentation
- ✅ 1750 sales transactions with accurate data
- ✅ ₹50 Lakhs monthly revenue
- ✅ ₹95 Lakhs total inventory value

---

## 🚀 Implementation Timeline

**Phase 1 (Day 1-2): Planning & Backup**
- Review current data structure
- Backup existing data
- Finalize branch details
- Finalize role permissions

**Phase 2 (Day 3-4): Branch & User Setup**
- Create Mumbai branches
- Create enhanced user roles
- Update permission system
- Test authentication

**Phase 3 (Day 5-7): Product Catalog**
- Create 1200 realistic products
- Set accurate pricing with GST
- Distribute across branches
- Add product images/details

**Phase 4 (Day 8-10): Sales & Customer Data**
- Generate customer segments
- Create realistic sales data
- Align payment methods
- Verify calculations

**Phase 5 (Day 11-12): Inventory & Validation**
- Distribute inventory
- Set reorder points
- Run validation scripts
- Fix any discrepancies

**Phase 6 (Day 13-14): Frontend Updates**
- Update Dashboard
- Fix Reports page
- Update Sales page
- Update Inventory page

**Phase 7 (Day 15): Testing & Documentation**
- Comprehensive testing
- Update user documentation
- Create admin guide
- Final validation

---

## 🔒 Data Integrity Measures

1. **Referential Integrity**: All foreign keys properly linked
2. **Calculation Consistency**: Single source of truth for calculations
3. **Transaction Atomicity**: Sales create inventory movements atomically
4. **Audit Trail**: All changes logged with user and timestamp
5. **Validation Hooks**: Pre-save validations on all models
6. **Automated Tests**: Unit tests for all calculation functions

---

## 📝 Default Login Credentials (After Seeding)

```
Admin:
Email: admin@mumbaisupermart.com
Password: Admin@123456

Regional Manager:
Email: regional.manager@mumbaisupermart.com
Password: Regional@123456

Store Manager (Andheri):
Email: manager.andheri@mumbaisupermart.com
Password: Manager@123456

Inventory Manager (Andheri):
Email: inventory.andheri@mumbaisupermart.com
Password: Inventory@123456

Cashier (Andheri):
Email: cashier1.andheri@mumbaisupermart.com
Password: Cashier@123456

Viewer/Auditor:
Email: auditor@mumbaisupermart.com
Password: Viewer@123456
```

---

## 🎯 Success Criteria

1. ✅ All pages show identical totals for same date range
2. ✅ Profit calculations match across Dashboard and Reports
3. ✅ Inventory values consistent everywhere
4. ✅ Customer spend matches sales data
5. ✅ Payment method totals equal sales amounts
6. ✅ No negative profit margins (except promotions)
7. ✅ Realistic sales patterns (weekends higher)
8. ✅ Logical inventory distribution
9. ✅ Clear user role separation
10. ✅ All validations passing

---

## 📚 Additional Documentation Needed

1. **Admin Manual**: How to manage 3-branch setup
2. **Store Manager Guide**: Daily operations
3. **Cashier Training**: POS system usage
4. **Inventory Manager Guide**: Stock management
5. **API Documentation**: Updated endpoints
6. **Database Schema**: Updated ER diagrams

---

## 🔄 Rollback Plan

If issues occur:
1. Stop all services
2. Restore from backup
3. Analyze failure logs
4. Fix issues in dev environment
5. Re-test before production deployment

---

**Document Version**: 1.0  
**Created**: October 12, 2025  
**Author**: AI Development Team  
**Status**: Ready for Review & Approval

---

**Next Steps**: 
1. Review and approve this plan
2. Get stakeholder sign-off
3. Begin Phase 1 implementation
4. Set up monitoring for data consistency

**Estimated Effort**: 15 days (1 sprint)  
**Risk Level**: Medium (with proper backup and rollback)  
**Impact**: High (Complete data consistency)
