# Data Flow Diagrams (DFD)

## Overview
Data Flow Diagrams (DFD) represent the flow of data through the Supermarket Inventory Management System. These diagrams illustrate how information moves between different processes, data stores, and external entities, providing a clear visualization of system operations.

---

## Context Diagram (Level 0 DFD)

### Description
The Context Diagram provides a high-level view of the entire system, showing how external entities interact with the Supermarket Inventory System. It represents the system as a single process with inputs and outputs.

### Diagram Code (PlantUML)
```
@startuml
!define RECTANGLE class

skinparam rectangle {
    BackgroundColor LightBlue
    BorderColor Black
}

rectangle "Admin" as Admin
rectangle "Manager" as Manager
rectangle "Cashier" as Cashier
rectangle "Inventory Clerk" as Clerk
rectangle "Customer" as Customer

rectangle "Supermarket\nInventory\nManagement\nSystem" as System {
}

Admin --> System : User credentials\nSystem settings
System --> Admin : Reports\nUser management data

Manager --> System : Product data\nInventory updates
System --> Manager : Sales reports\nInventory reports

Cashier --> System : Sale transactions\nProduct scans
System --> Cashier : Receipts\nInvoices

Clerk --> System : Stock adjustments\nTransfer requests
System --> Clerk : Inventory status\nLow stock alerts

Customer --> System : Purchase requests
System --> Customer : Receipts\nProduct information
@enduml
```

---

## Level 1 DFD

### Description
Level 1 DFD breaks down the main system into core processes: User Authentication, Product Management, Inventory Management, Sales Processing, and Reporting. It shows data flows between processes and data stores.

### Diagram Code (PlantUML)
```
@startuml
!define PROCESS rectangle
!define DATASTORE database

skinparam rectangle {
    BackgroundColor LightYellow
    BorderColor Black
}

skinparam database {
    BackgroundColor LightGreen
    BorderColor Black
}

actor Admin
actor Manager
actor Cashier
actor Clerk

PROCESS "1.0\nUser\nAuthentication" as Auth
PROCESS "2.0\nProduct\nManagement" as Product
PROCESS "3.0\nInventory\nManagement" as Inventory
PROCESS "4.0\nSales\nProcessing" as Sales
PROCESS "5.0\nReporting\nSystem" as Report

DATASTORE "D1: Users" as UserDB
DATASTORE "D2: Products" as ProductDB
DATASTORE "D3: Inventory" as InventoryDB
DATASTORE "D4: Sales" as SalesDB
DATASTORE "D5: Branches" as BranchDB

Admin --> Auth : Login credentials
Auth --> Admin : Auth token
Auth --> UserDB : Store user data
UserDB --> Auth : Validate credentials

Manager --> Product : Add/Edit products
Product --> ProductDB : Product data
ProductDB --> Product : Product info

Clerk --> Inventory : Stock updates
Inventory --> InventoryDB : Inventory data
InventoryDB --> Inventory : Stock levels
Inventory --> Product : Update product stock

Cashier --> Sales : Sale transaction
Sales --> SalesDB : Sale records
Sales --> InventoryDB : Update stock
SalesDB --> Sales : Sale info

Manager --> Report : Request reports
Report --> SalesDB : Fetch sales data
Report --> InventoryDB : Fetch inventory data
Report --> Manager : Generated reports
@enduml
```

---

## Level 2 DFD - Sales Processing

### Description
Level 2 DFD for Sales Processing shows detailed sub-processes including product scanning, payment processing, inventory update, and receipt generation. This provides an in-depth view of the sales transaction flow.

### Diagram Code (PlantUML)
```
@startuml
!define PROCESS rectangle
!define DATASTORE database

skinparam rectangle {
    BackgroundColor LightYellow
    BorderColor Black
}

skinparam database {
    BackgroundColor LightGreen
    BorderColor Black
}

actor Cashier
actor Customer

PROCESS "4.1\nScan/Select\nProducts" as Scan
PROCESS "4.2\nCalculate\nTotal" as Calculate
PROCESS "4.3\nProcess\nPayment" as Payment
PROCESS "4.4\nUpdate\nInventory" as UpdateInv
PROCESS "4.5\nGenerate\nReceipt" as Receipt

DATASTORE "D2: Products" as ProductDB
DATASTORE "D3: Inventory" as InventoryDB
DATASTORE "D4: Sales" as SalesDB

Cashier --> Scan : Product barcode/SKU
Scan --> ProductDB : Query product
ProductDB --> Scan : Product details
Scan --> Calculate : Item list

Calculate --> Calculate : Apply discount\nCalculate tax
Calculate --> Payment : Total amount

Customer --> Payment : Payment info
Payment --> SalesDB : Save sale record
Payment --> UpdateInv : Sale items

UpdateInv --> InventoryDB : Reduce stock
InventoryDB --> UpdateInv : Confirmation
UpdateInv --> Receipt : Sale complete

Receipt --> SalesDB : Fetch sale data
Receipt --> Customer : Print receipt
Receipt --> Cashier : Sale confirmation
@enduml
```

