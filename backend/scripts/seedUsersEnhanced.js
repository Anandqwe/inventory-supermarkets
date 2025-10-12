require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Branch = require('../src/models/Branch');
const bcrypt = require('bcryptjs');

/**
 * Seed Enhanced User Roles - Mumbai Supermart Chain
 * 18 Users across 6 role types
 */

const defaultPassword = 'Mumbai@123456'; // Will be hashed

const enhancedUsers = [
  // 1. System Administrator (1 user)
  {
    firstName: 'Anand',
    lastName: 'Krishna',
    email: 'admin@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Admin',
    branch: null,
    phone: '+91 98200 11111',
    isActive: true,
    permissions: [], // Will be set by setDefaultPermissions in User model
    metadata: {
      employeeId: 'EMP001',
      joinDate: new Date('2023-01-15'),
      designation: 'System Administrator',
      department: 'IT & Administration',
      reportingTo: null,
      workingHours: '9:00 AM - 6:00 PM',
      employmentType: 'Full-time'
    }
  },

  // 2. Regional Manager (1 user) - Oversees all 3 branches
  {
    firstName: 'Priya', lastName: 'Sharma',
    email: 'regional.manager@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Regional Manager',
    branch: null, // Access to all branches
    phone: '+91 98200 22222',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },

  // 3. Store Managers (3 users - one per branch)
  {
    firstName: 'Amit', lastName: 'Patel',
    email: 'manager.andheri@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Store Manager',
    branchCode: 'AW001', // Andheri West - will be resolved to branch ID
    phone: '+91 98200 33331',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },
  {
    firstName: 'Sneha', lastName: 'Desai',
    email: 'manager.vileparle@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Store Manager',
    branchCode: 'VP002', // Vile Parle East
    phone: '+91 98200 33332',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },
  {
    firstName: 'Vikram', lastName: 'Singh',
    email: 'manager.bandra@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Store Manager',
    branchCode: 'BW003', // Bandra West
    phone: '+91 98200 33333',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },

  // 4. Inventory Managers (3 users - one per branch)
  {
    firstName: 'Rahul', lastName: 'Mehta',
    email: 'inventory.andheri@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Inventory Manager',
    branchCode: 'AW001',
    phone: '+91 98200 44441',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },
  {
    firstName: 'Pooja', lastName: 'Joshi',
    email: 'inventory.vileparle@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Inventory Manager',
    branchCode: 'VP002',
    phone: '+91 98200 44442',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },
  {
    firstName: 'Arjun', lastName: 'Nair',
    email: 'inventory.bandra@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Inventory Manager',
    branchCode: 'BW003',
    phone: '+91 98200 44443',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },

  // 5. Cashiers/Sales Associates (9 users - 3 per branch)
  // Andheri West Cashiers
  {
    firstName: 'Sunita', lastName: 'Yadav',
    email: 'cashier1.andheri@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Cashier',
    branchCode: 'AW001',
    phone: '+91 98200 55541',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },
  {
    firstName: 'Deepak', lastName: 'Gupta',
    email: 'cashier2.andheri@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Cashier',
    branchCode: 'AW001',
    phone: '+91 98200 55542',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },
  {
    firstName: 'Kavita', lastName: 'Reddy',
    email: 'cashier3.andheri@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Cashier',
    branchCode: 'AW001',
    phone: '+91 98200 55543',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },

  // Vile Parle East Cashiers
  {
    firstName: 'Anil', lastName: 'Kumar',
    email: 'cashier1.vileparle@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Cashier',
    branchCode: 'VP002',
    phone: '+91 98200 55551',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },
  {
    firstName: 'Meena', lastName: 'Shah',
    email: 'cashier2.vileparle@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Cashier',
    branchCode: 'VP002',
    phone: '+91 98200 55552',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },
  {
    firstName: 'Ravi', lastName: 'Iyer',
    email: 'cashier3.vileparle@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Cashier',
    branchCode: 'VP002',
    phone: '+91 98200 55553',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },

  // Bandra West Cashiers
  {
    firstName: 'Neha', lastName: 'Chopra',
    email: 'cashier1.bandra@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Cashier',
    branchCode: 'BW003',
    phone: '+91 98200 55561',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },
  {
    firstName: 'Sanjay', lastName: 'Malhotra',
    email: 'cashier2.bandra@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Cashier',
    branchCode: 'BW003',
    phone: '+91 98200 55562',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },
  {
    firstName: 'Divya', lastName: 'Rao',
    email: 'cashier3.bandra@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Cashier',
    branchCode: 'BW003',
    phone: '+91 98200 55563',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },

  // 6. Viewers/Auditors (2 users)
  {
    firstName: 'Anita', lastName: 'Verma',
    email: 'auditor@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Viewer',
    branch: null,
    phone: '+91 98200 66666',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  },
  {
    firstName: 'Rajesh', lastName: 'Kapoor',
    email: 'viewer@mumbaisupermart.com',
    password: defaultPassword,
    role: 'Viewer',
    branch: null,
    phone: '+91 98200 66667',
    isActive: true,
    permissions: [] // Will be set by setDefaultPermissions in User model
  }
];

