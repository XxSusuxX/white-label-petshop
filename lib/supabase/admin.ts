import { createClient } from "@supabase/supabase-js";

const FALLBACK_URL = "https://qzwfvbwhpddnsgqovfzv.supabase.co";
const FALLBACK_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6d2Z2YndocGRkbnNncW92Znp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTYyMDk5MCwiZXhwIjoyMDk3MTk2OTkwfQ.4GE_vPLAKPhFrzdLYhaWuvSAxGnYdxdEzrB-z9b9JQ8";

export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;

  return createClient(url, serviceKey);
}
