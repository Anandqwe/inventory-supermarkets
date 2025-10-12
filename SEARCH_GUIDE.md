# 🔍 Global Search Guide

## What Can You Search?

The global search in the header searches across **Products**, **Sales**, and **Suppliers/Customers**.

### Currently Searchable Fields:

#### 📦 Products
- **Product Name** (e.g., "Amul Milk", "Tata Salt", "Maggi")
- **SKU** (e.g., "AMU-FRM-500", "TAT-SLT-1KG")
- **Barcode** (e.g., "8901020031011")

#### 🛒 Sales
- **Sale Number** (e.g., "SALE-2024-001")
- **Customer Name** (e.g., "John Doe")
- **Customer Phone** (e.g., "9876543210")
- **Customer Email** (e.g., "customer@example.com")

#### 👥 Suppliers/Customers
- **Supplier Name** (e.g., "Amul Dairy", "Tata Consumer")
- **Contact Info** (email or phone)

---

## 🚀 How to Add Data to Search

### Option 1: Import Sample Products (Recommended)
1. Go to **Products** page
2. Click **Import** button
3. Upload the sample CSV from: `backend/samples/products_sample.csv`
4. This will add products like:
   - Amul Fresh Milk 500ml
   - Tata Salt 1kg
   - Maggi Noodles 70g
   - Basmati Rice 1kg
   - And more...

### Option 2: Create Products Manually
1. Go to **Products** page
2. Click **Add Product**
3. Fill in the form
4. Save the product

### Option 3: Create Sales
1. Go to **Sales** page
2. Click **New Sale**
3. Add products and complete the sale

---

## 🎯 Example Searches

Once you have data, try these searches:

### Product Searches:
- `Amul` - Find all Amul products
- `Milk` - Find all milk products
- `Tata` - Find all Tata products
- `AMU-FRM-500` - Search by SKU
- `Dairy` - Find products in Dairy category

### Sale Searches:
- `SALE-2024` - Find sales by sale number
- `Walk-in` - Find walk-in customer sales
- Customer name (if you added it)

### Supplier Searches:
- `Amul Dairy` - Find Amul supplier
- `Tata Consumer` - Find Tata supplier

---

## 💡 Tips

1. **Minimum 2 characters** required to search
2. Search is **case-insensitive** (e.g., "amul" = "AMUL" = "Amul")
3. Search uses **partial matching** (e.g., "Mil" will find "Milk")
4. Results are **limited to 5 per category** (click "View all results" for more)
5. **Recent searches** are saved locally for quick access

---

## 🛠️ Quick Setup (If No Data Available)

### Step 1: Ensure Backend is Running
```bash
cd backend
npm run dev
```

### Step 2: Ensure Frontend is Running
```bash
cd frontend
npm run dev
```

### Step 3: Login
- Email: `admin@supermarket.com`
- Password: `Admin@123456`

### Step 4: Import Products
1. Go to Products page
2. Click Import button
3. Select `backend/samples/products_sample.csv`
4. Wait for import to complete

### Step 5: Try Searching!
- Click the search box in the header
- Type: `Amul`, `Milk`, `Tata`, or any product name
- See instant results!

---

## 📊 Current Database Status

To check if you have data:
- **Products**: Go to `/products` - should show products list
- **Sales**: Go to `/sales` - should show sales history
- **Suppliers**: Go to Settings > Master Data > Suppliers

---

## 🐛 Troubleshooting

### "No results found" appears for everything?
✅ **Solution**: You need to add data first!
- Import products using the CSV file
- Or create products manually
- Or create some sales

### Search not working at all?
✅ **Check**:
1. Backend server is running (port 5000)
2. Frontend server is running (port 5173)
3. You're logged in
4. Check browser console for errors (F12)

### Search is slow?
✅ The search has a 300ms delay (debounce) to avoid too many API calls. This is normal!

---

## 🎨 Features

- ✅ Real-time search as you type
- ✅ Searches multiple categories at once
- ✅ Recent search history
- ✅ Click results to navigate
- ✅ Keyboard navigation (Enter to search)
- ✅ Clear button to reset
- ✅ Loading indicators
- ✅ Dark mode support
- ✅ Responsive design

---

Enjoy searching! 🎉
