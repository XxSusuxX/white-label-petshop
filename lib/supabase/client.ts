import { createBrowserClient } from "@supabase/ssr";

const FALLBACK_URL = "https://qzwfvbwhpddnsgqovfzv.supabase.co";
const FALLBACK_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6d2Z2YndocGRkbnNncW92Znp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MjA5OTAsImV4cCI6MjA5NzE5Njk5MH0.46C8R4qO2paItgO8oxQgeY7L36XnaRbNiM-l1Yb1xAQ";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON;

  return createBrowserClient(url, anonKey);
}
