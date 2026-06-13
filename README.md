# The Atelier - Next.js E-Commerce Platform

A luxury fashion e-commerce platform built with Next.js 14, MongoDB Atlas, and TypeScript. This project converts the original HTML/Tailwind design system into a fully functional, production-ready web application.

## 🌟 Features

- **Modern Tech Stack**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JWT-based auth with bcrypt password hashing
- **State Management**: Zustand for global state
- **API**: RESTful API with Next.js App Router
- **Admin Dashboard**: Complete admin panel for product and order management
- **Design System**: Luxury minimalist aesthetic with custom Tailwind config
- **Responsive**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript support throughout

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB Atlas account (free tier available)
- Modern browser for development

## 🚀 Quick Start

### 1. Installation

```bash
# Navigate to the project
cd nextjs-app

# Install dependencies
npm install
# or
yarn install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/the-atelier?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_SECRET=your-very-secure-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Optional: Payment Gateway (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier)
4. Create a database user
5. Get your connection string
6. Replace `username:password` in your `.env.local`

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── products/      # Product endpoints
│   │   ├── cart/          # Cart management
│   │   ├── orders/        # Order management
│   │   └── users/         # User profile
│   ├── admin/             # Admin dashboard pages
│   ├── collections/       # Product listing
│   ├── products/          # Product detail pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout page
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable React components
├── lib/                   # Utility functions
│   ├── mongodb.ts         # MongoDB connection
│   ├── auth.ts            # Authentication utilities
│   ├── api.ts             # API response utilities
│   └── response.ts        # Response helpers
├── models/                # MongoDB Schemas
│   ├── User.ts
│   ├── Product.ts
│   ├── Cart.ts
│   ├── Order.ts
│   └── Review.ts
├── hooks/                 # Custom React hooks & Zustand stores
│   ├── useAuth.ts         # Auth store
│   └── useCart.ts         # Cart store
├── types/                 # TypeScript type definitions
│   ├── auth.ts
│   └── index.ts
├── styles/                # Global styles
│   └── globals.css        # Design system & utilities
└── utils/                 # Helper functions
```

## 🗄️ Database Models

### User
- Email, password (hashed)
- Profile information (firstName, lastName, phone)
- Addresses (shipping & billing)
- Wishlist
- Role (customer, admin)

### Product
- Name, description, price
- Collection & category
- Images, materials
- Sizes & colors with stock
- Rating & reviews
- Featured flag

### Cart
- User ID reference
- Array of cart items
- Total price

### Order
- User ID reference
- Items ordered
- Addresses (shipping & billing)
- Payment & order status
- Tracking information

### Review
- Product rating (1-5)
- Title & comment
- Verified purchase flag

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/[id]` - Get product details

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart` - Update cart item
- `DELETE /api/cart` - Clear cart

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get order details

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

## 🎨 Design System

The project implements the "Digital Atelier" design system with:

- **Color Palette**: Monochrome base with forest green accents
- **Typography**: Noto Serif (headlines), Manrope (body)
- **Spacing**: Whitespace-driven layouts
- **Components**: Sharp edges (0px radius), no hard borders
- **Elevation**: Tonal layering instead of shadows

### Custom Tailwind Classes

```css
/* Buttons */
.btn-primary      /* Primary action button */
.btn-secondary    /* Secondary button */
.btn-ghost        /* Ghost/text button */

/* Typography */
.text-display-lg   /* Large display text */
.text-headline     /* Section headlines */
.text-title        /* Component titles */
.text-label        /* Labels & metadata */

/* Layout */
.container-base    /* Max-width container with padding */
.glass             /* Glass effect for headers */
.divider-soft      /* Tonal divider */

/* Effects */
.gradient-premium  /* Premium gradient */
.hover-lift        /* Hover scale effect */
.transition-smooth /* Smooth transition */
```

## 🔐 Authentication Flow

1. User signs up/logs in with email and password
2. Password is hashed with bcrypt
3. JWT token generated for session
4. Token stored in localStorage (with Zustand)
5. Token included in Authorization header for API requests
6. Middleware validates token on protected routes

## 🛒 Shopping Flow

1. Browse products on collections page
2. Add items to cart (with size & color selection)
3. View cart with totals
4. Proceed to checkout
5. Enter shipping & billing addresses
6. Review order
7. Submit order (payment ready for integration)
8. Order confirmation with tracking

## 📊 Admin Features

- Dashboard with KPIs and charts
- Product management (CRUD)
- Order management with status updates
- Customer management
- Analytics and reporting
- Settings

## 🔌 Integration Points

### Ready for Payment Gateway

```typescript
// Example: Stripe integration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const paymentIntent = await stripe.paymentIntents.create({
  amount: order.totalPrice * 100,
  currency: 'usd',
});
```

### Ready for Email Service

```typescript
// Example: SendGrid or Resend
await sendOrderConfirmationEmail(user.email, order);
```

### Ready for Image Upload

```typescript
// Example: Cloudinary or AWS S3
const imageUrl = await uploadImage(file);
```

## 📚 Additional Pages to Build

The following pages are ready for content integration:

- `/new-arrivals` - New arrivals page
- `/archive` - Archived collections
- `/journal` - Blog/journal section
- `/account` - User account page
- `/orders` - Order history
- `/wishlist` - Saved items
- `/admin/orders` - Order management
- `/admin/customers` - Customer management
- `/admin/analytics` - Analytics dashboard
- `/admin/settings` - Admin settings

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables on Vercel

Add the following to your Vercel project settings:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (production URL)
- Any other API keys

### Docker (Alternative)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 📝 Development Guidelines

### Adding a New Page

1. Create file in `src/app/[page]/page.tsx`
2. Follow the design system
3. Use custom Tailwind classes
4. Ensure responsive design

### Adding a New API Route

1. Create file in `src/app/api/[endpoint]/route.ts`
2. Import `connectDB()` and models
3. Use response helpers
4. Add authentication if needed

### Adding a New Model

1. Create schema in `src/models/[Model].ts`
2. Export TypeScript interface
3. Use in API routes
4. Update types in `src/types/`

## 🧪 Testing Credentials

For testing without real payments:

```
Email: test@example.com
Password: Test@12345
```

Note: Create test accounts through the signup page in development.

## 📖 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [Zustand](https://github.com/pmndrs/zustand)

## 🐛 Troubleshooting

### MongoDB Connection Error
- Verify MongoDB URI in `.env.local`
- Check IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for dev)
- Ensure database exists

### Auth Token Issues
- Clear localStorage and retry login
- Verify `NEXTAUTH_SECRET` is set
- Check token expiration in `lib/auth.ts`

### Styling Issues
- Run `npm run dev` to rebuild Tailwind
- Check Tailwind config in `tailwind.config.ts`
- Ensure CSS is imported in `app/layout.tsx`

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format
```

## 📄 License

This project is part of "The Atelier" e-commerce platform. All rights reserved.

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check MongoDB and Next.js docs
4. Create GitHub issues

## 🎯 Next Steps

1. ✅ Set up MongoDB Atlas
2. ✅ Configure environment variables
3. ✅ Run `npm install`
4. ✅ Start dev server with `npm run dev`
5. ⚠️ Seed sample data (optional)
6. ⚠️ Integrate payment gateway
7. ⚠️ Set up email service
8. ⚠️ Deploy to production

Happy coding! 🚀
