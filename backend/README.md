# Kuvaka Gemini-Style Backend

## Overview
A Node.js (Express + TypeScript) backend for user specific chatrooms, OTP-based login, Gemini API-powered AI conversations, and Stripe-based subscription management. Features JWT authentication, async queueing, rate limiting, and robust modular architecture.

---

## Features
- OTP-based login (mobile only)
- JWT authentication
- Password reset (OTP)
- Chatroom management (CRUD, caching)
- Async Gemini API chat (BullMQ + Redis)
- Rate limiting for Basic users
- Stripe Pro subscription (Checkout, webhook)
- Modular, clean codebase

---

## Tech Stack
- Node.js, Express.js, TypeScript
- PostgreSQL (Prisma ORM)
- Redis (caching, rate limiting, queue)
- BullMQ (queue for Gemini API)
- Stripe (subscription/payments)
- Google Gemini API (AI chat)

---

## Setup & Installation

### 1. Clone the Repo
```bash
git clone https://github.com/raghuaanand/Gemini-Backend-Clone-Assignment.git
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in `/backend`:
```
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
```

### 4. Run Database Migrations
```bash
npx prisma migrate dev
```

### 5. Start Redis & PostgreSQL
Make sure both are running and accessible.

### 6. Start the Backend Server (BullMQ Worker will start simultaneously)
```bash
npx ts-node src/server.ts
```

### 8. (Optional) Start Stripe CLI for Webhooks
```bash
stripe listen --forward-to localhost:5000/webhook/stripe
```


---

## Architecture Overview
- **/src/controllers**: Route logic
- **/src/routes**: API endpoints
- **/src/models**: Prisma schema
- **/src/services**: Queue, Gemini API, etc.
- **/src/workers**: BullMQ worker for Gemini
- **/src/middlewares**: JWT, error handling
- **/prisma/schema.prisma**: DB models

---

## Queue System (BullMQ)
- User messages are queued for Gemini API processing.
- Worker fetches jobs, calls Gemini, stores AI response as a message.
- Scalable and reliable async processing.

---

## Gemini API Integration
- Uses Google Gemini API for AI chat responses.
- API key required in `.env`.
- All Gemini calls are async via queue.

---

## Stripe Integration
- Pro subscription via Stripe Checkout.
- Webhook updates user tier on payment/cancellation.
- Requires Stripe CLI for local webhook testing.

---

## Rate Limiting
- Basic users: 5 prompts/day (enforced via Redis)
- Pro users: unlimited

---

## Deployment
- Deployed to any public cloud (Render, Railway, Fly.io, EC2, etc.)
- Set environment variables in your cloud provider.
- Make sure PostgreSQL and Redis are accessible.
- Update `FRONTEND_URL` and `base_url` in Postman for your deployed backend.

---

## Assumptions & Design Decisions
- OTPs are returned in API responses (no SMS integration, for testing/demo)
- Stripe test mode used for all payments
- Prisma ORM for type safety and migrations
- BullMQ for scalable async processing
- Redis for caching, rate limiting, and queue

---

## How to Test
- Use Postman collection for all flows (auth, chatroom, messaging, subscription)
- JWT and chatroom IDs are managed via environment variables
- Stripe webhooks require Stripe CLI for local testing

---