const seedEnhancedUsers = async () => {
  try {
    console.log('👥 Starting Enhanced Users Seed...\n');

    // Check if users already exist
    const existingUsers = await User.find();
    if (existingUsers.length > 1) { // More than default admin
      console.log('⚠️  Warning: Users already exist in database');
      console.log(`📊 Found ${existingUsers.length} existing users`);

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('\n❓ Do you want to DELETE all existing users (except system admin) and create new ones? (yes/no): ', resolve);
      });

      readline.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Seeding cancelled by user');
        process.exit(0);
      }

      // Delete ALL users including old credentials
      console.log('\n🗑️  Deleting all existing users (including old admin)...');
      const deleteResult = await User.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} users\n`);
    }

    // Fetch all branches to map branch codes
    const branches = await Branch.find();
    console.log(`📍 Found ${branches.length} branches in database`);

    if (branches.length === 0) {
      console.log('❌ Error: No branches found! Please run seedBranchesMumbai.js first');
      process.exit(1);
    }

    const branchMap = {};
    branches.forEach(branch => {
      branchMap[branch.code] = branch._id;
      console.log(`   - ${branch.code}: ${branch.name}`);
    });
    console.log('');

    // Create users (password will be hashed by User model's pre-save hook)
    console.log('📝 Creating 18 enhanced users...\n');

    const createdUsers = [];
    const roleCount = {
      'Admin': 0,
      'Regional Manager': 0,
      'Store Manager': 0,
      'Inventory Manager': 0,
      'Cashier': 0,
      'Viewer': 0
    };

    for (const userData of enhancedUsers) {
      // Resolve branch from code
      if (userData.branchCode) {
        userData.branch = branchMap[userData.branchCode];
        if (!userData.branch) {
          console.log(`⚠️  Warning: Branch code ${userData.branchCode} not found for user ${userData.email}`);
        }
        delete userData.branchCode;
      }

      // Use plain password - User model will hash it automatically
      userData.password = defaultPassword;

      const user = await User.create(userData);
      createdUsers.push(user);
      roleCount[user.role]++;

      const branchInfo = user.branch ?
        `Branch: ${branches.find(b => b._id.equals(user.branch))?.code || 'Unknown'}` :
        'Branch: All/None';

      console.log(`✅ ${user.role.padEnd(18)} - ${`${user.firstName} ${user.lastName}`.padEnd(20)} - ${user.email}`);
      console.log(`   ${branchInfo}`);
    }

    console.log('\n📊 Summary:');
    console.log(`   Total Users Created: ${createdUsers.length}`);
    console.log(`   - Admins: ${roleCount['Admin']}`);
    console.log(`   - Regional Managers: ${roleCount['Regional Manager']}`);
    console.log(`   - Store Managers: ${roleCount['Store Manager']}`);
    console.log(`   - Inventory Managers: ${roleCount['Inventory Manager']}`);
    console.log(`   - Cashiers/Sales: ${roleCount['Cashier']}`);
    console.log(`   - Viewers/Auditors: ${roleCount['Viewer']}`);
    console.log('');

    console.log('🎉 Enhanced Users Seeding Completed Successfully!');
    console.log('');
    console.log('🔑 Default Login Credentials:');
    console.log(`   Password for all users: ${defaultPassword}`);
    console.log('');
    console.log('👤 Sample Logins:');
    console.log('   Admin: admin@mumbaisupermart.com');
    console.log('   Regional Manager: regional.manager@mumbaisupermart.com');
    console.log('   Store Manager (Andheri): manager.andheri@mumbaisupermart.com');
    console.log('   Inventory Manager (Bandra): inventory.bandra@mumbaisupermart.com');
    console.log('   Cashier (Vile Parle): cashier1.vileparle@mumbaisupermart.com');
    console.log('   Viewer: viewer@mumbaisupermart.com');
    console.log('   Auditor: auditor@mumbaisupermart.com');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Run seedProductsRealistic.js to add products');
    console.log('   2. Run seedCustomersSegmented.js to add customers');
    console.log('   3. Run seedSalesConsistent.js to add sales data');

    return createdUsers;

  } catch (error) {
    console.error('❌ Error seeding enhanced users:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  const database = require('../src/config/database');

  database.connect()
    .then(async () => {
      await seedEnhancedUsers();
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

module.exports = seedEnhancedUsers;


