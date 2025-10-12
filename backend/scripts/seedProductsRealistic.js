require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Brand = require('../src/models/Brand');
const Unit = require('../src/models/Unit');
const Supplier = require('../src/models/Supplier');
const Branch = require('../src/models/Branch');

/**
 * Seed 1200 Realistic Indian Products
 * 9 Categories with proper GST rates and Indian brands
 */

// Indian product categories with GST rates
const indianCategories = [
  { name: 'Beverages', gstRate: 12, productCount: 120 },
  { name: 'Staples & Grains', gstRate: 5, productCount: 150 },
  { name: 'Personal Care', gstRate: 18, productCount: 100 },
  { name: 'Baby Care', gstRate: 18, productCount: 100 },
  { name: 'Snacks', gstRate: 12, productCount: 150 },
  { name: 'Dairy', gstRate: 5, productCount: 100 },
  { name: 'Frozen Foods', gstRate: 5, productCount: 80 },
  { name: 'Cleaning & Household', gstRate: 18, productCount: 100 },
  { name: 'Pantry & Cooking', gstRate: 12, productCount: 300 }
];

// Indian brands by category
const indianBrands = {
  'Beverages': ['Coca-Cola', 'Pepsi', 'Amul', 'Paper Boat', 'Tropicana', 'Real', 'Minute Maid', 'Frooti', 'Maaza', 'Slice'],
  'Staples & Grains': ['India Gate', 'Daawat', 'Fortune', 'Aashirvaad', 'Tata Sampann', 'Kohinoor', 'Pillsbury'],
  'Personal Care': ['Dove', 'Ponds', 'Lakme', 'Nivea', 'Himalaya', 'Patanjali', 'Biotique', 'Garnier', 'Loreal'],
  'Baby Care': ['Johnson & Johnson', 'Pampers', 'Huggies', 'Himalaya', 'Mamy Poko', 'Chicco', 'Pigeon'],
  'Snacks': ['Haldirams', 'Bikaji', 'Lays', 'Kurkure', 'Bingo', 'Britannia', 'Parle', 'ITC', 'Amul'],
  'Dairy': ['Amul', 'Mother Dairy', 'Britannia', 'Nandini', 'Heritage', 'Nestle', 'Verka'],
  'Frozen Foods': ['McCain', 'ITC', 'Sumeru', 'Venky', 'Godrej', 'Al Kabeer'],
  'Cleaning & Household': ['Vim', 'Harpic', 'Lizol', 'Colin', 'Odonil', 'Surf Excel', 'Ariel', 'Tide', 'Comfort'],
  'Pantry & Cooking': ['MDH', 'Everest', 'Catch', 'Eastern', 'MTR', 'Kissan', 'Maggi', 'Top Ramen', 'Yippee']
};

