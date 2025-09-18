# Foundation Migration & Setup Guide

This guide will help you migrate the existing codebase to use the enhanced foundation with linting, formatting, validation, logging, and shared types.

## 🚀 Quick Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account or local MongoDB
- Git installed

### 1. Install Dependencies

#### Backend Setup
```bash
cd backend
npm install
```

#### Frontend Setup
```bash
cd frontend
npm install
```

### 2. Environment Configuration

#### Backend Environment
Copy the example environment file and configure:
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your actual values:
```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/inventory_db
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
```

#### Frontend Environment
Copy the example environment file:
```bash
cd frontend
cp .env.example .env
```

Edit `.env` with your configuration:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Development Workflow Setup

#### Initialize Git Hooks (Backend)
```bash
cd backend
npm run prepare
```

#### Initialize Git Hooks (Frontend)
```bash
cd frontend
npm run prepare
```

### 4. Code Quality Check

#### Lint and Format Backend
```bash
cd backend
npm run lint
npm run format
npm run validate
```

#### Lint and Format Frontend
```bash
cd frontend
npm run lint
npm run format
npm run validate
```

### 5. Run the Application

#### Start Backend
```bash
cd backend
npm run dev
```

#### Start Frontend
```bash
cd frontend
npm run dev
```

## 📁 New File Structure

```
inventory-supermarkets/
├── docs/
│   ├── ARCHITECTURE.md          # ✅ System architecture documentation
│   ├── DATA_MODELS.md
│   ├── SETUP.md
│   └── TODAY_CHECKLIST.md
├── shared/
│   ├── types/
│   │   └── index.ts             # ✅ Shared TypeScript types
│   └── validation/
│       └── schemas.js           # ✅ Shared validation schemas
├── backend/
│   ├── .env.example             # ✅ Environment template
│   ├── .prettierrc              # ✅ Code formatting config
│   ├── eslint.config.js         # ✅ Linting configuration
│   ├── package.json             # ✅ Enhanced with new scripts
│   └── src/
│       ├── middleware/
│       │   └── validation.js    # ✅ Enhanced validation middleware
│       └── utils/
│           └── logger.js        # ✅ Centralized logging system
├── frontend/
│   ├── .env.example             # ✅ Environment template
│   ├── .prettierrc              # ✅ Code formatting config
│   ├── eslint.config.js         # ✅ Linting configuration
│   └── package.json             # ✅ Enhanced with new scripts
└── .gitignore                   # ✅ Comprehensive ignore rules
```

## 🔧 Available Scripts

### Backend Scripts
```bash
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage# Run tests with coverage
npm run lint         # Check code with ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check if code is formatted
npm run validate     # Run all checks (lint + format + test)
npm run seed         # Seed database with sample data
```

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code with ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check if code is formatted
npm run type-check   # Check TypeScript types
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run test:coverage# Run tests with coverage
npm run validate     # Run all checks
```

## 🔒 Code Quality Features

### ✅ ESLint Configuration
- **Backend**: Node.js specific rules with security checks
- **Frontend**: React/JSX rules with accessibility checks
- **Common**: Best practices, error prevention, consistent styling

### ✅ Prettier Configuration
- Consistent code formatting across the project
- Tailwind CSS class sorting (frontend)
- JSON and Markdown formatting

### ✅ Git Hooks (Husky + lint-staged)
- Pre-commit: Automatic linting and formatting
- Pre-push: Run tests before pushing
- Commit message validation

### ✅ Validation System
- Shared Joi schemas for consistent validation
- Enhanced middleware with detailed error reporting
- Input sanitization and XSS protection
- File upload validation

### ✅ Logging System
- Structured logging with Winston
- Request/response logging
- Authentication audit trail
- Security event logging
- Performance monitoring
- Error tracking with context

## 🔐 Security Enhancements

### Input Validation
- Comprehensive Joi schemas
- XSS protection
- SQL injection prevention
- File upload security

### Rate Limiting
- Per-endpoint rate limiting
- Configurable windows and limits
- Security event logging

### Authentication Security
- Detailed auth logging
- Failed login attempt tracking
- Session management

## 📊 Monitoring & Debugging

### Log Files (Backend)
```
backend/logs/
├── combined.log      # All log levels
├── error.log         # Errors only
├── http.log          # HTTP requests
├── exceptions.log    # Unhandled exceptions
└── rejections.log    # Unhandled promise rejections
```

### Development Tools
- **Backend**: Detailed console logging in development
- **Frontend**: React DevTools integration
- **Testing**: Vitest for frontend, Jest for backend
- **Coverage**: Built-in code coverage reports

## 🚀 Development Workflow

### 1. Before Starting Work
```bash
git pull origin main
npm run validate  # Check code quality
```

### 2. During Development
```bash
npm run dev       # Start development server
npm run test:watch # Run tests in watch mode
```

### 3. Before Committing
```bash
npm run validate  # Ensure all checks pass
git add .
git commit -m "feat: description"  # Hooks will run automatically
```

### 4. Code Review Checklist
- [ ] All tests pass
- [ ] No linting errors
- [ ] Code is formatted
- [ ] Types are defined (if applicable)
- [ ] Validation schemas updated
- [ ] Error handling included
- [ ] Logging added for important events

## 🛠 Troubleshooting

### Common Issues

#### MongoDB Connection
```bash
# Check connection string in .env
MONGODB_URI=mongodb+srv://...
```

#### Port Conflicts
```bash
# Backend default: 5000
PORT=5001

# Frontend default: 3000 (Vite)
# Change in vite.config.js if needed
```

#### Permission Issues (Windows)
```bash
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Validation Errors
- Check shared validation schemas in `shared/validation/schemas.js`
- Update both frontend and backend if schema changes
- Test validation with various input combinations

### Logging Issues
- Check log files in `backend/logs/`
- Adjust log level in `.env`: `LOG_LEVEL=debug`
- Ensure logs directory has write permissions

## 📈 Performance Optimization

### Backend
- Database indexing
- Query optimization
- Response compression
- Caching strategies

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle analysis

## 🔄 Migration Checklist

### ✅ Completed
- [x] Architecture documentation
- [x] ESLint + Prettier setup
- [x] Environment configuration
- [x] Shared types and validation
- [x] Centralized logging
- [x] Enhanced validation middleware
- [x] Git hooks and workflows

### 🔄 Next Steps
- [ ] Update existing controllers to use new validation
- [ ] Add comprehensive test coverage
- [ ] Implement rate limiting on routes
- [ ] Add TypeScript to frontend components
- [ ] Create API documentation
- [ ] Set up CI/CD pipeline

## 📚 Additional Resources

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [Data Models](./docs/DATA_MODELS.md)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [Joi Validation](https://joi.dev/api/)
- [Winston Logging](https://github.com/winstonjs/winston)

## 🆘 Support

If you encounter any issues during the migration:

1. Check the logs in `backend/logs/`
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed
4. Run `npm run validate` to check for issues
5. Review the error messages for specific guidance

The foundation is now ready for production-grade development with proper tooling, validation, logging, and code quality measures in place.