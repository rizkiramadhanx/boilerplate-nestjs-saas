# 🏢 Tenant API Documentation

**Base URL:** `/backoffice/tenants`

Semua endpoint memerlukan **autentikasi JWT**.

---

## 📌 Get All Tenants

**GET** `/backoffice/tenants`

### Query Parameters

| Parameter | Tipe   | Default | Keterangan                    |
| --------- | ------ | ------- | ----------------------------- |
| `page`    | number | 1       | Halaman                       |
| `limit`  | number | 10      | Jumlah per halaman            |
| `keyword` | string | -       | Filter nama tenant (case-insensitive) |

### Response

```json
{
  "status": 200,
  "message": "Get all tenants success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Agen Berkah Cahaya",
      "owner_name": "John Doe",
      "owner_email": "john@example.com",
      "status": "active",
      "plan": "Premium",
      "created_at": "2025-09-19T08:26:46.000Z",
      "branches": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440010",
          "name": "Cabang Utama"
        }
      ],
      "users": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440020",
          "name": "Jane Doe",
          "email": "jane@example.com"
        }
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

## 📌 Delete Tenant

**DELETE** `/backoffice/tenants/:id`

Menghapus tenant beserta semua cabang dan user terkait.

### Example

```
DELETE /backoffice/tenants/550e8400-e29b-41d4-a716-446655440001
```

### Response

```json
{
  "status": 200,
  "message": "Tenant deleted successfully"
}
```

### ⚠️ Warning

Menghapus tenant akan menghapus:
- Semua cabang (branches) terkait
- Semua user terkait
- Semua transaksi terkait

---

## ⚠️ Error Responses

### Not Found (404)

```json
{
  "status": 404,
  "message": "Tenant not found"
}
```
