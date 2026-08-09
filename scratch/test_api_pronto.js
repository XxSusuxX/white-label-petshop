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

async function testApiPronto() {
  console.log("=== Testando resiliência de salvamento de 'Pronto para Busca' ===");
  const { data: appts } = await supabase.from('appointments').select('*').limit(1);
  if (!appts || appts.length === 0) return;
  
  const testId = appts[0].id;
  console.log("ID testado:", testId);

  // Injetar tag Status: pronto no updateData
  const updateData = {
    status: 'pronto',
    notes: '[OPERACAO] | [STEP:1] | Status: pronto'
  };

  let { data, error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', testId)
    .select()
    .single();

  if (error && (error.code === '23514' || error.message.includes('check constraint'))) {
    console.log("-> Restrição de check constraint capturada com sucesso! Aplicando fallback da API...");
    const fallbackData = { ...updateData, status: "confirmado" };
    const retryRes = await supabase
      .from('appointments')
      .update(fallbackData)
      .eq('id', testId)
      .select()
      .single();

    data = retryRes.data;
    error = retryRes.error;
  }

  console.log("Status retornado pelo banco:", data?.status);
  console.log("Notes retornadas pelo banco:", data?.notes);

  // Agora simular o GET que busca a lista de agendamentos
  const { data: fetched } = await supabase.from('appointments').select('*').eq('id', testId).single();
  let effectiveStatus = fetched.status;
  if (fetched.notes?.includes("Status: pronto")) {
    effectiveStatus = "pronto";
  }
  console.log("-> Status final interpretado pelo GET:", effectiveStatus);
}

testApiPronto();
