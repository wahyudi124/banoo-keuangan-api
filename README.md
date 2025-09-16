# BANOO API - Supabase Edge Functions

API untuk sistem manajemen keuangan menggunakan Supabase Edge Functions dengan integrasi external application.

## Base URL
```
https://your-project.supabase.co/functions/v1/banoo-api
```

## Authentication

API menggunakan sistem external authentication dengan header:
```
Authorization: Bearer <supabase_anon_key>
x-user-id: <user_id_from_external_app>
```

## Tipe Transaksi

- **PEMASUKAN**: Uang masuk (status: TRANSAKSI)
- **PENGELUARAN**: Uang keluar (status: TRANSAKSI)  
- **HUTANG**: Uang yang harus dibayar (status: BELUM LUNAS)
- **PIUTANG**: Uang yang akan diterima (status: BELUM LUNAS)

---

## 📦 ITEM MANAGEMENT

### 1. Tambah Item Baru
```bash
POST /item
Content-Type: application/json

{
  "nama": "IKAN KAKAP"
}
```

### 2. Search Item (Autosuggestion)
```bash
GET /item/search?q=ika&limit=5
```
**Response:**
```json
{
  "success": true,
  "data": [
    {"id": "uuid", "nama": "IKAN KAKAP"},
    {"id": "uuid", "nama": "IKAN SALMON"}
  ]
}
```

### 3. Ambil Semua Item
```bash
GET /item
```

### 4. Edit Item
```bash
PUT /item/{item_id}
Content-Type: application/json

{
  "nama": "IKAN KAKAP UPDATED"
}
```

### 5. Hapus Item
```bash
DELETE /item/{item_id}
```

---

## 💰 TRANSAKSI MANAGEMENT

### 1. Buat Transaksi PEMASUKAN (dengan Item)
```bash
POST /transaksi
Content-Type: application/json

{
  "tipe": "PEMASUKAN",
  "tanggal": "2024-01-17T14:30:00Z",
  "catatan": "Penjualan ikan hari ini",
  "items": [
    {
      "nama_item": "IKAN KAKAP",
      "qty": 2,
      "harga_satuan": 50000,
      "diskon": 5000
    },
    {
      "nama_item": "UDANG WINDU",
      "qty": 1,
      "harga_satuan": 75000,
      "diskon": 0
    }
  ]
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tipe": "PEMASUKAN",
    "tanggal": "2024-01-17T14:30:00Z",
    "total": 120000,
    "status": "TRANSAKSI",
    "items": [...]
  }
}
```

### 2. Buat Transaksi PENGELUARAN (tanpa Item)
```bash
POST /transaksi
Content-Type: application/json

{
  "tipe": "PENGELUARAN",
  "tanggal": "2024-01-17T15:00:00Z",
  "catatan": "Bayar listrik bulanan",
  "total": 450000
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tipe": "PENGELUARAN",
    "tanggal": "2024-01-17T15:00:00Z",
    "total": 450000,
    "status": "TRANSAKSI",
    "items": []
  }
}
```

### 3. Buat Transaksi HUTANG (Status: BELUM LUNAS)
```bash
POST /transaksi
Content-Type: application/json

{
  "tipe": "HUTANG",
  "tanggal": "2024-01-17T10:00:00Z",
  "jatuh_tempo": "2024-02-17",
  "catatan": "Hutang supplier ikan",
  "total": 2500000
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tipe": "HUTANG",
    "tanggal": "2024-01-17T10:00:00Z",
    "jatuh_tempo": "2024-02-17",
    "total": 2500000,
    "status": "BELUM LUNAS",
    "catatan": "Hutang supplier ikan",
    "items": []
  }
}
```

### 4. Buat Transaksi PIUTANG (Status: BELUM LUNAS)
```bash
POST /transaksi
Content-Type: application/json

{
  "tipe": "PIUTANG",
  "tanggal": "2024-01-17T16:00:00Z",
  "jatuh_tempo": "2024-02-17",
  "catatan": "Piutang restoran ABC",
  "total": 1500000
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tipe": "PIUTANG",
    "tanggal": "2024-01-17T16:00:00Z",
    "jatuh_tempo": "2024-02-17",
    "total": 1500000,
    "status": "BELUM LUNAS",
    "catatan": "Piutang restoran ABC",
    "items": []
  }
}
```

### 5. Ambil Semua Transaksi (dengan Pagination)
```bash
GET /transaksi?page=0&size=10
```

### 6. Ambil Transaksi by ID (dengan Items)
```bash
GET /transaksi/{transaksi_id}
```

