const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const Branch = require('../src/models/Branch');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Indian names database
const firstNames = {
  male: [
    'Arjun', 'Rahul', 'Amit', 'Rohan', 'Karan', 'Vikas', 'Sanjay', 'Anil', 'Suresh', 'Ravi',
    'Vikram', 'Manoj', 'Rajesh', 'Ajay', 'Deepak', 'Nitin', 'Ashok', 'Pradeep', 'Santosh', 'Vishal',
    'Ramesh', 'Prakash', 'Mukesh', 'Arun', 'Sachin', 'Sunil', 'Naveen', 'Ankit', 'Akash', 'Varun',
    'Gaurav', 'Abhishek', 'Nikhil', 'Siddharth', 'Aditya', 'Manish', 'Pankaj', 'Vinay', 'Yogesh', 'Harish'
  ],
  female: [
    'Priya', 'Anjali', 'Neha', 'Pooja', 'Sneha', 'Kavita', 'Rekha', 'Asha', 'Sunita', 'Meena',
    'Deepika', 'Swati', 'Preeti', 'Ritu', 'Nisha', 'Shweta', 'Anita', 'Shalini', 'Varsha', 'Divya',
    'Aarti', 'Shruti', 'Pallavi', 'Madhuri', 'Kiran', 'Seema', 'Rajani', 'Sarika', 'Archana', 'Vandana',
    'Smita', 'Tanvi', 'Shreya', 'Aishwarya', 'Nikita', 'Sakshi', 'Riya', 'Simran', 'Anushka', 'Isha'
  ]
};

const lastNames = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Shah', 'Reddy', 'Iyer', 'Nair', 'Desai',
  'Joshi', 'Mehta', 'Rao', 'Kulkarni', 'Shetty', 'Menon', 'Kapoor', 'Malhotra', 'Agarwal', 'Bansal',
  'Verma', 'Chauhan', 'Yadav', 'Pandey', 'Mishra', 'Saxena', 'Tiwari', 'Jain', 'Bose', 'Das',
  'Chopra', 'Bhatt', 'Thakur', 'Pillai', 'Varma', 'Khanna', 'Mittal', 'Goyal', 'Arora', 'Sinha'
];

// Mumbai localities with PIN codes
const mumbaiLocalities = [
  { area: 'Andheri West', pincode: '400053', landmark: 'Near Lokhandwala Circle' },
  { area: 'Andheri West', pincode: '400053', landmark: 'Near Versova Beach' },
  { area: 'Andheri West', pincode: '400053', landmark: 'Near D.N. Nagar Metro' },
  { area: 'Andheri East', pincode: '400069', landmark: 'Near Chakala Metro' },
  { area: 'Andheri East', pincode: '400069', landmark: 'Near Marol Naka' },
  { area: 'Vile Parle East', pincode: '400057', landmark: 'Near Mumbai Airport' },
  { area: 'Vile Parle East', pincode: '400057', landmark: 'Near Hanuman Road' },
  { area: 'Vile Parle West', pincode: '400056', landmark: 'Near Parle Point' },
  { area: 'Vile Parle West', pincode: '400056', landmark: 'Near ISKCON Temple' },
  { area: 'Bandra West', pincode: '400050', landmark: 'Near Linking Road' },
  { area: 'Bandra West', pincode: '400050', landmark: 'Near Bandstand Promenade' },
  { area: 'Bandra West', pincode: '400050', landmark: 'Near Hill Road' },
  { area: 'Bandra East', pincode: '400051', landmark: 'Near BKC Metro' },
  { area: 'Bandra East', pincode: '400051', landmark: 'Near Bandra Terminus' },
  { area: 'Santacruz West', pincode: '400054', landmark: 'Near Juhu Beach' },
  { area: 'Santacruz West', pincode: '400054', landmark: 'Near Airport Road' },
  { area: 'Santacruz East', pincode: '400055', landmark: 'Near Vakola Bridge' },
  { area: 'Khar West', pincode: '400052', landmark: 'Near Carter Road' },
  { area: 'Khar West', pincode: '400052', landmark: 'Near 14th Road' },
  { area: 'Juhu', pincode: '400049', landmark: 'Near Juhu Chowpatty' },
  { area: 'Juhu', pincode: '400049', landmark: 'Near SNDT College' },
  { area: 'Goregaon West', pincode: '400062', landmark: 'Near Film City Road' },
  { area: 'Goregaon West', pincode: '400062', landmark: 'Near Motilal Nagar' },
  { area: 'Goregaon East', pincode: '400063', landmark: 'Near Aarey Colony' },
  { area: 'Malad West', pincode: '400064', landmark: 'Near Infiniti Mall' },
  { area: 'Malad East', pincode: '400097', landmark: 'Near Kurar Village' },
  { area: 'Kandivali West', pincode: '400067', landmark: 'Near Thakur Complex' },
  { area: 'Kandivali East', pincode: '400101', landmark: 'Near Mahavir Nagar' },
  { area: 'Borivali West', pincode: '400092', landmark: 'Near IC Colony' },
  { area: 'Borivali East', pincode: '400066', landmark: 'Near National Park' }
];

