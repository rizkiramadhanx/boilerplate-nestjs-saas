# 👥 Users API Documentation

**Base URL:** `/user`

Semua endpoint di bawah ini **memerlukan autentikasi JWT** dan akses module `user`.

---

## 📌 Create User

**POST** `/user`

### Request Body

| Field             | Type   | Required | Description                   |
| ----------------- | ------ | -------- | ----------------------------- |
| `name`            | string | ✅       | Nama lengkap user             |
| `email`           | string | ✅       | Email unik user               |
| `password`        | string | ✅       | Password minimal 8 karakter   |
| `confirmPassword` | string | ✅       | Konfirmasi password           |
| `outlet_id`       | UUID   | ✅       | ID outlet tempat user bekerja |
| `role_id`         | UUID   | ❌       | ID role user (optional)       |
| `picture`         | string | ❌       | URL foto profil (optional)    |

```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "picture": "https://example.com/new-avatar.jpg",
  "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
  "role_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

### Response

```json
{
  "status": 201,
  "message": "User created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "New User",
    "email": "newuser@example.com",
    "isConfirmed": false,
    "picture": "https://example.com/new-avatar.jpg",
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "role_id": "550e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2025-09-19T08:26:46.000Z",
    "updatedAt": "2025-09-19T08:26:46.000Z"
  }
}
```

---

## 📌 Get All Users (Pagination + Search)

**GET** `/user`

### Query Parameters

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| `page`    | int    | Page number (default: 1)     |
| `limit`   | int    | Items per page (default: 10) |
| `keyword` | string | Search by name (optional)    |

### Example

```
GET /user?page=1&limit=5&keyword=admin
```

### Response

```json
{
  "status": 200,
  "message": "Get All user success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Admin User",
      "email": "admin@example.com",
      "isConfirmed": true,
      "picture": "https://example.com/avatar.jpg",
      "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
      "role_id": "550e8400-e29b-41d4-a716-446655440001",
      "createdAt": "2025-09-19T08:26:46.000Z",
      "updatedAt": "2025-09-19T08:26:46.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "total_page": 1
  }
}
```

---

## 📌 Get User by ID

**GET** `/user/:id`

### Example

```
GET /user/550e8400-e29b-41d4-a716-446655440001
```

### Response

```json
{
  "status": 200,
  "message": "Get user success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Admin User",
    "email": "admin@example.com",
    "isConfirmed": true,
    "picture": "https://example.com/avatar.jpg",
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "role_id": "550e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2025-09-19T08:26:46.000Z",
    "updatedAt": "2025-09-19T08:26:46.000Z"
  }
}
```

### Error (Not Found)

```json
{
  "status": 404,
  "message": "User not found"
}
```

---

## 📌 Update User

**PUT** `/user/:id`

### Request Body

| Field       | Type   | Required | Description                   |
| ----------- | ------ | -------- | ----------------------------- |
| `name`      | string | ❌       | Nama lengkap user             |
| `email`     | string | ❌       | Email unik user               |
| `password`  | string | ❌       | Password minimal 8 karakter   |
| `outlet_id` | UUID   | ❌       | ID outlet tempat user bekerja |
| `role_id`   | UUID   | ❌       | ID role user                  |
| `picture`   | string | ❌       | URL foto profil               |

```json
{
  "name": "Updated User",
  "email": "updated@example.com",
  "password": "NewPassword123!",
  "picture": "https://example.com/updated-avatar.jpg",
  "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
  "role_id": "550e8400-e29b-41d4-a716-446655440002"
}
```

### Response

```json
{
  "status": 200,
  "message": "User updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Updated User",
    "email": "updated@example.com",
    "isConfirmed": true,
    "picture": "https://example.com/updated-avatar.jpg",
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "role_id": "550e8400-e29b-41d4-a716-446655440002",
    "createdAt": "2025-09-19T08:26:46.000Z",
    "updatedAt": "2025-09-19T08:30:46.000Z"
  }
}
```

---

## 📌 Delete User

**DELETE** `/user/:id`

### Example

```
DELETE /user/550e8400-e29b-41d4-a716-446655440001
```

### Response

```json
{
  "status": 200,
  "message": "User deleted successfully"
}
```

### Error (Not Found)

```json
{
  "message": "User not found"
}
```

---

## 🛡️ Auth & Middleware

Semua endpoint di atas:

- **Memerlukan JWT Bearer Token** melalui header:

  ```
  Authorization: Bearer <token>
  ```

- **Dibatasi oleh middleware akses modul**:

  ```
  middleware.RequireModuleAccess("user")
  ```

---

## 🔐 Permissions Required

| Endpoint           | Permission Required |
| ------------------ | ------------------- |
| `GET /user`        | `user:read`         |
| `GET /user/:id`    | `user:read`         |
| `POST /user`       | `user:create`       |
| `PUT /user/:id`    | `user:update`       |
| `DELETE /user/:id` | `user:delete`       |

---

## 📋 Business Rules

1. **Email Uniqueness**: Email harus unik dalam sistem
2. **Outlet Access Control**:
   - Admin dapat mengelola users di semua outlet
   - User biasa hanya dapat mengelola users di outlet mereka
3. **Password Hashing**: Password akan di-hash sebelum disimpan
4. **Email Verification**: User baru perlu verifikasi email
5. **Optional Fields**:
   - `picture` adalah field optional yang bisa dikosongkan
   - Field `name` wajib diisi saat create user

---

## ⚠️ Error Responses

### Conflict (409)

```json
{
  "status": 409,
  "message": "User with this email already exists"
}
```

### Forbidden (403)

```json
{
  "status": 403,
  "message": "You can only create users in your outlet"
}
```

### Validation Error (400)

```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "email must be a valid email"
    },
    {
      "field": "password",
      "message": "password must be longer than or equal to 8 characters"
    }
  ]
}
```
