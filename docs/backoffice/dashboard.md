# 📊 Dashboard API Documentation

**Base URL:** `/backoffice/dashboard`

Semua endpoint memerlukan **autentikasi JWT**.

---

## 📌 Get Dashboard Summary

**GET** `/backoffice/dashboard/summary`

### Query Parameters

| Parameter | Tipe   | Default | Keterangan       |
| --------- | ------ | ------- | ---------------- |
| `year`    | number | -       | Tahun filter (opsional) |

### Response

```json
{
  "status": 200,
  "message": "Get dashboard summary success",
  "data": {
    "tenants": {
      "total": 150,
      "by_status": {
        "active": 120,
        "inactive": 30
      }
    },
    "users": {
      "total": 450
    },
    "profit": {
      "total": "15000000"
    },
    "acquisition": {
      "today": {
        "tenants": 5,
        "users": 12
      },
      "last_7_days": {
        "tenants": 35,
        "users": 89
      },
      "last_30_days": {
        "tenants": 150,
        "users": 320
      }
    },
    "monthly_acquisition": [
      {
        "month": 1,
        "trial": 10,
        "subscribe": 5
      },
      {
        "month": 2,
        "trial": 15,
        "subscribe": 8
      }
    ],
    "cumulative_users": [
      {
        "month": 1,
        "semua": 100,
        "subscribe": 80,
        "trial": 20
      },
      {
        "month": 2,
        "semua": 150,
        "subscribe": 120,
        "trial": 30
      }
    ],
    "year": 2025
  }
}
```

---

## 📋 Field Descriptions

### Tenants

| Field     | Tipe          | Keterangan                           |
| --------- | ------------- | ------------------------------------ |
| total     | number        | Total semua tenant                   |
| by_status | Record<string, number> | Jumlah tenant per status      |

### Users

| Field | Tipe   | Keterangan        |
| ----- | ------ | ----------------- |
| total | number | Total semua user |

### Profit

| Field | Tipe   | Keterangan           |
| ----- | ------ | -------------------- |
| total | string | Total profit (Rupiah) |

### Acquisition

| Field          | Tipe   | Keterangan                           |
| -------------- | ------ | ------------------------------------ |
| today          | object | Akuisisi hari ini                    |
| last_7_days    | object | Akuisisi 7 hari terakhir             |
| last_30_days   | object | Akuisisi 30 hari terakhir             |

### Monthly Acquisition

Array dari objek akuisisi per bulan.

| Field    | Tipe   | Keterangan                   |
| -------- | ------ | ---------------------------- |
| month    | number | Bulan (1-12)                |
| trial    | number | Jumlah tenant trial baru     |
| subscribe | number | Jumlah tenant subscribe baru |

### Cumulative Users

Array kumulatif user per bulan.

| Field     | Tipe   | Keterangan                    |
| --------- | ------ | ----------------------------- |
| month     | number | Bulan (1-12)                 |
| semua     | number | Total semua user             |
| subscribe | number | User yang subscribe           |
| trial     | number | User yang masih trial        |
