# CHAPTER 5: IMPLEMENTATION

## 5.2 Algorithm and Pseudocode

### 5.2.1 User Authentication Algorithm

#### Login Algorithm
**Purpose**: Authenticate user credentials and generate secure session token

**Algorithm Steps**:
```
Algorithm: UserAuthentication
Input: email, password
Output: authToken, userData

1. START
2. Receive email and password from user
3. Validate input format
   IF email is invalid OR password is empty THEN
      RETURN "Validation Error"
   END IF
4. Query database for user by email
   IF user not found THEN
      RETURN "User not found"
   END IF
5. Compare password with stored hash using bcrypt
   IF password does not match THEN
      RETURN "Invalid password"
   END IF
6. Check user status
   IF user.isActive == false THEN
      RETURN "Account inactive"
   END IF
7. Generate JWT token with user data
8. Update lastLogin timestamp
9. RETURN token and user data
10. END
```

**Pseudocode**:
```javascript
FUNCTION authenticateUser(email, password):
    // Input validation
    IF NOT isValidEmail(email) OR isEmpty(password):
        THROW ValidationError("Invalid input")
    
    // Find user in database
    user = database.findByEmail(email)
    IF user IS NULL:
        THROW NotFoundError("User not found")
    
    // Verify password
    isPasswordValid = bcrypt.compare(password, user.password)
    IF NOT isPasswordValid:
        THROW AuthenticationError("Invalid password")
    
    // Check user status
    IF user.isActive == FALSE:
        THROW ForbiddenError("Account inactive")
    
    // Generate token
    tokenPayload = {
        id: user._id,
        email: user.email,
        role: user.role,
        branch: user.branch
    }
    token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: '24h' })
    
    // Update last login
    database.update(user._id, { lastLogin: currentTimestamp() })
    
    // Return authentication response
    RETURN {
        success: TRUE,
        token: token,
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            fullName: user.firstName + " " + user.lastName
        }
    }
END FUNCTION
```

---

### 5.2.2 Sales Transaction Algorithm

#### Process Sale Algorithm
**Purpose**: Process complete sales transaction with inventory update

**Algorithm Steps**:
```
Algorithm: ProcessSalesTransaction
Input: saleItems[], customerId, branchId, paymentMethod
Output: saleRecord, invoice

1. START
2. Initialize sale object with timestamp
3. FOR each item in saleItems:
   a. Validate product exists
   b. Check stock availability at branch
   c. IF stock insufficient THEN
         RETURN "Insufficient stock"
      END IF
   d. Calculate item subtotal (price × quantity)
   e. Calculate tax amount
   f. Add to sale items array
4. Calculate sale totals:
   a. subtotal = SUM of all item subtotals
   b. totalTax = SUM of all item taxes
   c. totalDiscount = applied discounts
   d. grandTotal = subtotal + totalTax - totalDiscount
5. BEGIN DATABASE TRANSACTION
6. Create sale record in database
7. FOR each item in sale:
   a. Update product stock at branch
   b. Record inventory adjustment
8. IF customer provided THEN
   a. Update customer purchase history
9. Generate invoice number
10. Commit transaction
11. Generate receipt/invoice
12. RETURN sale record and invoice
13. END
```

