# User Panel - Complete Guide

## Overview

The User Panel provides a complete e-commerce experience for customers, allowing them to browse products, manage their cart, place orders, and track their order status.

## Features Implemented

### ✅ 1. Account Management

#### Registration
- **Page**: `/register`
- **Features**:
  - First name, last name, email, phone
  - Strong password validation (8+ chars, uppercase, lowercase, number, special char)
  - Password confirmation
  - Terms and conditions acceptance
  - Automatic login after registration

#### Login
- **Page**: `/login`
- **Features**:
  - Email and password authentication
  - Remember me option
  - Forgot password link
  - Automatic redirect if already logged in
  - Redirect to intended page after login

#### User Menu (Header)
- Shows user name and email when logged in
- Quick access to "My Orders"
- Logout functionality
- Login button when not authenticated

### ✅ 2. Product Browsing

- **Home Page**: Browse all products by category
- **Category Pages**: Filter products by category
- **Product Details**: View full product information
- **Search**: Search products (header search bar)

### ✅ 3. Shopping Cart

#### Cart Page (`/cart`)
- **Features**:
  - View all cart items
  - Update quantities
  - Remove items
  - Clear entire cart
  - View order summary with:
    - Subtotal
    - Delivery charges (FREE)
    - Total amount
  - Proceed to checkout button

#### Cart Integration
- **Local Storage**: Cart persists in browser
- **Backend Sync**: When logged in, cart syncs with backend
- **Cart Badge**: Shows item count in header

### ✅ 4. Order Placement

#### Checkout Process
1. **Shipping Address Form**:
   - Full name
   - Phone number
   - Email address
   - Complete address
   - City, State, PIN code
   - Auto-filled from user profile if logged in

2. **Payment Method Selection**:
   - **Cash on Delivery (COD)**
     - Pay when you receive
     - No additional charges
   - **UPI Payment**
     - Google Pay, PhonePe, Paytm
     - ₹30 discount on online payments
   - **Credit/Debit Card**
     - Visa, MasterCard, RuPay
     - ₹30 discount on online payments

3. **Order Summary**:
   - Itemized list
   - Subtotal
   - Delivery charges
   - Discounts (if applicable)
   - Final total

4. **Order Confirmation**:
   - Order number
   - Payment method
   - Total amount
   - Delivery timeline
   - Links to view orders or continue shopping

### ✅ 5. Order Tracking

#### Order Status Flow
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
```

#### Order Tracking Features
- **Visual Timeline**: Shows current order status with icons
- **Status Badges**: Color-coded status indicators
- **Timestamps**: Shows when each status was reached
- **Tracking Information**: 
  - Tracking number (when shipped)
  - Carrier name
  - Shipping date

#### Order Detail Page (`/my-orders/[id]`)
- Complete order information
- Order items with images
- Shipping address
- Payment information
- Order timeline visualization
- Tracking details (if shipped)

### ✅ 6. Order History

#### My Orders Page (`/my-orders`)
- **Features**:
  - List all orders
  - Order statistics cards:
    - Total orders
    - Pending orders
    - Delivered orders
    - Cancelled orders
  - Filter by status:
    - All Orders
    - Pending
    - Confirmed
    - Processing
    - Shipped
    - Out for Delivery
    - Delivered
    - Cancelled
  - Search by order number
  - Pagination support
  - Click to view order details

### ✅ 7. Order Cancellation

#### Cancellation Rules
- Can cancel orders with status: **PENDING**, **CONFIRMED**, or **PROCESSING**
- Cannot cancel once order is **SHIPPED** or later
- Requires cancellation reason

#### Cancellation Process
1. Go to order details page
2. Click "Cancel Order" button (only visible if cancellable)
3. Enter cancellation reason
4. Confirm cancellation
5. Order status updates to **CANCELLED**

## User Flow

### Complete Shopping Flow

1. **Browse Products**
   ```
   Home → Category → Product Details
   ```

2. **Add to Cart**
   ```
   Product Card → Add to Cart → Cart Page
   ```

3. **Checkout**
   ```
   Cart → Proceed to Checkout → 
   Fill Shipping Address → 
   Select Payment Method → 
   Place Order
   ```

4. **Order Confirmation**
   ```
   Order Success → View My Orders → Order Details
   ```

5. **Track Order**
   ```
   My Orders → Order Details → 
   View Timeline → Track Status
   ```

6. **Cancel Order** (if needed)
   ```
   My Orders → Order Details → 
   Cancel Order → Enter Reason → Confirm
   ```

## Authentication Flow

### Registration
1. Navigate to `/register`
2. Fill registration form
3. Submit → Auto-login → Redirect to home

### Login
1. Navigate to `/login`
2. Enter credentials
3. Submit → Redirect to home (or intended page)

### Logout
1. Click user menu in header
2. Click "Logout"
3. Redirect to home

## Payment Methods

### Cash on Delivery (COD)
- **When**: Order placed
- **Payment**: Upon delivery
- **Charges**: No additional charges
- **Note**: Keep exact amount ready

### UPI Payment
- **Methods**: Google Pay, PhonePe, Paytm, etc.
- **Discount**: ₹30 off
- **Processing**: Instant

### Credit/Debit Card
- **Cards**: Visa, MasterCard, RuPay
- **Discount**: ₹30 off
- **Processing**: Secure payment gateway

## Order Status Meanings

| Status | Description | Can Cancel? |
|--------|-------------|-------------|
| PENDING | Order placed, awaiting confirmation | ✅ Yes |
| CONFIRMED | Order confirmed by seller | ✅ Yes |
| PROCESSING | Order being prepared | ✅ Yes |
| SHIPPED | Order shipped with tracking | ❌ No |
| OUT_FOR_DELIVERY | On the way to delivery address | ❌ No |
| DELIVERED | Successfully delivered | ❌ No |
| CANCELLED | Order cancelled by customer | ❌ No |
| RETURNED | Order returned | ❌ No |
| REFUNDED | Payment refunded | ❌ No |

## API Integration

### Authentication APIs
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user

### Cart APIs
- `GET /api/v1/cart` - Get cart
- `POST /api/v1/cart/items` - Add to cart
- `PUT /api/v1/cart/items/:productId` - Update cart item
- `DELETE /api/v1/cart/items/:productId` - Remove from cart
- `DELETE /api/v1/cart` - Clear cart

### Order APIs
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/my-orders` - Get user orders
- `GET /api/v1/orders/my-orders/:id` - Get order details
- `POST /api/v1/orders/:id/cancel` - Cancel order

## Security Features

1. **Password Security**:
   - Bcrypt hashing
   - Strong password requirements
   - Password validation

2. **Authentication**:
   - JWT tokens
   - httpOnly cookies
   - Token refresh

3. **Authorization**:
   - User can only view their own orders
   - Order cancellation restrictions
   - Protected routes

## Responsive Design

All pages are fully responsive:
- **Mobile**: Optimized for small screens
- **Tablet**: Medium screen layouts
- **Desktop**: Full feature layouts

## Error Handling

- Network errors
- Authentication errors
- Validation errors
- User-friendly error messages
- Retry options

## Next Steps for Users

1. **Create Account**: Register at `/register`
2. **Browse Products**: Explore categories on home page
3. **Add to Cart**: Click "Add to Cart" on any product
4. **Checkout**: Go to cart and proceed to checkout
5. **Place Order**: Fill address, select payment, place order
6. **Track Order**: View orders at `/my-orders`
7. **Cancel if Needed**: Cancel before shipping if required

## Support

For issues:
- Check authentication status
- Verify cart items
- Check order status
- Contact support if needed

