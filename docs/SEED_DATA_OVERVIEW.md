# Seed Data Overview - Indian Supermarket Inventory System

## 📊 Complete Seed Data Documentation

This document provides a comprehensive overview of all the data that gets seeded into your supermarket inventory system when you run `npm run seed`.

---

## 🔧 How to Run Seed Data

### **Main Seed Script** (Recommended)
```bash
cd backend
npm run seed
```
This runs the comprehensive seeding with 1200+ products and realistic demo data.

### **Alternative Scripts**
```bash
npm run seed:full    # Runs scripts/seedFullData.js (smaller dataset)
npm run db:seed      # Same as npm run seed
```

---

## 👥 **1. USERS** (5 Users)

### **Admin User** 🔑
- **Email:** `admin@supermarket.com`
- **Password:** `Admin@123456`
- **Role:** Admin
- **Name:** System Admin
- **Permissions:** Full access to all system features
  - Manage products, inventory, sales, reports
  - Manage users, categories, brands, units
  - Manage suppliers, branches, settings
- **Status:** Active

### **Manager User** 👨‍💼
- **Email:** `manager@supermarket.com`
- **Password:** `Manager@123456`
- **Role:** Manager
- **Name:** Store Manager
- **Permissions:**
  - Manage products & inventory
  - View reports
- **Branch:** Delhi Central (Main)

### **Cashier Users** 🧑‍💼 (3 Cashiers)

#### Cashier 1
- **Email:** `cashier1@supermarket.com`
- **Password:** `Cashier@123456`
- **Role:** Cashier
- **Name:** Cashier One
- **Permissions:** Make sales, view products
- **Branch:** Delhi Central

#### Cashier 2
- **Email:** `cashier2@supermarket.com`
- **Password:** `Cashier@123456`
- **Role:** Cashier
- **Name:** Cashier Two
- **Branch:** Mumbai Andheri

### **Inventory Clerk** 📦
- **Email:** `inventory@supermarket.com`
- **Password:** `Inventory@123456`
- **Role:** Manager
- **Name:** Inventory Clerk
- **Permissions:** Manage inventory, view products

---

## 🏪 **2. BRANCHES** (8 Locations)

### **1. MegaMart Delhi Central** (Main Branch)
- **Code:** DEL001
- **Type:** Hypermarket (Large)
- **Location:** Connaught Place, Block A, Delhi - 110001
- **Contact:** +91-11-4567-8901
- **Email:** delhicentral@megamart.com
- **Manager:** Rohit Singh
- **Hours:** 
  - Weekday: 08:00 - 22:00
  - Weekend: 08:00 - 23:00

### **2. MegaMart Mumbai Andheri**
- **Code:** MUM001
- **Type:** Hypermarket (Large)
- **Location:** Link Road, Near Metro, Mumbai - 400058
- **Contact:** +91-22-5678-9012
- **Manager:** Kavitha Menon

### **3. MegaMart Bangalore Koramangala**
- **Code:** BAN001
- **Type:** Supermarket (Medium)
- **Location:** 80 Feet Road, Bangalore - 560034
- **Contact:** +91-80-6789-0123
- **Manager:** Arun Kumar

### **4. MegaMart Chennai T.Nagar**
- **Code:** CHE001
- **Type:** Supermarket (Medium)
- **Location:** Ranganathan Street, Chennai - 600017
- **Contact:** +91-44-7890-1234
- **Manager:** Deepa Krishnan

### **5. MegaMart Kolkata Park Street**
- **Code:** KOL001
- **Type:** Supermarket (Medium)
- **Location:** Park Street, Kolkata - 700016

### **6. MegaMart Hyderabad Banjara Hills**
- **Code:** HYD001
- **Type:** Supermarket (Medium)
- **Location:** Road No. 10, Hyderabad

### **7. MegaMart Pune Koregaon Park**
- **Code:** PUN001
- **Type:** Convenience Store (Small)
- **Location:** North Main Road, Pune

### **8. MegaMart Ahmedabad Satellite**
- **Code:** AHM001
- **Type:** Supermarket (Medium)
- **Location:** SG Highway, Ahmedabad

---

## 📦 **3. CATEGORIES** (12 Categories)

### **Beverages** (BEV)
- **Description:** Soft drinks, juices, tea, coffee, water
- **GST Rate:** 12%
- **Avg Price:** ₹45
- **Stock Range:** 80-400 units
- **Perishable:** No

### **Dairy** (DAI)
- **Description:** Milk, curd, paneer, butter, cheese
- **GST Rate:** 5%
- **Avg Price:** ₹65
- **Stock Range:** 50-200 units
- **Perishable:** Yes

