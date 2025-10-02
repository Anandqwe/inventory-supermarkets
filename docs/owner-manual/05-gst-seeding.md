# Part 5: GST & Pricing + Seeding & Demo Data

## GST & Pricing (India Retail Context)

### GST Tax Structure Implementation

**Current State**: The system has basic tax fields in models but needs complete GST calculation logic.

**GST Rate Categories** (to be implemented):
```javascript
// File to create: backend/src/utils/gstUtils.js
const GST_RATES = {
  // Essential items
  EXEMPT: 0,        // Basic food items (wheat, rice, vegetables)
  RATE_5: 5,        // Packaged food, milk, curd, paneer
  RATE_12: 12,      // Processed food, frozen items
  RATE_18: 18,      // Biscuits, cosmetics, soaps
  RATE_28: 28,      // Luxury items, aerated beverages
  
  // State-specific rates
  CESS: 40          // De-merit goods (tobacco, pan masala)
};

const CATEGORY_GST_MAPPING = {
  'dairy': GST_RATES.RATE_5,
  'staples': GST_RATES.EXEMPT,
  'beverages': GST_RATES.RATE_12,
  'snacks': GST_RATES.RATE_18,
  'personal-care': GST_RATES.RATE_18,
  'household': GST_RATES.RATE_18,
  'luxury': GST_RATES.RATE_28
};
```

### Intrastate vs Interstate Tax Split

**Tax Calculation Logic** (to be added):
```javascript
// backend/src/utils/gstUtils.js
class GSTCalculator {
  static calculateTax(baseAmount, gstRate, isInterstate = false, buyerState = 'KA', sellerState = 'KA') {
    const taxAmount = (baseAmount * gstRate) / 100;
    
    if (isInterstate || buyerState !== sellerState) {
      // Interstate: IGST only
      return {
        igst: taxAmount,
        cgst: 0,
        sgst: 0,
        totalTax: taxAmount
      };
    } else {
      // Intrastate: CGST + SGST (50% each)
      const cgst = taxAmount / 2;
      const sgst = taxAmount / 2;
      return {
        igst: 0,
        cgst: cgst,
        sgst: sgst,
        totalTax: taxAmount
      };
    }
  }
  
  static calculateInvoiceTotal(items, customerState = 'KA', storeState = 'KA') {
    let subtotal = 0;
    let totalTax = 0;
    const taxBreakdown = { cgst: 0, sgst: 0, igst: 0 };
    
    items.forEach(item => {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      
      const tax = this.calculateTax(
        lineTotal, 
        item.gstRate, 
        false, 
        customerState, 
        storeState
      );
      
      totalTax += tax.totalTax;
      taxBreakdown.cgst += tax.cgst;
      taxBreakdown.sgst += tax.sgst;
      taxBreakdown.igst += tax.igst;
    });
    
    return {
      subtotal: this.roundToTwoDecimals(subtotal),
      taxBreakdown,
      totalTax: this.roundToTwoDecimals(totalTax),
      grandTotal: this.roundToTwoDecimals(subtotal + totalTax)
    };
  }
  
  static roundToTwoDecimals(amount) {
    return Math.round(amount * 100) / 100;
  }
}
```

### Product-Level GST Integration

**Enhanced Product Model** (to be updated in `backend/src/models/Product.js`):
```javascript
// Add these fields to existing Product schema
gstRate: {
  type: Number,
  required: true,
  enum: [0, 5, 12, 18, 28, 40],
  default: function() {
    // Auto-assign based on category
    return CATEGORY_GST_MAPPING[this.category?.code?.toLowerCase()] || 18;
  }
},
hsnCode: {
  type: String,
  required: false,
  match: [/^\d{4,8}$/, 'HSN code must be 4-8 digits'],
  index: true
},
taxExempt: {
  type: Boolean,
  default: false
}
```

### Sales Transaction GST Storage

**Enhanced Sale Model** (to be updated in `backend/src/models/Sale.js`):
```javascript
// Add to existing Sale schema
taxSummary: {
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalTax: { type: Number, required: true }
},
customerGSTIN: {
  type: String,
  match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format']
},
placeOfSupply: {
  type: String,
  required: true,
  default: 'Karnataka' // Store's state
}

// Enhanced SaleItem schema
gstRate: { type: Number, required: true },
hsnCode: { type: String },
taxableAmount: { type: Number, required: true },
cgst: { type: Number, default: 0 },
sgst: { type: Number, default: 0 },
igst: { type: Number, default: 0 }
```

### Example Product Categories with GST Rates

