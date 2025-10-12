# Reports Page Filter Fix

## Issue Description
When clicking "All Branches" in the Reports page filter dropdown, the page was only showing "All Branches" text but not actually fetching data for all branches. The dynamic filters (branch and category) were not properly applying when changed.

## Root Cause Analysis

### Problem 1: React Query Cache Keys
The original implementation was using entire objects in the `queryKey`:
```javascript
queryKey: ['sales-analytics', dateRange, filters]
```

**Issue**: When objects are used in queryKeys, React Query uses **reference equality** to determine if data needs to be refetched. Even though the values inside the objects changed, if the object reference didn't change, React Query wouldn't refetch.

### Problem 2: Empty String Filter Values
When "All Branches" was selected, the filter value was an empty string `""`, but the code was using:
```javascript
branchId: filters.branch || undefined
```

**Issue**: Empty string `""` is falsy in JavaScript, so `|| undefined` works correctly. However, the queryKey still included the entire `filters` object, preventing proper cache invalidation.

## Solution Implemented

### 1. Separated QueryKey Values
Changed from passing entire objects to primitive values:

**Before:**
```javascript
queryKey: ['sales-analytics', dateRange, filters]
```

**After:**
```javascript
queryKey: ['sales-analytics', dateRange.startDate, dateRange.endDate, filters.branch, filters.category]
```

This ensures React Query can properly track individual value changes and trigger refetches.

### 2. Explicit Filter Checking
Added explicit checks before adding filters to API params:

**Before:**
```javascript
const response = await reportsAPI.getSalesReport({ 
  startDate: dateRange.startDate, 
  endDate: dateRange.endDate,
  branchId: filters.branch || undefined,
  groupBy: 'day'
});
```

**After:**
```javascript
const params = { 
  startDate: dateRange.startDate, 
  endDate: dateRange.endDate,
  groupBy: 'day'
};

// Only add branchId if a specific branch is selected (not empty string)
if (filters.branch && filters.branch.trim() !== '') {
  params.branchId = filters.branch;
}

const response = await reportsAPI.getSalesReport(params);
```

This ensures that when "All Branches" is selected (empty string), the `branchId` parameter is completely omitted from the API request, allowing the backend to return data for all branches.

### 3. Applied Fix to All Report Queries
Updated all four report queries:
- ✅ Sales Analytics (`getSalesReport`)
- ✅ Financial/Profit Analysis (`getProfitAnalysis`)
- ✅ Inventory Report (`getInventoryReport`)
- ✅ Customer Analysis (`getCustomerAnalysis`)

Each query now:
1. Uses primitive values in queryKey for proper cache tracking
2. Explicitly checks filter values before adding to params
3. Omits filters entirely when "All" is selected

## Files Modified

### `frontend/src/pages/Reports.jsx`
- Updated 4 `useQuery` hooks (lines ~89-190)
- Changed queryKey structure for all analytics queries
- Added explicit filter checking logic
- Added refetch functions for manual data refresh

## Testing Checklist

### Manual Testing Steps:
1. ✅ Navigate to Reports page
2. ✅ Select "All Branches" - Should show data from all branches
3. ✅ Select a specific branch - Should show only that branch's data
4. ✅ Change date range - Should refetch data automatically
5. ✅ Select "All Categories" - Should show all categories
6. ✅ Select a specific category - Should show only that category
7. ✅ Switch between tabs (Sales, Financial, Inventory, Customer) - Should maintain filter selections
8. ✅ Change filters while on different tabs - Should refetch appropriate data

### Backend Verification:
The backend correctly handles optional filters:
```javascript
// From reportsController.js
if (branchId) filter.branch = branchId;
```
When `branchId` is undefined (not sent), the backend doesn't add it to the MongoDB filter, resulting in data from all branches.

## React Query Cache Behavior

### How It Works Now:
1. **Initial Load**: Query with `['sales-analytics', '2025-01-01', '2025-01-31', '', '']`
2. **Select Branch**: Query with `['sales-analytics', '2025-01-01', '2025-01-31', 'branchId123', '']`
   - Cache key changed → React Query refetches data
3. **Back to "All Branches"**: Query with `['sales-analytics', '2025-01-01', '2025-01-31', '', '']`
   - Cache key changed back → React Query uses cached data or refetches if stale

## Performance Benefits

1. **Proper Cache Invalidation**: Filters changing now correctly trigger refetches
2. **Selective Refetching**: Only affected queries refetch when specific filters change
3. **Cache Reuse**: When switching back to previous filter combinations, React Query reuses cached data

## Related Backend Code

The backend already properly handles the optional filters in:
- `backend/src/controllers/reportsController.js`
  - `getSalesReport()` - line 174: `if (branchId) filter.branch = branchId;`
  - `getProfitAnalysis()` - line 363: `if (branchId) filter.branch = branchId;`
  - `getInventoryReport()` - Handles branchId filtering
  - `getCustomerAnalysis()` - Handles branchId filtering

## Future Improvements

1. **Loading States**: Show skeleton loaders during filter changes
2. **Filter Validation**: Add visual feedback when no data matches filters
3. **Filter Persistence**: Save filter selections to localStorage
4. **URL State**: Sync filters with URL params for shareable links
5. **Filter Reset**: Add "Clear All Filters" button

## Debugging Tips

If filters still don't work:

1. **Check React Query DevTools**: 
   - Install React Query DevTools
   - Verify queryKey values change when filters change
   - Check if queries are refetching or using cached data

2. **Check Network Tab**:
   - Verify API requests include/exclude filters correctly
   - Confirm backend returns different data for different filters

3. **Check Console**:
   - Look for error messages from API calls
   - Verify filter values are correct (not undefined when they should have values)

4. **Check Backend Logs**:
   - Verify backend receives correct filter parameters
   - Check MongoDB queries being constructed

## References

- React Query Documentation: [Query Keys](https://tanstack.com/query/latest/docs/react/guides/query-keys)
- MongoDB Query Operators: [Comparison Operators](https://www.mongodb.com/docs/manual/reference/operator/query-comparison/)
- Project Docs: `docs/REPORTS_PAGE_PURPOSE.md`
