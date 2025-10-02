# Indian Supermarket Demo Data Seeding

This comprehensive seeding system creates realistic demo data for the Indian supermarket inventory management system with **1200+ products** and complete master data.

## 🎯 What Gets Created

### Master Data
- **5 Users** (Admin, Manager, 2 Cashiers, Inventory Clerk)
- **12 Categories** (Beverages, Dairy, Produce, etc.)
- **34 Brands** (Mix of Indian & International brands)
- **8 Units** (kg, L, piece, etc.)
- **8 Suppliers** (Across major Indian cities)
- **8 Branches** (Delhi, Mumbai, Bangalore, etc.)

### Core Data
- **1200+ Products** 🌟
  - Indian market focused names and pricing
  - Realistic SKUs (CAT-BRAND-####)
  - Indian barcodes (890-prefix)
  - Multi-branch inventory
  - GST tax rates (5%, 12%, 18%)
  - Perishable items with expiry dates
  - Product variants (Premium, Economy, etc.)
- **150 Customers**
  - Indian names and phone numbers
  - Multiple addresses support
  - Loyalty points system

## 🚀 Quick Start

### Option 1: Complete Seeding
```bash
# Install dependencies (if not done)
npm install

# Run the comprehensive seeder
npm run seed

# Or use the full path
npm run seed:demo
```

### Option 2: Verify Existing Data
```bash
# Check what's already in the database
npm run seed:verify
```

## 📊 Sample Output

```
🎯 DEMO DATA SUMMARY
===================
Users: 5
Categories: 12
Brands: 34
Units: 8
Suppliers: 8
Branches: 8
Products: 1200 ⭐
Customers: 150
===================
Total Records: 1425
```

## 🔐 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@supermarket.com | Admin@123456 |
| Manager | manager@supermarket.com | Manager@123456 |
| Cashier 1 | cashier1@supermarket.com | Cashier@123456 |
| Cashier 2 | cashier2@supermarket.com | Cashier@123456 |
| Inventory | inventory@supermarket.com | Inventory@123456 |

## 🏗️ Architecture

### File Structure
```
backend/src/seed/
├── seed.js              # Main seeding script
├── verify.js            # Verification script
├── data/                # Reference data
│   ├── categories.js    # 12 Indian market categories
│   ├── brands.js        # 34 Indian & international brands
│   ├── units.js         # 8 measurement units
│   ├── suppliers.js     # 8 suppliers across India
│   └── branches.js      # 8 branch locations
└── utils/               # Helper utilities
    ├── DatabaseSeeder.js # Main seeding class
    └── productUtils.js   # Product generation utilities
```

### Key Features

#### 🇮🇳 Indian Market Focus
- **Pricing**: All prices in INR (₹5 to ₹500 range)
- **Tax Rates**: Realistic GST rates by category
- **Brands**: Mix of Indian (Amul, Patanjali, Tata) and International (Nestle, Unilever)
- **Categories**: Indian retail categories (Dairy, Staples, Personal Care)
- **Locations**: Major Indian cities and regions

#### 📦 Realistic Product Data
- **Unique SKUs**: Format CAT-BRAND-#### (e.g., BEV-AMUL-1234)
- **Indian Barcodes**: 890-prefix following EAN-13 format
- **Product Variants**: Economy, Premium, Family Pack, Organic
- **Size Variants**: 250g, 500g, 1kg, 200ml, 500ml, 1L, etc.
- **Stock Levels**: Realistic per-branch inventory
- **Expiry Dates**: For perishable items (dairy, produce, meat)

#### 🏪 Multi-Branch Support
- Products distributed across multiple branches
- Branch-specific stock levels
- Realistic reorder levels and max stock

## 🛠️ Technical Details

### Dependencies
- `@faker-js/faker` - For realistic fake data generation
- `mongoose` - MongoDB ORM for data models

### Database Models Used
- User (with role-based permissions)
- Category (with GST tax rates)
- Brand (with country of origin)
- Unit (measurement types)
- Supplier (with contact details)
- Branch (store locations)
- Product (with pricing, stock, expiry)
- Customer (with addresses, loyalty points)

### Performance
- Processes ~100 products per category
- Total seeding time: ~30-60 seconds
- Progress indicators for large data sets
- Optimized batch operations

## 🎮 Testing the System

### 1. Start Backend
```bash
npm run dev
```

### 2. Start Frontend
```bash
cd ../frontend
npm run dev
```

### 3. Test Scenarios
- **Login**: Use any of the provided credentials
- **Products**: Browse 1200+ products across categories
- **Inventory**: Check stock levels across branches
- **Search**: Test product search and filtering
- **Dashboard**: View realistic data in charts
- **Reports**: Generate reports with actual data

## 🔧 Customization

### Adding More Products
Edit `backend/src/seed/utils/DatabaseSeeder.js`:
```javascript
// Change target number
const targetProducts = 2000; // Instead of 1200
```

### Adding New Categories
Edit `backend/src/seed/data/categories.js`:
```javascript
{
  code: 'NEW',
  name: 'New Category',
  description: 'Description here',
  taxRate: 18,
  avgPrice: 100,
  stockRange: [20, 100],
  reorderLevel: 10,
  perishable: false
}
```

### Adding New Brands
Edit `backend/src/seed/data/brands.js`:
```javascript
{ name: 'New Brand', code: 'NEWBR', country: 'India', category: 'STA' }
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:27017
   ```
   **Solution**: Ensure MongoDB is running

2. **Duplicate Key Error**
   ```
   MongoServerError: E11000 duplicate key error
   ```
   **Solution**: Clear database first or use fresh database

3. **Validation Errors**
   ```
   ValidationError: Path `field` is required
   ```
   **Solution**: Check model schema requirements

### Reset Database
```bash
# Clear all data and reseed
npm run seed
```

### Environment Variables
Ensure `.env` file has:
```
MONGODB_URI=mongodb://localhost:27017/supermarket
```

## 📈 What's Next

The seeded data is perfect for:
- **Frontend Development**: Test all UI components with real data
- **API Testing**: All endpoints have realistic data to work with
- **Performance Testing**: Large dataset for optimization
- **Demo Presentations**: Professional-looking sample data
- **Feature Development**: Rich data set for new features

## 🎉 Success!

You now have a fully populated Indian supermarket inventory system with:
- ✅ 1200+ Indian market products
- ✅ Multi-branch inventory tracking  
- ✅ Realistic pricing in INR
- ✅ Role-based user system
- ✅ Complete master data setup
- ✅ Ready for frontend integration

Perfect for testing dashboards, reports, and all system functionality! 🚀