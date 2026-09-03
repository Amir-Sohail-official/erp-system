# ERP System

A professional JavaScript MERN ERP for sales, purchases, inventory, payments, dashboard analytics, and reporting.

## Overview

This ERP is designed as a real business workflow system with a layered backend and React + Vite frontend. The implementation keeps business rules on the server and uses MongoDB for transactional data storage and reporting.

The project includes:

- Authentication with JWT and role-based permissions
- User and role management
- Category and product maintenance
- Customer and supplier management
- Purchase workflow with stock increase
- Sales workflow with stock decrease
- Inventory tracking and stock movement history
- Payments and transaction status tracking
- Return validation and financial adjustments
- Dashboard metrics and business reports
- Demo data for presentation and testing

## Architecture

### Backend

The backend follows the service-oriented pattern below:

Request -> Route -> Middleware -> Controller -> Service/Model -> MongoDB

Key responsibilities:

- Routes define API endpoints and protection rules
- Middleware handles JWT auth, permissions, ObjectId validation, and errors
- Controllers process request data and map business responses
- Services own critical stock and financial logic
- Models define MongoDB documents and indexes
- Utilities centralize permissions and API response formatting

### Frontend

The frontend is a Vite + React application with a monolithic but modular component structure and a dashboard shell for ERP navigation.

## Technology Stack

### Frontend

- React
- Vite
- Axios
- Plain JavaScript (not TypeScript)

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Zod validation

### General

- JavaScript MERN stack
- REST API architecture
- Local development port consistency
- Shared business logic on the backend

## Project Structure

```text
erp-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── app.js
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── README.md
└── package.json
```

## Environment Variables

Create a backend `.env` file with your MongoDB Atlas connection and deployment settings.

Required values:

```env
PORT=5005
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
JWT_SECRET=your-very-long-secure-secret
JWT_EXPIRES_IN=7d
SEED_ADMIN_EMAIL=admin@erp.local
SEED_ADMIN_PASSWORD=admin123456
SEED_ADMIN_NAME=System Admin
```

Notes:

- Add the deploying machine's public IP address in MongoDB Atlas under Network Access.
- `JWT_SECRET` must be long and unpredictable for production-grade behavior.
- The default local ports are `5005` for the backend and `5173` for the frontend.

## Installation

### Backend

```bash
cd erp-system/backend
npm install
```

### Frontend

```bash
cd erp-system/frontend
npm install
```

## Running the Application

### Backend

```bash
cd erp-system/backend
npm run start:fixed
```

### Frontend

```bash
cd erp-system/frontend
npm run dev:fixed
```

## Database Setup

1. Create a MongoDB Atlas database user with read/write access to the application database.
2. Add the backend server's public IP address in Atlas Network Access.
3. Set `MONGO_URI` in the backend environment.
4. Start the backend. The app seeds default roles and an admin user automatically.

## Seed Data

The backend seeds:

- Admin role
- Manager role
- Salesman role
- Inventory Manager role
- Accountant role
- System admin account
- Categories
- Products
- Customers
- Suppliers
- Sample purchases and sales for demo/report workflows

Default admin credentials:

```text
Email: admin@erp.local
Password: admin123456
```

## Authentication and Authorization

Authentication uses JWT issued after a successful login.

Flow:

1. Client posts credentials to `/api/auth/login`
2. Backend validates the email and password
3. Backend signs a JWT with a secure secret
4. Client stores the token locally
5. Protected requests include `Authorization: Bearer <token>`
6. Middleware verifies the token and loads the user profile
7. Route-level `authorize()` checks enforce permissions

Supported roles:

- Admin
- Manager
- Salesman
- Inventory Manager
- Accountant

## Main Features

### Core ERP modules

- Users and roles
- Categories
- Products
- Suppliers
- Customers
- Inventory and stock movements
- Purchases
- Sales and POS-like sales entry
- Payments
- Returns
- Dashboard analytics
- Reports

### Inventory and financial rules

- Negative quantity is rejected
- Insufficient stock blocks sales
- Product SKU and barcode collisions are rejected
- Selling price cannot be below cost price
- Sales and purchases use server-side totals rather than trusting frontend values
- Stock changes are tracked through an inventory transaction ledger

## API Overview

Key routes:

```text
/api/auth/login
/api/auth/register
/api/auth/me
/api/users
/api/categories
/api/products
/api/customers
/api/suppliers
/api/purchases
/api/sales
/api/payments
/api/returns
/api/inventory
/api/dashboard
/api/reports
```

## Main Workflows

### Purchase flow

- Supplier created
- Purchase record created
- Stock increased through inventory service
- Payment status tracked
- Dashboard and reports update from real data

### Sales flow

- Customer created
- Product validated against stock
- Sale total calculated on backend
- Stock decreased through inventory service
- Payment record stored
- Receipt details returned

### Inventory flow

- Inventory transactions record previous and new stock values
- Stock movements are used for reporting and reconciliation

### Dashboard and reports

- Real aggregation queries read from MongoDB collections
- Dashboard includes totals, low stock counts, sales, purchases, inventory value, and profit data

## Known Limitations

- MongoDB must be available and reachable for the backend to run successfully.
- A replica set is expected in the local Mongo configuration for transactions and consistency.
- This project is intentionally a JavaScript MERN ERP rather than a TypeScript/Next.js rewrite.
- Some features are presentation-ready but not a full enterprise suite beyond the implemented modules.
- Production hardening should include external secret management, CI, and more exhaustive QA in a live deployment environment.

## Final Notes

This ERP is intended to be stable, modular, and presentation-ready for a business workflow demo. It preserves the layered backend architecture and keeps business-critical calculations on the server side to avoid trust issues from client-side inputs.

## API Response Standard

Success response:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Meaningful error message",
  "errors": []
}
```

## Notes
This increment is intentionally limited to the foundation of the ERP system. Future increments will add the actual ERP modules and business features in a disciplined, modular way.
