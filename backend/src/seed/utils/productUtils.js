const { faker } = require('@faker-js/faker');

/**
 * Generate SKU (Stock Keeping Unit) for products
 * Format: CAT-BRD-####
 */
function generateSKU(categoryCode, brandCode) {
  // Use timestamp + random for better uniqueness
  const timestamp = Date.now().toString().slice(-6);
  const randomNum = faker.number.int({ min: 100, max: 999 });
  return `${categoryCode}-${brandCode}-${timestamp}${randomNum}`;
}

/**
 * Generate Indian-style barcode (EAN-13 format)
 */
function generateBarcode() {
  // Indian country code for EAN: 890
  const countryCode = '890';
  const manufacturerCode = faker.number.int({ min: 10000, max: 99999 }).toString();
  const productCode = faker.number.int({ min: 10000, max: 99999 }).toString();
  
  return `${countryCode}${manufacturerCode}${productCode}`;
}

/**
 * Calculate price based on category and market position
 */
function calculatePrice(category, isPremium = false) {
  const avgPrice = category.avgPrice || 50;
  const variance = avgPrice * 0.4; // 40% variance
  const basePrice = avgPrice + (Math.random() - 0.5) * variance;
  
  // Premium products cost 20-50% more
  if (isPremium) {
    return Math.round(basePrice * faker.number.float({ min: 1.2, max: 1.5 }));
  }
  
  return Math.round(Math.max(basePrice, 5)); // Minimum price of 5
}

/**
 * Calculate stock levels based on category characteristics
 */
function calculateStockLevels(category, branchType = 'Medium') {
  const multiplier = branchType === 'Large' ? 1.5 : branchType === 'Small' ? 0.7 : 1;
  
  const stockRange = category.stockRange || [20, 100];
  const minStock = Math.round(stockRange[0] * multiplier);
  const maxStock = Math.round(stockRange[1] * multiplier);
  const reorderLevel = Math.round((category.reorderLevel || stockRange[0]) * multiplier);
  
  const currentStock = faker.number.int({ min: reorderLevel, max: maxStock });
  
  return {
    currentStock,
    minStock,
    maxStock,
    reorderLevel
  };
}

/**
 * Generate expiry date for perishable items
 */
function generateExpiryDate(category) {
  if (!category.perishable) return null;
  
  // Different shelf lives for different perishable categories
  let daysToExpiry = 30; // default
  if (category.code === 'DAI') daysToExpiry = faker.number.int({ min: 3, max: 15 }); // Dairy
  else if (category.code === 'PRO') daysToExpiry = faker.number.int({ min: 2, max: 10 }); // Produce
  else if (category.code === 'MEA') daysToExpiry = faker.number.int({ min: 1, max: 5 }); // Meat
  else if (category.code === 'BAK') daysToExpiry = faker.number.int({ min: 2, max: 7 }); // Bakery
  else daysToExpiry = faker.number.int({ min: 7, max: 365 });
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysToExpiry);
  
  return expiryDate;
}

/**
 * Generate realistic product descriptions for Indian market
 */
function generateProductDescription(productName, category, brand) {
  const descriptions = {
    'Beverages': [
      `Refreshing ${productName} from ${brand.name}. Perfect for hot Indian summers.`,
      `Premium quality ${productName} with authentic taste. Hygienically packed.`,
      `Natural and healthy ${productName}. No artificial colors or preservatives.`
    ],
    'Dairy Products': [
      `Fresh ${productName} from ${brand.name}. Rich in calcium and protein.`,
      `Pure and creamy ${productName}. Sourced from local dairy farms.`,
      `Organic ${productName} with natural goodness. Suitable for all ages.`
    ],
    'Fresh Produce': [
      `Fresh ${productName} directly from farms. Rich in vitamins and minerals.`,
      `Organic ${productName} grown without chemicals. Fresh and crispy.`,
      `Premium quality ${productName}. Handpicked for freshness.`
    ],
    'Staples & Grains': [
      `High-quality ${productName} from ${brand.name}. Traditional taste and aroma.`,
      `Premium ${productName} carefully selected and processed. Rich in nutrients.`,
      `Authentic ${productName} perfect for Indian cooking. Long grain variety.`
    ]
  };
  
  const categoryDescriptions = descriptions[category.name] || [
    `Quality ${productName} from ${brand.name}. Trusted by Indian families.`,
    `Premium ${productName} with excellent quality and taste.`,
    `Fresh ${productName} at best prices. Perfect for daily use.`
  ];
  
  return faker.helpers.arrayElement(categoryDescriptions);
}

