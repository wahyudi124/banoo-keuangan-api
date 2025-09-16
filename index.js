import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

interface TransaksiPayload {
  tipe: 'PEMASUKAN' | 'PENGELUARAN' | 'HUTANG' | 'PIUTANG';
  tanggal?: string;
  jatuh_tempo?: string;
  catatan?: string;
  total?: number;
  items?: Array<{
    id?: string; // untuk edit item existing
    nama_item: string;
    qty: number;
    harga_satuan: number;
    diskon?: number;
  }>;
}

interface ItemPayload {
  nama: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get user_id from external application via header
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return new Response(JSON.stringify({ error: 'x-user-id header required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const user = { id: userId };

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    

    
    // ITEM ENDPOINTS
    if (pathParts[1] === 'item') {
      // GET /item/search?q=ika - Search items for autosuggestion
      if (req.method === 'GET' && pathParts[2] === 'search') {
        const query = url.searchParams.get('q');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        if (!query || query.trim().length < 1) {
          return new Response(JSON.stringify({ success: true, data: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const { data, error } = await supabase
          .from('item')
          .select('id, nama')
          .eq('user_id', user.id)
          .ilike('nama', `%${query.trim()}%`)
          .order('nama')
          .limit(limit);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // GET /item - Read all items
      if (req.method === 'GET' && pathParts.length === 2) {
        const { data, error } = await supabase
          .from('item')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /item - Create new item
      if (req.method === 'POST' && pathParts.length === 2) {
        const payload: ItemPayload = await req.json();
        
        if (!payload.nama?.trim()) {
          return new Response(JSON.stringify({ error: 'Nama item wajib diisi' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check existing item case insensitive
        const { data: existingItem } = await supabase
          .from('item')
          .select('id')
          .eq('user_id', user.id)
          .ilike('nama', payload.nama.trim())
          .single();
        
        if (existingItem) {
          return new Response(JSON.stringify({ error: 'Item dengan nama ini sudah ada' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data, error } = await supabase
          .from('item')
          .insert({ user_id: user.id, nama: payload.nama.trim() })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // PUT /item/:id - Update item
      if (req.method === 'PUT' && pathParts.length === 3) {
        const itemId = pathParts[2];
        const payload: ItemPayload = await req.json();
        
        if (!payload.nama?.trim()) {
          return new Response(JSON.stringify({ error: 'Nama item wajib diisi' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check existing item case insensitive (exclude current item)
        const { data: existingItem } = await supabase
          .from('item')
          .select('id')
          .eq('user_id', user.id)
          .ilike('nama', payload.nama.trim())
          .neq('id', itemId)
          .single();
        
        if (existingItem) {
          return new Response(JSON.stringify({ error: 'Item dengan nama ini sudah ada' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data, error } = await supabase
          .from('item')
          .update({ nama: payload.nama.trim() })
          .eq('id', itemId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        if (!data) {
          return new Response(JSON.stringify({ error: 'Item tidak ditemukan' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // DELETE /item/:id - Delete item
      if (req.method === 'DELETE' && pathParts.length === 3) {
        const itemId = pathParts[2];
        
        const { data, error } = await supabase
          .from('item')
          .delete()
          .eq('id', itemId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        if (!data) {
          return new Response(JSON.stringify({ error: 'Item tidak ditemukan' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ success: true, message: 'Item berhasil dihapus' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // TRANSAKSI ENDPOINTS
    if (pathParts[1] === 'transaksi') {
      // GET /transaksi/pemasukan?bulan=1&tahun=2024
      if (req.method === 'GET' && pathParts[2] === 'pemasukan') {
        const bulan = url.searchParams.get('bulan');
        const tahun = url.searchParams.get('tahun');
        
        let query = supabase
          .from('transaksi')
          .select('total')
          .eq('user_id', user.id)
          .in('tipe', ['PEMASUKAN', 'HUTANG']);
        
        if (tahun) {
          query = query.gte('tanggal', `${tahun}-01-01`)
                      .lt('tanggal', `${parseInt(tahun) + 1}-01-01`);
        }
        
        if (bulan && tahun) {
          const startDate = `${tahun}-${bulan.padStart(2, '0')}-01`;
          const nextMonth = parseInt(bulan) === 12 ? 1 : parseInt(bulan) + 1;
          const nextYear = parseInt(bulan) === 12 ? parseInt(tahun) + 1 : parseInt(tahun);
          const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
          
          query = query.gte('tanggal', startDate).lt('tanggal', endDate);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        const jumlahTransaksi = data.length;
        const grandTotal = data.reduce((sum, item) => sum + parseFloat(item.total), 0);
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: {
            jumlah_transaksi: jumlahTransaksi,
            grand_total: grandTotal
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // GET /transaksi/pengeluaran?bulan=1&tahun=2024
      if (req.method === 'GET' && pathParts[2] === 'pengeluaran') {
        const bulan = url.searchParams.get('bulan');
        const tahun = url.searchParams.get('tahun');
        
        let query = supabase
          .from('transaksi')
          .select('total')
          .eq('user_id', user.id)
          .in('tipe', ['PENGELUARAN', 'PIUTANG']);
        
        if (tahun) {
          query = query.gte('tanggal', `${tahun}-01-01`)
                      .lt('tanggal', `${parseInt(tahun) + 1}-01-01`);
        }
        
        if (bulan && tahun) {
          const startDate = `${tahun}-${bulan.padStart(2, '0')}-01`;
          const nextMonth = parseInt(bulan) === 12 ? 1 : parseInt(bulan) + 1;
          const nextYear = parseInt(bulan) === 12 ? parseInt(tahun) + 1 : parseInt(tahun);
          const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
          
          query = query.gte('tanggal', startDate).lt('tanggal', endDate);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        const jumlahTransaksi = data.length;
        const grandTotal = data.reduce((sum, item) => sum + parseFloat(item.total), 0);
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: {
            jumlah_transaksi: jumlahTransaksi,
            grand_total: grandTotal
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // GET /transaksi/hutang/list?tahun=2024&page=0&size=10 (MUST BE FIRST)
      if (req.method === 'GET' && pathParts[2] === 'hutang' && pathParts[3] === 'list') {
        const tahun = url.searchParams.get('tahun');
        const page = parseInt(url.searchParams.get('page') || '0');
        const size = parseInt(url.searchParams.get('size') || '10');
        
        if (!tahun) {
          return new Response(JSON.stringify({ error: 'Parameter tahun wajib diisi' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Count total records (HUTANG + PIUTANG)
        let countQuery = supabase
          .from('transaksi')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('tipe', ['HUTANG', 'PIUTANG'])
          .gte('tanggal', `${tahun}-01-01`)
          .lt('tanggal', `${parseInt(tahun) + 1}-01-01`);
        
        const { count, error: countError } = await countQuery;
        if (countError) throw countError;
        
        // Calculate pagination
        const totalRecords = count || 0;
        const totalPages = Math.ceil(totalRecords / size);
        const offset = page * size;
        
        // Get paginated data (HUTANG + PIUTANG)
        let dataQuery = supabase
          .from('transaksi')
          .select('*')
          .eq('user_id', user.id)
          .in('tipe', ['HUTANG', 'PIUTANG'])
          .gte('tanggal', `${tahun}-01-01`)
          .lt('tanggal', `${parseInt(tahun) + 1}-01-01`)
          .order('tanggal', { ascending: false })
          .range(offset, offset + size - 1);
        
        const { data, error } = await dataQuery;
        if (error) throw error;
        
        return new Response(JSON.stringify({ 
          success: true, 
          data,
          pagination: {
            current_page: page,
            page_size: size,
            total_records: totalRecords,
            total_pages: totalPages
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // GET /transaksi/hutang?tahun=2024 (SUMMARY)
      if (req.method === 'GET' && pathParts[2] === 'hutang' && pathParts.length === 3) {
        const tahun = url.searchParams.get('tahun');
        
        if (!tahun) {
          return new Response(JSON.stringify({ error: 'Parameter tahun wajib diisi' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Get HUTANG data
        let hutangQuery = supabase
          .from('transaksi')
          .select('total')
          .eq('user_id', user.id)
          .eq('tipe', 'HUTANG')
          .gte('tanggal', `${tahun}-01-01`)
          .lt('tanggal', `${parseInt(tahun) + 1}-01-01`);
        
        // Get PIUTANG data
        let piutangQuery = supabase
          .from('transaksi')
          .select('total')
          .eq('user_id', user.id)
          .eq('tipe', 'PIUTANG')
          .gte('tanggal', `${tahun}-01-01`)
          .lt('tanggal', `${parseInt(tahun) + 1}-01-01`);
        
        const [hutangResult, piutangResult] = await Promise.all([
          hutangQuery,
          piutangQuery
        ]);
        
        if (hutangResult.error) throw hutangResult.error;
        if (piutangResult.error) throw piutangResult.error;
        
        const grandTotalHutang = hutangResult.data.reduce((sum, item) => sum + parseFloat(item.total), 0);
        const grandTotalPiutang = piutangResult.data.reduce((sum, item) => sum + parseFloat(item.total), 0);
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: {
            tahun: parseInt(tahun),
            grand_total_hutang: grandTotalHutang,
            grand_total_piutang: grandTotalPiutang
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // GET /transaksi/summary/detail?tahun=2024 (MUST BE FIRST)
      if (req.method === 'GET' && pathParts[2] === 'summary' && pathParts[3] === 'detail') {
        const tahun = url.searchParams.get('tahun');
        
        if (!tahun) {
          return new Response(JSON.stringify({ error: 'Parameter tahun wajib diisi' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const summaryData = [];
        
        // Loop through all 12 months
        for (let bulan = 1; bulan <= 12; bulan++) {
          const startDate = `${tahun}-${bulan.toString().padStart(2, '0')}-01`;
          const nextMonth = bulan === 12 ? 1 : bulan + 1;
          const nextYear = bulan === 12 ? parseInt(tahun) + 1 : parseInt(tahun);
          const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
          
          // Get PEMASUKAN data for this month
          let pemasukanQuery = supabase
            .from('transaksi')
            .select('total')
            .eq('user_id', user.id)
            .in('tipe', ['PEMASUKAN', 'HUTANG'])
            .gte('tanggal', startDate)
            .lt('tanggal', endDate);
          
          // Get PENGELUARAN data for this month
          let pengeluaranQuery = supabase
            .from('transaksi')
            .select('total')
            .eq('user_id', user.id)
            .in('tipe', ['PENGELUARAN', 'PIUTANG'])
            .gte('tanggal', startDate)
            .lt('tanggal', endDate);
          
          const [pemasukanResult, pengeluaranResult] = await Promise.all([
            pemasukanQuery,
            pengeluaranQuery
          ]);
          
          if (pemasukanResult.error) throw pemasukanResult.error;
          if (pengeluaranResult.error) throw pengeluaranResult.error;
          
          const grandTotalPemasukan = pemasukanResult.data.reduce((sum, item) => sum + parseFloat(item.total), 0);
          const grandTotalPengeluaran = pengeluaranResult.data.reduce((sum, item) => sum + parseFloat(item.total), 0);
          
          summaryData.push({
            bulan: bulan,
            grand_total_pemasukan: grandTotalPemasukan,
            grand_total_pengeluaran: grandTotalPengeluaran
          });
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: summaryData
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // GET /transaksi/summary?tahun=2024&bulan=1&hari=17
      if (req.method === 'GET' && pathParts[2] === 'summary' && pathParts.length === 3) {
        const tahun = url.searchParams.get('tahun');
        const bulan = url.searchParams.get('bulan');
        const hari = url.searchParams.get('hari');
        
        if (!tahun) {
          return new Response(JSON.stringify({ error: 'Parameter tahun wajib diisi' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Build filter conditions
        let dateFilter = {
          gte: `${tahun}-01-01`,
          lt: `${parseInt(tahun) + 1}-01-01`
        };
        
        if (tahun && bulan && hari) {
          const targetDate = `${tahun}-${bulan.padStart(2, '0')}-${hari.padStart(2, '0')}`;
          dateFilter = {
            gte: targetDate,
            lt: `${targetDate}T23:59:59.999Z`
          };
        } else if (tahun && bulan) {
          const startDate = `${tahun}-${bulan.padStart(2, '0')}-01`;
          const nextMonth = parseInt(bulan) === 12 ? 1 : parseInt(bulan) + 1;
          const nextYear = parseInt(bulan) === 12 ? parseInt(tahun) + 1 : parseInt(tahun);
          const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
          
          dateFilter = {
            gte: startDate,
            lt: endDate
          };
        }
        
        // Get PEMASUKAN data
        let pemasukanQuery = supabase
          .from('transaksi')
          .select('total')
          .eq('user_id', user.id)
          .in('tipe', ['PEMASUKAN', 'HUTANG'])
          .gte('tanggal', dateFilter.gte)
          .lt('tanggal', dateFilter.lt);
        
        // Get PENGELUARAN data
        let pengeluaranQuery = supabase
          .from('transaksi')
          .select('total')
          .eq('user_id', user.id)
          .in('tipe', ['PENGELUARAN', 'PIUTANG'])
          .gte('tanggal', dateFilter.gte)
          .lt('tanggal', dateFilter.lt);
        
        const [pemasukanResult, pengeluaranResult] = await Promise.all([
          pemasukanQuery,
          pengeluaranQuery
        ]);
        
        if (pemasukanResult.error) throw pemasukanResult.error;
        if (pengeluaranResult.error) throw pengeluaranResult.error;
        
        const grandTotalPemasukan = pemasukanResult.data.reduce((sum, item) => sum + parseFloat(item.total), 0);
        const grandTotalPengeluaran = pengeluaranResult.data.reduce((sum, item) => sum + parseFloat(item.total), 0);
        
        // Build response based on parameters
        let responseData: any = {
          tahun: parseInt(tahun),
          grand_total_pemasukan: grandTotalPemasukan,
          grand_total_pengeluaran: grandTotalPengeluaran
        };
        
        if (bulan) {
          responseData.bulan = parseInt(bulan);
        }
        
        if (hari) {
          responseData.hari = parseInt(hari);
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: responseData
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      

      
      // GET /transaksi?tahun=2024&bulan=1&hari=15&page=1&size=10
      if (req.method === 'GET' && pathParts.length === 2) {
        const tahun = url.searchParams.get('tahun');
        const bulan = url.searchParams.get('bulan');
        const hari = url.searchParams.get('hari');
        const page = parseInt(url.searchParams.get('page') || '0');
        const size = parseInt(url.searchParams.get('size') || '10');
        
        // Count total records first
        let countQuery = supabase
          .from('transaksi')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        // Apply same filters to count query
        if (tahun && bulan && hari) {
          const targetDate = `${tahun}-${bulan.padStart(2, '0')}-${hari.padStart(2, '0')}`;
          countQuery = countQuery.gte('tanggal', targetDate)
                                .lt('tanggal', `${targetDate}T23:59:59.999Z`);
        } else if (tahun && bulan) {
          const startDate = `${tahun}-${bulan.padStart(2, '0')}-01`;
          const nextMonth = parseInt(bulan) === 12 ? 1 : parseInt(bulan) + 1;
          const nextYear = parseInt(bulan) === 12 ? parseInt(tahun) + 1 : parseInt(tahun);
          const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
          
          countQuery = countQuery.gte('tanggal', startDate).lt('tanggal', endDate);
        } else if (tahun) {
          countQuery = countQuery.gte('tanggal', `${tahun}-01-01`)
                                .lt('tanggal', `${parseInt(tahun) + 1}-01-01`);
        }
        
        const { count, error: countError } = await countQuery;
        if (countError) throw countError;
        
        // Calculate pagination
        const totalRecords = count || 0;
        const totalPages = Math.ceil(totalRecords / size);
        const offset = page * size;
        
        // Get paginated data
        let dataQuery = supabase
          .from('transaksi')
          .select('*')
          .eq('user_id', user.id)
          .order('tanggal', { ascending: false })
          .range(offset, offset + size - 1);
        
        // Apply same filters to data query
        if (tahun && bulan && hari) {
          const targetDate = `${tahun}-${bulan.padStart(2, '0')}-${hari.padStart(2, '0')}`;
          dataQuery = dataQuery.gte('tanggal', targetDate)
                              .lt('tanggal', `${targetDate}T23:59:59.999Z`);
        } else if (tahun && bulan) {
          const startDate = `${tahun}-${bulan.padStart(2, '0')}-01`;
          const nextMonth = parseInt(bulan) === 12 ? 1 : parseInt(bulan) + 1;
          const nextYear = parseInt(bulan) === 12 ? parseInt(tahun) + 1 : parseInt(tahun);
          const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
          
          dataQuery = dataQuery.gte('tanggal', startDate).lt('tanggal', endDate);
        } else if (tahun) {
          dataQuery = dataQuery.gte('tanggal', `${tahun}-01-01`)
                              .lt('tanggal', `${parseInt(tahun) + 1}-01-01`);
        }
        
        const { data, error } = await dataQuery;
        if (error) throw error;
        
        return new Response(JSON.stringify({ 
          success: true, 
          data,
          pagination: {
            current_page: page,
            page_size: size,
            total_records: totalRecords,
            total_pages: totalPages
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /transaksi/:id - Read transaksi by ID with items
      if (req.method === 'GET' && pathParts.length === 3) {
        const transaksiId = pathParts[2];
        
        const { data: transaksi, error: transaksiError } = await supabase
          .from('transaksi')
          .select('*')
          .eq('id', transaksiId)
          .eq('user_id', user.id)
          .single();

        if (transaksiError) throw transaksiError;
        
        if (!transaksi) {
          return new Response(JSON.stringify({ error: 'Transaksi tidak ditemukan' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data: items, error: itemsError } = await supabase
          .from('transaksi_item')
          .select('*')
          .eq('transaksi_id', transaksiId);

        if (itemsError) throw itemsError;

        return new Response(JSON.stringify({ 
          success: true, 
          data: { ...transaksi, items: items || [] } 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // PUT /transaksi/:id - Update transaksi with/without items
      if (req.method === 'PUT' && pathParts.length === 3) {
        const transaksiId = pathParts[2];
        const payload: Partial<TransaksiPayload> = await req.json();
        
        // Hitung total jika ada items
        let total = payload.total || 0;
        if (payload.items && payload.items.length > 0) {
          total = payload.items.reduce((sum, item) => 
            sum + (item.qty * item.harga_satuan - (item.diskon || 0)), 0
          );
        }
        
        const updateData: any = {};
        if (payload.tipe) updateData.tipe = payload.tipe;
        if (payload.tanggal) updateData.tanggal = payload.tanggal;
        if (payload.jatuh_tempo) updateData.jatuh_tempo = payload.jatuh_tempo;
        if (payload.catatan !== undefined) updateData.catatan = payload.catatan;
        updateData.total = total;
        
        if (payload.tipe && (payload.tipe === 'HUTANG' || payload.tipe === 'PIUTANG')) {
          updateData.status = 'BELUM LUNAS';
        } else if (payload.tipe) {
          updateData.status = 'TRANSAKSI';
        }

        const { data: transaksi, error: transaksiError } = await supabase
          .from('transaksi')
          .update(updateData)
          .eq('id', transaksiId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (transaksiError) throw transaksiError;

        if (!transaksi) {
          return new Response(JSON.stringify({ error: 'Transaksi tidak ditemukan' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Replace items jika ada
        let itemsData = [];
        if (payload.items && payload.items.length > 0) {
          // Delete all existing items first
          await supabase
            .from('transaksi_item')
            .delete()
            .eq('transaksi_id', transaksiId);
          
          // Check dan insert item baru jika belum ada (case insensitive)
          for (const item of payload.items) {
            const { data: existingItem } = await supabase
              .from('item')
              .select('id')
              .eq('user_id', user.id)
              .ilike('nama', item.nama_item)
              .single();
            
            if (!existingItem) {
              // Insert item baru jika belum ada
              await supabase
                .from('item')
                .insert({ user_id: user.id, nama: item.nama_item });
            }
          }
          
          // Insert all new items
          itemsData = payload.items.map(item => ({
            transaksi_id: transaksiId,
            nama_item: item.nama_item,
            qty: item.qty,
            harga_satuan: item.harga_satuan,
            diskon: item.diskon || 0
          }));

          const { error: itemsError } = await supabase
            .from('transaksi_item')
            .insert(itemsData);

          if (itemsError) throw itemsError;
        }

        return new Response(JSON.stringify({ 
          success: true, 
          data: { ...transaksi, items: itemsData } 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // DELETE /transaksi/:id - Delete transaksi
      if (req.method === 'DELETE' && pathParts.length === 3) {
        const transaksiId = pathParts[2];
        
        const { data, error } = await supabase
          .from('transaksi')
          .delete()
          .eq('id', transaksiId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        if (!data) {
          return new Response(JSON.stringify({ error: 'Transaksi tidak ditemukan' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Transaksi berhasil dihapus' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /transaksi - Create new transaksi
      if (req.method === 'POST' && pathParts.length === 2) {
      const payload: TransaksiPayload = await req.json();
      
      // Validasi
      if (!payload.tipe) {
        return new Response(JSON.stringify({ error: 'Tipe transaksi wajib diisi' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Hitung total
      let total = 0;
      if (payload.items && payload.items.length > 0) {
        total = payload.items.reduce((sum, item) => 
          sum + (item.qty * item.harga_satuan - (item.diskon || 0)), 0
        );
      } else if (payload.total) {
        total = payload.total;
      }

      // Insert transaksi
      const { data: transaksi, error: transaksiError } = await supabase
        .from('transaksi')
        .insert({
          user_id: user.id,
          tipe: payload.tipe,
          tanggal: payload.tanggal || new Date().toISOString(),
          jatuh_tempo: payload.jatuh_tempo,
          catatan: payload.catatan,
          total,
          status: (payload.tipe === 'HUTANG' || payload.tipe === 'PIUTANG') ? 'BELUM LUNAS' : 'TRANSAKSI'
        })
        .select()
        .single();

      if (transaksiError) throw transaksiError;

      // Insert items jika ada
      let itemsData = [];
      if (payload.items && payload.items.length > 0) {
        // Check dan insert item baru jika belum ada (case insensitive)
        for (const item of payload.items) {
          const { data: existingItem } = await supabase
            .from('item')
            .select('id')
            .eq('user_id', user.id)
            .ilike('nama', item.nama_item)
            .single();
          
          if (!existingItem) {
            // Insert item baru jika belum ada
            await supabase
              .from('item')
              .insert({ user_id: user.id, nama: item.nama_item });
          }
        }
        
        itemsData = payload.items.map(item => ({
          transaksi_id: transaksi.id,
          nama_item: item.nama_item,
          qty: item.qty,
          harga_satuan: item.harga_satuan,
          diskon: item.diskon || 0
        }));

        const { error: itemsError } = await supabase
          .from('transaksi_item')
          .insert(itemsData);

        if (itemsError) throw itemsError;
      }

      return new Response(JSON.stringify({ 
        success: true, 
        data: { ...transaksi, items: itemsData } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      }
    }

    return new Response(JSON.stringify({ error: 'Endpoint tidak ditemukan' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});