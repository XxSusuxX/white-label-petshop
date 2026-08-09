const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length > 0) {
    env[key.trim()] = vals.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function testProntoFix() {
  console.log("=== Testando update de status 'pronto' ===");
  const { data: appts } = await supabase.from('appointments').select('*').limit(1);
  if (!appts || appts.length === 0) return;
  
  const testId = appts[0].id;
  console.log("ID de teste:", testId);

  // 1. Tentar update com status 'pronto'
  let { data, error } = await supabase
    .from('appointments')
    .update({ status: 'pronto', notes: '[OPERACAO] | [STEP:1] | Status: pronto' })
    .eq('id', testId)
    .select()
    .single();

  console.log("Tentativa 1 (pronto):", data ? "SUCESSO" : "FALHA", error?.message);

  // 2. Se falhar com check constraint, testar fallback com status 'confirmado' e tag Status: pronto no notes
  if (error && (error.code === '23514' || error.message.includes('check constraint'))) {
    console.log("-> Fallback ativado: Usando status 'confirmado' + 'Status: pronto' em notes...");
    const fallbackRes = await supabase
      .from('appointments')
      .update({ status: 'confirmado', notes: '[OPERACAO] | [STEP:1] | Status: pronto' })
      .eq('id', testId)
      .select()
      .single();

    data = fallbackRes.data;
    error = fallbackRes.error;
    console.log("Resultado Fallback:", data ? "✅ SUCESSO ABSOLUTO!" : "FALHA", "Status salvo:", data?.status, "Notes:", data?.notes);
  }
}

testProntoFix();
