const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// Models
const User = require('../../models/User');
const Category = require('../../models/Category');
const Brand = require('../../models/Brand');
const Unit = require('../../models/Unit');
const Supplier = require('../../models/Supplier');
const Branch = require('../../models/Branch');
const Product = require('../../models/Product');
const Customer = require('../../models/Customer');
const Sale = require('../../models/Sale');
const Purchase = require('../../models/Purchase');
const Transfer = require('../../models/Transfer');
const Adjustment = require('../../models/Adjustment');

// Data
const categoriesData = require('../data/categories');
const brandsData = require('../data/brands');
const unitsData = require('../data/units');
const suppliersData = require('../data/suppliers');
const branchesData = require('../data/branches');

// Utils
const { 
  generateSKU,
  generateBarcode,
  calculatePrice,
  calculateStockLevels,
  generateExpiryDate,
  generateProductDescription,
  generateDiscount,
  generateBatchInfo,
  generateIndianProductNames
} = require('../utils/productUtils');

class DatabaseSeeder {
  constructor() {
    this.createdRecords = {
      users: 0,
      categories: 0,
      brands: 0,
      units: 0,
      suppliers: 0,
      branches: 0,
      products: 0,
      customers: 0,
      sales: 0,
      purchases: 0,
      transfers: 0,
      adjustments: 0
    };
    this.systemAdmin = null;
  }

  async createSystemAdmin() {
    console.log('👑 Creating system admin...');
    
    const adminUser = new User({
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@supermarket.com',
      password: 'Admin@123456',
      role: 'Admin',
      permissions: ['manage_products', 'manage_inventory', 'make_sales', 'view_reports', 'manage_users'],
      isActive: true
    });

    this.systemAdmin = await adminUser.save();
    this.createdRecords.users++;
    
    console.log('✅ System admin created');
  }

  async seedAll() {
    try {
      console.log('🌱 Starting comprehensive database seeding...');
      
      // Clear existing data
      await this.clearDatabase();
      
      // Create system admin first for references
      await this.createSystemAdmin();
      
      // Seed master data in correct order
      await this.seedCategories();
      await this.seedBrands();
      await this.seedUnits();
      await this.seedSuppliers();
      await this.seedBranches();
      await this.seedUsers(); // Additional users
      
      // Seed products (1000+)
      await this.seedProducts();
      
      // Seed customers
      await this.seedCustomers();
      
      // Seed transactions
      await this.seedPurchases();
      await this.seedSales();
      await this.seedTransfers();
      await this.seedAdjustments();
      
      // Print summary
      this.printSummary();
      
      console.log('✅ Database seeding completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during seeding:', error);
      throw error;
    }
  }

  async clearDatabase() {
    console.log('🗑️  Clearing existing data...');
    
    await Sale.deleteMany({});
    await Purchase.deleteMany({});
    await Customer.deleteMany({});
    await Product.deleteMany({});
    await Branch.deleteMany({});
    await Supplier.deleteMany({});
    await Unit.deleteMany({});
    await Brand.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    
    console.log('✅ Database cleared');
  }

  async seedUsers() {
    console.log('👥 Seeding additional users...');
    
    const branches = await Branch.find({});
    const defaultBranch = branches[0];
    
    const users = [
      {
        firstName: 'Store',
        lastName: 'Manager',
        email: 'manager@supermarket.com',
        password: 'Manager@123456',
        role: 'Manager',
        branch: defaultBranch._id,
        permissions: ['manage_products', 'manage_inventory', 'view_reports'],
        isActive: true,
        createdBy: this.systemAdmin._id
      },
      {
        firstName: 'Cashier',
        lastName: 'One',
        email: 'cashier1@supermarket.com',
        password: 'Cashier@123456',
        role: 'Cashier',
        branch: defaultBranch._id,
        permissions: ['make_sales', 'view_products'],
        isActive: true,
        createdBy: this.systemAdmin._id
      },
      {
        firstName: 'Cashier',
        lastName: 'Two',
        email: 'cashier2@supermarket.com',
        password: 'Cashier@123456',
        role: 'Cashier',
        branch: branches[1]?._id || defaultBranch._id,
        permissions: ['make_sales', 'view_products'],
        isActive: true,
        createdBy: this.systemAdmin._id
      },
      {
        firstName: 'Inventory',
        lastName: 'Clerk',
        email: 'inventory@supermarket.com',
        password: 'Inventory@123456',
        role: 'Manager',
        branch: defaultBranch._id,
        permissions: ['manage_inventory', 'view_products'],
        isActive: true,
        createdBy: this.systemAdmin._id
      }
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      this.createdRecords.users++;
    }

    console.log(`✅ Created ${this.createdRecords.users} additional users`);
  }

