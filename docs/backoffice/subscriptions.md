# 📋 Subscription API Documentation

**Base URL:** `/backoffice/subscriptions`

Semua endpoint memerlukan **autentikasi JWT**.

---

## 📌 Get All Subscriptions

**GET** `/backoffice/subscriptions`

### Query Parameters

| Parameter | Tipe   | Default | Keterangan                         |
| --------- | ------ | ------- | ---------------------------------- |
| `page`    | number | 1       | Halaman                            |
| `limit`  | number | 10      | Jumlah per halaman                 |
| `keyword` | string | -       | Filter nama tenant (case-insensitive) |
| `status`  | string | -       | Filter status subscription         |

### Response

```json
{
  "status": 200,
  "message": "Get all subscriptions success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "tenant_id": "550e8400-e29b-41d4-a716-446655440010",
      "tenant_name": "Agen Berkah Cahaya",
      "plan": "Premium",
      "status": "active",
      "amount": "199000",
      "user_quota": 10,
      "branch_quota": 3,
      "period_start": "2025-09-01T00:00:00.000Z",
      "period_end": "2025-10-01T00:00:00.000Z",
      "is_trial": false,
      "paid_at": "2025-08-25T10:30:00.000Z",
      "created_at": "2025-08-25T10:30:00.000Z",
      "updated_at": "2025-09-01T00:00:00.000Z"
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

## 📌 Cancel Subscription

**POST** `/backoffice/subscriptions/:id/cancel`

Membatalkan subscription.

### Example

```
POST /backoffice/subscriptions/550e8400-e29b-41d4-a716-446655440001/cancel
```

### Response

```json
{
  "status": 200,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscription_id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "cancelled"
  }
}
```

---

## 📌 Delete Subscription

**DELETE** `/backoffice/subscriptions/:id`

Menghapus subscription secara permanen.

### Example

```
DELETE /backoffice/subscriptions/550e8400-e29b-41d4-a716-446655440001
```

### Response

```json
{
  "status": 200,
  "message": "Subscription deleted successfully",
  "data": {
    "subscription_id": "550e8400-e29b-41d4-a716-446655440001",
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
  "message": "Subscription not found"
}
```
