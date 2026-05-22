-- =====================================================================
-- SEED DATA: Transaksi Fisik (POS)
--   Input  : c_tenant_id (di-set di DECLARE di bawah)
--   Target : branch PERTAMA milik tenant tsb (ASC by created_at)
--
-- Untuk cari tenant_id-nya:
--   SELECT id, name, owner_email FROM tenants ORDER BY created_at;
--
-- Yang dibuat (di branch pertama dari tenant target):
--   1. 5 accounts (Kas Utama, BCA, BRI, DANA, Pulsa) saldo random 3-4 jt per
--      akun (bulat ribuan), total sum max 20 jt
--   2. 5 categories aksesoris HP (Charger&Kabel, Audio, Pelindung HP,
--      Power&Storage, Aksesoris Lain)
--   3. 30 products aksesoris HP (harga 10-95rb bulat ribuan, HPP 60-80%
--      dari harga), stok awal 500 / produk
--   4. 30 stock_movements awal (initial stock-in)
--   5. 400 transactions agen (transfer, tarik tunai, setor, payment, top up).
--      Principal kelipatan 50rb max 200rb (50/100/150/200rb), customer_fee
--      2-5rb. Tersebar di range dinamis (lihat di bawah)
--   6. ~600+ account_movements (principal + customer_fee + capital_deposit)
--      capital_deposit = auto top-up modal owner saat saldo nipis
--   7. 800 pos_orders tersebar di range dinamis (mix cash/bank/e_wallet),
--      total bulat ribuan, diskon bulat ribuan
--   8. ~2400 pos_order_items
--   9. ~2400 stock_movements (penjualan, direction=out)
--  10. 800 account_movements (penambahan saldo cash account dari POS)
--  11. accounts.balance semua 5 akun disinkronkan ke saldo akhir
--
-- RANGE TANGGAL: dinamis, dari awal bulan kalender LALU sampai NOW().
--   Contoh: dijalankan 2026-04-26 -> data tersebar 2026-03-01 .. 2026-04-26
--           dijalankan 2026-05-10 -> data tersebar 2026-04-01 .. 2026-05-10
--
-- Prasyarat:
--   - tenant aktif sudah punya minimal 1 branch yang ter-link via
--     user_branches (atau accounts existing)
--   - (opsional) minimal 1 user di branch tsb
--
-- Cara jalanin:
--   psql "$DATABASE_URL" -f src/seeder/seed-pos-data.sql
-- =====================================================================

BEGIN;

-- (Opsional) Wipe data POS branch pertama dari tenant target sebelum re-seed.
-- Ganti '<TENANT_ID>' dulu, lalu uncomment.
--
-- WITH t AS (
--   SELECT id AS branch_id FROM (
--     SELECT b.id, b.created_at FROM branches b
--      JOIN user_branches ub ON ub.branch_id = b.id
--      WHERE ub.tenant_id = '<TENANT_ID>'
--      ORDER BY b.created_at ASC LIMIT 1
--   ) x
-- )
-- DELETE FROM account_movements am USING pos_orders po, t
--   WHERE am.pos_order_id = po.id AND po.branch_id = t.branch_id;
-- DELETE FROM account_movements am USING transactions tx, t
--   WHERE am.transaction_id = tx.id AND tx.branch_id = t.branch_id;
-- DELETE FROM transactions WHERE branch_id = (SELECT branch_id FROM t);
-- ... (ulangi pola WHERE branch_id = (SELECT branch_id FROM t) untuk
--      stock_movements, pos_order_items, pos_orders, products, categories,
--      accounts dengan nama 'Kas Utama'/'BCA Operasional'/'BRI Cabang'/
--      'DANA Toko'/'Pulsa Telkomsel')

DO $seed$
DECLARE
-- ===> ISI tenant_id target di sini <===
c_tenant_id     CONSTANT UUID := '00000000-0000-0000-0000-000000000000';
c_total_orders  CONSTANT INT  := 800;     -- total pos_orders yang digenerate
c_initial_stock CONSTANT INT  := 500;     -- stok awal per produk
c_agent_total   CONSTANT INT  := 400;     -- total transaksi agen

-- Range tanggal data DINAMIS, dihitung saat query dijalankan:
--   start = awal bulan kalender LALU (date_trunc 'month' dari NOW - 1 month)
--   end   = NOW() saat seeder dijalankan
-- Contoh: kalau dijalankan 2026-04-26 -> 2026-03-01 .. 2026-04-26
v_range_start TIMESTAMPTZ;
v_range_end   TIMESTAMPTZ;
v_range_secs  DOUBLE PRECISION;

v_branch_id    UUID;       -- branch pertama dari tenant target
v_tenant_id    UUID;       -- = c_tenant_id setelah validasi
v_user_id      UUID;
v_cash_acct_id UUID;
v_cash_balance NUMERIC(18,2);

