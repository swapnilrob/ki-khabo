<div align="center">

# Ki Khabo

### AI-Powered Smart Food Platform

A full-stack web application that connects users with restaurants, enables healthier food choices through AI-driven nutrition tracking, and delivers personalized meal recommendations — all in one place.

**CSE471: System Analysis and Design · Group 11 · Section 02 · Summer 2026**\
**BRAC University**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Express](https://img.shields.io/badge/Express.js-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-Academic-blue)]()

[Live Demo](https://ki-khabo.vercel.app) · [API Endpoint](https://kikhabo-api.onrender.com/api/health)

</div>

> **Note:** The backend is hosted on Render's free tier and spins down after 15 minutes of inactivity. If the first page load feels slow, give it about 30–50 seconds to wake up — subsequent requests will be instant.

---

## Overview

Ki Khabo is a comprehensive food discovery and ordering platform built for the Dhaka food scene. It manages three distinct user roles — **Regular Users** (food seekers), **Restaurant Owners**, and **Administrators** — and facilitates seamless restaurant discovery, food-specific ratings and reviews, AI-driven nutrition tracking, smart meal planning, and a loyalty reward system.

### Key Highlights

- **Restaurant Discovery** with interactive Google Maps integration, smart filters, and nearby restaurant search
- **AI Nutrition Assistant** powered by OpenAI for personalized diet advice and food image recognition
- **Smart Meal Planner** that builds weekly plans aligned with dietary goals and budget
- **Food-Specific Reviews** — rate individual dishes, not just restaurants
- **Premium Subscription** with bKash/SSLCommerz payment integration
- **Admin Verification Pipeline** — restaurant applications are reviewed before going live

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 (Vite), React Router, Axios |
| **Backend** | Express.js, Node.js 18+ |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Auth** | JWT (JSON Web Tokens), bcrypt |
| **External APIs** | OpenAI, Google Maps, NodeMailer, bKash / SSLCommerz |
| **Deployment** | Render (API), Vercel (Client) |

---

## User Roles

| Role | Capabilities |
|---|---|
| **User** (Food Seeker) | Search restaurants, browse menus with nutritional info, book tables, write reviews, track nutrition, access AI assistant (premium) |
| **Restaurant Owner** | Manage restaurant profile & menu, respond to reviews, view order/booking analytics |
| **Admin** | Verify restaurant registrations, moderate reviews, manage subscription pricing & reward rates, platform analytics |

---

## Features

### Common Workflows
- **Registration & Login** — JWT-based auth with role detection; multi-step owner registration with business verification
- **Admin Verification** — Restaurants must be approved before appearing in public search; admin can deactivate rule-violating profiles

### Module 1 — Discovery & Profiles
- Interactive map-based restaurant search with filters (cuisine, price, rating, dietary options)
- Detailed restaurant profiles with full menu and per-dish nutritional breakdown
- User dietary preferences & allergy flags that filter unsafe menu items platform-wide
- Food-specific star ratings and written reviews with owner responses

### Module 2 — Intelligence & Community
- Personal health dashboard with daily calorie tracking and weekly progress charts
- Personalized recommendation engine based on order history, preferences, and time of day
- Smart meal planner with budget and macro enforcement
- Social features: follow friends, save dishes, create and discover public food lists

### Module 3 — Premium & Operations
- AI diet assistant (OpenAI) with personalized meal suggestions from platform menus
- AI food image recognition for effortless calorie logging from photos
- Restaurant management dashboard with order analytics and menu CRUD
- Order & table booking system with real-time status notifications
- Email notifications (NodeMailer) for orders, bookings, and meal plan reminders
- Premium subscription via bKash/SSLCommerz (200 BDT/month or 2,000 BDT/year)
- Loyalty reward points redeemable as subscription discounts

---

## Project Structure

```
ki-khabo/
├── client/                          # React frontend (Vite)
│   ├── src/
│   │   ├── api/                     # Axios instance & interceptors
│   │   ├── components/              # Reusable UI components
│   │   │   └── ui/                  # Design system (Card, Badge, StarRating, etc.)
│   │   ├── context/                 # AuthContext (global auth state)
│   │   ├── pages/                   # Route-level page components
│   │   └── App.jsx                  # Route definitions
│   ├── .env                         # VITE_API_URL (not committed)
│   └── package.json
│
├── server/                          # Express backend
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/                 # Route handlers
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   └── restaurantController.js
│   ├── middleware/
│   │   ├── authMiddleware.js        # protect & authorize
│   │   └── errorMiddleware.js       # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Restaurant.js
│   │   └── Settings.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   └── restaurantRoutes.js
│   ├── seed/
│   │   └── createAdmin.js           # Admin account seeder
│   ├── utils/
│   │   └── generateToken.js
│   ├── .env                         # Secrets (not committed)
│   ├── .env.example                 # Template for teammates
│   ├── package.json
│   └── server.js                    # Entry point
│
├── .gitignore
└── README.md
```

---

## Local Development

Follow these steps to run the project on your own machine.

### Prerequisites

- [Node.js 18+](https://nodejs.org/) (LTS recommended)
- [Git](https://git-scm.com/)
- A [MongoDB Atlas](https://cloud.mongodb.com/) cluster (free M0 tier works)
- [Postman](https://www.postman.com/) or similar API client (optional, for testing)

### 1. Clone the repository

```bash
git clone https://github.com/swapnilrob/ki-khabo.git
cd ki-khabo
```

### 2. Backend

```bash
cd server
npm install
```

Create `server/.env` by copying the template and filling in your values:

```bash
cp .env.example .env
```

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/kikhabo?retryWrites=true&w=majority
JWT_SECRET=<a-long-random-string-at-least-32-chars>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@kikhabo.com
ADMIN_PASSWORD=<choose-a-strong-password>
```

Seed the admin account and start the server:

```bash
npm run seed:admin
npm run dev
```

The API will be available at `http://localhost:5000`.

### 3. Frontend

```bash
cd ../client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a food seeker account |
| `POST` | `/register-owner` | Public | Register a restaurant owner (creates a pending restaurant) |
| `POST` | `/login` | Public | Login for all roles |
| `GET` | `/me` | Private | Get current session |
| `PUT` | `/me` | Private | Update own profile |

### Admin — `/api/admin` *(all routes require admin role)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stats` | Platform overview (user counts, pending restaurants) |
| `GET` | `/restaurants?status=pending` | List restaurants, optionally filtered by status |
| `PATCH` | `/restaurants/:id/status` | Approve or reject a restaurant application |
| `PATCH` | `/restaurants/:id/toggle-active` | Deactivate / reactivate a restaurant |
| `GET` | `/users?role=user` | List accounts, optionally filtered by role |
| `PATCH` | `/users/:id/toggle-active` | Deactivate / reactivate a user account |
| `GET` | `/settings` | Read platform settings (pricing, reward rates) |
| `PUT` | `/settings` | Update platform settings |

### Restaurants — `/api/restaurants`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | List approved & active restaurants only |
| `GET` | `/my-restaurant` | Owner | Owner's own restaurant (any status) |

---

## Team & Module Assignments

| Member | Branch | Modules |
|---|---|---|
| Swapnil Rob | `feature/swapnil` | M1-2 Restaurant & Dish Profile · M2-3 Smart Meal Planner · M3-3 Restaurant Dashboard · M3-5 Notifications (NodeMailer) |
| Abdullah Al Noman | `feature/noman` | M1-1 Restaurant Discovery (Google Maps) · M2-2 Recommendation Engine · M3-4 Order & Booking · M3-8 Admin Dashboard |
| Md. Mostahid Hasan | `feature/mostahid` | M1-3 Profile & Dietary Prefs · M2-1 Health Dashboard · M3-1 AI Diet Assistant · M3-2 AI Image Recognition (OpenAI) |
| Md. Shakib-Al-Hossain | `feature/shakib` | M1-4 Ratings & Reviews · M2-4 Community · M3-6 Subscription (bKash/SSLCommerz) · M3-7 Reward Points |

### External API Ownership

| Member | API | Used In |
|---|---|---|
| Md. Mostahid Hasan | OpenAI API | AI Nutrition Assistant, Food Image Recognition |
| Abdullah Al Noman | Google Maps API | Restaurant Discovery & Map View |
| Swapnil Rob | Gmail API / NodeMailer | Notifications & Email Reminders |
| Md. Shakib-Al-Hossain | bKash / SSLCommerz | Subscription & Payment System |

---

## Branch Strategy

```
main                         ← Stable, demo-ready. Merges require a PR with approval.
 └── dev                     ← Integration branch. All features merge here first.
      ├── feature/swapnil
      ├── feature/noman
      ├── feature/mostahid
      └── feature/shakib
```

- **Never commit directly to `main`.**
- All work happens on `feature/*` branches, merged into `dev` via Pull Request.
- `dev` → `main` merges happen when a milestone is stable and tested.
- The common workflow (auth, admin panel, role-based routing) was built on `feature/common-workflow` and merged into `dev` before any individual work began.

---

## Deployment

| Service | Platform | URL |
|---|---|---|
| Backend API | [Render](https://render.com/) | `https://kikhabo-api.onrender.com` |
| Frontend | [Vercel](https://vercel.com/) | `https://ki-khabo.vercel.app` |

---

## License

This project was built as a course assignment for CSE471 at BRAC University and is intended for academic purposes.
