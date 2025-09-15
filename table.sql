-- ENUM tipe transaksi (Bahasa Indonesia)
DO $$ BEGIN
  CREATE TYPE tx_type AS ENUM ('PEMASUKAN','PENGELUARAN','HUTANG','PIUTANG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ENUM status bayar
DO $$ BEGIN
  CREATE TYPE status_bayar AS ENUM ('LUNAS','BELUM LUNAS', 'TRANSAKSI');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- MASTER ITEM per user (opsional)
CREATE TABLE IF NOT EXISTS item (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  nama       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, nama)
);

-- HEADER TRANSAKSI (dengan status bayar)
CREATE TABLE IF NOT EXISTS transaksi (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  tipe        tx_type NOT NULL,                  -- PEMASUKAN/PENGELUARAN/HUTANG/PIUTANG
  tanggal     date NOT NULL DEFAULT CURRENT_DATE,
  jatuh_tempo date,                              -- untuk HUTANG/PIUTANG
  catatan     text,
  total       numeric(18,2) NOT NULL DEFAULT 0,
  status      status_bayar NOT NULL DEFAULT 'TRANSAKSI',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- DETAIL TRANSAKSI
CREATE TABLE IF NOT EXISTS transaksi_item (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id  uuid NOT NULL REFERENCES transaksi(id) ON DELETE CASCADE,
  nama_item     text NOT NULL,
  qty           numeric(18,4) NOT NULL DEFAULT 1,
  harga_satuan  numeric(18,2) NOT NULL DEFAULT 0,
  diskon        numeric(18,2) NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