### **Produce** (PRO)
- **Description:** Fresh fruits, vegetables, herbs
- **GST Rate:** 5%
- **Avg Price:** ₹85
- **Stock Range:** 30-150 units
- **Perishable:** Yes

### **Meat & Seafood** (MEA)
- **Description:** Chicken, mutton, fish, eggs
- **GST Rate:** 5%
- **Avg Price:** ₹320
- **Stock Range:** 20-100 units
- **Perishable:** Yes

### **Bakery** (BAK)
- **Description:** Bread, biscuits, cakes, pastries
- **GST Rate:** 5%
- **Avg Price:** ₹35
- **Stock Range:** 40-200 units
- **Perishable:** Yes

### **Snacks** (SNA)
- **Description:** Chips, namkeen, nuts, crackers
- **GST Rate:** 18%
- **Avg Price:** ₹55
- **Stock Range:** 60-300 units
- **Perishable:** No

### **Frozen** (FRO)
- **Description:** Ice cream, frozen vegetables, ready meals
- **GST Rate:** 18%
- **Avg Price:** ₹180
- **Stock Range:** 25-120 units
- **Perishable:** Yes

### **Household** (HOU)
- **Description:** Cleaning supplies, detergents, paper products
- **GST Rate:** 18%
- **Avg Price:** ₹125
- **Stock Range:** 40-200 units
- **Perishable:** No

### **Personal Care** (PER)
- **Description:** Soaps, shampoos, toothpaste, cosmetics
- **GST Rate:** 18%
- **Avg Price:** ₹95
- **Stock Range:** 30-180 units
- **Perishable:** No

### **Baby Care** (BAB)
- **Description:** Diapers, baby food, toys, care products
- **GST Rate:** 12%
- **Avg Price:** ₹285
- **Stock Range:** 20-100 units
- **Perishable:** No

### **Staples** (STA)
- **Description:** Rice, wheat, oil, pulses, spices
- **GST Rate:** 5%
- **Avg Price:** ₹95
- **Stock Range:** 50-250 units
- **Perishable:** No

### **Pet Care** (PET)
- **Description:** Pet food, accessories, care products
- **GST Rate:** 18%
- **Avg Price:** ₹450
- **Stock Range:** 15-80 units
- **Perishable:** No

---

## 🏷️ **4. BRANDS** (34 Brands)

### **Indian Food & FMCG Brands**
1. **Tata Sampann** (TATAS) - Staples
2. **Aashirvaad** (AASHI) - Staples
3. **India Gate** (INDGATE) - Staples
4. **Everest** (EVER) - Staples
5. **Fortune** (FORT) - Staples
6. **Patanjali** (PATAN) - Personal Care
7. **Dabur** (DABUR) - Personal Care
8. **Himalaya** (HIMAL) - Personal Care
9. **Amul** (AMUL) - Dairy
10. **Mother Dairy** (MOTHER) - Dairy
11. **Britannia** (BRIT) - Bakery
12. **Parle** (PARLE) - Bakery
13. **ITC** (ITC) - Snacks
14. **Haldiram** (HALDI) - Snacks
15. **Bikano** (BIKANO) - Snacks
16. **MTR** (MTR) - Staples
17. **Kissan** (KISSAN) - Staples
18. **Maggi** (MAGGI) - Staples

### **International Brands in India**
19. **Nestle** (NEST) - Switzerland - Bakery
20. **Unilever** (UNIL) - Netherlands - Personal Care
21. **Procter & Gamble** (PG) - USA - Personal Care
22. **Coca Cola** (COKE) - USA - Beverages
23. **PepsiCo** (PEPSI) - USA - Beverages
24. **Johnson & Johnson** (JJ) - USA - Baby Care
25. **Kelloggs** (KELLO) - USA - Bakery

### **Regional Indian Brands**
26. **Vadilal** (VADIL) - Frozen
27. **Havells** (HAVELL) - Household
28. **Nirma** (NIRMA) - Household
29. **Godrej** (GODREJ) - Household
30. **Bajaj** (BAJAJ) - Personal Care
31. **Emami** (EMAMI) - Personal Care
32. **Marico** (MARICO) - Personal Care
33. **Pedigree** (PEDI) - Pet Care
34. **Whiskas** (WHISK) - Pet Care

---

## 📏 **5. UNITS OF MEASUREMENT** (8 Units)

1. **Pieces** (PCS) - Count - Individual items
2. **Kilograms** (KG) - Weight - Bulk items
3. **Grams** (G) - Weight - Small quantities
4. **Liters** (L) - Volume - Liquids
5. **Milliliters** (ML) - Volume - Small liquid volumes
6. **Packets** (PKT) - Count - Packaged goods
7. **Bottles** (BTL) - Count - Bottled products
8. **Boxes** (BOX) - Count - Boxed items

