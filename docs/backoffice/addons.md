# 🔧 Addon API Documentation

**Base URL:** `/backoffice/addons`

Semua endpoint memerlukan **autentikasi JWT**.

---

## 📌 Get All Addons

**GET** `/backoffice/addons`

### Query Parameters

| Parameter | Tipe   | Default | Keterangan                         |
| --------- | ------ | ------- | ---------------------------------- |
| `page`    | number | 1       | Halaman                            |
| `limit`  | number | 10      | Jumlah per halaman                 |
| `keyword` | string | -       | Filter nama tenant (case-insensitive) |
| `status`  | string | -       | Filter status addon               |
| `type`    | string | -       | Filter tipe addon (add_user/add_branch) |

### Response

```json
{
  "status": 200,
  "message": "Get all addons success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "tenant_id": "550e8400-e29b-41d4-a716-446655440010",
      "tenant_name": "Agen Berkah Cahaya",
      "subscription_id": "550e8400-e29b-41d4-a716-446655440020",
      "type": "add_user",
      "quantity": 2,
      "unit_price": "10000",
      "prorated_months": 6,
      "amount": "120000",
      "status": "active",
      "activated_at": "2025-09-15T10:00:00.000Z",
      "expires_at": "2026-03-15T10:00:00.000Z",
      "created_at": "2025-09-15T10:00:00.000Z",
      "updated_at": "2025-09-15T10:00:00.000Z"
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

## 📋 Addon Types

| Type        | Keterangan              |
| ----------- | ---------------------- |
| `add_user`  | Tambahan kuota user    |
| `add_branch` | Tambahan kuota cabang  |

---

## 📋 Addon Status

| Status    | Keterangan                 |
| --------- | -------------------------- |
| `pending` | Menunggu pembayaran        |
| `active`  | Sudah aktif                |
| `expired` | Sudah kadaluarsa           |
| `cancelled` | Dibatalkan              |

---

## 📌 Cancel Addon

**POST** `/backoffice/addons/:id/cancel`

Membatalkan addon.

### Example

```
POST /backoffice/addons/550e8400-e29b-41d4-a716-446655440001/cancel
```

### Response

```json
{
  "status": 200,
  "message": "Addon cancelled successfully",
  "data": {
    "addon_id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "cancelled"
  }
}
```

---

## 📌 Delete Addon

**DELETE** `/backoffice/addons/:id`

Menghapus addon secara permanen.

### Example

```
DELETE /backoffice/addons/550e8400-e29b-41d4-a716-446655440001
```

### Response

```json
{
  "status": 200,
  "message": "Addon deleted successfully",
  "data": {
    "addon_id": "550e8400-e29b-41d4-a716-446655440001",
    "deleted": true
  }
}
```

---

## ⚠️ Error Responses

### Not Found (404)

```json
{
  "status": 404,
  "message": "Addon not found"
}
```
