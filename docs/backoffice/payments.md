# 💳 Payment API Documentation

**Base URL:** `/backoffice/payments`

Semua endpoint memerlukan **autentikasi JWT**.

---

## 📌 Get All Payments

**GET** `/backoffice/payments`

### Query Parameters

| Parameter | Tipe   | Default | Keterangan                         |
| --------- | ------ | ------- | ---------------------------------- |
| `page`    | number | 1       | Halaman                            |
| `limit`  | number | 10      | Jumlah per halaman                 |
| `keyword` | string | -       | Filter nama tenant (case-insensitive) |
| `status`  | string | -       | Filter status payment             |

### Response

```json
{
  "status": 200,
  "message": "Get all payments success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "tenant_id": "550e8400-e29b-41d4-a716-446655440010",
      "tenant_name": "Agen Berkah Cahaya",
      "subscription_id": "550e8400-e29b-41d4-a716-446655440020",
      "subscription_plan": "Premium",
      "order_id": "ORD-2025-001",
      "provider": "midtrans",
      "project_slug": "agen-cerdas",
      "amount": "199000",
      "payment_url": "https://midtrans.example.com/pay/123456",
      "status": "pending",
      "paid_at": null,
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

## 📋 Payment Status

| Status     | Keterangan                    |
| ---------- | ----------------------------- |
| `pending`  | Menunggu pembayaran           |
| `paid`     | Sudah dibayar                 |
| `expired`  | Kadaluarsa                    |
| `failed`   | Gagal                         |
| `cancelled` | Dibatalkan                  |

---

## 📌 Get Payment Detail

**GET** `/backoffice/payments/:id`

### Example

```
GET /backoffice/payments/550e8400-e29b-41d4-a716-446655440001
```

### Response

```json
{
  "status": 200,
  "message": "Get payment detail success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440010",
    "tenant_name": "Agen Berkah Cahaya",
    "subscription_id": "550e8400-e29b-41d4-a716-446655440020",
    "subscription_plan": "Premium",
    "order_id": "ORD-2025-001",
    "provider": "midtrans",
    "project_slug": "agen-cerdas",
    "amount": "199000",
    "payment_url": "https://midtrans.example.com/pay/123456",
    "status": "pending",
    "paid_at": null,
    "created_at": "2025-09-19T08:26:46.000Z",
    "updated_at": "2025-09-19T08:26:46.000Z",
    "raw_response": {
      "transaction_id": "midtrans_123",
      "gross_amount": "199000"
    }
  }
}
```

---

## 📌 Validate Payment

**POST** `/backoffice/payments/:id/validate`

Memvalidasi payment dari provider (misalnya Midtrans).

### Example

```
POST /backoffice/payments/550e8400-e29b-41d4-a716-446655440001/validate
```

### Response

```json
{
  "status": 200,
  "message": "Payment validated successfully",
  "data": {
    "ok": true,
    "duplicate": false,
    "activated": true,
    "payment_status": "paid",
    "pakasir_status": "active"
  }
}
```

### Response Fields

| Field          | Tipe    | Keterangan                          |
| -------------- | ------- | ----------------------------------- |
| ok             | boolean | Apakah validasi berhasil           |
| duplicate      | boolean | Apakah payment duplikat             |
| activated      | boolean | Apakah subscription sudah aktiv     |
| payment_status | string  | Status payment dari provider        |
| pakasir_status | string  | Status dari Pakasir                |

---

## ⚠️ Error Responses

### Not Found (404)

```json
{
  "status": 404,
  "message": "Payment not found"
}
```
