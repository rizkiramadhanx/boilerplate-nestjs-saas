# 📦 Product API Documentation

**Base URL:** `/product`

Semua endpoint memerlukan **autentikasi JWT** dan permission sesuai tabel di bawah.

## Relasi kategori

- Satu **product** punya **satu kategori** (opsional / **nullable**).
- Satu **kategori** punya **banyak product**.
- Di response: selalu ada `category_id` (UUID atau `null`) dan `category` (object `{ id, name }` atau `null`).

---

## 📌 Get All Products

**GET** `/product`

Mengambil daftar produk untuk outlet user yang login, dengan paginasi dan filter nama.

### Query Parameters

| Parameter | Tipe   | Default | Keterangan                         |
| --------- | ------ | ------- | ---------------------------------- |
| `page`    | number | 1       | Halaman                            |
| `limit`   | number | 10      | Jumlah per halaman                  |
| `keyword` | string | -       | Filter nama produk (case-insensitive) |

Setiap item di `data` berisi `category_id` (UUID atau `null`) dan `category` (`{ id, name }` atau `null`).

### Example

```
GET /product?page=1&limit=10&keyword=Cincin
```

### Response

```json
{
  "status": 200,
  "message": "Get all products success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Cincin Emas 24K",
      "description": "Cincin emas murni 24 karat",
      "price": 2500000,
      "picture": "https://example.com/cincin.jpg",
      "hpp": 2200000,
      "stock": 10,
      "sku": "CIN-24K-001",
      "is_active": true,
      "created_at": "2025-09-19T08:26:46.000Z",
      "updated_at": "2025-09-19T08:26:46.000Z",
      "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
      "category_id": "550e8400-e29b-41d4-a716-446655440010",
      "category": { "id": "550e8400-e29b-41d4-a716-446655440010", "name": "Emas Murni" }
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

## 📌 Get Product By ID

**GET** `/product/:id`

Mengambil detail satu produk berdasarkan ID. Hanya produk dalam outlet user yang login yang bisa diakses.

### Example

```
GET /product/550e8400-e29b-41d4-a716-446655440001
```

### Response

```json
{
  "status": 200,
  "message": "Get product success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Cincin Emas 24K",
    "description": "Cincin emas murni 24 karat",
    "price": 2500000,
    "picture": "https://example.com/cincin.jpg",
    "hpp": 2200000,
    "stock": 10,
    "sku": "CIN-24K-001",
    "is_active": true,
    "created_at": "2025-09-19T08:26:46.000Z",
    "updated_at": "2025-09-19T08:26:46.000Z",
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "category_id": "550e8400-e29b-41d4-a716-446655440010",
    "category": { "id": "550e8400-e29b-41d4-a716-446655440010", "name": "Emas Murni" }
  }
}
```

---

## 📌 Create Product

**POST** `/product`

Membuat produk baru di **outlet user yang login**. Outlet diambil dari JWT.

### Request Body

```json
{
  "name": "Gelang Emas 18K",
  "description": "Gelang emas 18 karat dengan ukiran",
  "price": 3500000,
  "picture": "https://example.com/gelang.jpg",
  "hpp": 3000000,
  "stock": 5,
  "sku": "GEL-18K-001",
  "isActive": true,
  "category_id": "550e8400-e29b-41d4-a716-446655440010"
}
```

| Field        | Tipe    | Wajib | Keterangan                          |
| ------------ | ------- | ----- | ------------------------------------ |
| name         | string  | ✅    | Nama produk, max 500 karakter        |
| description  | string  | ✅    | Deskripsi produk                     |
| price        | number  | ✅    | Harga jual                           |
| picture      | string  | -     | URL gambar produk                    |
| hpp          | number  | -     | Harga pokok penjualan                |
| stock        | number  | ✅    | Jumlah stok                          |
| sku          | string  | -     | SKU (harus unik, konflik → 409)      |
| isActive     | boolean | -     | Status aktif, default `true`         |
| category_id  | UUID \| null | -     | ID kategori (opsional, nullable). Omit atau `null` = tanpa kategori |

### Response

```json
{
  "status": 201,
  "message": "Product created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Gelang Emas 18K",
    "description": "Gelang emas 18 karat dengan ukiran",
    "price": 3500000,
    "picture": "https://example.com/gelang.jpg",
    "hpp": 3000000,
    "stock": 5,
    "sku": "GEL-18K-001",
    "is_active": true,
    "created_at": "2025-09-19T09:00:00.000Z",
    "updated_at": "2025-09-19T09:00:00.000Z",
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "category_id": "550e8400-e29b-41d4-a716-446655440010",
    "category": { "id": "550e8400-e29b-41d4-a716-446655440010", "name": "Emas Murni" }
  }
}
```

---

## 📌 Update Product

**PATCH** `/product/:id`

Mengubah data produk. Semua field opsional; hanya field yang dikirim yang di-update. Hanya produk dalam outlet user yang login yang boleh diubah.

### Request Body

```json
{
  "name": "Gelang Emas 18K Premium",
  "description": "Gelang emas 18 karat dengan ukiran premium",
  "price": 3800000,
  "stock": 8,
  "isActive": true,
  "category_id": "550e8400-e29b-41d4-a716-446655440011"
}
```

| Field        | Tipe    | Wajib | Keterangan     |
| ------------ | ------- | ----- | --------------- |
| name         | string  | -     | Nama produk     |
| description  | string  | -     | Deskripsi       |
| price        | number  | -     | Harga jual      |
| picture      | string  | -     | URL gambar      |
| hpp          | number  | -     | Harga pokok     |
| stock        | number  | -     | Stok            |
| sku          | string  | -     | SKU (unik)      |
| isActive     | boolean | -     | Status aktif    |
| category_id  | UUID \| null | -     | ID kategori. Kirim `null` untuk melepas kategori |

### Response

```json
{
  "status": 200,
  "message": "Product updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Gelang Emas 18K Premium",
    "description": "Gelang emas 18 karat dengan ukiran premium",
    "price": 3800000,
    "picture": "https://example.com/gelang.jpg",
    "hpp": 3000000,
    "stock": 8,
    "sku": "GEL-18K-001",
    "is_active": true,
    "created_at": "2025-09-19T09:00:00.000Z",
    "updated_at": "2025-09-19T09:15:00.000Z",
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "category_id": "550e8400-e29b-41d4-a716-446655440011",
    "category": { "id": "550e8400-e29b-41d4-a716-446655440011", "name": "Emas 18K" }
  }
}
```

---

## 📌 Delete Product

**DELETE** `/product/:id`

Menghapus produk. Hanya produk dalam outlet user yang login yang boleh dihapus.

### Example

```
DELETE /product/550e8400-e29b-41d4-a716-446655440002
```

### Response

```json
{
  "status": 200,
  "message": "Product deleted successfully",
  "data": {
    "message": "Product deleted successfully"
  }
}
```

---

## 🔐 Permissions Required

| Endpoint           | Permission      |
| ------------------ | --------------- |
| `GET /product`     | `product:read`  |
| `GET /product/:id` | `product:read`  |
| `POST /product`    | `product:create`|
| `PATCH /product/:id` | `product:update`|
| `DELETE /product/:id` | `product:delete`|

---

## 📋 Business Rules

1. **Outlet-based**: Produk dibuat dan di-scope ke outlet user yang login; list/detail/update/delete hanya untuk produk dalam outlet yang sama.
2. **Create**: Produk baru selalu dapat `outlet_id` dari JWT, bukan dari body.
3. **Update/Delete**: Hanya produk yang `outlet_id`-nya sama dengan outlet user yang login yang boleh diubah/hapus.
4. **SKU**: Jika diisi, harus unik; konflik mengembalikan 409.
5. **Category (nullable)**: `category_id` opsional; boleh tidak dikirim atau dikirim `null` = produk tanpa kategori. Saat update, kirim `category_id: null` untuk melepas kategori. Response selalu menyertakan `category_id` dan `category` (object `{ id, name }` atau `null`). Satu product maksimal satu kategori; satu kategori bisa punya banyak product.

---

## ⚠️ Error Responses

### Not Found (404)

```json
{
  "status": 404,
  "message": "Product not found"
}
```

### Conflict (409)

```json
{
  "status": 409,
  "message": "Product with this SKU already exists"
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
    },
    {
      "field": "price",
      "message": "price must be a number"
    },
    {
      "field": "stock",
      "message": "stock must be a number"
    }
  ]
}
```

### Internal Server Error (500)

```json
{
  "status": 500,
  "message": "Failed to get products"
}
```
