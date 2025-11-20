# FixedPronos Backend API

Backend API for FixedPronos VIP - A premium sports betting prediction platform.

## 🚀 Technologies

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** (Neon DB) - Database
- **Firebase Admin** - Authentication
- **Multer** - File uploads
- **Zod** - Schema validation

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── firebase.ts          # Firebase configuration
│   ├── middleware/
│   │   └── auth.ts              # Authentication middleware
│   ├── routes/
│   │   ├── admin.ts             # Admin panel routes
│   │   ├── auth.ts              # Authentication routes
│   │   ├── payments.ts          # Payment processing routes
│   │   ├── pronos.ts            # Pronos management routes
│   │   └── user.ts              # User profile routes
│   └── server.ts                # Main server file
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
├── uploads/                     # File uploads directory
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp env.example .env
   ```

   Configure your `.env` file:
   ```env
   DATABASE_URL="postgresql://username:password@hostname:5432/database"
   FIREBASE_PROJECT_ID=""
   FIREBASE_PRIVATE_KEY=""
   FIREBASE_CLIENT_EMAIL=""
   PORT=3001
   NODE_ENV="development"
   ADMIN_EMAIL="admin@fixedpronos.com"
   FRONTEND_URL="http://localhost:5173"
   UPLOAD_PATH="./uploads"
   ```

3. **Database setup:**
   ```bash
   # Generate Prisma client
   npm run generate

   # Run migrations
   npm run migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

### Users
- Firebase authentication integration
- Referral system (30% commission)
- Profile management

### Pronos
- Sports predictions with detailed analysis
- Publishing system for admin control
- Status tracking (pending/won/lost/void)

### Subscriptions
- Multiple plans (basic/premium/vip)
- Manual activation by admin
- Expiration tracking

### Payments
- Manual payment processing
- Support for crypto and mobile money
- Proof upload system
- Admin approval workflow

## 🔐 Authentication

Uses Firebase Authentication with custom claims for admin access.

### Admin Access
Set `ADMIN_EMAIL` in environment variables to grant admin access to `/admin/*` routes.

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `GET /auth/me` - Get current user profile
- `PUT /auth/profile` - Update user profile

### Pronos
- `GET /pronos` - Get pronos with pagination
- `GET /pronos/:id` - Get specific prono
- `GET /pronos/date/today` - Today's pronos
- `GET /pronos/date/yesterday` - Yesterday's pronos
- `GET /pronos/date/before-yesterday` - Before yesterday's pronos

### User
- `GET /user/profile` - User profile with subscription
- `GET /user/subscription/status` - Subscription status
- `GET /user/referral` - Referral information

### Payments
- `POST /payments/submit` - Submit payment request
- `GET /payments/history` - Payment history

### Admin Panel
- `GET /admin/dashboard` - Dashboard statistics
- `GET /admin/users` - User management
- `GET /admin/subscriptions` - Subscription management
- `POST /admin/subscriptions` - Create subscription
- `PUT /admin/subscriptions/:id` - Update subscription
- `GET /admin/pronos` - Prono management
- `POST /admin/pronos` - Create prono
- `PUT /admin/pronos/:id` - Update prono
- `DELETE /admin/pronos/:id` - Delete prono
- `GET /admin/payments/all` - All payments
- `PUT /admin/payments/:id/process` - Process payment

## 💰 Payment System

### Supported Methods
1. **Cryptocurrency**
   - Manual address submission
   - Transaction hash verification
   - Proof upload

2. **Mobile Money**
   - Orange Money, MTN, etc.
   - Phone number validation
   - Proof upload

### Admin Processing
- Review payment proofs
- Approve/reject payments
- Automatic subscription activation
- Commission calculation

## 🚀 Deployment

### Render Deployment

1. **Connect your repository**
2. **Set build command:**
   ```bash
   npm run build
   ```

3. **Set start command:**
   ```bash
   npm start
   ```

4. **Environment variables:**
   - Set all variables from `.env` in Render dashboard
   - Add `NODE_ENV=production`

5. **Database:**
   - Use Neon DB PostgreSQL
   - Update `DATABASE_URL` with production connection string

## 🔒 Security

- Firebase token verification
- Admin email validation
- File upload restrictions
- CORS configuration
- Helmet security headers

## 📊 Admin Panel Features

- **Dashboard:** User stats, payment overview
- **User Management:** View all users with subscription status
- **Subscription Management:** Manual activation/deactivation
- **Prono Management:** Create, edit, publish predictions
- **Payment Processing:** Review and approve manual payments

## 🎯 Business Logic

### Subscription Plans
- **Basic:** 30 days - €30
- **Premium:** 60 days - €50
- **VIP:** 90 days - €100

### Referral System
- 30% commission on referred user subscriptions
- Automatic calculation and tracking

### Payment Processing
- Manual review for all payments
- Proof verification required
- Automatic subscription activation on approval

## 🛠️ Development

### Scripts
- `npm run dev` - Development with hot reload
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run migrate` - Database migrations
- `npm run generate` - Generate Prisma client

### File Uploads
- Images stored in `/uploads` directory
- 5MB file size limit
- Image format validation (JPEG, PNG, GIF)

## 📝 Notes

- All dates are stored in UTC
- Firebase handles user authentication
- Admin routes require `ADMIN_EMAIL` environment variable
- File uploads are served statically from `/uploads` path
- CORS is configured for frontend URL