### 7. Edit Transaksi
```bash
PUT /transaksi/{transaksi_id}
Content-Type: application/json

{
  "tipe": "PEMASUKAN",
  "tanggal": "2024-01-17T16:30:00Z",
  "catatan": "Penjualan Updated",
  "items": [
    {
      "nama_item": "IKAN SALMON",
      "qty": 1,
      "harga_satuan": 80000,
      "diskon": 0
    }
  ]
}
```

### 8. Hapus Transaksi
```bash
DELETE /transaksi/{transaksi_id}
```

---

## 📊 SUMMARY & REPORTS

### 1. Summary Pemasukan/Hutang by Period
```bash
GET /transaksi/pemasukan?tahun=2024&bulan=1
```
**Response:**
```json
{
  "success": true,
  "data": {
    "jumlah_transaksi": 15,
    "grand_total": 5750000
  }
}
```

### 2. Summary Pengeluaran/Piutang by Period
```bash
GET /transaksi/pengeluaran?tahun=2024&bulan=1
```

### 3. Summary Hutang/Piutang by Tahun
```bash
GET /transaksi/hutang?tahun=2024
```
**Response:**
```json
{
  "success": true,
  "data": {
    "tahun": 2024,
    "grand_total_hutang": 15750000,
    "grand_total_piutang": 8500000
  }
}
```

### 4. List Hutang & Piutang (dengan Pagination)
```bash
GET /transaksi/hutang/list?tahun=2024&page=0&size=10
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tipe": "HUTANG",
      "tanggal": "2024-01-17T10:00:00Z",
      "total": 2500000,
      "status": "BELUM LUNAS",
      "jatuh_tempo": "2024-02-17",
      "catatan": "Hutang supplier ikan"
    }
  ],
  "pagination": {
    "current_page": 0,
    "page_size": 10,
    "total_records": 25,
    "total_pages": 3
  }
}
```

### 5. Summary Comprehensive (Pemasukan vs Pengeluaran)
```bash
# By Hari
GET /transaksi/summary?tahun=2024&bulan=1&hari=17

# By Bulan  
GET /transaksi/summary?tahun=2024&bulan=1

# By Tahun
GET /transaksi/summary?tahun=2024
```
**Response:**
```json
{
  "success": true,
  "data": {
    "tahun": 2024,
    "bulan": 1,
    "grand_total_pemasukan": 15750000,
    "grand_total_pengeluaran": 8500000
  }
}
```

### 6. Summary Detail per Bulan (Array 12 Bulan)
```bash
GET /transaksi/summary/detail?tahun=2024
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "bulan": 1,
      "grand_total_pemasukan": 3450000,
      "grand_total_pengeluaran": 1200000
    },
    {
      "bulan": 2,
      "grand_total_pemasukan": 4200000,
      "grand_total_pengeluaran": 1850000
    },
    // ... sampai bulan 12
  ]
}
```

---

## 🔍 FILTERING & PAGINATION

### Filter by Date
```bash
# By Tahun
GET /transaksi?tahun=2024

# By Bulan
GET /transaksi?tahun=2024&bulan=1

# By Hari
GET /transaksi?tahun=2024&bulan=1&hari=17
```

### Pagination (Zero-based)
```bash
GET /transaksi?page=0&size=10  # Page 1, 10 items
GET /transaksi?page=1&size=5   # Page 2, 5 items
```

---

## ⚡ SPECIAL FEATURES

### Auto-Insert Items
Saat membuat transaksi dengan items, jika item belum ada di database, akan otomatis ditambahkan ke master item (case insensitive).

### Case Insensitive
Semua operasi item menggunakan case insensitive matching:
- "IKAN KAKAP" = "ikan kakap" = "Ikan Kakap"

### Replace Strategy
PUT transaksi dengan items akan menghapus semua items lama dan replace dengan yang baru.

---

## 📝 ERROR RESPONSES

```json
{
  "error": "Parameter tahun wajib diisi"
}
```

```json
{
  "error": "x-user-id header required"
}
```

```json
{
  "error": "Item dengan nama ini sudah ada"
}
```

---

## 🚀 DEPLOYMENT NOTES

1. Deploy ke Supabase Edge Functions
2. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. **PENTING**: Di Supabase Dashboard > Edge Functions > Settings:
   - Set "Verify JWT with legacy secret" ke **OFF**
   - API menggunakan external authentication system

## 🔒 SECURITY

- API menggunakan external user authentication
- Data isolation per user_id otomatis diterapkan
- CORS headers dikonfigurasi untuk cross-origin requests
- Case insensitive operations untuk user experience yang lebih baik