// Street prefixes for realistic addresses
const streetPrefixes = [
  'Plot No.', 'Flat No.', 'Building', 'Wing', 'Block', 'House No.',
  'Shop No.', 'Tower', 'Apartment', 'Residence'
];

const buildingNames = [
  'Sai Heights', 'Raj Residency', 'Shanti Apartments', 'Anand Bhavan', 'Krishna Tower',
  'Ganesh Plaza', 'Laxmi Niwas', 'Shiv Shakti', 'Om Sai', 'Tulsi Enclave',
  'Emerald Heights', 'Golden Palace', 'Silver Nest', 'Pearl Residency', 'Diamond Tower',
  'Royal Gardens', 'Green Valley', 'Sunrise Heights', 'Sunset Plaza', 'Paradise Apartments',
  'Horizon View', 'Skyline Tower', 'Ocean Breeze', 'Hill View', 'Garden Estate'
];

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhoneNumber() {
  const prefixes = ['98', '97', '96', '95', '93', '91', '90', '89', '88', '87', '86', '85', '84', '83', '82', '81', '80', '79', '78', '77', '76', '75', '74', '73', '72', '70'];
  const prefix = getRandomElement(prefixes);
  const remainingDigits = Array.from({length: 8}, () => getRandomInt(0, 9)).join('');
  return `+91${prefix}${remainingDigits}`;
}

function generateEmail(firstName, lastName, customerIndex) {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com'];
  const separators = ['', '.', '_'];
  const separator = getRandomElement(separators);
  // Include customerIndex to ensure uniqueness
  const uniqueNumber = customerIndex + getRandomInt(100, 999);
  return `${firstName.toLowerCase()}${separator}${lastName.toLowerCase()}${uniqueNumber}@${getRandomElement(domains)}`;
}

function generateAddress() {
  const locality = getRandomElement(mumbaiLocalities);
  const streetPrefix = getRandomElement(streetPrefixes);
  const buildingName = getRandomElement(buildingNames);
  const streetNumber = getRandomInt(1, 999);

  return {
    street: `${streetPrefix} ${streetNumber}, ${buildingName}`,
    landmark: locality.landmark,
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: locality.pincode,
    country: 'India'
  };
}