-- Bank/e-wallet/pulsa account untuk transaksi agen
v_acct_bca   UUID; v_bal_bca   NUMERIC(18,2);
v_acct_bri   UUID; v_bal_bri   NUMERIC(18,2);
v_acct_dana  UUID; v_bal_dana  NUMERIC(18,2);
v_acct_pulsa UUID; v_bal_pulsa NUMERIC(18,2);

v_cat_charger UUID;
v_cat_audio   UUID;
v_cat_screen  UUID;
v_cat_power   UUID;
v_cat_lain    UUID;

pd        JSONB;
pid       UUID;
cat_uuid  UUID;

v_order_idx     INT;
v_paid_at       TIMESTAMPTZ;
v_order_id      UUID;
v_subtotal      NUMERIC(18,2);
v_discount      NUMERIC(18,2);
v_total         NUMERIC(18,2);
v_payment       VARCHAR(16);
v_customer_name VARCHAR(100);
v_items_count   INT;
v_qty           INT;
v_line_sub      NUMERIC(18,2);

v_chosen          RECORD;
v_stock_before    INT;
v_stock_after     INT;
v_balance_before  NUMERIC(18,2);
v_balance_after   NUMERIC(18,2);
v_picked_ids      UUID[];

-- Variables untuk seksi transaksi agen (BRILink)
v_agent_idx     INT;
v_tx_id         UUID;
v_tx_type       VARCHAR(32);
v_principal     NUMERIC(18,2);
v_customer_fee  NUMERIC(18,2);
v_agent_fee     NUMERIC(18,2);
v_dest_number   VARCHAR(64);
v_dest_name     VARCHAR(255);
v_dest_provider VARCHAR(100);
v_cust_name_tx  VARCHAR(100);
v_bank_acct_id  UUID;
v_bank_balance  NUMERIC(18,2);
v_cash_flow     VARCHAR(4);
v_account_flow  VARCHAR(4);
v_cash_delta    NUMERIC(18,2);
v_bank_delta    NUMERIC(18,2);
v_topup         NUMERIC(18,2);
v_topup_count   INT := 0;
v_topup_total   NUMERIC(18,2) := 0;

v_payment_pool TEXT[] := ARRAY[
  'cash','cash','cash','cash','cash','cash','bank','bank','e_wallet'
];
v_customer_pool TEXT[] := ARRAY[
  NULL, NULL, NULL,
  'Customer Walk-in','Bu Sari','Pak Joko','Mbak Rina','Pak Budi','Mas Andi',
  'Bu Yati','Pak Hadi','Mbak Lia','Pak Tono','Bu Wati','Mas Eko',
  'Pak Slamet','Bu Indah','Mbak Dewi','Pak Bambang','Bu Lastri',
  'Pak Agus','Mas Riko','Mbak Yuni','Bu Painem','Pak Karjo'
];
v_payment_provider_pool TEXT[] := ARRAY['PLN','PDAM','Telkom','BPJS','Indihome'];
BEGIN
------------------------------------------------------------------
-- 0. Hitung range tanggal dinamis & validasi tenant
------------------------------------------------------------------
v_range_start := date_trunc('month', NOW() - INTERVAL '1 month');
v_range_end   := NOW();
v_range_secs  := EXTRACT(EPOCH FROM (v_range_end - v_range_start));

RAISE NOTICE 'Range tanggal seeding: % .. % (% hari)',
  v_range_start, v_range_end, round((v_range_secs / 86400.0)::numeric, 1);

IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = c_tenant_id) THEN
  RAISE EXCEPTION 'Tenant % tidak ditemukan di tabel tenants. Cek "SELECT id, name FROM tenants ORDER BY created_at;"', c_tenant_id;
END IF;
v_tenant_id := c_tenant_id;

-- Branch pertama tenant: link via user_branches, urut created_at ASC.
SELECT b.id INTO v_branch_id
FROM branches b
JOIN user_branches ub ON ub.branch_id = b.id
WHERE ub.tenant_id = v_tenant_id
ORDER BY b.created_at ASC
LIMIT 1;

-- Fallback: kalau user_branches kosong, coba via accounts.
IF v_branch_id IS NULL THEN
  SELECT b.id INTO v_branch_id
  FROM branches b
  JOIN accounts a ON a.branch_id = b.id
  WHERE a.tenant_id = v_tenant_id
  ORDER BY b.created_at ASC
  LIMIT 1;
END IF;

IF v_branch_id IS NULL THEN
  RAISE EXCEPTION 'Tenant % belum punya branch (cek user_branches/accounts).', v_tenant_id;
END IF;