**Pseudocode**:
```javascript
FUNCTION processSale(saleData):
    // Initialize sale
    sale = {
        saleNumber: generateSaleNumber(),
        items: [],
        branch: saleData.branchId,
        cashier: currentUser.id,
        paymentMethod: saleData.paymentMethod,
        date: currentTimestamp()
    }
    
    subtotal = 0
    totalTax = 0
    
    // Process each item
    FOR EACH item IN saleData.items:
        // Validate product
        product = database.findProduct(item.productId)
        IF product IS NULL:
            THROW NotFoundError("Product not found")
        
        // Check stock
        stock = product.getStockAtBranch(saleData.branchId)
        IF stock.quantity < item.quantity:
            THROW ValidationError("Insufficient stock for " + product.name)
        
        // Calculate item totals
        itemSubtotal = product.price * item.quantity
        itemTax = itemSubtotal * (product.tax / 100)
        itemTotal = itemSubtotal + itemTax
        
        // Add to sale items
        sale.items.push({
            product: item.productId,
            productName: product.name,
            quantity: item.quantity,
            unitPrice: product.price,
            tax: itemTax,
            subtotal: itemSubtotal,
            total: itemTotal
        })
        
        subtotal = subtotal + itemSubtotal
        totalTax = totalTax + itemTax
    END FOR
    
    // Calculate final totals
    sale.subtotal = subtotal
    sale.tax = totalTax
    sale.discount = saleData.discount OR 0
    sale.total = subtotal + totalTax - sale.discount
    
    // Database transaction
    BEGIN_TRANSACTION:
        // Save sale
        savedSale = database.createSale(sale)
        
        // Update inventory
        FOR EACH item IN sale.items:
            database.updateProductStock(
                item.product,
                saleData.branchId,
                -item.quantity  // Reduce stock
            )
            
            // Log adjustment
            database.createAdjustment({
                product: item.product,
                branch: saleData.branchId,
                type: 'sale',
                quantity: -item.quantity,
                reason: 'Sale transaction: ' + savedSale.saleNumber
            })
        END FOR
        
        // Update customer if provided
        IF saleData.customerId IS NOT NULL:
            database.updateCustomer(saleData.customerId, {
                totalPurchases: INCREMENT,
                lastPurchaseDate: currentTimestamp()
            })
        END IF
    COMMIT_TRANSACTION
    
    // Generate invoice
    invoice = generateInvoice(savedSale)
    
    // Return result
    RETURN {
        success: TRUE,
        sale: savedSale,
        invoice: invoice
    }
END FUNCTION
```

---

### 5.2.3 Inventory Adjustment Algorithm

#### Stock Adjustment Algorithm
**Purpose**: Adjust product stock with validation and audit trail

**Algorithm Steps**:
```
Algorithm: AdjustInventoryStock
Input: productId, branchId, adjustmentType, quantity, reason
Output: updatedStock, adjustmentRecord

1. START
2. Validate input parameters
3. Fetch product from database
4. IF product not found THEN
      RETURN "Product not found"
   END IF
5. Get current stock at branch
6. Calculate new stock quantity:
   IF adjustmentType == "add" THEN
      newQuantity = currentStock + quantity
   ELSE IF adjustmentType == "remove" THEN
      newQuantity = currentStock - quantity
      IF newQuantity < 0 THEN
         RETURN "Insufficient stock"
      END IF
   ELSE IF adjustmentType == "damage" THEN
      newQuantity = currentStock - quantity
   END IF
7. Update stock in database
8. Create adjustment record for audit
9. Check if stock below reorder level
10. IF stock < reorderLevel THEN
       Send low stock alert
    END IF
11. RETURN updated stock and adjustment record
12. END
```

**Pseudocode**:
```javascript
FUNCTION adjustInventoryStock(adjustmentData):
    // Validate inputs
    IF NOT isValidObjectId(adjustmentData.productId):
        THROW ValidationError("Invalid product ID")
    
    IF adjustmentData.quantity <= 0:
        THROW ValidationError("Quantity must be positive")
    
    // Fetch product
    product = database.findProduct(adjustmentData.productId)
    IF product IS NULL:
        THROW NotFoundError("Product not found")
    
    // Get current stock
    stockIndex = product.stocks.findIndex(
        s => s.branch == adjustmentData.branchId
    )
    
    IF stockIndex == -1:
        THROW NotFoundError("Stock not found for this branch")
    
    currentQuantity = product.stocks[stockIndex].quantity
    
    // Calculate new quantity based on type
    SWITCH adjustmentData.type:
        CASE "add":
            newQuantity = currentQuantity + adjustmentData.quantity
            BREAK
        
        CASE "remove":
            newQuantity = currentQuantity - adjustmentData.quantity
            IF newQuantity < 0:
                THROW ValidationError("Insufficient stock")
            BREAK
        
        CASE "damage":
            newQuantity = currentQuantity - adjustmentData.quantity
            IF newQuantity < 0:
                THROW ValidationError("Quantity exceeds available stock")
            BREAK
        
        CASE "set":
            newQuantity = adjustmentData.quantity
            BREAK
        
        DEFAULT:
            THROW ValidationError("Invalid adjustment type")
    END SWITCH
    
    // Begin transaction
    BEGIN_TRANSACTION:
        // Update stock
        product.stocks[stockIndex].quantity = newQuantity
        product.stocks[stockIndex].lastUpdated = currentTimestamp()
        updatedProduct = database.saveProduct(product)
        
        // Create adjustment record
        adjustment = database.createAdjustment({
            product: adjustmentData.productId,
            branch: adjustmentData.branchId,
            type: adjustmentData.type,
            quantity: adjustmentData.quantity,
            previousQuantity: currentQuantity,
            newQuantity: newQuantity,
            reason: adjustmentData.reason,
            adjustedBy: currentUser.id,
            date: currentTimestamp()
        })
    COMMIT_TRANSACTION
    
    // Check reorder level
    reorderLevel = product.stocks[stockIndex].reorderLevel OR 10
    IF newQuantity < reorderLevel:
        sendLowStockAlert(product, adjustmentData.branchId, newQuantity)
    END IF
    
    // Return result
    RETURN {
        success: TRUE,
        product: updatedProduct,
        adjustment: adjustment,
        currentStock: newQuantity
    }
END FUNCTION
```

