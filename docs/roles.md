# 👑 Roles API Documentation

**Base URL:** `/role`

Semua endpoint di bawah ini **memerlukan autentikasi JWT** dan permission sesuai tabel di bawah.

---

## 📌 Get Available Actions

**GET** `/role/list-action`

Mengembalikan daftar modul dan aksi yang bisa dipakai untuk konfigurasi role.

### Response

```json
{
  "status": 200,
  "message": "Action list",
  "data": [
    {
      "name": "role",
      "actions": ["role:create", "role:read", "role:update", "role:delete"]
    },
    {
      "name": "user",
      "actions": ["user:create", "user:read", "user:update", "user:delete"]
    },
    {
      "name": "product",
      "actions": [
        "product:create",
        "product:read",
        "product:update",
        "product:delete"
      ]
    },
    {
      "name": "category",
      "actions": [
        "category:create",
        "category:read",
        "category:update",
        "category:delete"
      ]
    }
  ]
}
```

---

## 📌 Get All Roles (Outlet)

**GET** `/role`

Mengambil daftar role untuk outlet user yang login, dengan paginasi dan filter nama.

### Query Parameters

| Parameter | Tipe   | Default | Keterangan                    |
| --------- | ------ | ------- | ----------------------------- |
| `page`    | number | 1       | Halaman                       |
| `limit`   | number | 10      | Jumlah per halaman            |
| `keyword` | string | -       | Filter nama role (case-insensitive) |

### Example

```
GET /role?page=1&limit=10&keyword=Manager
```

### Response

```json
{
  "status": 200,
  "message": "Get all roles success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Manager",
      "is_admin": false,
      "modules": ["user", "product"],
      "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2025-09-19T08:26:46.000Z",
      "updated_at": "2025-09-19T08:26:46.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Staff",
      "is_admin": false,
      "modules": ["product"],
      "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2025-09-19T08:27:46.000Z",
      "updated_at": "2025-09-19T08:27:46.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "total_page": 1
  }
}
```

---

## 📌 Create Role

**POST** `/role`

Membuat role baru untuk **outlet user yang login**. Outlet diambil dari JWT, tidak dari path/body.

### Request Body

```json
{
  "name": "Manager",
  "modules": ["user", "product"],
  "isAdmin": false
}
```

| Field    | Tipe    | Wajib | Keterangan                                      |
| -------- | ------- | ----- | ------------------------------------------------ |
| name     | string  | ✅    | Nama role, max 100 karakter                      |
| modules  | string[]| ✅    | Array nama modul (min 1, unik)                   |
| isAdmin  | boolean | -     | Default `false`                                  |

### Response

```json
{
  "status": 201,
  "message": "Role created",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Manager",
    "is_admin": false,
    "modules": ["user", "product"],
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-09-19T08:26:46.000Z",
    "updated_at": "2025-09-19T08:26:46.000Z"
  }
}
```

---

## 📌 Get Role Detail

**GET** `/role/:roleId`

Mengambil detail satu role berdasarkan ID.

### Example

```
GET /role/550e8400-e29b-41d4-a716-446655440001
```

### Response

```json
{
  "status": 200,
  "message": "Role detail",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Manager",
      "is_admin": false,
      "modules": ["user", "product"],
      "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2025-09-19T08:26:46.000Z",
      "updated_at": "2025-09-19T08:26:46.000Z"
    }
  ]
}
```

---

## 📌 Update Role

**PATCH** `/role/:roleId`

### Request Body

Semua field opsional; hanya field yang dikirim yang di-update.

```json
{
  "name": "Senior Manager",
  "modules": ["user", "product", "category"],
  "isAdmin": false
}
```

### Response

```json
{
  "status": 200,
  "message": "Role updated",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Senior Manager",
    "is_admin": false,
    "modules": ["user", "product", "category"],
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-09-19T08:26:46.000Z",
    "updated_at": "2025-09-19T08:30:46.000Z"
  }
}
```

---

## 📌 Delete Role

**DELETE** `/role/:roleId`

### Example

```
DELETE /role/550e8400-e29b-41d4-a716-446655440001
```

### Response

```json
{
  "status": 200,
  "message": "Role deleted",
  "data": true
}
```

---

## 🛡️ Auth & Guard

- **JWT**: Semua endpoint memerlukan header:

  ```
  Authorization: Bearer <token>
  ```

- **Permission**: Dibatasi oleh `PermissionsGuard` dengan permission per endpoint (lihat tabel di bawah).

---

## 🔐 Permissions Required

| Endpoint                 | Permission   |
| ------------------------ | ------------ |
| `GET /role/list-action` | (tidak ada)  |
| `GET /role`             | `role:read`  |
| `POST /role`            | `role:create`|
| `GET /role/:roleId`     | `role:read`  |
| `PATCH /role/:roleId`   | `role:update`|
| `DELETE /role/:roleId`  | `role:delete`|

---

## 📋 Business Rules

1. **Outlet-based**: Role selalu terikat ke outlet; create/list/detail/update/delete hanya untuk outlet user yang login.
2. **Create**: Role dibuat untuk `user.outlet.id` dari JWT, bukan dari path atau body.
3. **Update/Delete**: Hanya role yang `outlet_id`-nya sama dengan outlet user yang boleh diubah/hapus.
4. **Admin role**: Role dengan `is_admin: true` tidak boleh dihapus (403).
5. **Modules**: Nilai `modules` harus sesuai modul yang ada di `list-action` (role, user, product, category).

---

## ⚠️ Error Responses

### Conflict (409)

```json
{
  "status": 409,
  "message": "Failed to create role"
}
```

### Forbidden (403)

```json
{
  "status": 403,
  "message": "Outlet mismatch"
}
```

```json
{
  "status": 403,
  "message": "Cross-outlet access forbidden"
}
```

```json
{
  "status": 403,
  "message": "Admin role cannot be deleted"
}
```

### Not Found (404)

```json
{
  "status": 404,
  "message": "Role not found"
}
```

```json
{
  "status": 404,
  "message": "Outlet not found"
}
```

### Validation Error (400)

```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "name should not be empty"
    },
    {
      "field": "modules",
      "message": "modules must be an array"
    }
  ]
}
```

---

## 📝 Available Modules

Modul yang bisa dipakai di `modules` (sesuai `GET /role/list-action`):

| Modul     | Keterangan        | Aksi dasar                          |
| --------- | ----------------- | ------------------------------------ |
| **role**  | Manajemen role    | create, read, update, delete         |
| **user**  | Manajemen user    | create, read, update, delete         |
| **product** | Manajemen produk | create, read, update, delete         |
| **category** | Manajemen kategori | create, read, update, delete     |

Setiap aksi dalam format: `{module}:{action}` (contoh: `role:read`, `product:create`).
