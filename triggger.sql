-- fungsi umum
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

-- item
DROP TRIGGER IF EXISTS trg_item_updated_at ON item;
CREATE TRIGGER trg_item_updated_at
BEFORE UPDATE ON item
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- transaksi
DROP TRIGGER IF EXISTS trg_transaksi_updated_at ON transaksi;
CREATE TRIGGER trg_transaksi_updated_at
BEFORE UPDATE ON transaksi
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- transaksi_item
DROP TRIGGER IF EXISTS trg_transaksi_item_updated_at ON transaksi_item;
CREATE TRIGGER trg_transaksi_item_updated_at
BEFORE UPDATE ON transaksi_item
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