---

### 5.2.4 Product Search Algorithm

#### Smart Product Search Algorithm
**Purpose**: Search products with multiple filters and pagination

**Algorithm Steps**:
```
Algorithm: SearchProducts
Input: searchQuery, filters, pagination
Output: products[], totalCount, paginationInfo

1. START
2. Initialize query object
3. IF searchQuery not empty THEN
   a. Add text search condition
   b. Search in name, description, SKU, barcode
4. Apply filters:
   a. IF category filter THEN add category condition
   b. IF brand filter THEN add brand condition
   c. IF branch filter THEN add branch stock condition
   d. IF price range THEN add price condition
5. Calculate skip value = (page - 1) × limit
6. Execute database query with:
   a. Search conditions
   b. Sort order
   c. Skip and limit
   d. Population of references
7. Get total count for pagination
8. Calculate pagination metadata
9. RETURN filtered products with pagination
10. END
```

**Pseudocode**:
```javascript
FUNCTION searchProducts(searchParams):
    // Initialize query
    query = {}
    
    // Text search
    IF searchParams.search IS NOT EMPTY:
        query.$or = [
            { name: { $regex: searchParams.search, $options: 'i' } },
            { description: { $regex: searchParams.search, $options: 'i' } },
            { sku: { $regex: searchParams.search, $options: 'i' } },
            { barcode: { $regex: searchParams.search, $options: 'i' } }
        ]
    END IF
    
    // Category filter
    IF searchParams.category IS NOT NULL:
        query.category = searchParams.category
    END IF
    
    // Brand filter
    IF searchParams.brand IS NOT NULL:
        query.brand = searchParams.brand
    END IF
    
    // Branch stock filter
    IF searchParams.branch IS NOT NULL:
        query['stocks.branch'] = searchParams.branch
    END IF
    
    // Price range filter
    IF searchParams.minPrice OR searchParams.maxPrice:
        query.price = {}
        IF searchParams.minPrice:
            query.price.$gte = searchParams.minPrice
        IF searchParams.maxPrice:
            query.price.$lte = searchParams.maxPrice
    END IF
    
    // Active products only
    query.isActive = TRUE
    
    // Pagination
    page = searchParams.page OR 1
    limit = searchParams.limit OR 10
    skip = (page - 1) * limit
    
    // Sort order
    sortField = searchParams.sortBy OR 'name'
    sortOrder = searchParams.sortOrder == 'desc' ? -1 : 1
    sort = { [sortField]: sortOrder }
    
    // Execute query
    products = database.find(query)
        .populate('category brand unit')
        .sort(sort)
        .skip(skip)
        .limit(limit)
    
    // Get total count
    totalCount = database.countDocuments(query)
    
    // Calculate pagination
    totalPages = CEIL(totalCount / limit)
    hasNextPage = page < totalPages
    hasPrevPage = page > 1
    
    // Return result
    RETURN {
        success: TRUE,
        data: products,
        pagination: {
            page: page,
            limit: limit,
            total: totalCount,
            pages: totalPages,
            hasNext: hasNextPage,
            hasPrev: hasPrevPage
        }
    }
END FUNCTION
```

---

### 5.2.5 Report Generation Algorithm

#### Sales Report Algorithm
**Purpose**: Generate comprehensive sales report with analytics