SELECT u.id INTO v_user_id
FROM users u
WHERE u.branch_id = v_branch_id
LIMIT 1;

------------------------------------------------------------------
-- 0.5. Seed 5 accounts (idempotent by name+branch)
--      Saldo awal random 3-4 jt per akun (bulat ribuan).
--      Per akun ∈ [3 jt, 5 jt] (sesuai constraint user) dan
--      total sum semua akun GUARANTEED ≤ 20 jt (max 5 × 4 = 20 jt).
--      Saat saldo nipis di tengah transaksi, owner auto top-up modal
--      (lihat seksi 2.5: capital_deposit movement).
------------------------------------------------------------------
FOR pd IN SELECT * FROM jsonb_array_elements('[
  {"name":"Kas Utama","type":"cash","provider":null,"account_number":null},
  {"name":"BCA Operasional","type":"bank","provider":"BCA","account_number":"1234567890"},
  {"name":"BRI Cabang","type":"bank","provider":"BRI","account_number":"0987654321"},
  {"name":"DANA Toko","type":"e_wallet","provider":"DANA","account_number":"081234567890"},
  {"name":"Pulsa Telkomsel","type":"pulsa","provider":"Telkomsel","account_number":null}
]'::jsonb)
LOOP
  IF NOT EXISTS (
    SELECT 1 FROM accounts
    WHERE branch_id = v_branch_id AND name = pd->>'name'
  ) THEN
    INSERT INTO accounts
      (id, tenant_id, branch_id, name, type, balance, provider, account_number)
    VALUES (
      gen_random_uuid(),
      v_tenant_id,
      v_branch_id,
      pd->>'name',
      pd->>'type',
      round((3000000 + random() * 1000000) / 1000)::numeric * 1000,  -- 3.0-4.0 jt, bulat ribuan
      NULLIF(pd->>'provider',''),
      NULLIF(pd->>'account_number','')
    );
  END IF;
END LOOP;

------------------------------------------------------------------
-- 0.6. Load semua account ID + saldo (kas, BCA, BRI, DANA, Pulsa)
------------------------------------------------------------------
SELECT a.id, a.balance::numeric
  INTO v_cash_acct_id, v_cash_balance
FROM accounts a
WHERE a.branch_id = v_branch_id AND a.type = 'cash'
ORDER BY a.created_at ASC
LIMIT 1;

IF v_cash_acct_id IS NULL THEN
  RAISE EXCEPTION 'Cash account (type=cash) tidak ditemukan/terbuat untuk branch %.', v_branch_id;
END IF;

SELECT id, balance::numeric INTO v_acct_bca, v_bal_bca
  FROM accounts WHERE branch_id = v_branch_id AND name = 'BCA Operasional' LIMIT 1;
SELECT id, balance::numeric INTO v_acct_bri, v_bal_bri
  FROM accounts WHERE branch_id = v_branch_id AND name = 'BRI Cabang' LIMIT 1;
SELECT id, balance::numeric INTO v_acct_dana, v_bal_dana
  FROM accounts WHERE branch_id = v_branch_id AND name = 'DANA Toko' LIMIT 1;
SELECT id, balance::numeric INTO v_acct_pulsa, v_bal_pulsa
  FROM accounts WHERE branch_id = v_branch_id AND name = 'Pulsa Telkomsel' LIMIT 1;

RAISE NOTICE 'Mulai seeding: branch=% tenant=% user=% cash_acct=% saldo_awal=%',
  v_branch_id, v_tenant_id, COALESCE(v_user_id::text,'(NULL)'), v_cash_acct_id, v_cash_balance;

------------------------------------------------------------------
-- 1. Categories aksesoris HP (idempotent: skip kalau nama sudah ada di branch)
------------------------------------------------------------------
SELECT id INTO v_cat_charger FROM categories WHERE branch_id = v_branch_id AND name = 'Charger & Kabel' LIMIT 1;
IF v_cat_charger IS NULL THEN
  v_cat_charger := gen_random_uuid();
  INSERT INTO categories (id, name, branch_id) VALUES (v_cat_charger, 'Charger & Kabel', v_branch_id);
END IF;

SELECT id INTO v_cat_audio FROM categories WHERE branch_id = v_branch_id AND name = 'Audio' LIMIT 1;
IF v_cat_audio IS NULL THEN
  v_cat_audio := gen_random_uuid();
  INSERT INTO categories (id, name, branch_id) VALUES (v_cat_audio, 'Audio', v_branch_id);
END IF;

SELECT id INTO v_cat_screen FROM categories WHERE branch_id = v_branch_id AND name = 'Pelindung HP' LIMIT 1;
IF v_cat_screen IS NULL THEN
  v_cat_screen := gen_random_uuid();
  INSERT INTO categories (id, name, branch_id) VALUES (v_cat_screen, 'Pelindung HP', v_branch_id);
