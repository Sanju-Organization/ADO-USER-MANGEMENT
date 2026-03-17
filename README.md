# User Management Web Application

## Overview
A full-stack web application for managing users with authentication, role-based access control, and CRUD operations.

## Tech Stack
- **Frontend**: React 18, Material UI, Axios, React Router
- **Backend**: Node.js, Express.js
- **Database**: SQL.js (in-memory SQL database)
- **Authentication**: JWT (JSON Web Tokens), bcrypt password hashing
- **Testing**: Playwright e2e tests
- **CI/CD**: Azure Pipelines

## Project Structure
```
tmna-user-management/
├── tmna_backend/
│   ├── db/database.js                 # SQL.js initialization
│   ├── middleware/auth.js             # JWT authentication
│   ├── middleware/errorHandler.js     # Global error handling
│   ├── routes/auth.js                 # Login/Register endpoints
│   ├── routes/users.js                # User CRUD endpoints
│   └── server.js                      # Express server
├── tmna_frontend/
│   ├── src/
│   │   ├── context/AuthContext.js     # Auth state
│   │   ├── pages/                     # React pages
│   │   ├── services/api.js            # Axios client
│   │   └── App.js
│   ├── tests/                         # Playwright e2e tests
│   ├── public/index.html
│   └── package.json
├── azure-pipelines.yml                # CI/CD config
└── package.json
```

## Features
- User registration with validation
- Secure JWT-based authentication
- Role-based access control (admin/user)
- User profile management
- Password change with verification
- Soft delete for users
- Pagination and search functionality
- Input validation and error handling
- E2E testing with Playwright

## Local Setup

### Prerequisites
- Node.js >= 16.x
- npm >= 8.x

### Installation & Running

1. **Install all dependencies**:
   ```bash
   npm ci
   cd tmna_frontend && npm ci
   cd ..
   ```

2. **Start backend** (Terminal 1):
   ```bash
   npm run backend
   ```
   Backend: http://localhost:5000

3. **Start frontend** (Terminal 2):
   ```bash
   cd tmna_frontend && npm start
   ```
   Frontend: http://localhost:3000

4. **Run e2e tests** (Terminal 3):
   ```bash
   cd tmna_frontend && npx playwright test
   ```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - List users (pagination, search)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update profile
- `POST /api/users/:id/change-password` - Change password
- `DELETE /api/users/:id` - Soft delete (admin only)

## Authentication
After login, clients receive JWT token:
```json
{
  "token": "eyJhbGciOiJIUzI1NiI...",
  "user": { "id", "email", "username", "role" }
}
```

Include in requests: `Authorization: Bearer <token>`

## Test Coverage
- User registration flow
- Login with valid/invalid credentials
- Logout functionality
- Dashboard user listing
- User search functionality
- Profile updates
- Password changes

## CI/CD Pipeline
Runs on Azure DevOps for all feature branches and main:
1. Installs dependencies
2. Installs Playwright browsers
3. Starts backend and frontend
4. Runs e2e tests
5. Publishes JUnit results
6. Uploads Playwright report
