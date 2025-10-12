# RBAC Permissions Matrix

**Quick Reference**: What each role can do

---

## Legend
- ✅ Full Access
- 🟢 Create/Read/Update
- 🔵 Read/Update Only
- 🟡 Read Only
- 🔴 No Access

---

## Products Management

| Action | Admin | Regional Mgr | Store Mgr | Inventory Mgr | Cashier | Viewer |
|--------|-------|--------------|-----------|---------------|---------|--------|
| **View Products** | ✅ All branches | ✅ All branches | 🟡 Own branch | ✅ Own branch | 🟡 For sales | 🟡 All branches |
| **Create Products** | ✅ | ✅ | ✅ | ✅ | 🔴 | 🔴 |
| **Edit Products** | ✅ | ✅ | 🔵 Own branch | ✅ | 🔴 | 🔴 |
| **Delete Products** | ✅ | ✅ | 🔴 | ✅ | 🔴 | 🔴 |
| **Import Products** | ✅ | ✅ | ✅ | ✅ | 🔴 | 🔴 |
| **Export Products** | ✅ | ✅ | ✅ | ✅ | 🔴 | 🔴 |

---

## Sales Operations

| Action | Admin | Regional Mgr | Store Mgr | Inventory Mgr | Cashier | Viewer |
|--------|-------|--------------|-----------|---------------|---------|--------|
| **View Sales** | ✅ All branches | ✅ All branches | 🟡 Own branch | 🟡 Own branch | 🟡 Own sales | 🟡 All branches |
| **Create Sales** | ✅ | ✅ | ✅ | 🔴 | ✅ | 🔴 |
| **Edit Sales** | ✅ | ✅ | 🔵 Own branch | 🔴 | 🔴 | 🔴 |
| **Delete Sales** | ✅ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| **Process Refunds** | ✅ | ✅ | ✅ | 🔴 | 🔴 | 🔴 |

---

## Inventory Management

| Action | Admin | Regional Mgr | Store Mgr | Inventory Mgr | Cashier | Viewer |
|--------|-------|--------------|-----------|---------------|---------|--------|
| **View Inventory** | ✅ All branches | ✅ All branches | 🟡 Own branch | ✅ Own branch | 🟡 Stock levels | 🟡 All branches |
| **Stock Adjustments** | ✅ | ✅ | ✅ | ✅ | 🔴 | 🔴 |
| **Initiate Transfers** | ✅ | ✅ | ✅ | ✅ | 🔴 | 🔴 |
| **Approve Transfers** | ✅ | ✅ | 🔵 To own branch | 🔴 | 🔴 | 🔴 |
| **Delete Adjustments** | ✅ | 🔴 | 🔴 | ✅ | 🔴 | 🔴 |

---

## Purchase Orders

| Action | Admin | Regional Mgr | Store Mgr | Inventory Mgr | Cashier | Viewer |
|--------|-------|--------------|-----------|---------------|---------|--------|
| **View Orders** | ✅ All branches | ✅ All branches | 🟡 Own branch | 🟡 Own branch | 🔴 | 🟡 All branches |
| **Create Orders** | ✅ | ✅ | ✅ | ✅ | 🔴 | 🔴 |
| **Edit Orders** | ✅ | ✅ | ✅ | 🔴 | 🔴 | 🔴 |
| **Approve Orders** | ✅ | ✅ | ✅ | 🔴 | 🔴 | 🔴 |
| **Receive Orders** | ✅ | ✅ | ✅ | ✅ | 🔴 | 🔴 |
| **Delete Orders** | ✅ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |

---

## Financial Management

| Action | Admin | Regional Mgr | Store Mgr | Inventory Mgr | Cashier | Viewer |
|--------|-------|--------------|-----------|---------------|---------|--------|
| **View Invoices** | ✅ | 🟡 All branches | 🟡 Own branch | 🟡 Purchase only | 🔴 | 🟡 All branches |
| **Create Invoices** | ✅ | 🔴 | ✅ | 🔴 | 🔴 | 🔴 |
| **Edit Invoices** | ✅ | 🔴 | ✅ | 🔴 | 🔴 | 🔴 |
| **Void Invoices** | ✅ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| **Delete Invoices** | ✅ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| **Record Payments** | ✅ | 🔴 | ✅ | 🔴 | 🔴 | 🔴 |
| **View Financial Reports** | ✅ | ✅ | ✅ | 🔴 | 🔴 | ✅ |