function generateCustomerData(tier, systemUserId, branchId, customerIndex) {
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const firstName = getRandomElement(firstNames[gender]);
  const lastName = getRandomElement(lastNames);

  // Generate customer number (CUS + 6 digits)
  const customerNumber = `CUS${String(customerIndex).padStart(6, '0')}`;

  // Define tier characteristics
  const tierConfig = {
    'VIP': {
      minSpend: 10000,
      maxSpend: 50000,
      minPurchases: 20,
      maxPurchases: 100,
      creditLimit: { min: 5000, max: 20000 },
      loyaltyMultiplier: 3,
      customerGroup: 'vip'
    },
    'Loyal': {
      minSpend: 5000,
      maxSpend: 10000,
      minPurchases: 10,
      maxPurchases: 25,
      creditLimit: { min: 2000, max: 8000 },
      loyaltyMultiplier: 2,
      customerGroup: 'regular'
    },
    'Regular': {
      minSpend: 2000,
      maxSpend: 5000,
      minPurchases: 5,
      maxPurchases: 15,
      creditLimit: { min: 1000, max: 4000 },
      loyaltyMultiplier: 1.5,
      customerGroup: 'regular'
    },
    'Occasional': {
      minSpend: 500,
      maxSpend: 2000,
      minPurchases: 1,
      maxPurchases: 8,
      creditLimit: { min: 0, max: 1500 },
      loyaltyMultiplier: 1,
      customerGroup: 'retail'
    }
  };

  const config = tierConfig[tier];
  const totalSpent = getRandomInt(config.minSpend, config.maxSpend);
  const totalPurchases = getRandomInt(config.minPurchases, config.maxPurchases);
  const loyaltyPoints = Math.floor(totalSpent * 0.01 * config.loyaltyMultiplier);
  const averageOrderValue = Math.floor(totalSpent / totalPurchases);

  // 70% chance of credit limit for VIP/Loyal, 30% for Regular, 10% for Occasional
  const creditChance = tier === 'VIP' ? 0.7 : tier === 'Loyal' ? 0.7 : tier === 'Regular' ? 0.3 : 0.1;
  const hasCreditLimit = Math.random() < creditChance;
  const creditLimit = hasCreditLimit ? getRandomInt(config.creditLimit.min, config.creditLimit.max) : 0;
  const currentBalance = hasCreditLimit && Math.random() > 0.6 ?
    getRandomInt(0, Math.floor(creditLimit * 0.5)) : 0;

  const address = generateAddress();

  return {
    customerNumber,
    firstName,
    lastName,
    email: generateEmail(firstName, lastName, customerIndex),
    phone: generatePhoneNumber(),
    addresses: [{
      type: 'both',
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.pincode,
      country: address.country,
      isDefault: true
    }],
    customerType: 'individual',
    customerGroup: config.customerGroup,
    loyaltyPoints,
    creditLimit,
    currentBalance,
    isActive: Math.random() > 0.05, // 95% active
    totalSpent,
    totalPurchases,
    averageOrderValue,
    lastPurchaseDate: new Date(Date.now() - getRandomInt(1, 90) * 24 * 60 * 60 * 1000), // Last 90 days
    firstPurchaseDate: new Date(Date.now() - getRandomInt(180, 730) * 24 * 60 * 60 * 1000), // 6 months to 2 years ago
    registeredBranch: branchId,
    createdBy: systemUserId,
    notes: tier === 'VIP' ? 'High value customer - priority service' :
      tier === 'Loyal' ? 'Regular customer - good credit history' :
        tier === 'Regular' ? 'Active customer' :
          'Occasional shopper',
    tags: [tier.toLowerCase()],
    marketingConsent: {
      email: Math.random() > 0.3,
      sms: Math.random() > 0.4,
      phone: Math.random() > 0.7
    }
  };
}

