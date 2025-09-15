# BANOO API - Supabase Edge Functions

API untuk sistem manajemen keuangan menggunakan Supabase Edge Functions.

## Authentication

Semua endpoint memerlukan JWT token di header Authorization:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Item Management

#### Tambah Item Baru
```bash
curl -X POST https://your-project.supabase.co/functions/v1/banoo-api/item \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Produk A"
  }'
```

#### Ambil Semua Item
```bash
curl -X GET https://your-project.supabase.co/functions/v1/banoo-api/item \
  -H "Authorization: Bearer <jwt_token>"
```

#### Edit Item
```bash
curl -X PUT https://your-project.supabase.co/functions/v1/banoo-api/item/uuid-item \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Produk A Updated"
  }'
```

#### Hapus Item
```bash
curl -X DELETE https://your-project.supabase.co/functions/v1/banoo-api/item/uuid-item \
  -H "Authorization: Bearer <jwt_token>"
```

### Transaksi

#### Buat Transaksi Baru
```bash
curl -X POST https://your-project.supabase.co/functions/v1/banoo-api/transaksi \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tipe": "PEMASUKAN",
    "tanggal": "2024-01-15",
    "catatan": "Penjualan hari ini",
    "items": [
      {
        "nama_item": "Produk A",
        "qty": 2,
        "harga_satuan": 50000,
        "diskon": 5000
      }
    ]
  }'
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nama": "Produk A",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

### Error Response
```json
{
  "error": "Nama item wajib diisi"
}
```

## Deployment

1. Deploy ke Supabase Edge Functions
2. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. **PENTING**: Di Supabase Dashboard > Edge Functions > Settings:
   - Set "Verify JWT with legacy secret" ke **OFF**
   - API sudah mengimplementasikan JWT verification sendiri untuk keamanan yang lebih baik

## Security Notes

- API menggunakan `supabase.auth.getUser()` untuk validasi JWT yang lebih aman
- Setiap endpoint memverifikasi user authentication
- Data isolation per user (user_id) otomatis diterapkan
- CORS headers dikonfigurasi untuk cross-origin requests