**Algorithm Steps**:
```
Algorithm: GenerateSalesReport
Input: startDate, endDate, branchId, groupBy
Output: reportData, summary, charts

1. START
2. Validate date range
3. Build aggregation pipeline:
   a. Match sales within date range
   b. Filter by branch if specified
   c. Group by specified dimension (day/week/month)
   d. Calculate totals and counts
4. Execute aggregation
5. Calculate summary statistics:
   a. Total sales amount
   b. Total transactions
   c. Average order value
   d. Top selling products
6. Generate chart data
7. Format report output
8. RETURN report with visualizations
9. END
```

**Pseudocode**:
```javascript
FUNCTION generateSalesReport(reportParams):
    // Validate dates
    IF reportParams.startDate > reportParams.endDate:
        THROW ValidationError("Invalid date range")
    
    // Build aggregation pipeline
    pipeline = []
    
    // Match stage - filter by date and branch
    matchStage = {
        date: {
            $gte: reportParams.startDate,
            $lte: reportParams.endDate
        },
        status: 'completed'
    }
    
    IF reportParams.branchId IS NOT NULL:
        matchStage.branch = reportParams.branchId
    END IF
    
    pipeline.push({ $match: matchStage })
    
    // Group stage - aggregate by time period
    groupBy = reportParams.groupBy OR 'day'
    
    groupStage = {
        _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
        },
        totalSales: { $sum: '$total' },
        totalTransactions: { $count: {} },
        averageOrderValue: { $avg: '$total' },
        totalItems: { $sum: { $size: '$items' } }
    }
    
    IF groupBy == 'day':
        groupStage._id.day = { $dayOfMonth: '$date' }
    END IF
    
    pipeline.push({ $group: groupStage })
    
    // Sort stage
    pipeline.push({ $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } })
    
    // Execute aggregation
    salesData = database.aggregate('sales', pipeline)
    
    // Calculate summary
    summary = {
        totalRevenue: SUM(salesData, 'totalSales'),
        totalTransactions: SUM(salesData, 'totalTransactions'),
        averageOrderValue: AVERAGE(salesData, 'averageOrderValue'),
        totalItemsSold: SUM(salesData, 'totalItems')
    }
    
    // Get top selling products
    topProducts = database.aggregate('sales', [
        { $match: matchStage },
        { $unwind: '$items' },
        { $group: {
            _id: '$items.product',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.total' }
        }},
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
        { $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productInfo'
        }}
    ])
    
    // Generate chart data
    chartData = {
        labels: salesData.map(d => formatDate(d._id)),
        datasets: [{
            label: 'Daily Sales',
            data: salesData.map(d => d.totalSales)
        }]
    }
    
    // Return complete report
    RETURN {
        success: TRUE,
        report: {
            period: {
                start: reportParams.startDate,
                end: reportParams.endDate
            },
            summary: summary,
            dailyData: salesData,
            topProducts: topProducts,
            charts: chartData
        }
    }
END FUNCTION
```

---

### 5.2.6 Low Stock Alert Algorithm

#### Automatic Stock Monitoring Algorithm
**Purpose**: Monitor stock levels and send alerts when below threshold

**Pseudocode**:
```javascript
FUNCTION checkLowStockItems():
    // Get all active products
    products = database.findProducts({ isActive: TRUE })
    
    lowStockItems = []
    
    FOR EACH product IN products:
        FOR EACH stock IN product.stocks:
            // Check if below reorder level
            IF stock.quantity < stock.reorderLevel:
                lowStockItems.push({
                    product: product,
                    branch: stock.branch,
                    currentQuantity: stock.quantity,
                    reorderLevel: stock.reorderLevel,
                    shortage: stock.reorderLevel - stock.quantity
                })
            END IF
        END FOR
    END FOR
    
    // Send alerts if low stock found
    IF lowStockItems.length > 0:
        // Group by branch
        alertsByBranch = groupBy(lowStockItems, 'branch')
        
        FOR EACH branch, items IN alertsByBranch:
            // Get branch manager
            manager = database.findManagerByBranch(branch)
            
            // Send email notification
            emailService.send({
                to: manager.email,
                subject: 'Low Stock Alert',
                template: 'low-stock',
                data: {
                    branch: branch.name,
                    items: items,
                    date: currentTimestamp()
                }
            })
        END FOR
    END IF
    
    RETURN lowStockItems
END FUNCTION
```

These algorithms provide the core logic for the major functionalities of the Supermarket Inventory Management System, ensuring efficient, secure, and reliable operations.