---

## 🚛 **6. SUPPLIERS** (8 Major Suppliers)

### **1. Amul Dairy Products**
- **Code:** AMUL001
- **Location:** Anand, Gujarat
- **Contact:** +91-2692-258506
- **Email:** sales@amul.com
- **Specialization:** Dairy products

### **2. Tata Consumer Products**
- **Code:** TATA001
- **Location:** Mumbai, Maharashtra
- **Contact:** +91-22-6665-8282
- **Email:** orders@tata.com
- **Specialization:** Staples, beverages

### **3. Britannia Industries**
- **Code:** BRIT001
- **Location:** Kolkata, West Bengal
- **Contact:** +91-33-2357-9000
- **Email:** sales@britannia.co.in
- **Specialization:** Bakery products

### **4. ITC Foods Division**
- **Code:** ITC001
- **Location:** Kolkata, West Bengal
- **Contact:** +91-33-2288-9371
- **Email:** foodsales@itc.in
- **Specialization:** Snacks, staples

### **5. Hindustan Unilever**
- **Code:** HUL001
- **Location:** Mumbai, Maharashtra
- **Contact:** +91-22-3983-0000
- **Email:** orders@hul.co.in
- **Specialization:** Personal care, household

### **6. PepsiCo India**
- **Code:** PEPSI001
- **Location:** Gurugram, Haryana
- **Contact:** +91-124-473-7000
- **Email:** sales@pepsico.co.in
- **Specialization:** Beverages, snacks

### **7. Patanjali Ayurved**
- **Code:** PATAN001
- **Location:** Haridwar, Uttarakhand
- **Contact:** +91-1334-244107
- **Email:** sales@patanjali.net
- **Specialization:** FMCG, personal care

### **8. Mother Dairy**
- **Code:** MOTH001
- **Location:** Delhi, Delhi
- **Contact:** +91-11-2649-7121
- **Email:** orders@motherdairy.com
- **Specialization:** Dairy, ice cream

---

## 📦 **7. PRODUCTS** (1200+ Products)

The seed script generates **over 1200 realistic Indian market products** across all categories with:

### **Product Details Include:**
- **Unique SKU** - Auto-generated (e.g., BEV-COKE-001)
- **Barcode** - EAN-13 format
- **Product Name** - Indian market-specific names
- **Description** - Detailed product descriptions
- **Category** - One of 12 categories
- **Brand** - Indian & international brands
- **Unit** - Measurement unit
- **Supplier** - Linked to supplier
- **GST Rate** - 5%, 12%, 18%, or 28%

### **Pricing Structure:**
- **Cost Price** - Purchase cost from supplier
- **Selling Price** - Retail price (with 20-40% markup)
- **MRP** - Maximum Retail Price
- **Discount** - 0-30% promotional discounts
- **Tax Amount** - Auto-calculated GST

### **Stock Management:**
- **Multi-branch Stock** - Stock levels for each branch
- **Reorder Level** - Automatic reorder trigger point
- **Max Stock Level** - Maximum inventory capacity
- **Current Stock** - Varies from 0 (out of stock) to 500+ units

### **Sample Products by Category:**

#### **Dairy Products (50-100 items)**
- Amul Butter 500g, 100g, 1kg
- Amul Milk (Full Cream, Toned, Double Toned)
- Amul Cheese Slices, Cubes, Spread
- Mother Dairy Curd, Paneer, Lassi
- Britannia Fresh Cream, Ghee

#### **Beverages (150-200 items)**
- Coca Cola, Pepsi, Sprite, Fanta (200ml, 500ml, 1L, 2L)
- Tropicana Juices (Orange, Apple, Mixed Fruit)
- Real Fruit Juices
- Bisleri, Kinley, Aquafina Water
- Tata Tea, Red Label, Taj Mahal Tea
- Nescafe Coffee, Bru Coffee

#### **Snacks (200-250 items)**
- Lays Chips (all flavors, sizes)
- Kurkure (Masala Munch, Chilli Chatka)
- Bingo Mad Angles, Tedhe Medhe
- Haldiram Namkeen (Bhujia, Moong Dal, Sev)
- Britannia Biscuits (Good Day, Marie, Nutri Choice)
- Parle-G, Monaco, Hide & Seek

#### **Staples (150-200 items)**
- India Gate Basmati Rice (1kg, 5kg, 10kg, 25kg)
- Tata Salt, Aashirvaad Atta
- Fortune Cooking Oil
- Everest Spices (Turmeric, Red Chilli, Coriander)
- Toor Dal, Moong Dal, Chana Dal
- Sugar, Jaggery, Vermicelli