END IF;

SELECT id INTO v_cat_power FROM categories WHERE branch_id = v_branch_id AND name = 'Power & Storage' LIMIT 1;
IF v_cat_power IS NULL THEN
  v_cat_power := gen_random_uuid();
  INSERT INTO categories (id, name, branch_id) VALUES (v_cat_power, 'Power & Storage', v_branch_id);
END IF;

SELECT id INTO v_cat_lain FROM categories WHERE branch_id = v_branch_id AND name = 'Aksesoris Lain' LIMIT 1;
IF v_cat_lain IS NULL THEN
  v_cat_lain := gen_random_uuid();
  INSERT INTO categories (id, name, branch_id) VALUES (v_cat_lain, 'Aksesoris Lain', v_branch_id);
END IF;

------------------------------------------------------------------
-- 2. Products + initial stock-in movement
------------------------------------------------------------------
FOR pd IN SELECT * FROM jsonb_array_elements('[
  {"name":"Kabel Data Micro USB 1m","desc":"Kabel data Micro USB panjang 1 meter","price":15000,"hpp":10000,"sku":"KBL-MUS-1","cat":"charger"},
  {"name":"Kabel Data Type-C 1m","desc":"Kabel data USB Type-C panjang 1 meter","price":20000,"hpp":14000,"sku":"KBL-TPC-1","cat":"charger"},
  {"name":"Kabel Data Lightning 1m","desc":"Kabel data Lightning iPhone panjang 1 meter","price":35000,"hpp":25000,"sku":"KBL-LGT-1","cat":"charger"},
  {"name":"Kepala Charger 2A","desc":"Kepala charger USB output 2 Ampere","price":25000,"hpp":18000,"sku":"ADP-2A","cat":"charger"},
  {"name":"Kepala Charger Fast Charge","desc":"Kepala charger fast charging 18W","price":45000,"hpp":32000,"sku":"ADP-FC","cat":"charger"},
  {"name":"Charger Mobil Dual USB","desc":"Charger mobil dengan 2 port USB","price":30000,"hpp":22000,"sku":"ADP-CR","cat":"charger"},
  {"name":"Kabel HDMI 1.5m","desc":"Kabel HDMI panjang 1.5 meter","price":50000,"hpp":35000,"sku":"KBL-HDM-15","cat":"charger"},

  {"name":"Earphone Jack 3.5mm","desc":"Earphone universal jack 3.5mm","price":15000,"hpp":10000,"sku":"ERP-35","cat":"audio"},
  {"name":"Earphone Super Bass","desc":"Earphone bass-boost untuk musik","price":25000,"hpp":18000,"sku":"ERP-BS","cat":"audio"},
  {"name":"Earphone Type-C","desc":"Earphone konektor Type-C","price":35000,"hpp":25000,"sku":"ERP-TPC","cat":"audio"},
  {"name":"Headset Bluetooth Single","desc":"Headset Bluetooth 1 telinga","price":50000,"hpp":38000,"sku":"BT-SGL","cat":"audio"},
  {"name":"Speaker Bluetooth Mini","desc":"Speaker Bluetooth portable mini","price":75000,"hpp":55000,"sku":"SPK-MN","cat":"audio"},

  {"name":"Tempered Glass Universal","desc":"Tempered glass anti gores universal","price":10000,"hpp":6000,"sku":"TG-UNV","cat":"screen"},
  {"name":"Tempered Glass Premium","desc":"Tempered glass full cover premium","price":25000,"hpp":17000,"sku":"TG-PRM","cat":"screen"},
  {"name":"Tempered Glass Privacy","desc":"Tempered glass privacy anti spy","price":35000,"hpp":25000,"sku":"TG-PRV","cat":"screen"},
  {"name":"Casing Bening Universal","desc":"Casing HP bening universal","price":15000,"hpp":10000,"sku":"CSE-BNG","cat":"screen"},
  {"name":"Casing Anti Crack","desc":"Casing HP anti crack shockproof","price":30000,"hpp":22000,"sku":"CSE-AC","cat":"screen"},
  {"name":"Casing Premium Karakter","desc":"Casing HP motif karakter premium","price":45000,"hpp":32000,"sku":"CSE-PRM","cat":"screen"},

  {"name":"Memory Card 8GB","desc":"MicroSD memory card kapasitas 8GB","price":35000,"hpp":27000,"sku":"MMC-8","cat":"power"},
  {"name":"Memory Card 16GB","desc":"MicroSD memory card kapasitas 16GB","price":55000,"hpp":42000,"sku":"MMC-16","cat":"power"},
  {"name":"Memory Card 32GB","desc":"MicroSD memory card kapasitas 32GB","price":75000,"hpp":60000,"sku":"MMC-32","cat":"power"},
  {"name":"Powerbank 5000mAh","desc":"Powerbank kapasitas 5000 mAh","price":65000,"hpp":50000,"sku":"PB-5K","cat":"power"},
  {"name":"Powerbank 10000mAh","desc":"Powerbank kapasitas 10000 mAh","price":95000,"hpp":75000,"sku":"PB-10K","cat":"power"},
  {"name":"Flashdisk 8GB","desc":"USB flashdisk kapasitas 8GB","price":35000,"hpp":26000,"sku":"FD-8","cat":"power"},

  {"name":"Holder HP Mobil","desc":"Holder HP untuk dashboard mobil","price":25000,"hpp":17000,"sku":"HLD-MBL","cat":"lain"},
  {"name":"Pop Socket","desc":"Pop socket grip belakang HP","price":15000,"hpp":9000,"sku":"PPS","cat":"lain"},
  {"name":"Ring Holder Logam","desc":"Ring holder logam putar 360 derajat","price":12000,"hpp":7000,"sku":"RNG-LGM","cat":"lain"},
  {"name":"Stylus Pen Universal","desc":"Stylus pen universal layar HP","price":18000,"hpp":12000,"sku":"STY","cat":"lain"},
  {"name":"Stand HP Lipat","desc":"Stand HP lipat portable","price":35000,"hpp":25000,"sku":"STD-LP","cat":"lain"},
  {"name":"Gantungan HP Strap","desc":"Gantungan HP strap pendek","price":10000,"hpp":6000,"sku":"GTG-STR","cat":"lain"}
]'::jsonb)
LOOP
  pid := gen_random_uuid();
  cat_uuid := CASE pd->>'cat'
    WHEN 'charger' THEN v_cat_charger
    WHEN 'audio'   THEN v_cat_audio
    WHEN 'screen'  THEN v_cat_screen
    WHEN 'power'   THEN v_cat_power
    WHEN 'lain'    THEN v_cat_lain
  END;

  INSERT INTO products
    (id, name, description, price, hpp, sku, stock, branch_id, category_id)
  VALUES
    (pid,
      pd->>'name',
      pd->>'desc',
      (pd->>'price')::int,
      (pd->>'hpp')::int,
      pd->>'sku',
      c_initial_stock,
      v_branch_id,
      cat_uuid);

  INSERT INTO stock_movements
    (id, tenant_id, branch_id, product_id, source, direction, quantity,
      stock_before, stock_after, reference_type, reference_id, user_id, notes, created_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, v_branch_id, pid,
      'manual_adjustment', 'in', c_initial_stock,
      0, c_initial_stock, 'manual', NULL, v_user_id,
      'Stok awal seeding', v_range_start);