  async seedCategories() {
    console.log('📁 Seeding categories...');
    
    for (const categoryData of categoriesData) {
      const category = new Category({
        ...categoryData,
        createdBy: this.systemAdmin._id
      });
      await category.save();
      this.createdRecords.categories++;
    }

    console.log(`✅ Created ${this.createdRecords.categories} categories`);
  }

  async seedBrands() {
    console.log('🏷️  Seeding brands...');
    
    for (const brandData of brandsData) {
      const brand = new Brand({
        ...brandData,
        createdBy: this.systemAdmin._id
      });
      await brand.save();
      this.createdRecords.brands++;
    }

    console.log(`✅ Created ${this.createdRecords.brands} brands`);
  }

  async seedUnits() {
    console.log('📏 Seeding units...');
    
    for (const unitData of unitsData) {
      const unit = new Unit({
        ...unitData,
        createdBy: this.systemAdmin._id
      });
      await unit.save();
      this.createdRecords.units++;
    }

    console.log(`✅ Created ${this.createdRecords.units} units`);
  }

  async seedSuppliers() {
    console.log('🚛 Seeding suppliers...');
    
    for (const supplierData of suppliersData) {
      const supplier = new Supplier({
        ...supplierData,
        createdBy: this.systemAdmin._id
      });
      await supplier.save();
      this.createdRecords.suppliers++;
    }

    console.log(`✅ Created ${this.createdRecords.suppliers} suppliers`);
  }

  async seedBranches() {
    console.log('🏪 Seeding branches...');
    
    for (const branchData of branchesData) {
      const branch = new Branch({
        ...branchData,
        createdBy: this.systemAdmin._id
      });
      await branch.save();
      this.createdRecords.branches++;
    }

    console.log(`✅ Created ${this.createdRecords.branches} branches`);
  }

