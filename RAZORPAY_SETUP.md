# Razorpay Payment Integration Setup

## Overview

The payment integration is now complete for processing $1 payments using Razorpay. The checkout page is available at `/checkout`.

## Environment Variables Required

### Server (.env)

Add these to your Render backend environment variables:

```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Getting Razorpay Credentials

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Sign up or log in
3. Navigate to **Settings → API Keys**
4. Copy your **Key ID** and **Key Secret**
5. Add them to your Render environment variables

## How It Works

### Frontend Flow

1. User navigates to `/checkout` (protected route)
2. Clicks "Pay Now" button
3. Razorpay checkout modal opens
4. User enters payment details
5. Payment is processed
6. Backend verifies signature
7. Redirect to dashboard on success

### Backend Flow

1. **POST /api/payment/create-order** - Creates order in Razorpay
   - Converts $1 to ₹100 INR (hardcoded amount)
   - Returns order ID and Razorpay key

2. **POST /api/payment/verify-payment** - Verifies payment signature
   - Validates signature using secret key
   - Confirms payment status with Razorpay
   - Updates user premium status

3. **GET /api/payment/payment-status/:paymentId** - Checks payment status

## Files Created

### Backend

- `server/controllers/paymentController.js` - Payment logic (create order, verify)
- `server/routes/paymentRoutes.js` - Payment API routes

### Frontend

- `client/src/pages/Checkout.jsx` - Checkout page component
- `client/src/styles/Checkout.css` - Checkout styling
- Updated `client/src/services/api.js` - Added payment API calls
- Updated `client/src/App.jsx` - Added checkout route

## Payment Amount

Currently set to **₹100 INR** (~$1 USD)

To change the amount:

1. Edit `client/src/pages/Checkout.jsx` - Update the `amount` in `handlePayment()` call
2. Edit `server/controllers/paymentController.js` - Update `amount` default value
3. Update the display prices in Checkout component

## Testing

Use Razorpay test cards:

- **Card**: 4111 1111 1111 1111
- **Expiry**: Any future date
- **CVV**: Any 3 digits
- **OTP**: Any value

## Features Included

✓ Secure payment processing via Razorpay
✓ Signature verification for fraud prevention
✓ Order creation and tracking
✓ Payment status checking
✓ Premium user tracking via localStorage
✓ Beautiful, responsive checkout UI
✓ Error handling and user feedback

## Next Steps

1. Add Razorpay credentials to Render environment
2. Test the payment flow
3. Monitor payment logs in Razorpay dashboard
4. Implement premium feature gates based on `lex_premium` localStorage flag
