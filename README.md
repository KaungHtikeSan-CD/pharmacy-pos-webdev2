# Pharmacy POS System

Web Development Project 2

## Team Members

- Kaung Htike San - GitHub: https://github.com/KaungHtikeSan-CD
- Oak Soe Khant - GitHub: https://github.com/Calyx4u
- Phyo Min Khaing - GitHub: https://github.com/PMTheNight

## Project Description

Pharmacy POS System is a web application for small and mid-range pharmacy operations. The system will help pharmacy staff manage medicine stock, record wholesale orders, confirm arrived products, process POS sales, and review purchase history.

The project is built with Next.js, MongoDB, and REST API routes. It includes CRUD operations for three main data models: Product/Stock, Order, and Sale/Purchase.

## Planned Technology Stack

- Next.js
- MongoDB
- REST API routes
- GitHub
- VM deployment

## Main Data Models

- Product / Stock
- Order
- Sale / Purchase

## Project Status

Core project features are implemented:

- Dashboard summary with stock, order, sales, and top-selling product data
- Product/Stock CRUD with search and low stock monitoring
- Order CRUD with manual arrived confirmation
- POS checkout by product code or barcode
- Purchase history list with delete support
- MongoDB-backed REST API routes for Product, Order, and Sale data

## Main Pages

- `/` - Dashboard
- `/stock` - Product and stock management
- `/orders` - Wholesale order management
- `/pos` - POS checkout
- `/purchase-history` - Completed sales history

## REST API Routes

- `GET /api/products` - list products
- `POST /api/products` - create product
- `GET /api/products/:productId` - get product detail
- `PATCH /api/products/:productId` - update product
- `DELETE /api/products/:productId` - delete product
- `GET /api/orders` - list orders
- `POST /api/orders` - create order
- `GET /api/orders/:orderId` - get order detail
- `PATCH /api/orders/:orderId` - update order or mark arrived
- `DELETE /api/orders/:orderId` - delete order
- `GET /api/sales` - list sales
- `POST /api/sales` - create sale checkout
- `GET /api/sales/:saleId` - get sale detail
- `PATCH /api/sales/:saleId` - update sale
- `DELETE /api/sales/:saleId` - delete sale

## Local Setup

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` from `.env.example` and update the MongoDB connection if needed.
4. Run the development server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Work Plan

- Kaung Htike San: project setup and Product/Stock module
- Oak Soe Khant: Order Management module
- Phyo Min Khaing: POS Sale, Purchase History, and Dashboard data

## Screenshots

Add final screenshots before submission:

- Dashboard page
- Stock management page
- Order management page
- POS checkout page
- Purchase history page
