# 📁 Category API Documentation

**Base URL:** `/category`

Semua endpoint memerlukan **autentikasi JWT** dan permission sesuai tabel di bawah.

---

## 📌 Get All Categories

**GET** `/category`

Mengambil daftar kategori untuk outlet user yang login, dengan paginasi dan filter nama.

### Query Parameters

| Parameter | Tipe   | Default | Keterangan                            |
| --------- | ------ | ------- | ------------------------------------- |
| `page`    | number | 1       | Halaman                               |
| `limit`   | number | 10      | Jumlah per halaman                    |
| `keyword` | string | -       | Filter nama kategori (case-insensitive) |

### Example

```
GET /category?page=1&limit=10&keyword=Emas
```

### Response

```json
{
  "status": 200,
  "message": "Get all categories success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "name": "Emas Murni",
      "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2025-09-19T08:26:46.000Z",
      "updated_at": "2025-09-19T08:26:46.000Z",
      "products": [
        { "id": "550e8400-e29b-41d4-a716-446655440001", "name": "Cincin Emas 24K" },
        { "id": "550e8400-e29b-41d4-a716-446655440002", "name": "Gelang Emas 18K" }
      ]
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

## 📌 Get Category By ID

**GET** `/category/:id`

Mengambil detail satu kategori berdasarkan ID. Hanya kategori dalam outlet user yang login yang bisa diakses.

### Example

```
GET /category/550e8400-e29b-41d4-a716-446655440010
```

### Response

```json
{
  "status": 200,
  "message": "Get category success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "name": "Emas Murni",
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-09-19T08:26:46.000Z",
    "updated_at": "2025-09-19T08:26:46.000Z",
    "products": [
      { "id": "550e8400-e29b-41d4-a716-446655440001", "name": "Cincin Emas 24K" },
      { "id": "550e8400-e29b-41d4-a716-446655440002", "name": "Gelang Emas 18K" }
    ]
  }
}
```

**Relasi:** Satu kategori punya **banyak product** (array `products` berisi `id` dan `name` tiap product).

---

## 📌 Create Category

**POST** `/category`

Membuat kategori baru di **outlet user yang login**. Outlet diambil dari JWT.

### Request Body

```json
{
  "name": "Perhiasan Emas"
}
```

| Field | Tipe   | Wajib | Keterangan                 |
| ----- | ------ | ----- | -------------------------- |
| name  | string | ✅    | Nama kategori, max 255 karakter |

### Response

```json
{
  "status": 201,
  "message": "Category created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440011",
    "name": "Perhiasan Emas",
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-09-19T09:00:00.000Z",
    "updated_at": "2025-09-19T09:00:00.000Z"
  }
}
```

---

## 📌 Update Category

**PATCH** `/category/:id`

Mengubah data kategori. Field opsional; hanya field yang dikirim yang di-update. Hanya kategori dalam outlet user yang login yang boleh diubah.

### Request Body

```json
{
  "name": "Perhiasan Emas & Perak"
}
```

| Field | Tipe   | Wajib | Keterangan     |
| ----- | ------ | ----- | --------------- |
| name  | string | -     | Nama kategori   |

### Response

```json
{
  "status": 200,
  "message": "Category updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440011",
    "name": "Perhiasan Emas & Perak",
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-09-19T09:00:00.000Z",
    "updated_at": "2025-09-19T09:15:00.000Z"
  }
}
```

---

## 📌 Delete Category

**DELETE** `/category/:id`

Menghapus kategori. Hanya kategori dalam outlet user yang login yang boleh dihapus.

### Example

```
DELETE /category/550e8400-e29b-41d4-a716-446655440011
```

### Response

```json
{
  "status": 200,
  "message": "Category deleted successfully",
  "data": {
    "message": "Category deleted successfully"
  }
}
```

---

## 🔐 Permissions Required

| Endpoint            | Permission       |
| ------------------- | ---------------- |
| `GET /category`     | `category:read`  |
| `GET /category/:id` | `category:read`  |
| `POST /category`    | `category:create`|
| `PATCH /category/:id` | `category:update`|
| `DELETE /category/:id` | `category:delete`|

---

## 📋 Business Rules

1. **Outlet-based**: Kategori dibuat dan di-scope ke outlet user yang login; list/detail/update/delete hanya untuk kategori dalam outlet yang sama.
2. **Create**: Kategori baru selalu dapat `outlet_id` dari JWT, bukan dari body.
3. **Update/Delete**: Hanya kategori yang `outlet_id`-nya sama dengan outlet user yang login yang boleh diubah/hapus.
4. **Nama unik per outlet**: Nama kategori harus unik dalam satu outlet; konflik create/update mengembalikan 409.

---

## ⚠️ Error Responses

### Not Found (404)

```json
{
  "status": 404,
  "message": "Category not found"
}
```

### Conflict (409)

```json
{
  "status": 409,
  "message": "Category with this name already exists"
}
```

### Validation (400)

```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "name should not be empty"
    }
  ]
}
```

### Internal Server Error (500)

```json
{
  "status": 500,
  "message": "Failed to get categories"
}
```
