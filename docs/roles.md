# 👑 Roles API Documentation

**Base URL:** `/roles`

Semua endpoint di bawah ini **memerlukan autentikasi JWT** dan akses module `roles`.

---

## 📌 Get Available Actions

**GET** `/roles/list-action`

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
    }
  ]
}
```

---

## 📌 Create Role for Outlet

**POST** `/roles/:outletId`

### Request Body

```json
{
  "name": "Manager",
  "description": "Role untuk manager outlet",
  "modules": ["user", "product"],
  "isAdmin": false
}
```

### Response

```json
{
  "status": 201,
  "message": "Role created",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Manager",
    "description": "Role untuk manager outlet",
    "modules": ["user", "product"],
    "isAdmin": false,
    "outletId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2025-09-19T08:26:46.000Z",
    "updatedAt": "2025-09-19T08:26:46.000Z"
  }
}
```

---

## 📌 Get Roles by Outlet

**GET** `/roles/:outletId`

### Example

```
GET /roles/550e8400-e29b-41d4-a716-446655440000
```

### Response

```json
{
  "status": 200,
  "message": "Roles list",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Manager",
      "description": "Role untuk manager outlet",
      "modules": ["user", "product"],
      "isAdmin": false,
      "outletId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2025-09-19T08:26:46.000Z",
      "updatedAt": "2025-09-19T08:26:46.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Staff",
      "description": "Role untuk staff outlet",
      "modules": ["product"],
      "isAdmin": false,
      "outletId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2025-09-19T08:27:46.000Z",
      "updatedAt": "2025-09-19T08:27:46.000Z"
    }
  ]
}
```

---

## 📌 Update Role

**PATCH** `/roles/:roleId`

### Request Body

```json
{
  "name": "Senior Manager",
  "description": "Role untuk senior manager outlet",
  "modules": ["user", "product"],
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
    "description": "Role untuk senior manager outlet",
    "modules": ["user", "product"],
    "isAdmin": false,
    "outletId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2025-09-19T08:26:46.000Z",
    "updatedAt": "2025-09-19T08:30:46.000Z"
  }
}
```

---

## 📌 Delete Role

**DELETE** `/roles/:roleId`

### Example

```
DELETE /roles/550e8400-e29b-41d4-a716-446655440001
```

### Response

```json
{
  "status": 200,
  "message": "Role deleted"
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
  middleware.RequireModuleAccess("roles")
  ```

---

## 🔐 Permissions Required

| Endpoint                 | Permission Required                |
| ------------------------ | ---------------------------------- |
| `GET /roles/list-action` | Tidak memerlukan permission khusus |
| `POST /roles/:outletId`  | `roles:create`                     |
| `GET /roles/:outletId`   | `roles:read`                       |
| `PATCH /roles/:roleId`   | `roles:update`                     |
| `DELETE /roles/:roleId`  | `roles:delete`                     |

---

## 📋 Business Rules

1. **Outlet-based Roles**: Setiap role terikat dengan outlet tertentu
2. **Admin Access Control**:
   - Admin dapat mengelola roles di semua outlet
   - User biasa hanya dapat mengelola roles di outlet mereka
3. **Module Permissions**: Role dapat memiliki akses ke multiple modules
4. **Admin Role**: Role dengan `isAdmin: true` memiliki akses penuh
5. **Role Hierarchy**: Admin role tidak dapat dihapus atau dimodifikasi oleh non-admin

---

## ⚠️ Error Responses

### Conflict (409)

```json
{
  "status": 409,
  "message": "Role with this name already exists in this outlet"
}
```

### Forbidden (403)

```json
{
  "status": 403,
  "message": "You can only manage roles in your outlet"
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

Sistem mendukung modules berikut untuk role permissions:

- **user**: Manajemen pengguna
- **product**: Manajemen produk
- **role**: Manajemen role (hanya admin)

Setiap module memiliki 4 aksi dasar:

- `create`: Membuat data baru
- `read`: Membaca data
- `update`: Mengupdate data
- `delete`: Menghapus data