#### **Personal Care (200-250 items)**
- Colgate, Pepsodent, Close-Up Toothpaste
- Pantene, Head & Shoulders, Clinic Plus Shampoo
- Dove, Lux, Lifebuoy Soap
- Fair & Lovely, Ponds, Himalaya Face Wash
- Gillette, Veet Razors
- Vaseline, Nivea Body Lotion

#### **Household (100-150 items)**
- Surf Excel, Tide, Ariel Detergent
- Vim, Pril Dishwash
- Lizol, Harpic Floor Cleaners
- Colin Glass Cleaner
- All Out, Good Knight, Mortein Mosquito Repellents

#### **Bakery (80-100 items)**
- Britannia Bread (White, Brown, Multigrain)
- Harvest Gold Bread
- Britannia Cakes (Fruit Cake, Plum Cake)
- Sunfeast Cookies
- Cream Rolls, Rusk

---

## 👥 **8. CUSTOMERS** (150 Customers)

Generated with realistic Indian names and contact information:

### **Customer Types:**
- **Walk-in Customers** - 60% (no contact details)
- **Registered Customers** - 40% (with email/phone)

### **Customer Data Includes:**
- **Name** - Indian first and last names
- **Phone** - +91 Indian mobile numbers
- **Email** - Email addresses
- **Address** - Indian city addresses
- **Loyalty Points** - 0-5000 points
- **Total Purchases** - Historical purchase count
- **Total Spent** - Lifetime value

### **Customer Segments:**
- **VIP Customers** (10+) - High spenders (₹50,000+)
- **Loyal Customers** (30+) - Regular shoppers (₹20,000-₹50,000)
- **Regular Customers** (60+) - Occasional buyers (₹5,000-₹20,000)
- **New Customers** (50+) - First-time buyers

---

## 💰 **9. SALES TRANSACTIONS** (200 Sales)

Generated across the last 90 days with realistic patterns:

### **Sales Distribution:**
- **Peak Days:** Friday-Sunday (40% more sales)
- **Slow Days:** Monday (30% fewer sales)
- **Average Sales per Day:** 2-8 transactions

### **Transaction Details:**
- **Invoice Numbers** - Sequential with branch code
- **Date/Time** - Realistic business hours
- **Branch** - Distributed across all 8 branches
- **Cashier** - Randomly assigned
- **Customer** - Mix of walk-in and registered
- **Payment Method:**
  - Cash - 40%
  - Credit/Debit Card - 35%
  - UPI/Digital - 25%

### **Sale Items:**
- **Products per Sale:** 3-12 items
- **Quantities:** 1-5 units per item
- **Subtotal:** ₹200 - ₹5,000
- **Discounts:** 0-20% on promotions
- **GST:** Calculated per item
- **Total Amount:** After discount + tax

### **Sample Sale Patterns:**
- Morning sales (8am-12pm): Dairy, bread, newspapers
- Afternoon sales (12pm-6pm): Lunch items, beverages
- Evening sales (6pm-10pm): Groceries, household items

---

## 📥 **10. PURCHASE ORDERS** (50 Purchase Orders)

Supplier purchases for stock replenishment:

### **Purchase Details:**
- **PO Number** - Auto-generated (PO-YYYYMMDD-XXX)
- **Supplier** - Linked to suppliers
- **Branch** - Receiving branch
- **Order Date** - Last 60 days
- **Expected Delivery** - 3-7 days from order
- **Status:**
  - Pending - 20%
  - Approved - 30%
  - Received - 50%

### **Purchase Items:**
- **Products:** 5-20 items per order
- **Quantity:** Bulk orders (10-500 units)
- **Cost Price:** From supplier pricing
- **Total Amount:** ₹10,000 - ₹2,00,000

---

## 🔄 **11. STOCK TRANSFERS** (30 Transfers)

Inter-branch stock movements:

### **Transfer Details:**
- **From Branch:** Source branch
- **To Branch:** Destination branch
- **Transfer Date:** Last 30 days
- **Status:** Pending, In Transit, Completed
- **Items:** 2-10 products per transfer
- **Quantities:** 5-50 units

### **Common Transfer Reasons:**
- Rebalancing stock between branches
- Emergency stock for high-demand items
- Overstock redistribution

---

## 📝 **12. STOCK ADJUSTMENTS** (40 Adjustments)

Inventory corrections and write-offs:

