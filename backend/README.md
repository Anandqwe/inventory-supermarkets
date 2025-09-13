# Backend README

## Supermarket Inventory & Sales Management - Backend

This is the backend API for the supermarket inventory and sales management system.

### Tech Stack
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- CORS enabled

### Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. Start development server:
```bash
npm run dev
```

4. Check health endpoint:
```bash
curl http://localhost:5000/health
```

### Project Structure
```
backend/
├── models/         # Database models
├── routes/         # API routes
├── controllers/    # Route handlers
├── middleware/     # Custom middleware
├── server.js       # Main application file
└── package.json    # Dependencies
```

### Environment Variables
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token signing
- `CORS_ORIGIN`: Frontend URL for CORS
- `PORT`: Server port (default: 5000)

### API Endpoints
- `GET /health` - Health check endpoint

More endpoints will be added as development progresses.