| Category | GST Rate | Examples | HSN Code Range |
|----------|----------|----------|----------------|
| **Staples** | 0% | Rice, wheat flour, fresh vegetables | 1001-1008 |
| **Dairy** | 5% | Milk, curd, paneer, ghee | 0401-0406 |
| **Beverages** | 12% | Fruit juices, coconut water | 2009, 2202 |
| **Packaged Food** | 5-18% | Biscuits (18%), bread (5%) | 1905, 2106 |
| **Personal Care** | 18% | Soap, shampoo, toothpaste | 3401, 3305 |
| **Household** | 18% | Detergent, cleaning supplies | 3402, 3808 |
| **Luxury/Tobacco** | 28%+cess | Aerated drinks, tobacco | 2202, 2402 |

### Rounding & Precision Rules

**Invoice Rounding Strategy** (to prevent mismatches):
```javascript
// backend/src/utils/gstUtils.js
class InvoiceRounding {
  // Rule 1: Round line-item tax to 2 decimals
  static roundLineItemTax(amount) {
    return Math.round(amount * 100) / 100;
  }
  
  // Rule 2: Round final invoice total to nearest ₹0.05 (Indian practice)
  static roundInvoiceTotal(amount) {
    return Math.round(amount * 20) / 20; // Rounds to nearest 0.05
  }
  
  // Rule 3: Adjust for rounding differences
  static adjustForRounding(calculatedTotal, items) {
    const lineItemSum = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const difference = calculatedTotal - lineItemSum;
    
    if (Math.abs(difference) <= 0.10) {
      // Adjust largest line item by difference
      const largestItem = items.reduce((max, item) => 
        item.lineTotal > max.lineTotal ? item : max
      );
      largestItem.lineTotal += difference;
    }
    
    return items;
  }
}
```

---

## Seeding & Demo Data

### Seed Scripts Overview

**Current Seed Structure** (`backend/src/seed/`):
```
seed/
├── seed.js                  # Main seeding script (1200+ products)
├── verify.js               # Post-seed validation
├── wipe.js                 # Clean database for fresh start  
├── data/                   # Indian market sample data
│   ├── categories.js       # Indian product categories
│   ├── brands.js          # Popular Indian brands
│   ├── units.js           # Measurement units (kg, L, pcs)
│   ├── branches.js        # Sample store locations
│   └── users.js           # Demo user accounts
└── utils/                  # Seeding helper functions
    ├── dataGenerator.js    # Realistic data creation
    └── skuGenerator.js     # SKU format generation
```

### How to Run Seed Scripts

**Available Commands** (`package.json`):
```bash
# Complete database seeding
npm run seed              # Create all demo data (users, products, transactions)

# Selective seeding  
npm run seed:products     # Products only
npm run seed:sales        # Sample transactions only
npm run seed:verify       # Validate seeded data

# Database cleanup
npm run seed:wipe         # Clear all data (use carefully!)

# Development workflow
npm run seed:wipe && npm run seed    # Fresh start with clean data
```

### Demo Data Specifications

**User Accounts Created**:
```javascript
// Login credentials for testing
const DEMO_USERS = [
  {
    email: 'admin@supermarket.com',
    password: 'Admin@123456',
    role: 'admin',
    firstName: 'Rajesh',
    lastName: 'Kumar'
  },
  {
    email: 'manager@supermarket.com', 
    password: 'Manager@123456',
    role: 'manager',
    firstName: 'Priya',
    lastName: 'Sharma'
  },
  {
    email: 'cashier@supermarket.com',
    password: 'Cashier@123456', 
    role: 'cashier',
    firstName: 'Amit',
    lastName: 'Patel'
  }
];
```

**Sample Categories & Brands**:
```javascript
// backend/src/seed/data/categories.js
const INDIAN_CATEGORIES = [
  { name: 'Dairy & Eggs', code: 'DAI', gstRate: 5 },
  { name: 'Fruits & Vegetables', code: 'FRV', gstRate: 0 },
  { name: 'Staples & Grains', code: 'STA', gstRate: 0 },
  { name: 'Beverages', code: 'BEV', gstRate: 12 },
  { name: 'Snacks & Confectionery', code: 'SNK', gstRate: 18 },
  { name: 'Personal Care', code: 'PER', gstRate: 18 },
  { name: 'Household Essentials', code: 'HOU', gstRate: 18 }
];

// backend/src/seed/data/brands.js  
const INDIAN_BRANDS = [
  { name: 'Amul', category: 'dairy' },
  { name: 'Tata', category: 'beverages' },
  { name: 'Britannia', category: 'snacks' },
  { name: 'Hindustan Unilever', category: 'personal-care' },
  { name: 'ITC', category: 'snacks' },
  { name: 'Nestle', category: 'beverages' },
  { name: 'Godrej', category: 'household' }
];
```

### 20 Sample Products with Realistic Pricing

