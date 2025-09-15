-- Update tabel transaksi untuk menggunakan datetime
ALTER TABLE transaksi ALTER COLUMN tanggal TYPE timestamptz USING tanggal::timestamptz;