  async seedProducts() {
    console.log('📦 Seeding products (targeting 1000+)...');
    
    const categories = await Category.find({});
    const brands = await Brand.find({});
    const units = await Unit.find({});
    const suppliers = await Supplier.find({});
    const branches = await Branch.find({});

    // Target: 1200 products distributed across categories
    const targetProducts = 1200;
    const productsPerCategory = Math.floor(targetProducts / categories.length);
    
    for (const category of categories) {
      console.log(`  Creating products for ${category.name}...`);
      
      // Get brands suitable for this category
      const categoryBrands = brands.filter(brand => 
        brand.category === category.code || 
        !brand.category // Generic brands
      );
      
      for (let i = 0; i < productsPerCategory; i++) {
        const brand = categoryBrands.length > 0 ? faker.helpers.arrayElement(categoryBrands) : faker.helpers.arrayElement(brands);
        const unit = faker.helpers.arrayElement(units);
        const categorySuppliers = suppliers.filter(s => s.categories && s.categories.includes(category.code));
        const supplier = categorySuppliers.length > 0 ? faker.helpers.arrayElement(categorySuppliers) : faker.helpers.arrayElement(suppliers);
        
        // Generate unique product name
        const productNames = generateIndianProductNames(category, brand, 1);
        const baseName = productNames[0];
        const variants = ['', ' Premium', ' Economy', ' Super', ' Special', ' Deluxe', ' Classic', ' Fresh', ' Natural', ' Organic'];
        const sizes = ['', ' 250g', ' 500g', ' 1kg', ' 200ml', ' 500ml', ' 1L', ' Pack of 2', ' Pack of 5', ' Family Pack'];
        
        const variant = faker.helpers.arrayElement(variants);
        const size = faker.helpers.arrayElement(sizes);
        const productName = `${baseName}${variant}${size} - ${faker.string.alphanumeric(4).toUpperCase()}`;
        
        // Calculate pricing and stock
        const isPremium = faker.datatype.boolean({ probability: 0.3 });
        const price = calculatePrice(category, isPremium);
        const stockLevels = calculateStockLevels(category);
        
        // Create stock levels for branches
        const selectedBranches = faker.helpers.arrayElements(branches, { min: 1, max: 3 });
        const stockByBranch = selectedBranches.map(branch => {
          const stockLevels = calculateStockLevels(category);
          return {
            branch: branch._id,
            quantity: stockLevels.currentStock,
            reorderLevel: stockLevels.reorderLevel,
            maxStockLevel: stockLevels.maxStock
          };
        });

        const product = new Product({
          name: productName,
          sku: generateSKU(category.code, brand.code),
          barcode: generateBarcode(),
          description: generateProductDescription(productName, category, brand),
          category: category._id,
          brand: brand._id,
          unit: unit._id,
          supplier: supplier._id,
          pricing: {
            costPrice: Math.round(price * 0.7), // 30% margin
            sellingPrice: price,
            mrp: Math.round(price * 1.1), // 10% above selling price
            discount: generateDiscount(),
            taxRate: category.taxRate
          },
          stockByBranch,
          expiryDate: generateExpiryDate(category),
          batchNumber: generateBatchInfo().batchNumber,
          manufacturingDate: generateBatchInfo().manufacturingDate,
          isActive: true,
          isPerishable: category.perishable || false,
          createdBy: this.systemAdmin._id
        });

        await product.save();
        this.createdRecords.products++;
        
        // Progress indicator
        if (this.createdRecords.products % 100 === 0) {
          console.log(`    Progress: ${this.createdRecords.products} products created`);
        }
      }
    }

    console.log(`✅ Created ${this.createdRecords.products} products`);
  }

  async seedCustomers() {
    console.log('👥 Seeding customers...');
    
    const branches = await Branch.find({});
    const customerCount = 150;
    
    for (let i = 0; i < customerCount; i++) {
      const customer = new Customer({
        customerNumber: `CUST${String(i + 1).padStart(6, '0')}`,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: `+91${faker.number.int({ min: 7000000000, max: 9999999999 })}`,
        addresses: [{
          type: 'both',
          street: faker.location.streetAddress(),
          city: faker.helpers.arrayElement(['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad']),
          state: faker.helpers.arrayElement(['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana']),
          zipCode: faker.location.zipCode('######'),
          country: 'India',
          isDefault: true
        }],
        registeredBranch: faker.helpers.arrayElement(branches)._id,
        loyaltyPoints: faker.number.int({ min: 0, max: 1000 }),
        isActive: true,
        createdBy: this.systemAdmin._id
      });

      await customer.save();
      this.createdRecords.customers++;
    }

    console.log(`✅ Created ${this.createdRecords.customers} customers`);
  }

