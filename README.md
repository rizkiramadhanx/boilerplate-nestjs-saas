# Kubik Boilerplate — Backend Nestjs

Backend **NestJS** untuk aplikasi toko emas (Kubix). Menggunakan **PostgreSQL** dengan **TypeORM**, autentikasi JWT, sistem role & permission, serta modul produk, kategori, user, dan outlet.

## Daftar Isi

- [Fitur](#fitur)
- [Persyaratan](#persyaratan)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Testing](#testing)
- [Migrasi Database](#migrasi-database)
- [Dokumentasi API](#dokumentasi-api)
- [Lisensi](#lisensi)

## Fitur

- **Autentikasi**: Register, login, refresh token, verifikasi email
- **Autorisasi**: Role-based access dengan permission (user, product, category, role, dll.)
- **Modul**: Users, Products, Categories, Roles, Outlets
- **Database**: PostgreSQL + TypeORM (migrations)
- **Mailer**: Verifikasi email (Nodemailer + Handlebars)

## Persyaratan

- **Node.js** (v18+ disarankan)
- **PostgreSQL**
- **npm** atau **bun**

## Instalasi

1. Clone repository:

   ```bash
   git clone <url-repo>
   cd boilerplate-nestjs-saas
   ```

2. Pasang dependensi:

   ```bash
   npm install
   ```

3. Salin file env dan isi nilai yang sesuai:

   ```bash
   cp .env.example .env
   ```

## Konfigurasi

Buat file `.env` di root proyek. Contoh struktur (lihat `.env.example`):

```env
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_NAME=kubix_db

# App
NODE_ENV=development
PORT=3000
FRONT_END_URL=http://localhost:5173

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h

JWT_SECRET_REFRESH=your_jwt_refresh_secret
JWT_EXPIRES_IN_REFRESH=7d

# Mail (verifikasi email)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=
MAIL_FROM=noreply@example.com
```

## Menjalankan Aplikasi

- Development (watch mode):

  ```bash
  npm run start:dev
  ```

- Production:

  ```bash
  npm run build
  npm run start:prod
  ```

Aplikasi berjalan di `http://localhost:3000` (atau nilai `PORT` di `.env`).

## Testing

- Menjalankan semua unit test:

  ```bash
  npm test
  ```

- Watch mode:

  ```bash
  npm run test:watch
  ```

- Coverage:

  ```bash
  npm run test:cov
  ```

- E2E:

  ```bash
  npm run test:e2e
  ```

## Migrasi Database

- Menjalankan migrasi:

  ```bash
  npm run migration:run
  ```

- Membuat migrasi baru:

  ```bash
  npm run migration:create -- src/migration/NamaMigrasi
  ```

- Generate migrasi dari perubahan entity:

  ```bash
  npm run migration:generate -- src/migration/NamaMigrasi
  ```

Panduan lengkap: [guide/migration.md](guide/migration.md).

## Dokumentasi API

Detail endpoint dan request/response ada di folder `docs/`:

| Modul      | File                                     | Deskripsi                                  |
| ---------- | ---------------------------------------- | ------------------------------------------ |
| Auth       | [docs/auth.md](docs/auth.md)             | Login, register, refresh, verifikasi email |
| Users      | [docs/users.md](docs/users.md)           | CRUD user, profile                         |
| Products   | [docs/products.md](docs/products.md)     | CRUD produk                                |
| Categories | [docs/categories.md](docs/categories.md) | CRUD kategori                              |
| Roles      | [docs/roles.md](docs/roles.md)           | Manajemen role & permission                |

## Scripts

| Perintah             | Keterangan         |
| -------------------- | ------------------ |
| `npm run start:dev`  | Dev server (watch) |
| `npm run build`      | Build production   |
| `npm run start:prod` | Jalankan build     |
| `npm test`           | Unit test          |
| `npm run lint`       | ESLint             |
| `npm run format`     | Prettier           |

## Lisensi

UNLICENSED (private).
