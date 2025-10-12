# Products Page Performance Fix

## Issue
The Products page was experiencing excessive re-renders when users typed in the search field or min/max price inputs. Every keystroke caused the entire page to reload, making typing difficult and providing a poor user experience.

## Root Causes
1. **No Debouncing**: Search term and price range filters triggered immediate API calls on every keystroke
2. **Direct State in Query Key**: React Query's `queryKey` included non-debounced state values, causing immediate refetches
3. **Object Reference Changes**: `priceRange` object changed reference on every update, triggering unnecessary effects
4. **Missing Stale Time**: No cache configuration meant every state change forced a new API request

## Solution Implemented

### 1. Added Debouncing for Search and Price Inputs
```javascript
// Debounced state variables
const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
const [debouncedPriceRange, setDebouncedPriceRange] = useState({ min: '', max: '' });

// Debounce search term (500ms delay)
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearchTerm(searchTerm);
  }, 500);
  return () => clearTimeout(timer);
}, [searchTerm]);

// Debounce price range (500ms delay)
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedPriceRange(priceRange);
  }, 500);
  return () => clearTimeout(timer);
}, [priceRange.min, priceRange.max]);
```

### 2. Updated React Query to Use Debounced Values
```javascript
useQuery({
  queryKey: ['products', pagination, debouncedSearchTerm, selectedCategory, 
             stockFilter, debouncedPriceRange.min, debouncedPriceRange.max, sorting],
  queryFn: fetchProducts,
  keepPreviousData: true,
  staleTime: 30000, // Added 30-second cache
});
```

### 3. Modified API Call to Use Debounced Values
```javascript
const fetchProducts = async () => {
  // Use debounced values for search and price filters
  if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
  if (debouncedPriceRange.min) params.append('minPrice', debouncedPriceRange.min);
  if (debouncedPriceRange.max) params.append('maxPrice', debouncedPriceRange.max);
  // ...
};
```

### 4. Updated Pagination Reset Logic
```javascript
// Reset pagination only when debounced values change
useEffect(() => {
  setPagination(prev => ({ ...prev, pageIndex: 0 }));
}, [debouncedSearchTerm, selectedCategory, stockFilter, 
    debouncedPriceRange.min, debouncedPriceRange.max]);
```

## Benefits
- ✅ **Smooth Typing Experience**: No lag or interruption while typing in search or price fields
- ✅ **Reduced API Calls**: API calls only happen 500ms after user stops typing
- ✅ **Better Performance**: Leverages React Query's cache with 30-second stale time
- ✅ **Consistent UX**: Now matches the Sales page behavior
- ✅ **Lower Server Load**: Fewer unnecessary API requests

## Technical Details
- **Debounce Delay**: 500ms (half a second) - optimal balance between responsiveness and efficiency
- **Stale Time**: 30 seconds - data is considered fresh for 30 seconds before refetching
- **Cache Strategy**: `keepPreviousData: true` maintains previous results during loading for smooth transitions

## Testing
Test the fix by:
1. Navigate to Products page
2. Type quickly in the search field - should see smooth typing without page flashing
3. Enter numbers in min/max price fields - should type smoothly
4. Wait 500ms after typing - data should load/update
5. Verify pagination resets to page 1 when filters change
6. Check that category and stock filters still work instantly (no debounce needed)

## Files Modified
- `frontend/src/pages/Products.jsx` - Added debouncing and stale time configuration

## Alignment with Sales Page Pattern
This fix brings the Products page in line with the Sales page architecture, which already uses:
- Debounced search with `staleTime: 30000`
- Efficient query key management
- Smooth typing experience for users
