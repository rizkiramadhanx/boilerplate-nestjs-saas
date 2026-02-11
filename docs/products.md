# 🛍️ Products API Documentation

**Base URL:** `api/product`

Semua endpoint di bawah ini **memerlukan autentikasi JWT** dan akses module `product`.

---

## 📌 Create Product

**POST** `api/product`

### Request Body

| Field         | Type    | Required | Description                         |
| ------------- | ------- | -------- | ----------------------------------- |
| `name`        | string  | ✅       | Nama produk                         |
| `description` | string  | ✅       | Deskripsi produk                    |
| `price`       | number  | ✅       | Harga jual produk                   |
| `stock`       | number  | ✅       | Stok produk                         |
| `picture`     | string  | ❌       | URL gambar produk (optional)        |
| `hpp`         | number  | ❌       | Harga pokok penjualan (optional)    |
| `sku`         | string  | ❌       | SKU produk (optional)               |
| `isActive`    | boolean | ❌       | Status aktif produk (default: true) |
| `category_id` | UUID    | ❌       | ID kategori produk (optional)       |

```json
{
  "name": "PlayStation 5",
  "description": "Gaming console terbaru dari Sony",
  "price": 8000000,
  "stock": 10,
  "picture": "https://example.com/ps5.jpg",
  "hpp": 6000000,
  "sku": "PS5-001",
  "isActive": true,
  "category_id": "550e8400-e29b-41d4-a716-446655440003"
}
```

### Response

```json
{
  "status": 201,
  "message": "Product created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "PlayStation 5",
    "description": "Gaming console terbaru dari Sony",
    "price": 8000000,
    "stock": 10,
    "hpp": 6000000,
    "sku": "PS5-001",
    "isActive": true,
    "category_id": "550e8400-e29b-41d4-a716-446655440003",
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2025-09-19T08:26:46.000Z",
    "updatedAt": "2025-09-19T08:26:46.000Z"
  }
}
```

---

## 📌 Get All Products (Pagination + Search)

**GET** `api/product`

### Query Parameters

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| `page`    | int    | Page number (default: 1)     |
| `limit`   | int    | Items per page (default: 10) |
| `keyword` | string | Search by name (optional)    |

### Example

```
GET api/product?page=1&limit=5&keyword=PlayStation
```

### Response

```json
{
  "status": 200,
  "message": "Get all products success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "PlayStation 5",
      "description": "Gaming console terbaru dari Sony",
      "price": 8000000,
      "stock": 10,

      "hpp": 6000000,
      "sku": "PS5-001",
      "isActive": true,
      "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2025-09-19T08:26:46.000Z",
      "updatedAt": "2025-09-19T08:26:46.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Xbox Series X",
      "description": "Gaming console dari Microsoft",
      "price": 7500000,
      "stock": 5,
      "picture": "https://example.com/xbox.jpg",
      "hpp": 5500000,
      "sku": "XBOX-001",
      "isActive": true,
      "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2025-09-19T08:27:46.000Z",
      "updatedAt": "2025-09-19T08:27:46.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 5,
    "total": 2,
    "total_page": 1
  }
}
```

---

## 📌 Get Product by ID

**GET** `api/product/:id`

### Example

```
GET api/product/550e8400-e29b-41d4-a716-446655440001
```

### Response

```json
{
  "status": 200,
  "message": "Get product success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "PlayStation 5",
    "description": "Gaming console terbaru dari Sony",
    "price": 8000000,
    "stock": 10,
    "hpp": 6000000,
    "sku": "PS5-001",
    "isActive": true,
    "category_id": "550e8400-e29b-41d4-a716-446655440003",
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2025-09-19T08:26:46.000Z",
    "updatedAt": "2025-09-19T08:26:46.000Z"
  }
}
```

### Error (Not Found)

```json
{
  "status": 404,
  "message": "Product not found"
}
```

---

## 📌 Update Product

**PUT** `api/product/:id`

### Request Body