### **Adjustment Types:**
- **Damage** - 40% (damaged goods)
- **Expiry** - 30% (expired products)
- **Theft** - 10% (shrinkage)
- **Found** - 10% (inventory found)
- **Correction** - 10% (count corrections)

### **Adjustment Details:**
- **Branch** - All branches
- **Products:** 1-5 items per adjustment
- **Quantity:** -50 to +20 units
- **Reason:** Detailed explanation
- **Approved By:** Manager/Admin

---

## 📊 **DATA VOLUME SUMMARY**

| **Entity**          | **Count** | **Purpose**                           |
|---------------------|-----------|---------------------------------------|
| Users               | 5         | Admin, managers, cashiers             |
| Branches            | 8         | Pan-India store locations             |
| Categories          | 12        | Product categorization                |
| Brands              | 34        | Indian & international brands         |
| Units               | 8         | Measurement standards                 |
| Suppliers           | 8         | Major Indian FMCG suppliers           |
| **Products**        | **1200+** | **Complete Indian supermarket range** |
| Customers           | 150       | Registered & walk-in customers        |
| Sales               | 200       | 90-day transaction history            |
| Purchase Orders     | 50        | Supplier orders (60 days)             |
| Stock Transfers     | 30        | Inter-branch movements                |
| Stock Adjustments   | 40        | Inventory corrections                 |

**Total Records:** ~1,500+ database records

---

## 🎯 **DATA QUALITY & REALISM**

### **Realistic Indian Market Data:**
✅ Authentic Indian brand names (Amul, Tata, Britannia)  
✅ Indian city addresses (Mumbai, Delhi, Bangalore)  
✅ Indian phone numbers (+91 format)  
✅ GST tax rates (5%, 12%, 18%, 28%)  
✅ INR pricing (₹10 - ₹5000 range)  
✅ Indian product names (Atta, Daal, Namkeen)  
✅ Realistic stock levels and reorder points  
✅ Seasonal sales patterns  
✅ Multi-branch stock distribution  
✅ Business hours (8am-11pm typical)  

### **Testing Scenarios Enabled:**
✅ **Low Stock Alerts** - Products below reorder level  
✅ **Out of Stock** - Zero stock items requiring urgent reorder  
✅ **Sales Reports** - 90 days of transaction data  
✅ **Profit Analysis** - Cost vs selling price margins  
✅ **Customer Segmentation** - VIP, Loyal, Regular, New  
✅ **Branch Performance** - Multi-location comparisons  
✅ **Inventory Turnover** - Stock movement analytics  
✅ **GST Calculations** - Tax compliance reports  
✅ **Payment Method Analysis** - Cash, card, UPI trends  
✅ **Cashier Performance** - Sales per cashier  

---

## 🚀 **USING THE SEEDED DATA**

### **1. Login to System**
```
URL: http://localhost:5173
Admin Email: admin@supermarket.com
Password: Admin@123456
```

### **2. Explore Features**
- **Dashboard** - See 90 days of sales analytics
- **Products** - Browse 1200+ Indian products
- **Sales** - Make new sales, view history
- **Inventory** - Check stock levels, low stock alerts
- **Reports** - Generate sales, profit, inventory reports
- **Customers** - View customer database
- **Master Data** - Manage categories, brands, suppliers

### **3. Test Scenarios**
- Create new sale with existing products
- Check low stock items requiring reorder
- Generate profit analysis report
- View branch-wise performance
- Create purchase order from supplier
- Transfer stock between branches
- Adjust inventory for damaged goods

---

## 🔄 **RE-SEEDING DATA**

### **Clear & Reseed Database:**
```bash
cd backend
npm run seed
```

**⚠️ Warning:** This will:
- Delete ALL existing data
- Create fresh seed data
- Reset to default state

### **Preserve Data:**
If you want to keep your data and just add sample data, manually run specific seed scripts instead of the full seed.

---

## 📞 **SUPPORT**

### **Need Different Data?**
Edit seed data files in `backend/src/seed/data/`:
- `categories.js` - Modify categories
- `brands.js` - Add/remove brands
- `branches.js` - Change locations
- `suppliers.js` - Update suppliers
- `units.js` - Modify measurement units

### **Need More/Less Data?**
Edit `DatabaseSeeder.js`:
```javascript
// Change product count
await this.seedProducts(2000); // Generate 2000 products instead of 1200

// Change customer count
await this.seedCustomers(300); // 300 customers instead of 150
```

---

**Version:** 1.0  
**Last Updated:** October 12, 2025  
**Data Format:** Indian Market Standards  
**Currency:** INR (₹)  
**Tax System:** GST (5%, 12%, 18%, 28%)  
**Market Focus:** Indian FMCG & Retail
