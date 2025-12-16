# Quick Start Guide - Authentication Integration

## 🚀 Quick Setup (5 minutes)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp example.env .env

# Edit .env and set:
# - MONGODB_URI (your MongoDB connection string)
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - JWT_REFRESH_SECRET (generate with: openssl rand -base64 32)
# - CORS_ORIGIN=http://localhost:3000

# Start backend
npm run dev
```

Backend runs on: `http://localhost:5000`

### 2. Frontend Setup

```bash
# From root directory

# Install dependencies (if not already done)
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > .env.local

# Start frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

### 3. Test It!

1. Open `http://localhost:3000/register`
2. Create an account
3. Check `localStorage` in browser DevTools → Application → Local Storage
4. You should see `accessToken` and `refreshToken`

---

## 📁 File Locations

### Backend `.env`
**Location**: `backend/.env`

Required variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT signing
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `CORS_ORIGIN` - Frontend URL (http://localhost:3000)

### Frontend `.env.local`
**Location**: `krishi/.env.local` (root directory)

Required variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL (http://localhost:5000/api/v1)

---

## 🔑 Key Features

✅ **POST /api/v1/auth/register** - User registration with username, email, password
✅ **POST /api/v1/auth/login** - User login with email and password
✅ **JWT Authentication** - Tokens stored in localStorage
✅ **bcrypt Password Hashing** - Secure password storage
✅ **CORS Configured** - Allows http://localhost:3000
✅ **Error Handling** - Proper validation and error messages
✅ **TypeScript** - Full type safety

---

## 🧪 Test Endpoints

### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","firstName":"Test","username":"testuser"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

---

## 📚 Full Documentation

See `AUTHENTICATION_INTEGRATION_GUIDE.md` for:
- Detailed CORS explanation
- Complete folder structure
- Troubleshooting guide
- Security best practices

---

## ⚠️ Common Issues

**CORS Error?**
- Check `CORS_ORIGIN` in `backend/.env` matches frontend URL exactly
- Restart backend after changing `.env`

**Connection Refused?**
- Verify backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`

**MongoDB Error?**
- Verify `MONGODB_URI` is correct
- Check MongoDB is running/accessible

---

**Need Help?** Check `AUTHENTICATION_INTEGRATION_GUIDE.md` for detailed troubleshooting.