/**
 * Generate random discount percentage
 */
function generateDiscount() {
  const hasDiscount = faker.datatype.boolean({ probability: 0.3 }); // 30% chance of discount
  if (!hasDiscount) return 0;
  
  return faker.number.int({ min: 5, max: 25 }); // 5-25% discount
}

/**
 * Generate batch information for tracking
 */
function generateBatchInfo() {
  const batchNumber = `BT${faker.date.recent({ days: 30 }).getFullYear()}${faker.number.int({ min: 1000, max: 9999 })}`;
  const manufacturingDate = faker.date.recent({ days: 60 });
  
  return {
    batchNumber,
    manufacturingDate
  };
}

/**
 * Generate realistic Indian product names based on category
 */
function generateIndianProductNames(category, brand, count = 1) {
  const productTemplates = {
    'Beverages': [
      `${brand.name} Mango Juice`, `${brand.name} Orange Juice`, `${brand.name} Apple Juice`,
      `${brand.name} Coconut Water`, `${brand.name} Lemon Drink`, `${brand.name} Cola`,
      `${brand.name} Sprite`, `${brand.name} Energy Drink`, `${brand.name} Iced Tea`,
      `${brand.name} Lassi`, `${brand.name} Buttermilk`, `${brand.name} Fresh Lime`
    ],
    'Dairy Products': [
      `${brand.name} Full Cream Milk`, `${brand.name} Toned Milk`, `${brand.name} Double Toned Milk`,
      `${brand.name} Paneer`, `${brand.name} Curd`, `${brand.name} Butter`,
      `${brand.name} Ghee`, `${brand.name} Cheese Slices`, `${brand.name} Cream`,
      `${brand.name} Yogurt`, `${brand.name} Cottage Cheese`, `${brand.name} Khoya`
    ],
    'Fresh Produce': [
      'Basmati Rice', 'Onions', 'Potatoes', 'Tomatoes', 'Ginger', 'Garlic',
      'Green Chilies', 'Carrots', 'Cabbage', 'Cauliflower', 'Spinach', 'Coriander',
      'Mint Leaves', 'Curry Leaves', 'Lemons', 'Bananas', 'Apples', 'Mangoes'
    ],
    'Staples & Grains': [
      `${brand.name} Basmati Rice`, `${brand.name} Brown Rice`, `${brand.name} Wheat Flour`,
      `${brand.name} Besan`, `${brand.name} Suji`, `${brand.name} Oats`,
      `${brand.name} Quinoa`, `${brand.name} Daliya`, `${brand.name} Rice Flour`,
      `${brand.name} Toor Dal`, `${brand.name} Moong Dal`, `${brand.name} Chana Dal`
    ],
    'Snacks & Confectionery': [
      `${brand.name} Namkeen Mix`, `${brand.name} Biscuits`, `${brand.name} Cookies`,
      `${brand.name} Chips`, `${brand.name} Chocolates`, `${brand.name} Candies`,
      `${brand.name} Nuts Mix`, `${brand.name} Crackers`, `${brand.name} Wafers`,
      `${brand.name} Peanuts`, `${brand.name} Cashews`, `${brand.name} Almonds`
    ],
    'Personal Care': [
      `${brand.name} Shampoo`, `${brand.name} Soap`, `${brand.name} Toothpaste`,
      `${brand.name} Body Wash`, `${brand.name} Face Wash`, `${brand.name} Hair Oil`,
      `${brand.name} Moisturizer`, `${brand.name} Deodorant`, `${brand.name} Perfume`,
      `${brand.name} Talcum Powder`, `${brand.name} Face Cream`, `${brand.name} Hand Sanitizer`
    ],
    'Household Items': [
      `${brand.name} Detergent Powder`, `${brand.name} Liquid Detergent`, `${brand.name} Dish Wash`,
      `${brand.name} Floor Cleaner`, `${brand.name} Toilet Cleaner`, `${brand.name} Glass Cleaner`,
      `${brand.name} Air Freshener`, `${brand.name} Fabric Softener`, `${brand.name} Bleach`,
      `${brand.name} Kitchen Cleaner`, `${brand.name} Bathroom Cleaner`, `${brand.name} Multi-Surface Cleaner`
    ],
    'Bakery & Bread': [
      `${brand.name} White Bread`, `${brand.name} Brown Bread`, `${brand.name} Whole Wheat Bread`,
      `${brand.name} Pav`, `${brand.name} Burger Buns`, `${brand.name} Pizza Base`,
      `${brand.name} Croissant`, `${brand.name} Muffins`, `${brand.name} Donuts`,
      `${brand.name} Cake`, `${brand.name} Pastries`, `${brand.name} Cookies`
    ],
    'Frozen Foods': [
      `${brand.name} Ice Cream`, `${brand.name} Frozen Vegetables`, `${brand.name} Frozen Fruits`,
      `${brand.name} Frozen Parathas`, `${brand.name} Frozen Samosas`, `${brand.name} Frozen Pizza`,
      `${brand.name} Frozen Chicken`, `${brand.name} Frozen Fish`, `${brand.name} Frozen Prawns`,
      `${brand.name} Kulfi`, `${brand.name} Frozen Paneer`, `${brand.name} Frozen Corn`
    ],
    'Meat & Seafood': [
      'Fresh Chicken', 'Mutton', 'Fish', 'Prawns', 'Crab', 'Chicken Breast',
      'Chicken Legs', 'Chicken Wings', 'Minced Meat', 'Fish Fillet',
      'Pomfret', 'Rohu Fish', 'Salmon', 'Tuna', 'Eggs'
    ],
    'Baby Care': [
      `${brand.name} Baby Soap`, `${brand.name} Baby Shampoo`, `${brand.name} Baby Oil`,
      `${brand.name} Baby Powder`, `${brand.name} Diapers`, `${brand.name} Baby Food`,
      `${brand.name} Baby Lotion`, `${brand.name} Baby Wipes`, `${brand.name} Feeding Bottle`,
      `${brand.name} Baby Cereal`, `${brand.name} Baby Formula`, `${brand.name} Baby Cream`
    ],
    'Pet Care': [
      `${brand.name} Dog Food`, `${brand.name} Cat Food`, `${brand.name} Pet Shampoo`,
      `${brand.name} Pet Treats`, `${brand.name} Bird Food`, `${brand.name} Fish Food`,
      `${brand.name} Pet Toys`, `${brand.name} Pet Collar`, `${brand.name} Pet Bed`,
      `${brand.name} Pet Medicine`, `${brand.name} Pet Supplements`, `${brand.name} Litter`
    ]
  };
  
  const templates = productTemplates[category.name] || [`${brand.name} Product`];
  const names = [];
  
  for (let i = 0; i < count; i++) {
    names.push(faker.helpers.arrayElement(templates));
  }
  
  return names;
}

module.exports = {
  generateSKU,
  generateBarcode,
  calculatePrice,
  calculateStockLevels,
  generateExpiryDate,
  generateProductDescription,
  generateDiscount,
  generateBatchInfo,
  generateIndianProductNames
};