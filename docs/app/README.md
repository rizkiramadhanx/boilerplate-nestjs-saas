# 📚 Client App API Documentation

Dokumentasi API untuk module Client App (agen-cerdas-client).

---

## 📁 Daftar Module

| Module | File | Base URL |
| ------ | ----- | -------- |
| [Auth](./auth.md) | `auth.md` | `/auth` |
| [Users](./users.md) | `users.md` | `/user` |
| [Roles](./roles.md) | `roles.md` | `/role` |
| [Products](./products.md) | `products.md` | `/product` |
| [Categories](./categories.md) | `categories.md` | `/category` |

---

## 🔐 Authentication

Sebagian besar endpoint memerlukan **autentikasi JWT** di header:

```
Authorization: Bearer <access_token>
```

Beberapa endpoint (seperti Auth) tidak memerlukan autentikasi.
