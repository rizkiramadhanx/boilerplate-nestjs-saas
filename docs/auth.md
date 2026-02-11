# 🔐 Auth API Documentation

**Base URL:** `/auth`

Module autentikasi untuk login, register, dan manajemen token.

---

## 📌 Register User

**POST** `/auth/register`

### Request Body

```json
{
  "email": "user@example.com",
  "username": "username123",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
  "role_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

### Response

```json
{
  "status": 200,
  "message": "register user succes"
}
```

---

## 📌 Login User

**POST** `/auth/login`

### Request Body

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### Response

```json
{
  "status": 200,
  "message": "Login Success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** Refresh token akan disimpan dalam HTTP-only cookie.

---

## 📌 Refresh Token

**POST** `/auth/refresh`

### Headers

```
Cookie: refresh_token=<refresh_token>
```

### Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📌 Logout User

**POST** `/auth/logout`

### Headers

```
Authorization: Bearer <access_token>
```

### Response

```json
{
  "status": 200,
  "message": "Logged out successfully"
}
```

---

## 📌 Get User Profile

**GET** `/auth/profile`

### Headers

```
Authorization: Bearer <access_token>
```

### Response

```json
{
  "status": 200,
  "message": "Get profile success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "username123",
    "isConfirmed": true,
    "outlet": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Outlet Gaming"
    },
    "role": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "admin",
      "isAdmin": true
    },
    "createdAt": "2025-09-19T08:26:46.000Z",
    "updatedAt": "2025-09-19T08:26:46.000Z"
  }
}
```

---

## 📌 Verify Email

**POST** `/auth/verify`

### Request Body

```json
{
  "token": "verification_token_from_email"
}
```

### Response

```json
{
  "status": 200,
  "message": "succes verified email"
}
```

---

## 📌 Resend Verification Email

**POST** `/auth/resend/verify`

### Headers

```
Authorization: Bearer <access_token>
```

### Response

```json
{
  "status": 200,
  "message": "Verification email sent"
}
```

---

## 🛡️ Auth & Middleware

- **Register & Login**: Tidak memerlukan autentikasi
- **Refresh Token**: Memerlukan refresh token dalam cookie
- **Profile, Logout, Resend Verify**: Memerlukan JWT Bearer Token

---

## ⚠️ Error Responses

### Unauthorized (401)

```json
{
  "status": 401,
  "message": "Invalid credentials"
}
```

### Conflict (409)

```json
{
  "status": 409,
  "message": "User with this email already exists"
}
```

### Bad Request (400)

```json
{
  "status": 400,
  "message": "Invalid verification token"
}
```

---

## 📋 Business Rules

1. **Email Uniqueness**: Email harus unik dalam sistem
2. **Password Strength**: Password minimal 8 karakter dengan kombinasi huruf, angka, dan simbol
3. **Email Verification**: User harus verifikasi email sebelum dapat login
4. **Token Expiry**:
   - Access token: 15 menit
   - Refresh token: 3 hari
5. **Outlet Assignment**: User harus terdaftar ke outlet saat register