---

## Reports & Analytics

| Action | Admin | Regional Mgr | Store Mgr | Inventory Mgr | Cashier | Viewer |
|--------|-------|--------------|-----------|---------------|---------|--------|
| **Sales Reports** | ✅ All branches | ✅ All branches | 🟡 Own branch | 🔴 | 🟡 Own sales | 🟡 All branches |
| **Inventory Reports** | ✅ All branches | ✅ All branches | 🟡 Own branch | ✅ Own branch | 🔴 | 🟡 All branches |
| **Purchase Reports** | ✅ All branches | ✅ All branches | 🟡 Own branch | ✅ Own branch | 🔴 | 🟡 All branches |
| **Financial Reports** | ✅ | ✅ | ✅ | 🔴 | 🔴 | ✅ |
| **Export Reports** | ✅ | ✅ | ✅ | ✅ | 🔴 | ✅ |
| **Advanced Analytics** | ✅ | ✅ | ✅ | 🔴 | 🔴 | 🔴 |

---

## User Management

| Action | Admin | Regional Mgr | Store Mgr | Inventory Mgr | Cashier | Viewer |
|--------|-------|--------------|-----------|---------------|---------|--------|
| **View Users** | ✅ All | 🟡 All (limited) | 🟡 Own branch | 🟡 Own branch | 🔴 | 🔴 |
| **Create Users** | ✅ All roles | 🔵 Limited roles | 🔵 Branch users | 🔴 | 🔴 | 🔴 |
| **Edit Users** | ✅ | 🔵 No Admin | 🔵 Branch only | 🔴 | 🔴 | 🔴 |
| **Delete Users** | ✅ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| **Assign Roles** | ✅ | 🔵 Limited | 🔵 Very limited | 🔴 | 🔴 | 🔴 |

---

## Master Data Management

| Action | Admin | Regional Mgr | Store Mgr | Inventory Mgr | Cashier | Viewer |
|--------|-------|--------------|-----------|---------------|---------|--------|
| **Categories** | ✅ Full | 🔵 View/Edit | 🟡 View only | 🟡 View only | 🟡 View only | 🟡 View only |
| **Brands** | ✅ Full | 🔵 View/Edit | 🟡 View only | 🟡 View only | 🟡 View only | 🟡 View only |
| **Units** | ✅ Full | 🟡 View only | 🟡 View only | 🟡 View only | 🔴 | 🟡 View only |
| **Suppliers** | ✅ Full | 🔵 View/Edit | 🟡 View only | 🟡 View only | 🔴 | 🟡 View only |
| **Branches** | ✅ Full | 🟡 View only | 🟡 View only | 🟡 View only | 🔴 | 🟡 View only |

---

## Security & Audit

| Action | Admin | Regional Mgr | Store Mgr | Inventory Mgr | Cashier | Viewer |
|--------|-------|--------------|-----------|---------------|---------|--------|
| **View Audit Logs** | ✅ All | 🟡 All (read) | 🟡 Own branch | 🔴 | 🔴 | 🔴 |
| **Security Dashboard** | ✅ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |
| **Session Management** | ✅ | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 |

---

## Dashboard & Profile

| Action | Admin | Regional Mgr | Store Mgr | Inventory Mgr | Cashier | Viewer |
|--------|-------|--------------|-----------|---------------|---------|--------|
| **View Dashboard** | ✅ All data | ✅ All branches | 🟡 Own branch | 🔵 Inventory focus | 🟡 Own metrics | 🟡 All branches |
| **Dashboard Analytics** | ✅ | ✅ | ✅ | 🔴 | 🔴 | 🔴 |
| **View Own Profile** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit Own Profile** | ✅ | ✅ | ✅ | ✅ | ✅ | 🔴 |

---

## Branch Scope Summary

| Role | Branch Access | Data Visibility |
|------|---------------|-----------------|
| **Admin** | All branches | Everything, everywhere |
| **Regional Manager** | All branches | Full cross-branch visibility |
| **Store Manager** | Single assigned branch | Own branch only |
| **Inventory Manager** | Single assigned branch | Own branch only |
| **Cashier** | Single assigned branch | Own branch, own sales |
| **Viewer** | All branches (read-only) | Everything, but read-only |

---

## Permission Count Summary

