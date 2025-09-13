/**
 * Utility functions for currency formatting in Indian Rupees
 */

/**
 * Format number as Indian currency (₹)
 * @param {number} amount - The amount to format
 * @param {boolean} compact - Whether to use compact notation (K, L, Cr)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, compact = false) => {
  if (typeof amount !== 'number') {
    return '₹0';
  }

  if (compact) {
    return formatCompactCurrency(amount);
  }

  // Use Indian number formatting with commas
  return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Format large numbers in Indian compact notation
 * @param {number} amount - The amount to format
 * @returns {string} Compact formatted currency
 */
export const formatCompactCurrency = (amount) => {
  if (amount >= 10000000) { // 1 Crore
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) { // 1 Lakh
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) { // 1 Thousand
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Parse currency string to number
 * @param {string} currencyString - Currency string like "₹1,234"
 * @returns {number} Parsed number
 */
export const parseCurrency = (currencyString) => {
  if (typeof currencyString !== 'string') {
    return 0;
  }
  
  // Remove ₹ symbol and commas, then parse
  const cleanString = currencyString.replace(/[₹,]/g, '');
  return parseFloat(cleanString) || 0;
};

/**
 * Common Indian grocery price ranges (for validation/suggestions)
 */
export const PRICE_CATEGORIES = {
  STAPLES: { min: 20, max: 200 }, // Rice, wheat, oil
  VEGETABLES: { min: 10, max: 100 }, // Per kg
  FRUITS: { min: 30, max: 300 }, // Per kg
  DAIRY: { min: 25, max: 150 }, // Milk, curd, etc
  MEAT: { min: 150, max: 600 }, // Per kg
  BAKERY: { min: 15, max: 100 }, // Bread, biscuits
  BEVERAGES: { min: 20, max: 200 }, // Tea, coffee, juices
  SNACKS: { min: 10, max: 150 }, // Chips, namkeen
  SPICES: { min: 50, max: 500 }, // Per 100g or packet
  HOUSEHOLD: { min: 30, max: 300 } // Cleaning supplies, etc
};

/**
 * Validate if price is reasonable for category
 * @param {number} price - Price to validate
 * @param {string} category - Product category
 * @returns {boolean} Whether price is in reasonable range
 */
export const validatePrice = (price, category) => {
  const categoryUpper = category?.toUpperCase();
  const range = PRICE_CATEGORIES[categoryUpper] || PRICE_CATEGORIES.STAPLES;
  
  return price >= range.min && price <= range.max * 2; // Allow 2x max for premium products
};

/**
 * Get suggested price range for category
 * @param {string} category - Product category
 * @returns {object} Min and max suggested prices
 */
export const getSuggestedPriceRange = (category) => {
  const categoryUpper = category?.toUpperCase();
  return PRICE_CATEGORIES[categoryUpper] || PRICE_CATEGORIES.STAPLES;
};