  async seedPurchases() {
    console.log('📥 Seeding purchases (last 90 days)...');
    
    const products = await Product.find({}).populate('supplier unit');
    const suppliers = await Supplier.find({});
    const branches = await Branch.find({});
    const purchaseCount = 250;
    
    for (let i = 0; i < purchaseCount; i++) {
      // Generate purchases over last 90 days
      const daysAgo = faker.number.int({ min: 0, max: 90 });
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - daysAgo);
      
      const supplier = faker.helpers.arrayElement(suppliers);
      const branch = faker.helpers.arrayElement(branches);
      
      // Get products from this supplier
      const supplierProducts = products.filter(p => 
        p.supplier && p.supplier._id.toString() === supplier._id.toString()
      );
      
      if (supplierProducts.length === 0) continue;
      
      const purchaseProducts = faker.helpers.arrayElements(supplierProducts, { 
        min: 3, 
        max: Math.min(15, supplierProducts.length) 
      });
      
      const purchaseNumber = `PO${String(Date.now() + i).slice(-8)}`;
      let subtotal = 0;
      let totalTax = 0;
      
      const items = purchaseProducts.map(product => {
        const quantity = faker.number.int({ min: 20, max: 200 });
        const unitPrice = product.pricing.costPrice;
        const totalPrice = quantity * unitPrice; // Required field
        const taxAmount = (totalPrice * product.pricing.taxRate) / 100;
        
        subtotal += totalPrice;
        totalTax += taxAmount;
        
        return {
          product: product._id,
          productName: product.name,
          sku: product.sku,
          unit: product.unit.name,
          quantity,
          unitPrice,
          totalPrice, // This is the required field name
          discount: {
            amount: 0,
            percentage: 0
          },
          tax: {
            rate: product.pricing.taxRate,
            amount: taxAmount
          },
          expiryDate: product.categories?.some(cat => cat.name.includes('Dairy')) ? 
            faker.date.future({ days: 30 }) : null,
          batchNumber: `BATCH-${faker.string.alphanumeric(8).toUpperCase()}`,
          manufacturingDate: faker.date.past({ days: 30 })
        };
      });

      const shippingCharges = faker.number.float({ min: 0, max: 500, multipleOf: 0.01 });
      const totalAmount = subtotal + totalTax + shippingCharges;
      
      const purchase = new Purchase({
        purchaseNumber,
        supplier: supplier._id,
        branch: branch._id,
        orderDate: purchaseDate, // Changed from purchaseDate
        expectedDeliveryDate: new Date(purchaseDate.getTime() + (supplier.leadTime || 7) * 24 * 60 * 60 * 1000),
        actualDeliveryDate: faker.datatype.boolean({ probability: 0.8 }) ? 
          new Date(purchaseDate.getTime() + faker.number.int({ min: 1, max: 10 }) * 24 * 60 * 60 * 1000) : null,
        items,
        totals: {
          subtotal,
          totalDiscount: 0,
          totalTax,
          shippingCharges,
          totalAmount // Required field
        },
        invoiceNumber: `INV-${faker.string.alphanumeric(10).toUpperCase()}`,
        invoiceDate: purchaseDate,
        status: faker.helpers.arrayElement(['pending', 'ordered', 'partial_received', 'received', 'cancelled']), // Valid enum values
        payment: {
          method: faker.helpers.arrayElement(['cash', 'cheque', 'bank_transfer', 'credit', 'online']),
          status: faker.helpers.arrayElement(['pending', 'partial', 'paid', 'overdue']),
          dueDate: new Date(purchaseDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from order
          paidAmount: faker.datatype.boolean({ probability: 0.6 }) ? totalAmount : 0,
          reference: `PAY-${faker.string.alphanumeric(8).toUpperCase()}`
        },
        paymentTerms: faker.helpers.arrayElement(['immediate', '15_days', '30_days', '45_days']),
        notes: `Purchase order for ${items.length} items from ${supplier.name}`,
        createdBy: this.systemAdmin._id,
        receivedBy: faker.datatype.boolean({ probability: 0.7 }) ? this.systemAdmin._id : null
      });

      await purchase.save();
      this.createdRecords.purchases++;
      
      // Update stock levels for received purchases
      if (purchase.status === 'received' || purchase.status === 'completed') {
        for (const item of items) {
          await Product.updateOne(
            { 
              _id: item.product,
              'stockByBranch.branch': branch._id 
            },
            { 
              $inc: { 'stockByBranch.$.quantity': item.quantity }
            }
          );
        }
      }
      
      if (i % 25 === 0 && i > 0) {
        console.log(`    Progress: ${i} purchases created`);
      }
    }

    console.log(`✅ Created ${this.createdRecords.purchases} purchases`);
  }