// Main seed function
async function seedCustomers() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database:', mongoose.connection.db.databaseName);

    // Get or create system admin user
    console.log('\n👤 Finding system admin...');
    const systemUser = await User.findOne({ email: 'admin@mumbaisupermart.com' });

    if (!systemUser) {
      console.log('⚠️  System admin not found. Please run seed:users first.');
      process.exit(1);
    }

    console.log(`✅ Found system admin: ${systemUser.fullName} (${systemUser.email})`);

    // Get all branches
    console.log('\n🏢 Finding branches...');
    const branches = await Branch.find({}).sort({ code: 1 });

    if (branches.length === 0) {
      console.log('⚠️  No branches found. Please run seed:branches first.');
      process.exit(1);
    }

    console.log(`✅ Found ${branches.length} branches: ${branches.map(b => b.name).join(', ')}`);

    // Clear existing customers
    console.log('\n🗑️  Clearing existing customers...');
    const deleteResult = await Customer.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing customers`);

    // Customer tier distribution
    const tierDistribution = [
      { tier: 'VIP', count: 50 },
      { tier: 'Loyal', count: 100 },
      { tier: 'Regular', count: 150 },
      { tier: 'Occasional', count: 200 }
    ];

    console.log('\n👥 Generating customers by tier...');
    let totalCreated = 0;
    let customerIndex = 1;

    for (const { tier, count } of tierDistribution) {
      console.log(`\n📊 Creating ${count} ${tier} customers...`);
      const customers = [];

      for (let i = 0; i < count; i++) {
        // Distribute customers across branches (Andheri gets 50%, Bandra 30%, Vile Parle 20%)
        const branchIndex = Math.random() < 0.5 ? 0 : Math.random() < 0.6 ? 1 : 2;
        const branch = branches[branchIndex];

        const customerData = generateCustomerData(tier, systemUser._id, branch._id, customerIndex++);
        customers.push(customerData);
      }

      // Batch insert with error handling
      let createdCustomers = [];
      try {
        createdCustomers = await Customer.insertMany(customers, { ordered: false });
        totalCreated += createdCustomers.length;
      } catch (error) {
        // If insertMany partially succeeds, error.insertedDocs contains successful inserts
        if (error.insertedDocs && error.insertedDocs.length > 0) {
          console.log(`   ⚠️  Partial success: ${error.insertedDocs.length}/${customers.length} customers created`);
          createdCustomers = error.insertedDocs;
          totalCreated += error.insertedDocs.length;
          // Log first few errors if they exist
          if (error.writeErrors && error.writeErrors.length > 0) {
            console.log(`   ⚠️  ${error.writeErrors.length} errors encountered:`);
            error.writeErrors.slice(0, 3).forEach((err, idx) => {
              console.log(`      ${idx + 1}. ${err.err.errmsg || err.err.message}`);
            });
          }
        } else {
          throw error; // Re-throw if no documents were inserted
        }
      }

      // Calculate tier statistics (using original customer data for averages)
      const tierStats = {
        total: createdCustomers.length,
        avgTotalSpent: Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length),
        avgPurchases: Math.round(customers.reduce((sum, c) => sum + c.totalPurchases, 0) / customers.length),
        avgLoyaltyPoints: Math.round(customers.reduce((sum, c) => sum + c.loyaltyPoints, 0) / customers.length),
        withCreditLimit: customers.filter(c => c.creditLimit > 0).length,
        avgCreditLimit: Math.round(customers.filter(c => c.creditLimit > 0).reduce((sum, c) => sum + c.creditLimit, 0) /
                                    customers.filter(c => c.creditLimit > 0).length) || 0,
        active: customers.filter(c => c.isActive).length
      };

      console.log(`   ✅ ${tier}: ${tierStats.total} customers`);
      console.log(`      💰 Avg Total Spent: ₹${tierStats.avgTotalSpent.toLocaleString('en-IN')}`);
      console.log(`      📦 Avg Purchases: ${tierStats.avgPurchases}`);
      console.log(`      ⭐ Avg Loyalty Points: ${tierStats.avgLoyaltyPoints}`);
      console.log(`      💳 With Credit: ${tierStats.withCreditLimit} (Avg: ₹${tierStats.avgCreditLimit.toLocaleString('en-IN')})`);
      console.log(`      ✓  Active: ${tierStats.active}`);
    }

    // Overall statistics
    console.log('\n📈 Overall Customer Statistics:');
    const allCustomers = await Customer.find({});
    const totalTotalSpent = allCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalLoyaltyPoints = allCustomers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
    const totalCreditLimit = allCustomers.reduce((sum, c) => sum + c.creditLimit, 0);
    const totalOutstanding = allCustomers.reduce((sum, c) => sum + c.currentBalance, 0);
    const activeCustomers = allCustomers.filter(c => c.isActive).length;

    // Branch distribution
    const byBranch = {};
    for (const branch of branches) {
      byBranch[branch.name] = allCustomers.filter(c => c.registeredBranch.toString() === branch._id.toString()).length;
    }

    console.log(`   👥 Total Customers: ${totalCreated}`);
    console.log(`   💰 Total Spent: ₹${totalTotalSpent.toLocaleString('en-IN')}`);
    console.log(`   ⭐ Total Loyalty Points: ${totalLoyaltyPoints.toLocaleString('en-IN')}`);
    console.log(`   💳 Total Credit Limit: ₹${totalCreditLimit.toLocaleString('en-IN')}`);
    console.log(`   📉 Total Outstanding: ₹${totalOutstanding.toLocaleString('en-IN')}`);
    console.log(`   ✓  Active Customers: ${activeCustomers} (${Math.round(activeCustomers/totalCreated*100)}%)`);
    console.log('\n   🏢 By Branch:');
    for (const [branchName, count] of Object.entries(byBranch)) {
      console.log(`      ${branchName}: ${count} customers (${Math.round(count/totalCreated*100)}%)`);
    }
    console.log('\n✅ Customer seeding completed successfully!');

  } catch (error) {
    console.error('\n❌ Error seeding customers:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedCustomers()
    .then(() => {
      console.log('✨ Seed process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Seed process failed:', error);
      process.exit(1);
    });
}

module.exports = seedCustomers;
