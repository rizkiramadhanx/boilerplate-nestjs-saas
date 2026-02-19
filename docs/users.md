# 👤 User API Documentation

**Base URL:** `/user`

Semua endpoint memerlukan **autentikasi JWT** dan permission sesuai tabel di bawah.

---

## 📌 Get All Users

**GET** `/user`

Mengambil daftar user untuk outlet user yang login, dengan paginasi dan filter nama.

### Query Parameters

| Parameter | Tipe   | Default | Keterangan                         |
| --------- | ------ | ------- | ---------------------------------- |
| `page`    | number | 1       | Halaman                            |
| `limit`   | number | 10      | Jumlah per halaman                 |
| `keyword` | string | -       | Filter nama user (case-insensitive) |

### Example

```
GET /user?page=1&limit=10&keyword=John
```

### Response

```json
{
  "status": 200,
  "message": "Get All user success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "John Doe",
      "email": "john@example.com",
      "picture": null,
      "created_at": "2025-09-19T08:26:46.000Z",
      "updated_at": "2025-09-19T08:26:46.000Z",
      "role_id": "550e8400-e29b-41d4-a716-446655440002",
      "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
      "role": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "name": "Manager",
        "isAdmin": false
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_page": 1
  }
}
```

---

## 📌 Get User By ID

**GET** `/user/:id`

Mengambil detail satu user berdasarkan ID. User non-admin hanya bisa mengakses user dalam outlet yang sama.

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
    "name": "John Doe",
    "email": "john@example.com",
    "is_confirmed": false,
    "picture": null,
    "created_at": "2025-09-19T08:26:46.000Z",
    "updated_at": "2025-09-19T08:26:46.000Z",
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "role_id": "550e8400-e29b-41d4-a716-446655440002",
    "role": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Manager",
      "isAdmin": false
    }
  }
}
```

---

## 📌 Create User

**POST** `/user`

Membuat user baru di **outlet user yang login**. Outlet diambil dari JWT.

### Request Body

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "role_id": "550e8400-e29b-41d4-a716-446655440002",
  "picture": "https://example.com/photo.jpg"
}
```

| Field            | Tipe   | Wajib | Keterangan                    |
| ---------------- | ------ | ----- | ----------------------------- |
| name             | string | ✅    | Nama user                     |
| email            | string | ✅    | Email (unik)                  |
| password         | string | ✅    | Min 8 karakter                |
| confirmPassword  | string | ✅    | Harus sama dengan password    |
| role_id          | UUID   | -     | ID role (opsional)            |
| picture          | string | -     | URL foto profil               |

### Response

```json
{
  "status": 201,
  "message": "User created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "is_confirmed": false,
    "picture": "https://example.com/photo.jpg",
    "created_at": "2025-09-19T09:00:00.000Z",
    "updated_at": "2025-09-19T09:00:00.000Z",
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "role_id": "550e8400-e29b-41d4-a716-446655440002"
  }
}
```

---

## 📌 Update User

**PUT** `/user/:id`

Mengubah data user. Semua field opsional; hanya field yang dikirim yang di-update. User non-admin hanya bisa mengubah user dalam outlet yang sama.

### Request Body

```json
{
  "name": "Jane Updated",
  "email": "jane.new@example.com",
  "password": "NewPassword123!",
  "role_id": "550e8400-e29b-41d4-a716-446655440004",
  "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
  "picture": "https://example.com/new-photo.jpg"
}
```

| Field     | Tipe   | Wajib | Keterangan     |
| --------- | ------ | ----- | --------------- |
| name      | string | -     | Nama user       |
| email     | string | -     | Email (unik)    |
| password  | string | -     | Min 8 karakter  |
| role_id   | UUID   | -     | ID role         |
| outlet_id | UUID   | -     | ID outlet       |
| picture   | string | -     | URL foto profil |

### Response

```json
{
  "status": 200,
  "message": "User updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Jane Updated",
    "email": "jane.new@example.com",
    "is_confirmed": false,
    "picture": "https://example.com/new-photo.jpg",
    "created_at": "2025-09-19T09:00:00.000Z",
    "updated_at": "2025-09-19T09:15:00.000Z",
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "role_id": "550e8400-e29b-41d4-a716-446655440004"
  }
}
```

---

## 📌 Delete User

**DELETE** `/user/:id`

Menghapus user. User non-admin hanya bisa menghapus user dalam outlet yang sama.

### Example

```
DELETE /user/550e8400-e29b-41d4-a716-446655440003
```

### Response

```json
{
  "status": 200,
  "message": "User deleted successfully",
  "data": {
    "message": "User deleted successfully"
  }
}
```

---

## 🔐 Permissions Required

| Endpoint        | Permission    |
| --------------- | ------------- |
| `GET /user`     | `user:read`   |
| `GET /user/:id` | `user:read`   |
| `POST /user`    | `user:create` |
| `PUT /user/:id` | `user:update` |
| `DELETE /user/:id` | `user:delete` |

---

## 📋 Business Rules

1. **Outlet-based**: User dibuat dan di-scope ke outlet user yang login; list/detail/update/delete hanya untuk user dalam outlet yang sama (kecuali admin).
2. **Create**: User baru selalu dapat `outlet_id` dari JWT, bukan dari body.
3. **Update/Delete**: Hanya user yang `outlet_id`-nya sama dengan outlet user yang login yang boleh diubah/hapus (admin bisa sesuai kebijakan).
4. **Email**: Harus unik; konflik mengembalikan 409.

---

## ⚠️ Error Responses

### Not Found (404)

```json
{
  "status": 404,
  "message": "User not found"
}
```

### Conflict (409)

```json
{
  "status": 409,
  "message": "User with this email already exists"
}
```

### Validation (400)

```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "email must be an email"
    },
    {
      "field": "password",
      "message": "password must be longer than or equal to 8 characters"
    }
  ]
}
```