| Field         | Type    | Required | Description           |
| ------------- | ------- | -------- | --------------------- |
| `name`        | string  | ❌       | Nama produk           |
| `description` | string  | ❌       | Deskripsi produk      |
| `price`       | number  | ❌       | Harga jual produk     |
| `stock`       | number  | ❌       | Stok produk           |
| `picture`     | string  | ❌       | URL gambar produk     |
| `hpp`         | number  | ❌       | Harga pokok penjualan |
| `sku`         | string  | ❌       | SKU produk            |
| `isActive`    | boolean | ❌       | Status aktif produk   |
| `category_id` | UUID    | ❌       | ID kategori produk    |

```json
{
  "name": "PlayStation 5 Digital Edition",
  "description": "PlayStation 5 tanpa disc drive",
  "price": 7500000,
  "stock": 15,
  "picture": "https://example.com/ps5-digital.jpg",
  "hpp": 5500000,
  "sku": "PS5-DIGITAL-001",
  "isActive": true,
  "category_id": "550e8400-e29b-41d4-a716-446655440003"
}
```

### Response

```json
{
  "status": 200,
  "message": "Product updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "PlayStation 5 Digital Edition",
    "description": "PlayStation 5 tanpa disc drive",
    "price": 7500000,
    "stock": 15,
    "picture": "https://example.com/ps5-digital.jpg",
    "hpp": 5500000,
    "sku": "PS5-DIGITAL-001",
    "isActive": true,
    "outlet_id": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2025-09-19T08:26:46.000Z",
    "updatedAt": "2025-09-19T08:30:46.000Z"
  }
}
```

---

## 📌 Delete Product

**DELETE** `api/product/:id`

### Example

```
DELETE api/product/550e8400-e29b-41d4-a716-446655440001
```

### Response

```json
{
  "status": 200,
  "message": "Product deleted successfully"
}
```

### Error (Not Found)

```json
{
  "message": "Product not found"
}
```

---

## 🏷️ Category Relationship

### Hubungan Kategori dan Product

- **Product → Category**: One-to-One (nullable)
  - Setiap product dapat memiliki maksimal 1 kategori
  - Field `category_id` bersifat optional (bisa null)
- **Category → Product**: One-to-Many
  - Setiap kategori dapat memiliki banyak product
  - Kategori dapat memiliki 0 atau lebih product

### Contoh Penggunaan

```json
{
  "name": "PlayStation 5",
  "description": "Gaming console terbaru dari Sony",
  "price": 8000000,
  "stock": 10,
  "category_id": "550e8400-e29b-41d4-a716-446655440003"
}
```

**Note**: Jika `category_id` tidak disediakan atau null, product akan dibuat tanpa kategori.

---

## 🛡️ Auth & Middleware

Semua endpoint di atas:

- **Memerlukan JWT Bearer Token** melalui header:

  ```
  Authorization: Bearer <token>
  ```

- **Dibatasi oleh middleware akses modul**:

  ```
  middleware.RequireModuleAccess("product")
  ```

---

## 🔐 Permissions Required

| Endpoint                 | Permission Required |
| ------------------------ | ------------------- |
| `GET api/product`        | `product:read`      |
| `GET api/product/:id`    | `product:read`      |
| `POST api/product`       | `product:create`    |
| `PUT api/product/:id`    | `product:update`    |
| `DELETE api/product/:id` | `product:delete`    |

---

## 📋 Business Rules

1. **Outlet Ownership**: Product terikat dengan outlet yang membuatnya
2. **Outlet Access Control**:
   - Admin dapat melihat semua products
   - User biasa hanya dapat melihat products di outlet mereka
3. **Stock Management**: Stock dapat diupdate untuk tracking inventory
4. **Price Validation**: Price dan HPP harus berupa angka positif
5. **SKU Uniqueness**: SKU harus unik dalam sistem (optional)
6. **Product Status**: Product dapat diaktifkan/nonaktifkan dengan field `isActive`
7. **Category Relationship**:
   - Product dapat memiliki 1 kategori (nullable)
   - Kategori dapat memiliki banyak product
   - Field `category_id` bersifat optional

---

## ⚠️ Error Responses

### Conflict (409)

```json
{
  "status": 409,
  "message": "Product with this name already exists"
}
```

### Forbidden (403)

```json
{
  "status": 403,
  "message": "You can only manage products in your outlet"
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
      "field": "price",
      "message": "price must be a positive number"
    }
  ]
}
```