END LOOP;

RAISE NOTICE 'Inserted products: %',
  (SELECT COUNT(*) FROM products WHERE branch_id = v_branch_id);

------------------------------------------------------------------
-- 2.5. Seed transaksi agen (BRILink-style: transactions + movements)
--      Date range: v_range_start .. v_range_end (dinamis, lihat header)
--      Types: transfer, cash_withdrawal, cash_deposit, payment, top_up
------------------------------------------------------------------
FOR v_agent_idx IN 1..c_agent_total LOOP
  -- Distribusi merata di sepanjang [v_range_start .. v_range_end], jitter ±1 jam
  v_paid_at := v_range_start
    + make_interval(secs =>
        (v_agent_idx::float * v_range_secs / c_agent_total)
        + (random() * 7200.0 - 3600.0)
      );

  -- Pilih type (weighted: transfer paling sering, payment jarang)
  v_tx_type := (CASE 1 + floor(random() * 10)::int
    WHEN 1 THEN 'transfer'
    WHEN 2 THEN 'transfer'
    WHEN 3 THEN 'transfer'
    WHEN 4 THEN 'cash_withdrawal'
    WHEN 5 THEN 'cash_withdrawal'
    WHEN 6 THEN 'cash_deposit'
    WHEN 7 THEN 'top_up'
    WHEN 8 THEN 'top_up'
    WHEN 9 THEN 'payment'
    ELSE        'payment'
  END);

  -- Principal: kelipatan 50rb, max 200rb. Pilihan: 50.000 / 100.000 / 150.000 / 200.000.
  v_principal := (1 + floor(random() * 4))::int * 50000;
  -- Customer fee: 2.000-5.000 (round 500)
  v_customer_fee := round((2000 + random() * 3000)::numeric / 500) * 500;
  v_agent_fee := 0;

  -- Pilih bank/destination account sesuai jenis tx
  IF v_tx_type IN ('transfer','cash_withdrawal','cash_deposit','payment') THEN
    IF random() < 0.55 THEN
      v_bank_acct_id := v_acct_bri;  v_bank_balance := v_bal_bri;
      v_dest_provider := 'BRI';
    ELSE
      v_bank_acct_id := v_acct_bca;  v_bank_balance := v_bal_bca;
      v_dest_provider := 'BCA';
    END IF;
  ELSE -- top_up
    IF random() < 0.4 THEN
      v_bank_acct_id := v_acct_dana;  v_bank_balance := v_bal_dana;
      v_dest_provider := 'DANA';
    ELSE
      v_bank_acct_id := v_acct_pulsa; v_bank_balance := v_bal_pulsa;
      v_dest_provider := 'Telkomsel';
    END IF;
  END IF;

  -- Generate destination data per type
  IF v_tx_type IN ('transfer','cash_withdrawal','cash_deposit') THEN
    v_dest_number := lpad((floor(random() * 1e10)::bigint)::text, 10, '0');
    v_dest_name   := v_customer_pool[4 + floor(random() * (array_length(v_customer_pool,1)-3))::int];
  ELSIF v_tx_type = 'payment' THEN
    v_dest_number := lpad((floor(random() * 1e12)::bigint)::text, 12, '0');
    v_dest_provider := v_payment_provider_pool[1 + floor(random() * array_length(v_payment_provider_pool,1))::int];
    v_dest_name   := v_customer_pool[4 + floor(random() * (array_length(v_customer_pool,1)-3))::int];
  ELSE -- top_up
    v_dest_number := '08' || lpad((floor(random() * 1e10)::bigint)::text, 10, '0');
    v_dest_name   := NULL;
  END IF;

  v_cust_name_tx := COALESCE(
    v_customer_pool[4 + floor(random() * (array_length(v_customer_pool,1)-3))::int],
    'Customer'
  );

  -- Tentukan flow direction sesuai FLOW_MAP service
  v_cash_flow    := CASE v_tx_type WHEN 'cash_withdrawal' THEN 'out' ELSE 'in'  END;
  v_account_flow := CASE v_tx_type
    WHEN 'cash_withdrawal' THEN 'out'
    WHEN 'cash_deposit'    THEN 'in'
    ELSE                       'out'
  END;

  -- Hitung delta saldo per akun
  v_cash_delta := (CASE v_cash_flow    WHEN 'in' THEN  v_principal ELSE -v_principal END) + v_customer_fee;
  v_bank_delta :=  CASE v_account_flow WHEN 'in' THEN  v_principal ELSE -v_principal END;

  -- AUTO-REPLENISH: kalau saldo cash gak cukup, owner top-up modal dulu
  -- (capital_deposit movement, terjadi 1 menit sebelum tx)
  IF (v_cash_balance + v_cash_delta) < 0 THEN
    v_topup := ceil((ABS(v_cash_balance + v_cash_delta) + 1000000) / 1000000.0) * 1000000;
    v_balance_before := v_cash_balance;
    v_balance_after  := v_cash_balance + v_topup;
    INSERT INTO account_movements
      (id, tenant_id, account_id, transaction_id, source, direction, amount,
        balance_before, balance_after, user_id, notes, created_at)
    VALUES
      (gen_random_uuid(), v_tenant_id, v_cash_acct_id, NULL, 'capital_deposit', 'in',
        v_topup, v_balance_before, v_balance_after, v_user_id,
        'Top-up modal owner (saldo kas nipis)', v_paid_at - INTERVAL '1 minute');
    v_cash_balance := v_balance_after;
    v_topup_count := v_topup_count + 1;
    v_topup_total := v_topup_total + v_topup;
  END IF;

  -- Sama untuk bank account
  IF (v_bank_balance + v_bank_delta) < 0 THEN
    v_topup := ceil((ABS(v_bank_balance + v_bank_delta) + 1000000) / 1000000.0) * 1000000;
    v_balance_before := v_bank_balance;
    v_balance_after  := v_bank_balance + v_topup;
    INSERT INTO account_movements
      (id, tenant_id, account_id, transaction_id, source, direction, amount,
        balance_before, balance_after, user_id, notes, created_at)
    VALUES
      (gen_random_uuid(), v_tenant_id, v_bank_acct_id, NULL, 'capital_deposit', 'in',
        v_topup, v_balance_before, v_balance_after, v_user_id,
        'Top-up modal owner (saldo bank/e-wallet nipis)', v_paid_at - INTERVAL '1 minute');
    v_bank_balance := v_balance_after;
    v_topup_count := v_topup_count + 1;
    v_topup_total := v_topup_total + v_topup;
  END IF;

  v_tx_id := gen_random_uuid();

  -- 1) Insert transactions row
  INSERT INTO transactions
    (id, tenant_id, branch_id, user_id, transaction_type, customer_name,
      principal, customer_fee, agent_fee,
      destination_number, destination_name, destination_provider,
      status, created_at, updated_at)
  VALUES
    (v_tx_id, v_tenant_id, v_branch_id, v_user_id, v_tx_type, v_cust_name_tx,
      v_principal, v_customer_fee, v_agent_fee,
      v_dest_number, v_dest_name, v_dest_provider,
      'success', v_paid_at, v_paid_at);

  -- 2) Cash account: principal movement
  v_balance_before := v_cash_balance;
  v_balance_after  := v_cash_balance + (CASE v_cash_flow WHEN 'in' THEN v_principal ELSE -v_principal END);
  INSERT INTO account_movements
    (id, tenant_id, account_id, transaction_id, source, direction, amount,
      balance_before, balance_after, user_id, created_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, v_cash_acct_id, v_tx_id, 'principal', v_cash_flow,
      v_principal, v_balance_before, v_balance_after, v_user_id, v_paid_at);
  v_cash_balance := v_balance_after;

  -- 3) Cash account: customer_fee (always 'in')
  IF v_customer_fee > 0 THEN
    v_balance_before := v_cash_balance;
    v_balance_after  := v_cash_balance + v_customer_fee;
    INSERT INTO account_movements
      (id, tenant_id, account_id, transaction_id, source, direction, amount,
        balance_before, balance_after, user_id, created_at)
    VALUES
      (gen_random_uuid(), v_tenant_id, v_cash_acct_id, v_tx_id, 'customer_fee', 'in',
        v_customer_fee, v_balance_before, v_balance_after, v_user_id, v_paid_at);
    v_cash_balance := v_balance_after;
  END IF;

  -- 4) Bank/e-wallet/pulsa account: principal movement
  v_balance_before := v_bank_balance;
  v_balance_after  := v_bank_balance + (CASE v_account_flow WHEN 'in' THEN v_principal ELSE -v_principal END);
  INSERT INTO account_movements
    (id, tenant_id, account_id, transaction_id, source, direction, amount,
      balance_before, balance_after, user_id, created_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, v_bank_acct_id, v_tx_id, 'principal', v_account_flow,
      v_principal, v_balance_before, v_balance_after, v_user_id, v_paid_at);
  v_bank_balance := v_balance_after;

  -- 5) Tulis kembali saldo bank ke variable yang sesuai
  IF v_bank_acct_id = v_acct_bca   THEN v_bal_bca   := v_bank_balance;
  ELSIF v_bank_acct_id = v_acct_bri   THEN v_bal_bri   := v_bank_balance;
  ELSIF v_bank_acct_id = v_acct_dana  THEN v_bal_dana  := v_bank_balance;
  ELSIF v_bank_acct_id = v_acct_pulsa THEN v_bal_pulsa := v_bank_balance;
  END IF;
