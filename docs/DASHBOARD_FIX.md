# Dashboard Real-Time Updates Fix

## Date: January 2025

## Issues Identified

### Issue 1: Recent Sales Not Reflecting After Sale Completion
**Problem**: When completing a sale on the POS page, the dashboard's "Recent Sales" section was not updating to show the new sale.

**Root Causes**:
1. Sales page was not invalidating dashboard queries after sale creation
2. Backend was filtering recent sales by date period instead of showing absolute most recent sales

### Issue 2: Low Stock Alerts Missing Quantity Information
**Problem**: Low stock alerts in the dashboard were not showing "how many items are left" - the quantity field was missing.

**Root Cause**: Backend aggregation pipeline for low stock items was not projecting the `stock` and `minStockLevel` fields needed by the frontend.

## Solutions Implemented

### Fix 1: Dashboard Query Invalidation in Sales Page

**File**: `frontend/src/pages/Sales.jsx` (Line ~200-207)

**Before**:
```jsx
onSuccess: (data) => {
  toast.success('Sale completed successfully!');
  clearCart();
  if (data.data.receipt) {
    handlePrintReceipt(data.data);
  }
  queryClient.invalidateQueries(['pos-products']); // Only invalidating products
},
```

**After**:
```jsx
onSuccess: (data) => {
  toast.success('Sale completed successfully!');
  clearCart();
  if (data.data.receipt) {
    handlePrintReceipt(data.data);
  }
  // Invalidate all related queries to refresh data
  queryClient.invalidateQueries(['pos-products']);
  queryClient.invalidateQueries(['dashboard-overview']); // ✅ Refresh dashboard stats
  queryClient.invalidateQueries(['sales-chart']); // ✅ Refresh sales charts
},
```

**Impact**: 
- Dashboard now automatically refetches data after sale completion
- Recent sales list updates immediately
- KPI stats (total sales, revenue) refresh automatically
- Sales charts update with new data

### Fix 2: Backend Recent Sales Query - Remove Period Filter

**File**: `backend/src/controllers/dashboardController.js` (Line ~173-183)

**Before**:
```javascript
// Recent sales with customer information (filtered by period)
const recentSalesFilter = {
  ...branchFilter,
  createdAt: { $gte: periodStartDate }, // ❌ Period filter prevents showing recent sales
  status: 'completed'
};

const recentSales = await Sale.find(recentSalesFilter)
  .populate('customer', 'name email phone')
  .populate('branch', 'name')
  .sort({ createdAt: -1 })
  .limit(10)
  .select('total items customer branch createdAt paymentMethod status') // Missing saleNumber
  .lean();
```

**After**:
```javascript
// Recent sales with customer information (always show most recent, not period-filtered)
const recentSalesFilter = {
  ...branchFilter, // ✅ Only filter by branch (if applicable)
  status: 'completed'
};

const recentSales = await Sale.find(recentSalesFilter)
  .populate('customer', 'name email phone')
  .populate('branch', 'name')
  .sort({ createdAt: -1 })
  .limit(10)
  .select('saleNumber total items customer branch createdAt paymentMethod status') // ✅ Added saleNumber
  .lean();
```

**Impact**: 
- Recent sales always shows the 10 most recent sales, regardless of dashboard date range filter
- Dashboard period selector (7 days, 30 days, etc.) affects KPIs but not recent sales list
- Sale number now included in response for better identification

### Fix 3: Low Stock Items - Add Stock Quantity Fields

**File**: `backend/src/controllers/dashboardController.js` (Line ~88-137)

**Before**:
```javascript
{
  $project: {
    name: 1,
    sku: 1,
    category: 1,
    quantity: 1,
    price: '$pricing.sellingPrice',
    lowStockBranches: 1
    // ❌ Missing stock and minStockLevel fields
  }
}
```

**After**:
```javascript
{
  $project: {
    name: 1,
    sku: 1,
    category: 1,
    quantity: 1,
    price: '$pricing.sellingPrice',
    lowStockBranches: 1,
    // ✅ Extract stock quantity (from branch or main quantity)
    stock: {
      $cond: {
        if: { $gt: [{ $size: '$lowStockBranches' }, 0] },
        then: { $arrayElemAt: ['$lowStockBranches.quantity', 0] },
        else: '$quantity'
      }
    },
    // ✅ Extract reorder level
    minStockLevel: {
      $cond: {
        if: { $gt: [{ $size: '$lowStockBranches' }, 0] },
        then: { $arrayElemAt: ['$lowStockBranches.reorderLevel', 0] },
        else: 10
      }
    }
  }
}
```

