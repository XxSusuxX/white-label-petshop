import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const adminSupabase = createAdminClient();

    // 1. Listar todas as tabelas públicas
    const { data: tables, error: tablesErr } = await adminSupabase
      .rpc("get_public_tables");

    // Se a função RPC não existir, usar query direta
    let tableList: string[] = [];
    if (tablesErr) {
      // Fallback: tentar acessar tabelas conhecidas e ver quais existem
      const knownTables = [
        "pet_shops", "tenants", "profiles", "pets",
        "services", "service_history", "appointments", "leads"
      ];

      for (const table of knownTables) {
        const { error } = await adminSupabase.from(table).select("*").limit(1);
        if (!error) {
          tableList.push(table);
        }
      }
    } else {
      tableList = (tables || []).map((t: any) => t.table_name || t);
    }

    // 2. Para cada tabela existente, buscar as colunas
    const schema: Record<string, any> = {};
    for (const table of tableList) {
      const { data: rows, error: rowErr } = await adminSupabase
        .from(table)
        .select("*")
        .limit(1);

      if (!rowErr && rows && rows.length > 0) {
        schema[table] = {
          columns: Object.keys(rows[0]),
          sampleRow: rows[0],
          exists: true,
        };
      } else {
        // Table exists but is empty
        schema[table] = {
          columns: [],
          sampleRow: null,
          exists: true,
          empty: true,
        };
      }
    }

    return NextResponse.json({
      tables: tableList,
      schema,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Erro em GET /api/admin/db-inspect:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