---

## Level 2 DFD - Inventory Management

### Description
Level 2 DFD for Inventory Management details the processes of stock adjustment, transfer between branches, low stock monitoring, and automated alerts. This ensures efficient inventory tracking across multiple branches.

### Diagram Code (PlantUML)
```
@startuml
!define PROCESS rectangle
!define DATASTORE database

skinparam rectangle {
    BackgroundColor LightYellow
    BorderColor Black
}

skinparam database {
    BackgroundColor LightGreen
    BorderColor Black
}

actor Clerk
actor Manager

PROCESS "3.1\nAdjust\nStock" as Adjust
PROCESS "3.2\nTransfer\nStock" as Transfer
PROCESS "3.3\nMonitor\nStock Levels" as Monitor
PROCESS "3.4\nGenerate\nAlerts" as Alert

DATASTORE "D2: Products" as ProductDB
DATASTORE "D3: Inventory" as InventoryDB
DATASTORE "D5: Branches" as BranchDB
DATASTORE "D6: Adjustments" as AdjustDB

Clerk --> Adjust : Stock adjustment data
Adjust --> InventoryDB : Update quantities
Adjust --> AdjustDB : Record adjustment
InventoryDB --> Adjust : Confirmation

Clerk --> Transfer : Transfer request
Transfer --> BranchDB : Check branches
Transfer --> InventoryDB : Update stock\n(from & to branches)
InventoryDB --> Transfer : Transfer complete

Monitor --> InventoryDB : Check stock levels
InventoryDB --> Monitor : Stock data
Monitor --> Alert : Low stock detected

Alert --> Manager : Low stock notification
Alert --> ProductDB : Fetch product info
ProductDB --> Alert : Product details
@enduml
```

---

## Level 2 DFD - User Authentication

### Description
Level 2 DFD for User Authentication shows the detailed authentication process including credential validation, token generation, role verification, and session management. This ensures secure access control across the system.

### Diagram Code (PlantUML)
```
@startuml
!define PROCESS rectangle
!define DATASTORE database

skinparam rectangle {
    BackgroundColor LightYellow
    BorderColor Black
}

skinparam database {
    BackgroundColor LightGreen
    BorderColor Black
}

actor User

PROCESS "1.1\nValidate\nCredentials" as Validate
PROCESS "1.2\nVerify\nRole & Status" as Verify
PROCESS "1.3\nGenerate\nToken" as Token
PROCESS "1.4\nManage\nSession" as Session

DATASTORE "D1: Users" as UserDB
DATASTORE "D7: Sessions" as SessionDB

User --> Validate : Email & Password
Validate --> UserDB : Query user
UserDB --> Validate : User data

Validate --> Verify : User found
Verify --> UserDB : Check role & status
UserDB --> Verify : Role & status info

Verify --> Token : User verified
Token --> Token : Generate JWT
Token --> Session : Token data

Session --> SessionDB : Store session
SessionDB --> Session : Session ID
Session --> User : Auth token & user info
@enduml
```

---

## Summary

### Key Data Stores
- **D1: Users** - Stores user accounts, roles, and permissions
- **D2: Products** - Contains product catalog with details
- **D3: Inventory** - Tracks stock levels across branches
- **D4: Sales** - Records all sales transactions
- **D5: Branches** - Stores branch information
- **D6: Adjustments** - Logs inventory adjustments
- **D7: Sessions** - Manages user sessions

### Main Processes
1. **User Authentication** - Secure login and access control
2. **Product Management** - CRUD operations on products
3. **Inventory Management** - Stock tracking and transfers
4. **Sales Processing** - Transaction handling and receipts
5. **Reporting System** - Analytics and business intelligence

### Data Flow Characteristics
- **Real-time Updates** - Inventory changes reflect immediately
- **Multi-branch Support** - Data flows across branches
- **Role-based Access** - Different data access for different users
- **Audit Trail** - All transactions logged for accountability