// Product name templates by category
const productTemplates = {
  'Beverages': [
    { prefix: 'Coca-Cola', suffixes: ['Regular', 'Zero', 'Diet'], sizes: ['250ml', '500ml', '750ml', '1L', '1.5L', '2L'] },
    { prefix: 'Pepsi', suffixes: ['Regular', 'Black', 'Diet'], sizes: ['250ml', '500ml', '750ml', '1L', '1.5L', '2L'] },
    { prefix: 'Sprite', suffixes: ['Regular', 'Zero'], sizes: ['250ml', '500ml', '750ml', '1L', '1.5L'] },
    { prefix: 'Fanta', suffixes: ['Orange', 'Lemon'], sizes: ['250ml', '500ml', '750ml', '1L'] },
    { prefix: 'Tropicana', suffixes: ['Orange', 'Mixed Fruit', 'Apple', 'Litchi', 'Mango'], sizes: ['200ml', '500ml', '1L'] },
    { prefix: 'Real', suffixes: ['Mango', 'Orange', 'Mixed Fruit', 'Apple'], sizes: ['200ml', '500ml', '1L'] },
    { prefix: 'Paper Boat', suffixes: ['Aamras', 'Jaljeera', 'Aam Panna', 'Kokum'], sizes: ['250ml', '500ml'] },
    { prefix: 'Bisleri', suffixes: ['Mineral Water'], sizes: ['500ml', '1L', '2L', '5L'] },
    { prefix: 'Kinley', suffixes: ['Mineral Water'], sizes: ['500ml', '1L', '2L'] },
    { prefix: 'Amul', suffixes: ['Kool Koko', 'Kool Cafe', 'Lassi'], sizes: ['200ml', '500ml'] }
  ],
  'Staples & Grains': [
    { prefix: 'India Gate', suffixes: ['Basmati Rice'], sizes: ['1kg', '5kg', '10kg', '25kg'] },
    { prefix: 'Daawat', suffixes: ['Rozana Basmati', 'Dubar Basmati'], sizes: ['1kg', '5kg', '10kg'] },
    { prefix: 'Aashirvaad', suffixes: ['Atta', 'Multigrain Atta', 'Select Sharbati Atta'], sizes: ['1kg', '2kg', '5kg', '10kg'] },
    { prefix: 'Pillsbury', suffixes: ['Chakki Atta', 'Multigrain Atta'], sizes: ['1kg', '2kg', '5kg'] },
    { prefix: 'Tata Sampann', suffixes: ['Toor Dal', 'Moong Dal', 'Chana Dal', 'Urad Dal', 'Masoor Dal'], sizes: ['500g', '1kg', '2kg'] },
    { prefix: 'Fortune', suffixes: ['Sona Masoori Rice', 'Brown Rice'], sizes: ['1kg', '5kg', '10kg'] },
    { prefix: 'India Gate', suffixes: ['Sona Masoori Rice', 'Brown Rice', 'Ponni Rice'], sizes: ['1kg', '5kg', '10kg'] }
  ],
  'Personal Care': [
    { prefix: 'Dove', suffixes: ['Soap', 'Body Wash', 'Shampoo', 'Conditioner', 'Body Lotion'], sizes: ['75g', '100g', '125g', '200ml', '400ml'] },
    { prefix: 'Ponds', suffixes: ['Cold Cream', 'White Beauty Cream', 'BB Cream', 'Face Wash'], sizes: ['50g', '100g', '200ml'] },
    { prefix: 'Lakme', suffixes: ['Lipstick', 'Kajal', 'Eyeliner', 'Compact', 'Foundation'], sizes: [''] },
    { prefix: 'Himalaya', suffixes: ['Face Wash', 'Face Cream', 'Body Lotion', 'Lip Balm'], sizes: ['50ml', '100ml', '150ml'] },
    { prefix: 'Patanjali', suffixes: ['Aloe Vera Gel', 'Kesh Kanti Hair Oil', 'Dant Kanti Toothpaste'], sizes: ['100ml', '200ml', '150g'] },
    { prefix: 'Nivea', suffixes: ['Body Lotion', 'Face Cream', 'Deodorant', 'Sunscreen'], sizes: ['100ml', '200ml', '400ml'] }
  ],
  'Baby Care': [
    { prefix: 'Johnson & Johnson', suffixes: ['Baby Powder', 'Baby Oil', 'Baby Lotion', 'Baby Shampoo', 'Baby Soap'], sizes: ['100g', '200g', '200ml', '400ml'] },
    { prefix: 'Pampers', suffixes: ['Baby Dry Pants', 'Premium Care'], sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    { prefix: 'Huggies', suffixes: ['Wonder Pants', 'Dry Pants'], sizes: ['S', 'M', 'L', 'XL'] },
    { prefix: 'Himalaya', suffixes: ['Baby Powder', 'Baby Oil', 'Baby Soap'], sizes: ['100g', '200g', '200ml'] },
    { prefix: 'Mamy Poko', suffixes: ['Pants'], sizes: ['S', 'M', 'L', 'XL'] }
  ],
  'Snacks': [
    { prefix: 'Haldirams', suffixes: ['Bhujia', 'Aloo Bhujia', 'Namkeen', 'Moong Dal', 'Khatta Meetha'], sizes: ['150g', '200g', '400g', '1kg'] },
    { prefix: 'Bikaji', suffixes: ['Bhujia', 'Raita Boondi', 'Aloo Chips'], sizes: ['150g', '200g', '400g'] },
    { prefix: 'Lays', suffixes: ['Classic Salted', 'American Cream & Onion', 'Magic Masala', 'Spanish Tomato Tango'], sizes: ['25g', '52g', '90g', '150g'] },
    { prefix: 'Kurkure', suffixes: ['Masala Munch', 'Solid Masti', 'Chilli Chatka'], sizes: ['25g', '50g', '90g', '140g'] },
    { prefix: 'Bingo', suffixes: ['Mad Angles', 'Tedhe Medhe', 'Yumitos'], sizes: ['35g', '60g', '130g'] },
    { prefix: 'Britannia', suffixes: ['Good Day', 'Marie Gold', 'Bourbon', 'NutriChoice', '50-50'], sizes: ['75g', '100g', '150g', '250g', '1kg'] },
    { prefix: 'Parle', suffixes: ['Hide & Seek', 'Monaco', 'Krackjack', '20-20 Cookies', 'Parle-G'], sizes: ['75g', '100g', '200g', '300g', '800g'] }
  ],
  'Dairy': [
    { prefix: 'Amul', suffixes: ['Milk', 'Butter', 'Cheese', 'Paneer', 'Curd', 'Buttermilk'], sizes: ['500ml', '1L', '100g', '200g', '500g'] },
    { prefix: 'Mother Dairy', suffixes: ['Milk', 'Curd', 'Paneer', 'Butter'], sizes: ['500ml', '1L', '200g', '500g'] },
    { prefix: 'Britannia', suffixes: ['Cheese Slices', 'Cream Cheese'], sizes: ['200g', '400g'] },
    { prefix: 'Nestle', suffixes: ['Milkmaid', 'Everyday Milk Powder'], sizes: ['400g', '1kg'] }
  ],
  'Frozen Foods': [
    { prefix: 'McCain', suffixes: ['French Fries', 'Potato Wedges', 'Aloo Tikki'], sizes: ['400g', '750g', '1kg'] },
    { prefix: 'ITC', suffixes: ['Chicken Nuggets', 'Chicken Sausages'], sizes: ['400g', '500g'] },
    { prefix: 'Sumeru', suffixes: ['Samosa', 'Spring Rolls'], sizes: ['400g', '800g'] }
  ],
  'Cleaning & Household': [
    { prefix: 'Vim', suffixes: ['Dishwash Bar', 'Dishwash Gel', 'Liquid'], sizes: ['200g', '500g', '500ml', '1L'] },
    { prefix: 'Harpic', suffixes: ['Toilet Cleaner', 'Bathroom Cleaner'], sizes: ['500ml', '1L'] },
    { prefix: 'Lizol', suffixes: ['Disinfectant Floor Cleaner'], sizes: ['500ml', '975ml', '2L'] },
    { prefix: 'Surf Excel', suffixes: ['Detergent Powder', 'Liquid Detergent', 'Matic'], sizes: ['500g', '1kg', '2kg', '4kg'] },
    { prefix: 'Ariel', suffixes: ['Detergent Powder', 'Matic'], sizes: ['500g', '1kg', '2kg'] },
    { prefix: 'Tide', suffixes: ['Detergent Powder', 'Plus'], sizes: ['500g', '1kg', '2kg'] },
    { prefix: 'Colin', suffixes: ['Glass Cleaner'], sizes: ['500ml', '1L'] }
  ],
  'Pantry & Cooking': [
    { prefix: 'MDH', suffixes: ['Chana Masala', 'Garam Masala', 'Red Chilli Powder', 'Turmeric Powder', 'Coriander Powder'], sizes: ['50g', '100g', '200g', '500g'] },
    { prefix: 'Everest', suffixes: ['Garam Masala', 'Chilli Powder', 'Turmeric', 'Coriander Powder'], sizes: ['50g', '100g', '200g'] },
    { prefix: 'Catch', suffixes: ['Garam Masala', 'Chat Masala', 'Kitchen King Masala'], sizes: ['50g', '100g'] },
    { prefix: 'Kissan', suffixes: ['Tomato Ketchup', 'Mixed Fruit Jam'], sizes: ['200g', '500g', '1kg'] },
    { prefix: 'Maggi', suffixes: ['2-Minute Noodles', 'Masala-ae-Magic', 'Rich Tomato Sauce'], sizes: ['70g', '280g', '500g', '1kg'] },
    { prefix: 'Fortune', suffixes: ['Refined Oil', 'Mustard Oil', 'Rice Bran Oil'], sizes: ['500ml', '1L', '5L'] },
    { prefix: 'MTR', suffixes: ['Instant Mix', 'Ready to Eat'], sizes: ['200g', '500g'] }
  ]
};

// Generate SKU
function generateSKU(category, index) {
  const catCode = category.substring(0, 3).toUpperCase();
  return `${catCode}${String(index).padStart(5, '0')}`;
}

// Calculate pricing with profit margin
function calculatePricing(costPrice, marginPercent, gstRate) {
  const sellingPrice = Math.round(costPrice * (1 + marginPercent / 100));
  const mrp = Math.round(sellingPrice * 1.05); // MRP is 5% above selling price

  return {
    costPrice: parseFloat(costPrice.toFixed(2)),
    sellingPrice: parseFloat(sellingPrice.toFixed(2)),
    mrp: parseFloat(mrp.toFixed(2)),
    discount: 0,
    taxRate: gstRate
  };
}

// Generate products for a category
function generateProductsForCategory(categoryData, brands, templates, startIndex) {
  const products = [];
  const { name, gstRate, productCount } = categoryData;
  const categoryTemplates = templates[name] || [];

  let productIndex = 0;

  while (products.length < productCount && categoryTemplates.length > 0) {
    for (const template of categoryTemplates) {
      if (products.length >= productCount) break;

      const { prefix, suffixes, sizes } = template;

      for (const suffix of suffixes) {
        if (products.length >= productCount) break;

        for (const size of sizes) {
          if (products.length >= productCount) break;

          const fullName = size ? `${prefix} ${suffix} ${size}`.trim() : `${prefix} ${suffix}`.trim();
          const sku = generateSKU(name, startIndex + productIndex);

          // Random cost price between ₹10 and ₹500
          const baseCost = Math.floor(Math.random() * (500 - 10 + 1)) + 10;
          // Profit margin between 15% and 35%
          const margin = Math.floor(Math.random() * (35 - 15 + 1)) + 15;

          const pricing = calculatePricing(baseCost, margin, gstRate);

          products.push({
            name: fullName,
            sku: sku,
            description: `${fullName} - High quality Indian product`,
            pricing: pricing,
            isPerishable: ['Dairy', 'Frozen Foods'].includes(name),
            tags: [name.toLowerCase(), prefix.toLowerCase()]
          });

          productIndex++;
        }
      }
    }

    // If we haven't reached productCount, loop through templates again with variations
    if (products.length < productCount) {
      break; // Prevent infinite loop
    }
  }

  return products;
}

const seedProductsRealistic = async () => {
  try {
    console.log('🛒 Starting Realistic Products Seed...\n');

    // Check if products already exist
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log('⚠️  Warning: Products already exist in database');
      console.log(`📊 Found ${existingProducts} existing products\n`);

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('❓ Do you want to DELETE all existing products and create new ones? (yes/no): ', resolve);
      });

      readline.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Seeding cancelled by user');
        process.exit(0);
      }

      console.log('\n🗑️  Deleting all existing products...');
      const deleteResult = await Product.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} products\n`);
    }

    // Get or create categories
    console.log('📂 Setting up categories...');

    // Get system admin for createdBy
    const User = require('../src/models/User');
    const systemUser = await User.findOne({ role: 'Admin' }).limit(1);
    if (!systemUser) {
      console.log('⚠️  No admin user found! Please run seed:users first.');
      process.exit(1);
    }
    console.log(`👤 Using admin: ${systemUser.email}\n`);

    const categoryMap = {};
    for (const catData of indianCategories) {
      // Generate category code from name (e.g., "Beverages" -> "BEV")
      const categoryCode = catData.name
        .split(' ')
        .map(word => word.substring(0, 3))
        .join('')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);

      let category = await Category.findOne({ code: categoryCode });
      if (!category) {
        category = await Category.create({
          name: catData.name,
          code: categoryCode,
          description: `${catData.name} products with ${catData.gstRate}% GST`,
          taxRate: catData.gstRate,
          isActive: true,
          createdBy: systemUser._id
        });
      }
      categoryMap[catData.name] = category._id;
      console.log(`✅ Category: ${catData.name} (${categoryCode}, ${catData.gstRate}% GST)`);
    }
    console.log('');

    // Get or create brands
    console.log('🏷️  Setting up brands...');
    const brandMap = {};
    const allBrands = new Set();
    Object.values(indianBrands).forEach(brands => brands.forEach(b => allBrands.add(b)));

    for (const brandName of allBrands) {
      // Generate brand code (e.g., "Coca-Cola" -> "COCACOLA" -> "COCACO")
      const brandCode = brandName
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase()
        .substring(0, 6);

      let brand = await Brand.findOne({ code: brandCode });
      if (!brand) {
        brand = await Brand.create({
          name: brandName,
          code: brandCode,
          description: `${brandName} products`,
          isActive: true,
          createdBy: systemUser._id
        });
      }
      brandMap[brandName] = brand._id;
    }
    console.log(`✅ Created/Found ${allBrands.size} brands\n`);

    // Get or create units
    console.log('📏 Setting up units...');
    const unitMap = {};
    const unitsData = [
      { name: 'kilogram', code: 'KG', symbol: 'kg', type: 'weight' },
      { name: 'gram', code: 'G', symbol: 'g', type: 'weight' },
      { name: 'liter', code: 'L', symbol: 'L', type: 'volume' },
      { name: 'milliliter', code: 'ML', symbol: 'ml', type: 'volume' },
      { name: 'piece', code: 'PCS', symbol: 'pcs', type: 'count' },
      { name: 'pack', code: 'PACK', symbol: 'pack', type: 'count' }
    ];

    for (const unitData of unitsData) {
      let unit = await Unit.findOne({ code: unitData.code });
      if (!unit) {
        unit = await Unit.create({
          name: unitData.name,
          code: unitData.code,
          type: unitData.type,
          isActive: true,
          createdBy: systemUser._id
        });
      }
      unitMap[unitData.symbol] = unit._id;
    }
    console.log(`✅ Created/Found ${unitsData.length} units\n`);

    // Get or create a default supplier
    console.log('🚚 Setting up supplier...');
    let supplier = await Supplier.findOne({ name: 'Mumbai Wholesale Suppliers' });
    if (!supplier) {
      supplier = await Supplier.create({
        name: 'Mumbai Wholesale Suppliers',
        code: 'MWS001',
        contact: {
          phone: '+91 22 2345 6789',
          email: 'wholesale@mumbaisuppliers.com'
        },
        address: {
          street: 'Crawford Market',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        isActive: true,
        createdBy: systemUser._id
      });
    }
    console.log(`✅ Supplier: ${supplier.name}\n`);

    // Generate all products
    console.log('🎯 Generating 1200 products across 9 categories...\n');
    let totalProducts = 0;
    let startIndex = 1;

    for (const categoryData of indianCategories) {
      console.log(`📦 Creating ${categoryData.productCount} products for ${categoryData.name}...`);

      const categoryProducts = generateProductsForCategory(
        categoryData,
        indianBrands[categoryData.name],
        productTemplates,
        startIndex
      );

      // Add category, brand, unit, supplier, createdBy to each product
      for (const product of categoryProducts) {
        product.category = categoryMap[categoryData.name];
        product.unit = unitMap['pcs']; // Default unit (piece)
        product.supplier = supplier._id;
        product.createdBy = systemUser._id;

        // Try to match brand from product name
        const matchedBrand = indianBrands[categoryData.name]?.find(b =>
          product.name.toLowerCase().includes(b.toLowerCase())
        );
        if (matchedBrand) {
          product.brand = brandMap[matchedBrand];
        }
      }

      // Bulk insert products for this category
      if (categoryProducts.length > 0) {
        await Product.insertMany(categoryProducts);
        totalProducts += categoryProducts.length;
        console.log(`✅ Created ${categoryProducts.length} ${categoryData.name} products`);
      }

      startIndex += categoryData.productCount;
    }

    console.log('\n📊 Summary:');
    console.log(`   Total Products Created: ${totalProducts}`);
    console.log(`   Categories: ${indianCategories.length}`);
    console.log(`   Brands: ${allBrands.size}`);
    console.log(`   Price Range: ₹${11.50} - ₹${675.00} (approx)`);
    console.log('');

    console.log('🎉 Realistic Products Seeding Completed Successfully!');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Run seedInventoryDistributed.js to distribute stock across branches');
    console.log('   2. Run seedCustomersSegmented.js to add customers');
    console.log('   3. Run seedSalesConsistent.js to add sales data');

    return totalProducts;

  } catch (error) {
    console.error('❌ Error seeding realistic products:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  const database = require('../src/config/database');

  database.connect()
    .then(async () => {
      await seedProductsRealistic();
      console.log('\n✅ Database connection will close in 2 seconds...');
      setTimeout(() => {
        mongoose.connection.close();
        process.exit(0);
      }, 2000);
    })
    .catch(error => {
      console.error('❌ Database connection error:', error);
      process.exit(1);
    });
}

module.exports = seedProductsRealistic;
