# Brainstorming: SaaS Pencatat Agen BRILink Multicabang

> Dokumentasi keputusan desain dan brainstorming untuk aplikasi SaaS pencatatan transaksi agen BRILink (dan layanan keuangan sejenis) dengan dukungan multi-tenant dan multi-cabang.

## Daftar Isi

1. [Product Overview](#product-overview)
2. [Business Model](#business-model)
3. [Pricing Strategy](#pricing-strategy)
4. [Target Market](#target-market)
5. [Arsitektur SaaS](#arsitektur-saas)
6. [Database Design](#database-design)
7. [Payment Integration](#payment-integration)
8. [Technical Stack](#technical-stack)
9. [Roadmap](#roadmap)
10. [Keputusan Desain Penting](#keputusan-desain-penting)
11. [Lampiran](#lampiran)

---

## Product Overview

### Nama Produk
**Buku Agen** (working title) — aplikasi pencatatan transaksi untuk agen BRILink dan layanan keuangan sejenis.

### Problem Statement

Aplikasi BRILink Mobile/EDC dari BRI hanya mencatat transaksi yang berhasil diproses di sistem BRI. Yang tidak tercatat tapi krusial untuk agen:

1. Biaya admin yang diterima cash dari nasabah (pendapatan utama agen)
2. Rekap per teller/cabang (kalau punya banyak cabang atau pegawai)
3. Posisi kas tunai vs saldo rekening secara real-time
4. Selisih kas per shift/per hari
5. Laba bersih per cabang (admin – fee – operasional)
6. Setoran modal & penarikan keuntungan antar cabang/owner

### Target User

- **Primary:** Pemilik agen BRILink dengan 1+ cabang
- **Secondary:** Pegawai/teller yang mencatat transaksi harian
- **Extended:** Agen layanan keuangan lain (BTN, DANA, OVO, GoPay, dll)

---

## Business Model

### Konsep Agen BRILink (Background)

BRILink adalah perluasan layanan BRI di mana BRI menjalin kerja sama dengan nasabah BRI sebagai agen yang dapat melayani transaksi perbankan bagi nasabahnya (program Laku Pandai OJK).

**Sumber pendapatan agen:**

1. **Fee dari BRI (sharing fee)** — 50:50 revenue sharing, masuk ke rekening BRI agen
   - Transfer sesama BRI: Rp 1.500
   - Transfer antar bank: Rp 6.000
   - PLN: Rp 1.500
   - Pulsa: Rp 500-1.575

2. **Biaya admin dari nasabah** — ditentukan sendiri oleh agen, dibayar cash
   - Typical Rp 2.000 - Rp 10.000 tergantung jenis & nominal

**Kewajiban agen:**
- Target 200 transaksi/bulan (setelah grace period 6 bulan)
- Uang jaminan Rp 3.000.000 (untuk EDC)
- Saldo rekening cukup untuk transaksi besar

### Model Bisnis SaaS Kita

**Kita = SaaS vendor** yang menjual aplikasi ke agen BRILink (tenant) dengan langganan bulanan/6-bulanan/tahunan.

**Value proposition:**
- Catat biaya admin cash yang tidak tercatat BRI
- Dashboard multi-cabang untuk owner
- Rekap per teller, per shift, per cabang
- Monitoring kas cash vs saldo rekening real-time
- Multi-provider (bukan cuma BRILink — bisa BTN, DANA, OVO, dll)

---

## Pricing Strategy

### Final Pricing (3 Tier)

| Tier | Harga | Per Bulan Effective | Discount | Keterangan |
|---|---|---|---|---|
| **Bulanan** | Rp 49.000/bulan | Rp 49.000 | 0% | Rp 10rb bulan pertama (intro) |
| **6 Bulan** ⭐ | Rp 249.000 | Rp 41.500 | 15% | Paling populer |
| **Tahunan** | Rp 439.000 | Rp 36.583 | 25% | Commitment tertinggi |

### Extra Charges

- **Extra user**: +Rp 5.000/user/bulan (di atas 3 user default)
- **Extra cabang**: +Rp 10.000/cabang/bulan (di atas 1 cabang default)

### Trial

- **14 hari** free trial
- **Max 100 transaksi** selama trial

### Aturan Kuota & Pricing

**Tambah user/cabang:**
- Kuota naik → `harga_bulanan` naik → berlaku untuk periode berikutnya
- Periode berjalan tidak ditagih ulang (sudah dibayar)

**Hapus user/cabang:**
- Kuota turun → `harga_bulanan` turun → **berlaku langsung** (tapi bulan ini tetap bayar penuh karena sudah dibayar)
- Tidak ada proration, tidak ada credit balance
- Minimal harus ada 1 cabang (tidak boleh hapus cabang terakhir)

**Soft delete:**
- Cabang yang dihapus → `deleted_at` diisi, data lama tetap accessible
- User yang dihapus → `is_active=false`

### Revenue Projection

Distribusi realistis mix tier dari 100 tenant:

| Tier | % | Count | Revenue Efektif |
|---|---|---|---|
| Bulanan | 30% | 30 | Rp 1.470.000 |
| 6 Bulan | 50% | 50 | Rp 2.075.000 |
| Tahunan | 20% | 20 | Rp 731.667 |
| **Total MRR** | | | **~Rp 4.28 juta/bulan** |

**Annual revenue estimate: ~Rp 51-60 juta/tahun** (base, belum extra).

### Kompetitor Pricing

| Produk | Harga/bulan | Target |
|---|---|---|
| Agenkas | Tidak displayed | Agen BRILink |
| Fioriz | Request demo | Agen BRILink (sejak 2018) |
| Kaslink | 3 tier | Konter & agen |
| Kledo | Rp 99-249rb | UMKM accounting |
| Majoo | ~Rp 250rb | POS kasir |
| BukuWarung/BukuKas | Free | UMKM warung (monetize via loan) |

**Positioning kita:** Lebih murah dari kompetitor general (Kledo, Majoo), transparent pricing (vs kompetitor niche yang "request demo").

---

## Target Market

### Market Size

- **Total agen BRILink Indonesia:** 500rb - 1jt (estimasi)
- **Butuh pencatatan digital:** ~30% (150rb-300rb)
- **Willing to pay SaaS:** ~10% (50rb-100rb)
- **Addressable market:** 50rb-100rb agen

**Target 1% market share dalam 2-3 tahun = 500-1000 tenant**

### Revenue Projection Growth

| Period | Tenant | MRR | Annual Revenue |
|---|---|---|---|
| Year 1 (bulan 12) | 50-100 | Rp 2-4jt | Rp 30-60jt |
| Year 2 | 200-500 | Rp 8-20jt | Rp 120-300jt |
| Year 3 | 500-1000 | Rp 20-40jt | Rp 300-600jt |

---

## Arsitektur SaaS

### Multi-Tenant Strategy

**Pola:** Shared Database, Shared Schema, Isolasi by `tenant_id`

```
1 Database
  └── Semua tenant data dalam tabel yang sama
       └── Dipisah logical by tenant_id
            └── Middleware auto-filter setiap query
```

**Keuntungan:** Murah, gampang scale, mudah maintain.

### Tenant Identification

**Method:** JWT authentication (MVP), bisa upgrade ke subdomain (`pakahmad.app.com`) nanti.

### Konsep Tenant vs Branch

- **Tenant** = unit isolasi tertinggi = 1 akun pelanggan SaaS (1 owner)
- **Branch** = outlet fisik di dalam 1 tenant
- **User** = pegawai di dalam 1 tenant, bisa di-assign ke banyak cabang dengan role berbeda

**Contoh:**
```
Tenant "Pak Ahmad Grup"
  ├── Cabang Jakarta Barat (role: Budi=admin, Siti=teller)
  ├── Cabang Jakarta Timur
  └── Cabang Tangerang (role: Budi=teller, Ahmad=admin)

Tenant "Bu Rina Agen"  ← data terisolasi penuh dari Pak Ahmad
  └── Cabang Surabaya
```

### User Authorization

**2 level akses:**
1. **Owner** (`is_owner=true`) — bisa semua, akses ke semua cabang miliknya
2. **Staff** — role ditentukan per cabang (`user_branch.role_id`)

**Role untuk end user** (global, dipakai semua tenant):
- `branch_admin` — bisa manage cabang spesifik
- `teller` — cuma input transaksi

**Admin SaaS** (developer/ops) — tabel terpisah, no level (flat access).

---

## Database Design

### Total 17 Tabel

**SaaS Layer (7 tabel):**
1. `admin` — akun admin panel SaaS
2. `tenant` — akun pelanggan SaaS
3. `pricing_config` — konfigurasi harga global
4. `subscription` — history tagihan & pembayaran
5. `subscription_change_log` — audit trail perubahan kuota
6. `payment_attempt` — percobaan pembayaran ke Pakasir
7. `payment_webhook_log` — log webhook untuk audit

**Application Layer (10 tabel):**
8. `user` — akun end user
9. `branch` — cabang/outlet
10. `role` — role end user (global)
11. `user_branch` — pivot M:N user-branch + role per cabang
12. `account` — kas (cash/bank/e_wallet/pulsa/other)
13. `customer` — nasabah tetap (opsional)
14. `fee_transaction` — default tarif per `transaction_type` enum (bracket pricing)
15. `shift` — buka/tutup kas teller
16. `transaction` — record transaksi ke nasabah
17. `account_movement` — audit trail cashflow

> `transaction_type` **bukan tabel** — jadi enum di code. Tiap tipe butuh perlakuan berbeda (validasi field, form, fee rule, integrasi provider), jadi tabel generic percuma — code tetap branch per tipe. Enum = source of truth perlakuan + type-safe.

### Tipe Account

```
cash       → Kas tunai (laci, brankas)
bank       → Rekening bank (BRI, BTN, Mandiri, BCA)
e_wallet   → Saldo e-wallet (DANA, OVO, GoPay, ShopeePay, LinkAja)
pulsa      → Saldo pulsa H2H (Digipos, MTronik, RajaBiller)
other      → Lainnya (Tabungan Emas, voucher, dll)
```

### Kategori Transaksi

```
cash       → Tarik tunai, setor tunai
transfer   → Transfer sesama bank, antar bank, BRIVA
payment    → PLN, BPJS, PDAM, cicilan, asuransi, SPP
top_up     → Pulsa, paket data, e-wallet, token listrik, voucher game
```

### Pattern Cash Flow

| Kategori | cash_flow | account_flow | Contoh |
|---|---|---|---|
| Tarik tunai | out | in | Cash keluar (ke customer), rekening BRILink agen masuk (settlement dari BRI) |
| Setor tunai | in | out | Cash masuk (dari customer), rekening BRILink agen keluar (didebit untuk transfer ke rek customer) |
| Transfer/PPOB/Top up | in | out | Cash masuk (admin dari customer), rekening keluar |

**Mayoritas transaksi BRILink:** cash IN + account OUT (kecuali tarik tunai yang berlawanan: cash OUT + account IN)

### Detail Transaksi (Nullable Columns)

Tiap `transaction` punya 3 kolom generic untuk info tujuan:

- `destination_number` — no rekening, HP, meter, pelanggan, BPJS
- `destination_name` — nama penerima atau pelanggan
- `destination_provider` — nama bank, operator, area PLN

### Transaction Type (Enum)

Didefinisikan di code sebagai enum. Contoh nilai (final list di-refine saat implementasi):

```
cash:     tarik_tunai, setor_tunai
transfer: transfer_sesama_bri, transfer_antar_bank
payment:  pln_token, pln_pasca, bpjs_kesehatan, pdam, indihome, cicilan
top_up:   pulsa, paket_data, ewallet_dana, ewallet_ovo, ewallet_gopay, voucher_game
```

Per tipe di-attach handler (strategy pattern) yang tentukan:
- `category`, `cash_flow`, `account_flow` (konstanta lookup)
- Validasi field tujuan (transfer → no rekening + bank, PLN → meter_no, pulsa → no HP + operator)
- Formula fee (bracket vs flat)
- Label display (i18n)

Tenant-level enable/disable cukup via config (misal kolom `enabled_transaction_types jsonb` di `tenant`) — bukan tabel terpisah.

### Fee Structure (Bracket Pricing)

Semantik:
- `customer_fee` — biaya admin yang ditagih ke nasabah (penambah kas/pendapatan agen)
- `agent_fee` — fee yang dibebankan provider ke saldo rekening agen (**pengurang** saldo, biaya operasional)

Tabel `fee_transaction` = `{ tenant_id, transaction_type (enum), min_amount, max_amount, customer_fee, agent_fee }`. Support bracket pricing:

```
transfer_antar_bank:
  0 – 100.000        → customer_fee 5.000,  agent_fee 3.000
  100.001 – 500.000  → customer_fee 6.000,  agent_fee 3.500
  500.001 – 1.000.000 → customer_fee 7.000, agent_fee 4.000
  1.000.001+         → customer_fee 10.000, agent_fee 5.000

pln_token (flat):
  0 – 999.999.999 → customer_fee 2.500, agent_fee 1.500
```

**Fee hanya sebagai default.** Saat transaksi disimpan, nilai di-snapshot ke `transaction.customer_fee` & `agent_fee` — jadi update tarif tidak merusak histori.

### Account Movement (Audit Trail)

Setiap perubahan `account.balance` di-log di `account_movement`. Source:

- `principal` — nominal transaksi utama
- `customer_fee` — biaya admin dari nasabah
- `agent_fee` — fee yang dibebankan provider ke saldo rekening agen (pengurang)
- `capital_deposit` — owner setor modal
- `profit_withdrawal` — owner tarik keuntungan
- `internal_transfer` — pindah antar kas
- `adjustment` — koreksi selisih

### Balance Strategy

**Running balance** di `account.balance` (bukan computed):
- Setiap transaksi, `account.balance` langsung di-update + insert `account_movement`
- Dua operasi dalam 1 DB transaction (atomic)
- Query saldo = super cepat (O(1))
- Audit trail tetap ada di `account_movement`

---

## Payment Integration

### Provider: Pakasir

Payment gateway lokal Indonesia (QRIS & Virtual Account). Dipakai **untuk subscription saja** (tenant bayar ke kita), bukan untuk transaksi operasional.

### Mode: Redirect

```
1. Tenant pilih paket → checkout
2. Server generate order_id unik: SUB-{subscription_id}-{timestamp}
3. Server INSERT subscription (pending) + payment_attempt
4. Redirect ke https://app.pakasir.com/pay/{slug}/{amount}?order_id=...&redirect=...
5. User bayar via QRIS/VA di Pakasir
6. Pakasir kirim webhook ke server
7. Server verify + update status
```

### Security Checklist

- ✅ Validate `amount` match dari webhook
- ✅ Validate `project` slug match
- ✅ Idempotency check (jangan double process)
- ✅ Double-verify via API `transactiondetail`
- ✅ DB transaction atomic
- ✅ Log semua webhook mentah untuk debugging

### Env Variables

```env
PAKASIR_PROJECT_SLUG=agenbri
PAKASIR_API_KEY=xxx123...
PAKASIR_SANDBOX=false
APP_URL=https://app.agenbri.com
```

---

## Technical Stack

### Backend

- **Framework:** NestJS
- **Database:** PostgreSQL (atau MySQL)
- **ORM:** TypeORM atau Prisma
- **Cache:** Redis (untuk dashboard)
- **Queue:** BullMQ (untuk background job)

### Infrastructure

**MVP Phase (100 concurrent users):**
- VPS: 2-4 vCPU, 4-8 GB RAM, 40-80 GB SSD
- Budget: Rp 150-400rb/bulan
- Rekomendasi provider: Hetzner (best value), DigitalOcean, Biznet Gio

**Scale Phase (500+ tenant):**
- Split ke 2 VPS (app + DB)
- Add Redis untuk cache
- Managed DB service

### Frontend

- Framework: NextJS / Nuxt (SPA atau SSR)
- UI library: Tailwind + shadcn/ui
- State: Zustand / Pinia

### Monitoring & DevOps

- Error tracking: Sentry (free tier)
- Logging: Better Stack / Grafana Loki
- Deployment: Docker + CI/CD (GitHub Actions)

---

## Roadmap

### Phase 1: MVP Agen BRILink (Bulan 1-3)

- [x] Database design (18 tabel)
- [ ] Migration SQL
- [ ] NestJS scaffold + multi-tenant middleware
- [ ] Auth (login, register tenant)
- [ ] CRUD cabang, user, account
- [ ] Define `TransactionType` enum + handler per tipe (strategy pattern)
- [ ] CRUD fee_transaction (bracket pricing per enum)
- [ ] Input transaction + account_movement
- [ ] Shift management
- [ ] Dashboard basic (cashflow harian, profit, saldo akun)
- [ ] Laporan per cabang, per user
- [ ] Subscription & Pakasir integration
- [ ] Onboarding wizard
- [ ] Landing page + pricing page

### Phase 2: POS Module (Bulan 4-6)

Dari feedback user, tambahkan:

- [ ] Product management (kategori, supplier, produk)
- [ ] Stock management (in, out, adjustment)
- [ ] Penjualan barang fisik (sale + sale_item)
- [ ] Pembayaran POS via cash/QRIS/transfer
- [ ] Laporan profit gabungan (BRILink + POS)

**Tambahan tabel:** `product_category`, `supplier`, `product`, `product_stock_movement`, `sale`, `sale_item`

### Phase 3: Advanced Features (Bulan 7-12)

- [ ] WhatsApp notification ke nasabah
- [ ] Export PDF/Excel branded
- [ ] Dashboard analytics advanced
- [ ] Multi-user di cabang yang sama (shift paralel)
- [ ] Hutang nasabah (piutang)
- [ ] Target tracking (monitor 200 tx/bulan BRI)
- [ ] Referral program

### Phase 4: Scale & Enterprise (Year 2+)

- [ ] API untuk integrasi pihak ketiga
- [ ] Multi-bahasa
- [ ] White-label option
- [ ] Mobile app native (Android/iOS)
- [ ] Advanced reporting (dashboard realtime)

---

## Keputusan Desain Penting

### 1. Multi-Tenant dengan Shared DB

**Alasan:** Paling cost-effective untuk SaaS UMKM. Pattern yang dipakai Shopify, Notion, Linear.

### 2. Role di pivot `user_branch`, bukan di `user`

**Alasan:** User bisa punya role berbeda di cabang berbeda (admin di cabang A, teller di cabang B).

### 3. Username unique per tenant

**Alasan:** Tenant A dan tenant B bisa sama-sama punya user "budi" tanpa konflik.

### 4. Tidak ada tabel `provider` master

**Alasan:** Tenant bikin `account` dengan nama bebas (BRILink, DANA, BTN, dll). Lebih fleksibel, gak perlu kita maintain master list.

### 5. `transaction_type` sebagai enum di code (bukan tabel)

**Alasan:** Tiap tipe transaksi punya perlakuan berbeda — validasi field, form input, formula fee, integrasi provider. Tabel generic `{name, category, cash_flow, account_flow}` tidak cukup menampung perbedaan ini — code bakal tetap `switch` per tipe, jadi tabel malah metadata redundant. Enum + handler per tipe (strategy pattern) = source of truth perlakuan, type-safe, compile-time check. Tenant-level enable/disable cukup via config field di `tenant`. Trade-off: nambah tipe baru = deploy (acceptable karena jenis layanan BRILink relatif stabil).

### 6. `fee_transaction` sebagai default value (bukan source of truth)

**Alasan:** Nilai final di-snapshot ke `transaction`. Update tarif tidak merusak histori transaksi lama.

### 7. Running balance di `account.balance`

**Alasan:** Query saldo super cepat. `account_movement` tetap sebagai audit trail untuk verifikasi.

### 8. 3 kolom generic untuk destination

**Alasan:** 90% kebutuhan tercover (rekening, HP, meter, pelanggan = semua "no tujuan"). Tetap simpel tapi query-able.

### 9. Pakasir hanya untuk subscription

**Alasan:** Transaksi operasional agen BRILink pakai EDC/aplikasi BRI sendiri. Pakasir cuma buat tenant bayar ke SaaS.

### 10. Soft delete untuk cabang

**Alasan:** Data transaksi lama milik cabang itu tetap penting buat laporan. Tinggal hide dari UI.

### 11. POS module ditunda ke Phase 2

**Alasan:** Fokus ke BRILink dulu, validasi product-market fit. POS tambah nanti kalau permintaan ada.

### 12. Admin SaaS flat (no level)

**Alasan:** Skala awal kecil, gak butuh hierarchy. Semua admin = full access.

---

## Lampiran

### A. Layanan Umum Agen BRILink

**Transaksi Paling Umum:**
- Transfer sesama BRI, antar bank, BRIVA, BI-Fast
- Tarik tunai BRI, bank lain, tanpa kartu
- Setor tunai

**PPOB:**
- PLN Token/Pascabayar
- PDAM, PGN
- BPJS Kesehatan/Ketenagakerjaan
- PBB, Samsat, Pajak
- Internet, TV Kabel, Telepon
- Cicilan (motor, KPR, kartu kredit, online)
- Asuransi (Prudential, Allianz, AIA)
- SPP Sekolah, UKT

**Top Up:**
- Pulsa & paket data (semua operator)
- E-wallet (GoPay, OVO, DANA, ShopeePay, LinkAja)
- BRIZZI, e-Money, Flazz, Tapcash
- Voucher game, Steam, iTunes
- Tabungan Emas Pegadaian

### B. Fee Typical

| Layanan | Biaya Admin | Sharing Fee |
|---|---|---|
| Transfer sesama BRI | Rp 2.000-5.000 | Rp 1.500 |
| Transfer antar bank | Rp 5.000-10.000 | Rp 3.000-6.000 |
| Tarik tunai | Rp 3.000-5.000 | Rp 1.500 |
| Setor tunai | Rp 2.000-5.000 | Rp 1.500 |
| PLN Pasca/Token | Rp 2.000-3.000 | Rp 1.500 |
| BPJS | Rp 2.500-5.000 | Rp 1.500-2.000 |
| Pulsa | Rp 500-2.000 | Rp 100-1.000 |
| Top Up E-Wallet | Rp 1.000-3.000 | Rp 500-1.500 |

### C. Ringkasan Perjalanan Brainstorming

Brainstorming ini melalui tahapan:

1. **ERD awal** — single-tenant, simple schema
2. **Multi-branch** — cabang, user, role, kas
3. **Multi-user per branch** — pivot M:N dengan role per cabang
4. **Multi-account per branch** — cash, bank, e-wallet, dll
5. **SaaS conversion** — multi-tenant dengan isolasi tenant_id
6. **Pricing design** — 3 tier dengan proration rules
7. **Payment integration** — Pakasir (redirect mode)
8. **POS module consideration** — ditunda ke Phase 2
9. **Detail transaction fields** — 3 kolom generic (destination_*)
10. **Fee structure** — bracket pricing as default value

### D. Skills yang Dibutuhkan

**Teknis:**
- NestJS, TypeScript
- PostgreSQL/MySQL, SQL optimization
- Payment gateway integration
- Multi-tenant architecture
- Redis caching (nanti)

**Non-teknis:**
- Marketing ke komunitas BRILink (FB Group, WA, TikTok)
- Customer support responsive
- Product analytics (mix panel / posthog)

### E. Resources

**Dokumentasi:**
- Pakasir API: https://pakasir.com/p/docs
- NestJS: https://docs.nestjs.com

**Kompetitor untuk riset:**
- Agenkas: https://agenkas.com
- Fioriz: https://fioriz.id
- Kaslink: https://smartkaslink.com
- Tokobang: https://tokobang.com

**Community:**
- Facebook Group Agen BRILink
- WhatsApp Group komunitas agen
- TikTok #agenbrilink

---

## Changelog

| Tanggal | Revisi |
|---|---|
| 2026-04-20 | Initial brainstorming dokumen |

---

**Status dokumen:** Draft v1.0  
**Next action:** Migration SQL + NestJS scaffold