| SKU | Product Name | Category | Brand | Cost (₹) | MRP (₹) | GST% | Stock |
|-----|--------------|----------|-------|----------|---------|------|-------|
| DAI-AMUL-1001 | Amul Milk 1L | Dairy | Amul | 45.00 | 50.00 | 5% | 150 |
| DAI-AMUL-1002 | Amul Butter 500g | Dairy | Amul | 420.00 | 450.00 | 5% | 75 |
| BEV-TATA-2001 | Tata Tea Premium 1kg | Beverages | Tata | 380.00 | 420.00 | 12% | 100 |
| SNK-BRIT-3001 | Britannia Biscuits 200g | Snacks | Britannia | 28.00 | 35.00 | 18% | 200 |
| STA-TATA-4001 | Tata Salt 1kg | Staples | Tata | 18.00 | 22.00 | 0% | 300 |
| PER-HUL-5001 | Dove Soap 100g | Personal Care | HUL | 75.00 | 85.00 | 18% | 120 |
| HOU-GOD-6001 | Godrej Detergent 1kg | Household | Godrej | 180.00 | 210.00 | 18% | 80 |
| BEV-COCA-2002 | Coca Cola 500ml | Beverages | Coca Cola | 15.00 | 20.00 | 28% | 250 |
| DAI-NEST-1003 | Nestle Yogurt 400g | Dairy | Nestle | 45.00 | 55.00 | 5% | 90 |
| SNK-ITC-3002 | ITC Chips 25g | Snacks | ITC | 8.00 | 10.00 | 18% | 300 |
| FRV-LOCA-7001 | Fresh Bananas 1kg | Fruits | Local | 35.00 | 45.00 | 0% | 50 |
| BEV-REAL-2003 | Real Fruit Juice 1L | Beverages | Real | 90.00 | 110.00 | 12% | 60 |
| PER-COLL-5002 | Colgate Toothpaste 150g | Personal Care | Colgate | 75.00 | 95.00 | 18% | 100 |
| STA-FORT-4002 | Fortune Rice 5kg | Staples | Fortune | 320.00 | 380.00 | 0% | 40 |
| DAI-MOTH-1004 | Mother Dairy Ghee 1L | Dairy | Mother Dairy | 450.00 | 520.00 | 5% | 30 |
| HOU-VIM-6002 | Vim Dishwash 500ml | Household | Vim | 85.00 | 105.00 | 18% | 70 |
| SNK-HALL-3003 | Haldiram Namkeen 200g | Snacks | Haldiram | 65.00 | 80.00 | 18% | 110 |
| BEV-AQUA-2004 | Aquafina Water 1L | Beverages | Aquafina | 8.00 | 12.00 | 0% | 400 |
| PER-PANT-5003 | Pantene Shampoo 400ml | Personal Care | Pantene | 220.00 | 275.00 | 18% | 45 |
| FRV-LOCA-7002 | Fresh Onions 1kg | Vegetables | Local | 25.00 | 35.00 | 0% | 80 |

### Idempotent Seeding Strategy

**Safe Re-running** (`backend/src/seed/seed.js`):
```javascript
class IdempotentSeeder {
  async seedWithCheck(Model, data, uniqueField) {
    const results = [];
    
    for (const item of data) {
      const existing = await Model.findOne({ [uniqueField]: item[uniqueField] });
      
      if (!existing) {
        const created = await Model.create(item);
        results.push({ action: 'created', item: created });
      } else {
        results.push({ action: 'skipped', item: existing });
      }
    }
    
    return results;
  }
  
  // Usage example
  async seedProducts() {
    console.log('🌱 Seeding products...');
    const results = await this.seedWithCheck(Product, SAMPLE_PRODUCTS, 'sku');
    console.log(`✅ Products: ${results.filter(r => r.action === 'created').length} created, ${results.filter(r => r.action === 'skipped').length} skipped`);
  }
}
```

### Sample Transactions Generation

**Realistic Sales Data** (generated by seed script):
```javascript
// Creates 200+ sample transactions across 30 days
const generateSampleSales = async () => {
  const branches = await Branch.find();
  const products = await Product.find();
  const cashiers = await User.find({ role: 'cashier' });
  
  // Generate realistic sales patterns
  for (let day = 0; day < 30; day++) {
    const salesPerDay = Math.floor(Math.random() * 20) + 10; // 10-30 sales per day
    
    for (let sale = 0; sale < salesPerDay; sale++) {
      const saleData = {
        branch: getRandomElement(branches)._id,
        cashier: getRandomElement(cashiers)._id,
        items: generateRandomItems(products, 1, 5), // 1-5 items per sale
        paymentMethod: getRandomPaymentMethod(),
        createdAt: getRandomTimeInDay(day)
      };
      
      await Sale.create(saleData);
    }
  }
};
```

---

## Navigation

**← Previous**: [Frontend UX Guide & Security](04-frontend-security.md)  
**→ Next**: [Testing + Performance + Operations](06-testing-performance-ops.md)