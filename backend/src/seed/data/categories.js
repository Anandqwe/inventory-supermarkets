// Indian Market Categories Data
module.exports = [
  {
    code: 'BEV',
    name: 'Beverages',
    description: 'Soft drinks, juices, tea, coffee, water',
    taxRate: 12,
    avgPrice: 45,
    stockRange: [80, 400],
    reorderLevel: 15,
    perishable: false
  },
  {
    code: 'DAI',
    name: 'Dairy',
    description: 'Milk, curd, paneer, butter, cheese',
    taxRate: 5,
    avgPrice: 65,
    stockRange: [50, 200],
    reorderLevel: 20,
    perishable: true
  },
  {
    code: 'PRO',
    name: 'Produce',
    description: 'Fresh fruits, vegetables, herbs',
    taxRate: 5,
    avgPrice: 85,
    stockRange: [30, 150],
    reorderLevel: 25,
    perishable: true
  },
  {
    code: 'MEA',
    name: 'Meat & Seafood',
    description: 'Chicken, mutton, fish, eggs',
    taxRate: 5,
    avgPrice: 320,
    stockRange: [20, 100],
    reorderLevel: 15,
    perishable: true
  },
  {
    code: 'BAK',
    name: 'Bakery',
    description: 'Bread, biscuits, cakes, pastries',
    taxRate: 5,
    avgPrice: 35,
    stockRange: [40, 200],
    reorderLevel: 20,
    perishable: true
  },
  {
    code: 'SNA',
    name: 'Snacks',
    description: 'Chips, namkeen, nuts, crackers',
    taxRate: 18,
    avgPrice: 55,
    stockRange: [60, 300],
    reorderLevel: 15,
    perishable: false
  },
  {
    code: 'FRO',
    name: 'Frozen',
    description: 'Ice cream, frozen vegetables, ready meals',
    taxRate: 18,
    avgPrice: 180,
    stockRange: [25, 120],
    reorderLevel: 10,
    perishable: true
  },
  {
    code: 'HOU',
    name: 'Household',
    description: 'Cleaning supplies, detergents, paper products',
    taxRate: 18,
    avgPrice: 125,
    stockRange: [40, 200],
    reorderLevel: 12,
    perishable: false
  },
  {
    code: 'PER',
    name: 'Personal Care',
    description: 'Soaps, shampoos, toothpaste, cosmetics',
    taxRate: 18,
    avgPrice: 95,
    stockRange: [30, 180],
    reorderLevel: 15,
    perishable: false
  },
  {
    code: 'BAB',
    name: 'Baby Care',
    description: 'Diapers, baby food, toys, care products',
    taxRate: 12,
    avgPrice: 285,
    stockRange: [20, 100],
    reorderLevel: 10,
    perishable: false
  },
  {
    code: 'PET',
    name: 'Pet Care',
    description: 'Pet food, toys, accessories',
    taxRate: 18,
    avgPrice: 450,
    stockRange: [15, 80],
    reorderLevel: 8,
    perishable: false
  },
  {
    code: 'STA',
    name: 'Staples & Grains',
    description: 'Rice, wheat, pulses, oils, spices',
    taxRate: 5,
    avgPrice: 145,
    stockRange: [100, 600],
    reorderLevel: 25,
    perishable: false
  }
];