  async seedSales() {
    console.log('💰 Seeding sales (last 60 days)...');
    
    const products = await Product.find({}).populate('unit brand');
    const customers = await Customer.find({});
    const cashiers = await User.find({ role: 'Cashier' });
    const branches = await Branch.find({});
    
    const salesCount = 500; // Increased for better demo data
    
    for (let i = 0; i < salesCount; i++) {
      // Generate sales over last 60 days with weekend spikes
      const daysAgo = faker.number.int({ min: 0, max: 60 });
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - daysAgo);
      
      // Weekend sales tend to be larger
      const isWeekend = saleDate.getDay() === 0 || saleDate.getDay() === 6;
      const maxItems = isWeekend ? 12 : 8;
      const minItems = isWeekend ? 3 : 1;
      
      const branch = faker.helpers.arrayElement(branches);
      const cashier = faker.helpers.arrayElement(cashiers);
      const customer = faker.datatype.boolean({ probability: 0.7 }) 
        ? faker.helpers.arrayElement(customers) 
        : null;
      
      // Select products available in this branch
      const availableProducts = products.filter(p => 
        p.stockByBranch && p.stockByBranch.some(s => 
          s.branch.toString() === branch._id.toString() && s.quantity > 0
        )
      );
      
      if (availableProducts.length === 0) continue;
      
      const saleProducts = faker.helpers.arrayElements(availableProducts, { 
        min: minItems, 
        max: Math.min(maxItems, availableProducts.length) 
      });
      
      let subtotal = 0;
      let totalTax = 0;
      const saleNumber = `SALE${String(Date.now() + i).slice(-8)}`;
      
      const items = saleProducts.map(product => {
        const branchStock = product.stockByBranch.find(s => 
          s.branch.toString() === branch._id.toString()
        );
        
        const maxQty = Math.min(branchStock?.quantity || 1, 10);
        const quantity = faker.number.int({ min: 1, max: maxQty });
        const unitPrice = product.pricing.sellingPrice;
        const discount = faker.number.int({ min: 0, max: 10 }); // 0-10% discount
        const discountAmount = (unitPrice * quantity * discount) / 100;
        const lineTotal = (unitPrice * quantity) - discountAmount;
        const taxAmount = (lineTotal * product.pricing.taxRate) / 100;
        
        subtotal += lineTotal;
        totalTax += taxAmount;
        
        return {
          product: product._id,
          productName: product.name,
          sku: product.sku,
          quantity,
          costPrice: product.pricing.costPrice, // Required field
          sellingPrice: product.pricing.sellingPrice, // Required field
          unitPrice,
          total: lineTotal, // Required field (changed from lineTotal)
          discount: discountAmount,
          tax: taxAmount
        };
      });

      const grandTotal = subtotal + totalTax;
      const paymentMethods = ['cash', 'card', 'upi'];
      const paymentMethod = faker.helpers.arrayElement(paymentMethods);
      
      // Payment breakdown for mixed payments (20% chance)
      const paymentBreakdown = faker.datatype.boolean({ probability: 0.2 }) ? [
        {
          method: paymentMethod,
          amount: Math.round(grandTotal * 0.6)
        },
        {
          method: faker.helpers.arrayElement(paymentMethods.filter(p => p !== paymentMethod)),
          amount: grandTotal - Math.round(grandTotal * 0.6)
        }
      ] : [
        {
          method: paymentMethod,
          amount: grandTotal
        }
      ];
      
      const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
      const totalAmount = subtotal + totalTax - totalDiscount;
      
      const sale = new Sale({
        saleNumber,
        invoiceNumber: `INV-${saleNumber}`,
        branch: branch._id,
        items,
        customer: customer?._id,
        customerName: customer?.name || 'Walk-in Customer',
        customerPhone: customer?.phone,
        customerEmail: customer?.email,
        // Financial details (required fields)
        subtotal, // Required
        discountAmount: totalDiscount,
        taxAmount: totalTax,
        total: totalAmount, // Required
        // Payment information 
        payments: paymentBreakdown.map(p => ({
          method: p.method,
          amount: p.amount,
          reference: `PAY-${faker.string.alphanumeric(8).toUpperCase()}`,
          receivedAt: saleDate
        })),
        totalPaid: totalAmount,
        paymentStatus: 'paid',
        saleDate,
        status: 'completed',
        cashier: cashier._id,
        createdBy: cashier._id
      });

      await sale.save();
      this.createdRecords.sales++;
      
      // Update stock levels
      for (const item of items) {
        await Product.updateOne(
          { 
            _id: item.product,
            'stockByBranch.branch': branch._id 
          },
          { 
            $inc: { 'stockByBranch.$.quantity': -item.quantity }
          }
        );
      }
      
      if (i % 50 === 0 && i > 0) {
        console.log(`    Progress: ${i} sales created`);
      }
    }