END LOOP;

-- Sync saldo bank/e-wallet/pulsa setelah transaksi agen selesai
UPDATE accounts SET balance = v_bal_bca,   updated_at = NOW() WHERE id = v_acct_bca;
UPDATE accounts SET balance = v_bal_bri,   updated_at = NOW() WHERE id = v_acct_bri;
UPDATE accounts SET balance = v_bal_dana,  updated_at = NOW() WHERE id = v_acct_dana;
UPDATE accounts SET balance = v_bal_pulsa, updated_at = NOW() WHERE id = v_acct_pulsa;

RAISE NOTICE 'Transaksi agen selesai. inserted=% topup_modal_count=% topup_modal_total=% saldo_kas_now=% bca=% bri=% dana=% pulsa=%',
  c_agent_total, v_topup_count, v_topup_total, v_cash_balance, v_bal_bca, v_bal_bri, v_bal_dana, v_bal_pulsa;

------------------------------------------------------------------
-- 3. Generate orders kronologis (oldest -> newest)
------------------------------------------------------------------
FOR v_order_idx IN 1..c_total_orders LOOP
  -- Distribusi paid_at merata di sepanjang [v_range_start .. v_range_end], jitter ±1 jam
  v_paid_at := v_range_start
    + make_interval(secs =>
        (v_order_idx::float * v_range_secs / c_total_orders)
        + (random() * 7200.0 - 3600.0)
      );

  v_payment       := v_payment_pool[1 + floor(random() * array_length(v_payment_pool, 1))::int];
  v_customer_name := v_customer_pool[1 + floor(random() * array_length(v_customer_pool, 1))::int];

  v_items_count := 1 + floor(random() * 5)::int;     -- 1-5 unique items
  v_subtotal    := 0;
  v_order_id    := gen_random_uuid();

  -- Insert header dulu (subtotal/discount/total nanti di-update)
  INSERT INTO pos_orders
    (id, tenant_id, branch_id, user_id, customer_name,
      subtotal, discount, total, payment_method, cash_account_id,
      status, paid_at, created_at)
  VALUES
    (v_order_id, v_tenant_id, v_branch_id, v_user_id, v_customer_name,
      0, 0, 0, v_payment, v_cash_acct_id,
      'completed', v_paid_at, v_paid_at);

  -- Pick produk random yang masih punya stok cukup
  SELECT array_agg(id) INTO v_picked_ids
  FROM (
    SELECT p.id
    FROM products p
    WHERE p.branch_id = v_branch_id AND p.stock > 5
    ORDER BY random()
    LIMIT v_items_count
  ) sub;

  IF v_picked_ids IS NULL OR array_length(v_picked_ids, 1) = 0 THEN
    DELETE FROM pos_orders WHERE id = v_order_id;
    RAISE NOTICE 'Stop di order #%: stok semua produk habis', v_order_idx;
    EXIT;
  END IF;

  FOR v_chosen IN
    SELECT p.id, p.name, p.price::numeric AS price, p.hpp::numeric AS hpp, p.stock
    FROM products p
    WHERE p.id = ANY(v_picked_ids)
    FOR UPDATE
  LOOP
    v_qty := 1 + floor(random() * 3)::int;          -- 1-3 unit
    IF v_qty > v_chosen.stock THEN
      v_qty := v_chosen.stock;
    END IF;
    IF v_qty <= 0 THEN
      CONTINUE;
    END IF;
    v_line_sub := v_chosen.price * v_qty;

    INSERT INTO pos_order_items
      (id, order_id, product_id, name_snapshot, price_snapshot, hpp_snapshot,
        quantity, subtotal, created_at)
    VALUES
      (gen_random_uuid(), v_order_id, v_chosen.id, v_chosen.name,
        v_chosen.price, v_chosen.hpp, v_qty, v_line_sub, v_paid_at);

    v_stock_before := v_chosen.stock;
    v_stock_after  := v_stock_before - v_qty;

    INSERT INTO stock_movements
      (id, tenant_id, branch_id, product_id, source, direction, quantity,
        stock_before, stock_after, reference_type, reference_id, user_id, created_at)
    VALUES
      (gen_random_uuid(), v_tenant_id, v_branch_id, v_chosen.id,
        'sale', 'out', v_qty,
        v_stock_before, v_stock_after, 'pos_order', v_order_id, v_user_id, v_paid_at);

    UPDATE products
      SET stock = v_stock_after, updated_at = v_paid_at
      WHERE id = v_chosen.id;

    v_subtotal := v_subtotal + v_line_sub;
  END LOOP;

  -- 20% order dapat diskon 1-10%, bulat ribuan
  IF random() < 0.2 THEN
    v_discount := round((v_subtotal * (0.01 + random() * 0.09)) / 1000)::numeric * 1000;
    IF v_discount > v_subtotal THEN v_discount := 0; END IF;
  ELSE
    v_discount := 0;
  END IF;
  v_total := v_subtotal - v_discount;

  UPDATE pos_orders
    SET subtotal = v_subtotal, discount = v_discount, total = v_total
    WHERE id = v_order_id;

  -- account_movement (uang masuk)
  v_balance_before := v_cash_balance;
  v_balance_after  := v_balance_before + v_total;

  INSERT INTO account_movements
    (id, tenant_id, account_id, transaction_id, pos_order_id,
      source, direction, amount, balance_before, balance_after, user_id, created_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, v_cash_acct_id, NULL, v_order_id,
      'sale', 'in', v_total, v_balance_before, v_balance_after, v_user_id, v_paid_at);

  v_cash_balance := v_balance_after;
END LOOP;

-- Sinkronkan saldo akhir ke accounts table
UPDATE accounts
  SET balance = v_cash_balance, updated_at = NOW()
  WHERE id = v_cash_acct_id;

RAISE NOTICE 'Selesai. transactions=% pos_orders=% pos_order_items=% stock_movements=% account_movements=% saldo_kas_akhir=%',
  (SELECT COUNT(*) FROM transactions      WHERE branch_id = v_branch_id),
  (SELECT COUNT(*) FROM pos_orders        WHERE branch_id = v_branch_id),
  (SELECT COUNT(*) FROM pos_order_items i
      JOIN pos_orders o ON o.id = i.order_id
      WHERE o.branch_id = v_branch_id),
  (SELECT COUNT(*) FROM stock_movements   WHERE branch_id = v_branch_id),
  (SELECT COUNT(*) FROM account_movements WHERE tenant_id = v_tenant_id),
  v_cash_balance;
END
$seed$;

COMMIT;
