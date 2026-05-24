# shopZone Cosmetics — Full-Stack MERN E-Commerce

A modern, scalable e-commerce platform built with the MERN stack.

## Tech Stack

**Frontend:** React 19, Vite, Tailwind CSS v4, Redux Toolkit, React Router v6, Framer Motion, Recharts, React Hook Form + Zod, Axios, Lucide React

**Backend:** Node.js, Express.js, MongoDB + Mongoose, JWT Auth, Multer + Cloudinary, Stripe, Nodemailer, PDFKit

---

## Project Structure

```
├── client/          # React frontend (Vite)
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route pages
│       ├── redux/        # Redux store + slices
│       ├── services/     # Axios API service
│       ├── routes/       # Route guards
│       └── lib/          # Utilities
│
└── server/          # Express backend
    ├── controllers/ # Route handlers
    ├── models/      # Mongoose models
    ├── routes/      # Express routes
    ├── middleware/  # Auth, error handling
    ├── config/      # DB, Cloudinary
    └── utils/       # Helpers (JWT, email, PDF)
```

---

## Setup

### 1. Backend

```bash
cd server
cp .env.example .env
# Fill in your credentials in .env
npm install
npm run dev
```

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

---

## Environment Variables (server/.env)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `CLOUDINARY_*` | Cloudinary credentials for image uploads |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments |
| `EMAIL_*` | SMTP credentials for email notifications |
| `CLIENT_URL` | Frontend URL (for CORS) |

---

## User Roles

| Role | Access |
|---|---|
| **Customer** | Browse, cart, checkout, orders, reviews, wishlist |
| **Seller** | Product management, order fulfillment, analytics |
| **Admin** | Full platform management, user/seller moderation |
| **Super Admin** | Admin management, audit logs, system settings |

---

## API Endpoints

| Resource | Base Path |
|---|---|
| Auth | `/api/auth` |
| Products | `/api/products` |
| Orders | `/api/orders` |
| Cart | `/api/cart` |
| Wishlist | `/api/wishlist` |
| Reviews | `/api/reviews` |
| Categories | `/api/categories` |
| Sellers | `/api/sellers` |
| Coupons | `/api/coupons` |
| Payments | `/api/payments` |
| Admin | `/api/admin` |
| Analytics | `/api/analytics` |

---

## Features

- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (Customer / Seller / Admin / Super Admin)
- ✅ Product search, filter, sort, pagination
- ✅ Shopping cart with coupon support
- ✅ Wishlist
- ✅ Stripe payment integration
- ✅ Cash on delivery
- ✅ Order tracking with status history
- ✅ PDF invoice download
- ✅ Email notifications (order confirmation, shipping)
- ✅ Seller dashboard with analytics
- ✅ Admin dashboard with charts (Recharts)
- ✅ Dark/light mode
- ✅ Responsive mobile-first design
- ✅ Skeleton loading states
- ✅ Cloudinary image uploads
- ✅ Audit logs (Super Admin)
- ✅ Low stock alerts
- ✅ Coupon management