| Role | Total Permissions | Create | Read | Update | Delete |
|------|------------------|--------|------|--------|--------|
| **Admin** | 56 | 18 | 18 | 15 | 12 |
| **Regional Manager** | 42 | 13 | 18 | 13 | 3 |
| **Store Manager** | 35 | 10 | 15 | 11 | 1 |
| **Inventory Manager** | 28 | 8 | 13 | 9 | 3 |
| **Cashier** | 12 | 2 | 9 | 2 | 0 |
| **Viewer** | 20 | 0 | 20 | 0 | 0 |

---

## Common Use Cases

### Admin Tasks
- ✅ System configuration and maintenance
- ✅ User and role management (all roles)
- ✅ Cross-branch data management
- ✅ Security and audit reviews
- ✅ Branch creation and deletion
- ✅ Critical financial operations

### Regional Manager Tasks
- ✅ Oversee multiple branches
- ✅ Cross-branch inventory transfers
- ✅ Regional performance analysis
- ✅ Approve large purchase orders
- ✅ Manage regional suppliers
- ✅ Cross-branch reporting

### Store Manager Tasks
- ✅ Daily branch operations
- ✅ Local staff management
- ✅ Branch inventory control
- ✅ Local purchase approvals
- ✅ Branch financial management
- ✅ Customer service oversight

### Inventory Manager Tasks
- ✅ Stock level monitoring
- ✅ Inventory adjustments
- ✅ Purchase order creation
- ✅ Stock transfers (within scope)
- ✅ Reorder management
- ✅ Product catalog updates

### Cashier Tasks
- ✅ Process customer sales
- ✅ Handle payments
- ✅ Check product availability
- ✅ View own sales history
- ✅ Update own profile
- ❌ No inventory management
- ❌ No financial reports
- ❌ No user management

### Viewer Tasks
- ✅ View all data (read-only)
- ✅ Generate reports
- ✅ Export data
- ✅ Monitor operations
- ✅ Audit and compliance
- ❌ No modifications allowed
- ❌ No user management
- ❌ No security features

---

## Real-World Examples

### Scenario 1: New Product Launch
```
Admin: Creates product in system ✅
Regional Manager: Adds product to all branches ✅
Store Manager: Sets local pricing/reorder levels ✅
Inventory Manager: Receives initial stock ✅
Cashier: Sells product to customers ✅
Viewer: Monitors launch performance ✅
```

### Scenario 2: Inter-Branch Transfer
```
Store Manager (Branch A): Initiates transfer ✅
Regional Manager: Approves transfer ✅
Inventory Manager (Branch A): Processes outgoing ✅
Inventory Manager (Branch B): Receives incoming ✅
Store Manager (Branch B): Confirms receipt ✅
Admin: Views audit trail ✅
```

### Scenario 3: End of Day
```
Cashier: Completes sales ✅
Store Manager: Reviews daily reports ✅
Regional Manager: Reviews all branches ✅
Admin: Monitors system health ✅
Viewer: Generates compliance reports ✅
```

---

## Quick Reference Codes

### Backend Permission Checks
```javascript
// Admin only
requireAdmin

// Any manager role
requireManager

// Specific permission
requirePermission(PERMISSIONS.PRODUCTS.CREATE)

// Multiple permissions (ANY)
requireAnyPermission([PERMISSIONS.SALES.READ, PERMISSIONS.SALES.CREATE])

// Multiple permissions (ALL)
requireAllPermissions([PERMISSIONS.PRODUCTS.DELETE, PERMISSIONS.INVENTORY.UPDATE])
```

### Frontend Permission Checks
```javascript
// Check permission
hasPermission(PERMISSIONS.PRODUCTS.CREATE)

// Check role
isAdmin()
isManager()
isCashier()

// Check multiple
hasAnyPermission([...])
hasAllPermissions([...])

// Check branch
belongsToBranch(branchId)
```

---

## Permission Naming Convention

```
Format: resource.action

Resources:
- users
- products
- sales
- inventory
- purchases
- invoices
- payments
- financial
- reports
- categories
- brands
- units
- suppliers
- branches
- audit
- security
- dashboard
- profile

Actions:
- create
- read
- update
- delete
- export
- import
- approve
- void
- refund
- adjust
- transfer
- analytics
```

---

**Last Updated**: October 12, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅

For implementation details, see:
- `RBAC_QUICK_START.md` - Developer guide
- `RBAC_ANALYSIS_AND_FIX.md` - Complete analysis
- `RBAC_TESTING_GUIDE.md` - Testing procedures