    console.log(`✅ Created ${this.createdRecords.sales} sales`);
  }

  async seedTransfers() {
    console.log('🔄 Seeding transfers between branches...');
    
    const products = await Product.find({}).populate('unit');
    const branches = await Branch.find({});
    const managers = await User.find({ role: 'Manager' });
    const transferCount = 45;
    
    for (let i = 0; i < transferCount; i++) {
      // Generate transfers over last 30 days
      const daysAgo = faker.number.int({ min: 0, max: 30 });
      const transferDate = new Date();
      transferDate.setDate(transferDate.getDate() - daysAgo);
      
      const fromBranch = faker.helpers.arrayElement(branches);
      const toBranch = faker.helpers.arrayElement(branches.filter(b => 
        b._id.toString() !== fromBranch._id.toString()
      ));
      
      // Get products available in the from branch
      const availableProducts = products.filter(p => 
        p.stockByBranch && p.stockByBranch.some(s => 
          s.branch.toString() === fromBranch._id.toString() && s.quantity > 10
        )
      );
      
      if (availableProducts.length === 0) continue;
      
      const transferProducts = faker.helpers.arrayElements(availableProducts, { 
        min: 1, 
        max: Math.min(8, availableProducts.length) 
      });
      
      const transferNumber = `TRF${String(Date.now() + i).slice(-8)}`;
      
      const items = transferProducts.map(product => {
        const fromStock = product.stockByBranch.find(s => 
          s.branch.toString() === fromBranch._id.toString()
        );
        
        const maxQty = Math.min(fromStock?.quantity || 1, 50);
        const quantity = faker.number.int({ min: 1, max: Math.max(1, Math.floor(maxQty * 0.3)) });
        
        return {
          product: product._id,
          productName: product.name,
          sku: product.sku,
          unit: product.unit.name,
          quantity,
          unitCost: product.pricing.costPrice
        };
      });

      const transfer = new Transfer({
        transferNumber,
        fromBranch: fromBranch._id,
        toBranch: toBranch._id,
        transferDate,
        items,
        status: faker.helpers.arrayElement(['pending', 'in_transit', 'completed', 'cancelled']),
        reason: faker.helpers.arrayElement(['restock', 'demand', 'expiry', 'other']),
        notes: `Transfer of ${items.length} items from ${fromBranch.name} to ${toBranch.name}`,
        createdBy: this.systemAdmin._id,
        approvedBy: faker.datatype.boolean({ probability: 0.8 }) ? faker.helpers.arrayElement(managers)._id : null,
        receivedBy: faker.datatype.boolean({ probability: 0.7 }) ? faker.helpers.arrayElement(managers)._id : null
      });

      await transfer.save();
      this.createdRecords.transfers++;
      
      // Update stock levels for completed transfers
      if (transfer.status === 'completed' || transfer.status === 'received') {
        for (const item of items) {
          // Reduce from source branch
          await Product.updateOne(
            { 
              _id: item.product,
              'stockByBranch.branch': fromBranch._id 
            },
            { 
              $inc: { 'stockByBranch.$.quantity': -item.quantity }
            }
          );
          
          // Add to destination branch
          await Product.updateOne(
            { 
              _id: item.product,
              'stockByBranch.branch': toBranch._id 
            },
            { 
              $inc: { 'stockByBranch.$.quantity': item.quantity }
            }
          );
        }
      }
    }

    console.log(`✅ Created ${this.createdRecords.transfers} transfers`);
  }

  async seedAdjustments() {
    console.log('📊 Seeding inventory adjustments...');
    
    const products = await Product.find({}).populate('unit');
    const branches = await Branch.find({});
    const managers = await User.find({ role: 'Manager' });
    const adjustmentCount = 35;
    
    const reasonCodes = [
      'DAMAGE', 'EXPIRED', 'THEFT', 'COUNTING_ERROR', 'SUPPLIER_ERROR',
      'RETURN_TO_VENDOR', 'PROMOTIONAL_LOSS', 'QUALITY_ISSUE'
    ];
    
    for (let i = 0; i < adjustmentCount; i++) {
      // Generate adjustments over last 45 days
      const daysAgo = faker.number.int({ min: 0, max: 45 });
      const adjustmentDate = new Date();
      adjustmentDate.setDate(adjustmentDate.getDate() - daysAgo);
      
      const branch = faker.helpers.arrayElement(branches);
      const reasonCode = faker.helpers.arrayElement(reasonCodes);
      
      // Get products available in this branch
      const availableProducts = products.filter(p => 
        p.stockByBranch && p.stockByBranch.some(s => 
          s.branch.toString() === branch._id.toString() && s.quantity > 0
        )
      );
      
      if (availableProducts.length === 0) continue;
      
      const adjustmentProducts = faker.helpers.arrayElements(availableProducts, { 
        min: 1, 
        max: Math.min(5, availableProducts.length) 
      });
      
      const adjustmentNumber = `ADJ${String(Date.now() + i).slice(-8)}`;
      let totalValue = 0;
      const isIncreaseAdjustment = faker.datatype.boolean({ probability: 0.3 }); // 30% chance of increase
      
      const items = adjustmentProducts.map(product => {
        const currentStock = product.stockByBranch.find(s => 
          s.branch.toString() === branch._id.toString()
        );
        
        // Adjustment quantity based on type
        const maxQty = isIncreaseAdjustment ? 20 : Math.min(currentStock?.quantity || 1, 10);
        const quantity = faker.number.int({ min: 1, max: maxQty });
        const adjustmentQty = isIncreaseAdjustment ? quantity : -quantity;
        const unitCost = product.pricing.costPrice;
        const lineValue = Math.abs(adjustmentQty) * unitCost;
        
        totalValue += lineValue;
        
        const currentQty = currentStock?.quantity || 0;
        const adjustedQty = currentQty + adjustmentQty;
        
        return {
          product: product._id,
          productName: product.name,
          sku: product.sku,
          currentQuantity: currentQty, // Required field
          adjustedQuantity: adjustedQty, // Required field
          difference: adjustmentQty, // Required field
          unit: product.unit.name,
          reason: faker.helpers.arrayElement(['damage', 'theft', 'expiry', 'found', 'count_error', 'other'])
        };
      });

      const adjustment = new Adjustment({
        adjustmentNumber,
        branch: branch._id,
        items,
        type: isIncreaseAdjustment ? 'increase' : 'decrease', // Required field
        reason: faker.helpers.arrayElement(['damage', 'theft', 'expiry', 'found', 'count_error', 'other']), // Required field
        notes: this.getAdjustmentNotes(reasonCode),
        adjustmentDate,
        createdBy: this.systemAdmin._id,
        approvedBy: faker.helpers.arrayElement(managers)._id,
        status: faker.helpers.arrayElement(['pending', 'approved', 'rejected'])
      });

      await adjustment.save();
      this.createdRecords.adjustments++;
      
      // Update stock levels
      for (const item of items) {
        await Product.updateOne(
          { 
            _id: item.product,
            'stockByBranch.branch': branch._id 
          },
          { 
            $inc: { 'stockByBranch.$.quantity': item.difference }
          }
        );
      }
    }

    console.log(`✅ Created ${this.createdRecords.adjustments} adjustments`);
  }

  getAdjustmentNotes(reasonCode) {
    const notes = {
      'DAMAGE': 'Items damaged during handling/transport',
      'EXPIRED': 'Products past expiry date removed from inventory',
      'THEFT': 'Inventory loss due to theft/shrinkage',
      'COUNTING_ERROR': 'Physical count correction',
      'SUPPLIER_ERROR': 'Supplier delivery discrepancy correction',
      'RETURN_TO_VENDOR': 'Defective items returned to supplier',
      'PROMOTIONAL_LOSS': 'Items used for promotional activities',
      'QUALITY_ISSUE': 'Quality control rejection'
    };
    
    return notes[reasonCode] || 'Inventory adjustment';
  }

  printSummary() {
    console.log('\n📊 SEEDING SUMMARY');
    console.log('==================');
    Object.entries(this.createdRecords).forEach(([type, count]) => {
      console.log(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`);
    });
    console.log('==================');
    
    const totalRecords = Object.values(this.createdRecords).reduce((sum, count) => sum + count, 0);
    console.log(`Total Records: ${totalRecords}`);
  }
}

module.exports = DatabaseSeeder;