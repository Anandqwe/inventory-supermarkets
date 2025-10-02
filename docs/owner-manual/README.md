# Inventory Supermarkets — Owner's Manual & Guided Tour

## Table of Contents

This comprehensive owner's manual is divided into manageable parts for easy navigation:

### Core Documentation
1. **[Executive Summary & Architecture](01-executive-summary-architecture.md)**
   - What the app does and who uses it
   - System architecture overview
   - Environment configuration

2. **[Codebase Map & Data Models](02-codebase-data-models.md)**
   - Complete file structure walkthrough
   - Database models and relationships
   - ERD diagrams

3. **[API Catalog & Core Flows](03-api-core-flows.md)**
   - Complete API endpoint documentation
   - Sequence diagrams for key processes
   - Authentication and business flows

4. **[Frontend UX Guide & Security](04-frontend-security.md)**
   - React component architecture
   - UI patterns and conventions
   - Security implementation details

5. **[GST & Pricing + Seeding](05-gst-seeding.md)**
   - Indian GST tax calculations
   - Demo data and seeding scripts
   - Sample products and categories

6. **[Testing + Performance + Operations](06-testing-performance-ops.md)**
   - Testing strategies and examples
   - Performance optimization
   - Monitoring and operations

7. **[How-to Recipes + Demo + FAQ](07-recipes-demo-faq.md)**
   - Step-by-step development recipes
   - 2-minute demo script
   - Troubleshooting guide and glossary

### Quick Navigation

- **New to the project?** → Start with [Executive Summary](01-executive-summary-architecture.md)
- **Need to extend features?** → Jump to [How-to Recipes](07-recipes-demo-faq.md#how-to-playbook)
- **API reference needed?** → Check [API Catalog](03-api-core-flows.md#api-catalog)
- **Debugging issues?** → See [FAQ & Troubleshooting](07-recipes-demo-faq.md#faq--troubleshooting)
- **Demo for stakeholders?** → Use [Demo Script](07-recipes-demo-faq.md#2-minute-demo-script)

### Understanding Checklist

Use this checklist to track your learning progress:

- [ ] **Architecture**: I understand how React frontend communicates with Node.js backend via JWT-authenticated APIs
- [ ] **Data Flow**: I know how product creation → stock tracking → sales processing → reporting works end-to-end
- [ ] **Authentication**: I can explain how JWT tokens are generated, stored, and validated for user sessions
- [ ] **Database Design**: I understand the relationships between User, Product, Sale, Category, and Branch models
- [ ] **API Structure**: I know how to find and test any endpoint using the consistent response format
- [ ] **Frontend Components**: I can locate and modify reusable UI components like Button, Modal, Table
- [ ] **Business Logic**: I understand how stock deduction, low-stock alerts, and GST calculations work
- [ ] **Extension Points**: I know where to edit code to add new fields, endpoints, or pages
- [ ] **Testing**: I can run existing tests and write new ones following the established patterns
- [ ] **Deployment**: I understand the environment variables and can set up the system locally

**If you checked all items, you're ready to maintain and extend this system! 🚀**

---

## Project Context

**Repository**: https://github.com/Anandqwe/inventory-supermarkets  
**Tech Stack**: React + Vite + Tailwind (Frontend) | Node.js + Express + MongoDB (Backend)  
**Domain**: Supermarket Inventory & Sales Management for Indian retail businesses  
**Last Updated**: October 2, 2025