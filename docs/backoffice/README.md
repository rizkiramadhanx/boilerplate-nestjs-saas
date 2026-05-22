# 📚 Backoffice API Documentation

Dokumentasi API untuk module Backoffice Admin.

---

## 📁 Daftar Module

| Module | File | Base URL |
| ------ | ----- | -------- |
| [Admins](./admins.md) | `admins.md` | `/backoffice/admins` |
| [Pricing](./pricing.md) | `pricing.md` | `/backoffice/pricing` |
| [Tenants](./tenants.md) | `tenants.md` | `/backoffice/tenants` |
| [Dashboard](./dashboard.md) | `dashboard.md` | `/backoffice/dashboard` |
| [Subscriptions](./subscriptions.md) | `subscriptions.md` | `/backoffice/subscriptions` |
| [Addons](./addons.md) | `addons.md` | `/backoffice/addons` |
| [Payments](./payments.md) | `payments.md` | `/backoffice/payments` |

---

## 🔐 Authentication

Semua endpoint Backoffice memerlukan **autentikasi JWT** di header:

```
Authorization: Bearer <access_token>
```
