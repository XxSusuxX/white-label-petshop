import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const redirectPath = searchParams.get("redirect") || "/auth/login";
  const isExisting = searchParams.get("existing");

  const supabase = createClient();
  await supabase.auth.signOut();

  const redirectUrl = new URL(redirectPath, origin);
  if (isExisting) {
    redirectUrl.searchParams.set("existing", "true");
  }

  const response = NextResponse.redirect(redirectUrl);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