**Logic**:
- If product has branch-specific stock, extract quantity from `lowStockBranches` array
- Otherwise, use main `quantity` field as fallback
- Same logic for `minStockLevel` (reorder level), defaulting to 10 if not set

**Impact**: 
- Low stock alerts now show exact quantity remaining (e.g., "5 left")
- Shows minimum stock level for context (e.g., "Min: 10")
- Works correctly for both branch-specific and global stock tracking

## Frontend Display

The Dashboard frontend correctly displays these fields:

```jsx
{/* Low Stock Alert Item */}
<div className="text-right flex-shrink-0 ml-2">
  <Badge variant="warning" className="text-xs whitespace-nowrap">
    {product.stock} left  {/* ✅ Now shows quantity */}
  </Badge>
  <div className="text-xs text-surface-500 dark:text-surface-400 mt-1 whitespace-nowrap">
    Min: {product.minStockLevel || 10}  {/* ✅ Shows reorder level */}
  </div>
</div>
```

```jsx
{/* Recent Sales Item */}
<div className="font-medium text-xs md:text-sm text-surface-900 dark:text-surface-100 truncate">
  Sale #{sale.saleNumber || sale._id?.slice(-6)}  {/* ✅ Shows sale number */}
</div>
<div className="text-xs text-surface-500 dark:text-surface-400 truncate">
  {sale.customer?.name || 'Walk-in Customer'}
</div>
```

## Testing

### Test Scenario 1: Recent Sales Update
1. Open Dashboard in one browser tab
2. Open Sales page in another tab
3. Complete a sale on the Sales page
4. Switch back to Dashboard tab
5. **Expected**: Recent sales section automatically updates within 30 seconds (auto-refresh interval) or immediately if user manually refreshes
6. **Actual**: ✅ Works - New sale appears in recent sales list

### Test Scenario 2: Low Stock Alerts Display
1. Navigate to Dashboard
2. Look at "Low Stock Alerts" section
3. **Expected**: Each low stock item shows quantity (e.g., "5 left") and minimum level (e.g., "Min: 10")
4. **Actual**: ✅ Works - Stock quantities and minimum levels displayed correctly

### Test Scenario 3: Branch-Specific Stock
1. Login as Admin
2. Dashboard shows products with branch-specific stock
3. Low stock items should show correct branch quantity
4. **Expected**: Quantity from specific branch, not global quantity
5. **Actual**: ✅ Works - Correctly extracts branch-specific quantities

## Related Files

### Modified Files:
1. `frontend/src/pages/Sales.jsx` - Added dashboard query invalidation
2. `backend/src/controllers/dashboardController.js` - Fixed recent sales filter and low stock projection

### Related Documentation:
- `docs/PRICING_FIX_PLAN.md` - GST-inclusive pricing model
- `docs/SEED_DATA_FIX.md` - Seed data pricing corrections

## Technical Details

### React Query Cache Invalidation:
```javascript
queryClient.invalidateQueries(['query-key']);
```
- Marks query as stale
- Triggers automatic refetch if query is currently being observed
- Ensures data consistency across components

### Dashboard Auto-Refresh:
The dashboard has built-in auto-refresh configured:
```javascript
refetchInterval: autoRefresh ? refreshInterval : false, // 30 seconds default
```
- Stats refresh every 30 seconds
- Sales chart refreshes every 30 seconds
- Inventory analytics refresh every 60 seconds
- Manual refresh button available

### MongoDB Aggregation:
The low stock pipeline uses `$cond` operator for conditional field extraction:
- Checks if branch array has items: `$gt: [{ $size: '$lowStockBranches' }, 0]`
- If yes: Extract first branch quantity: `$arrayElemAt: ['$lowStockBranches.quantity', 0]`
- If no: Use global quantity: `$quantity`

## Notes for Developers

### When Creating Sales:
Always invalidate these query keys after sale creation:
```javascript
queryClient.invalidateQueries(['pos-products']); // Product stock
queryClient.invalidateQueries(['dashboard-overview']); // Dashboard KPIs
queryClient.invalidateQueries(['sales-chart']); // Charts
```

### Dashboard Date Range:
- Period selector affects: KPIs, charts, statistics
- Does NOT affect: Recent sales list, low stock alerts
- Recent sales always shows absolute most recent, regardless of period

### Low Stock Logic:
- Product is low stock when: `quantity <= reorderLevel`
- Backend aggregation filters products meeting this criteria
- Frontend displays with warning badge and amber styling
- No low stock items = shows green success state

## Conclusion

Both dashboard issues have been resolved:
1. ✅ **Recent sales update in real-time** after sale completion via query invalidation
2. ✅ **Low stock alerts show quantities** via improved backend projection

The dashboard now provides accurate, real-time business insights with proper stock level visibility.
