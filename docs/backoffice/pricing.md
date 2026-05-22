# 💰 Pricing API Documentation

**Base URL:** `/backoffice/pricing`

Semua endpoint memerlukan **autentikasi JWT**.

---

## 📌 Get All Pricing

**GET** `/backoffice/pricing`

### Query Parameters

| Parameter | Tipe   | Default | Keterangan                |
| --------- | ------ | ------- | ------------------------- |
| `page`    | number | 1       | Halaman                   |
| `limit`  | number | 10      | Jumlah per halaman        |
| `keyword` | string | -       | Filter nama plan (case-insensitive) |

### Response

```json
{
  "status": 200,
  "message": "Get all pricing success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "plan": "Basic",
      "price": "99000",
      "period_months": 1,
      "default_user_quota": 5,
      "default_branch_quota": 1,
      "extra_user_price": "10000",
      "extra_branch_price": "25000",
      "trial_days": 7,
      "trial_max_transactions": 50,
      "is_active": true,
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

## 📌 Create Pricing

**POST** `/backoffice/pricing`

### Request Body

```json
{
  "plan": "Premium",
  "price": "199000",
  "period_months": 1,
  "default_user_quota": 10,
  "default_branch_quota": 3,
  "extra_user_price": "8000",
  "extra_branch_price": "20000",
  "trial_days": 14,
  "trial_max_transactions": 100,
  "is_active": true
}
```

| Field                  | Tipe    | Wajib | Keterangan                         |
| ---------------------- | ------- | ----- | ---------------------------------- |
| plan                   | string  | ✅    | Nama plan                          |
| price                  | string  | ✅    | Harga plan (string)                |
| period_months          | number  | ✅    | Durasi dalam bulan                 |
| default_user_quota     | number  | ✅    | Kuota user default                 |
| default_branch_quota   | number  | ✅    | Kuota cabang default                |
| extra_user_price       | string  | ✅    | Harga tambahan user (string)       |
| extra_branch_price     | string  | ✅    | Harga tambahan cabang (string)     |
| trial_days             | number  | ✅    | Jumlah hari trial                   |
| trial_max_transactions | number  | ✅    | Maksimal transaksi saat trial       |
| is_active              | boolean | ✅    | Apakah plan aktif                  |

### Response

```json
{
  "status": 201,
  "message": "Pricing created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "plan": "Premium",
    "price": "199000",
    "period_months": 1,
    "default_user_quota": 10,
    "default_branch_quota": 3,
    "extra_user_price": "8000",
    "extra_branch_price": "20000",
    "trial_days": 14,
    "trial_max_transactions": 100,
    "is_active": true,
    "created_at": "2025-09-19T09:00:00.000Z",
    "updated_at": "2025-09-19T09:00:00.000Z"
  }
}
```

---

## 📌 Update Pricing

**PATCH** `/backoffice/pricing/:id`

Semua field opsional; hanya field yang dikirim yang di-update.

### Request Body

```json
{
  "plan": "Premium Extended",
  "price": "249000",
  "is_active": false
}
```

### Response

```json
{
  "status": 200,
  "message": "Pricing updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "plan": "Premium Extended",
    "price": "249000",
    "period_months": 1,
    "default_user_quota": 10,
    "default_branch_quota": 3,
    "extra_user_price": "8000",
    "extra_branch_price": "20000",
    "trial_days": 14,
    "trial_max_transactions": 100,
    "is_active": false,
    "created_at": "2025-09-19T09:00:00.000Z",
    "updated_at": "2025-09-19T09:15:00.000Z"
  }
}
```

---

## 📌 Delete Pricing

**DELETE** `/backoffice/pricing/:id`

### Example

```
DELETE /backoffice/pricing/550e8400-e29b-41d4-a716-446655440002
```

### Response

```json
{
  "status": 200,
  "message": "Pricing deleted successfully"
}
```

---

## ⚠️ Error Responses

### Not Found (404)

```json
{
  "status": 404,
  "message": "Pricing not found"
}
```

### Validation (400)

```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "price",
      "message": "price must be a string"
    }
  ]
}
```
