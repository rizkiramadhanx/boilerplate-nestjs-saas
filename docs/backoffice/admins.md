# 👤 Admin API Documentation

**Base URL:** `/backoffice/admins`

Semua endpoint memerlukan **autentikasi JWT**.

---

## 📌 Get All Admins

**GET** `/backoffice/admins`

### Query Parameters

| Parameter | Tipe   | Default | Keterangan                |
| --------- | ------ | ------- | ------------------------- |
| `page`    | number | 1       | Halaman                   |
| `limit`  | number | 10      | Jumlah per halaman        |
| `keyword` | string | -       | Filter nama admin (case-insensitive) |

### Response

```json
{
  "status": 200,
  "message": "Get all admins success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "John Doe",
      "email": "admin@example.com",
      "created_at": "2025-09-19T08:26:46.000Z",
      "updated_at": "2025-09-19T08:26:46.000Z"
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

## 📌 Create Admin

**POST** `/backoffice/admins`

### Request Body

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "confirm_password": "Password123!"
}
```

| Field            | Tipe   | Wajib | Keterangan                    |
| ---------------- | ------ | ----- | ----------------------------- |
| name             | string | ✅    | Nama admin                    |
| email            | string | ✅    | Email (unik)                  |
| password         | string | ✅    | Min 8 karakter                |
| confirm_password | string | ✅    | Harus sama dengan password    |

### Response

```json
{
  "status": 201,
  "message": "Admin created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "created_at": "2025-09-19T09:00:00.000Z",
    "updated_at": "2025-09-19T09:00:00.000Z"
  }
}
```

---

## 📌 Update Admin

**PUT** `/backoffice/admins/:id`

### Request Body

```json
{
  "name": "Jane Updated",
  "email": "jane.new@example.com",
  "password": "NewPassword123!"
}
```

| Field    | Tipe   | Wajib | Keterangan     |
| -------- | ------ | ----- | -------------- |
| name     | string | -     | Nama admin     |
| email    | string | -     | Email (unik)   |
| password | string | -     | Min 8 karakter |

### Response

```json
{
  "status": 200,
  "message": "Admin updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Jane Updated",
    "email": "jane.new@example.com",
    "created_at": "2025-09-19T09:00:00.000Z",
    "updated_at": "2025-09-19T09:15:00.000Z"
  }
}
```

---

## 📌 Delete Admin

**DELETE** `/backoffice/admins/:id`

### Example

```
DELETE /backoffice/admins/550e8400-e29b-41d4-a716-446655440002
```

### Response

```json
{
  "status": 200,
  "message": "Admin deleted successfully"
}
```

---

## ⚠️ Error Responses

### Conflict (409)

```json
{
  "status": 409,
  "message": "Admin with this email already exists"
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
    }
  ]
}
```
