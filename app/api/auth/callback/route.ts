import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user_profiles entry exists.
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("user_id, profile_completed")
        .eq("user_id", data.user.id)
        .single();

      // Create profile if it doesn't exist.
      if (!profile) {
        await supabase.from("user_profiles").insert({
          user_id: data.user.id,
          display_name: data.user.email?.split("@")[0] || "User",
          email: data.user.email || "",
          profile_completed: false,
        });

        // Redirect to profile page for first-time setup.
        return NextResponse.redirect(`${origin}/profile`);
      }

      // Redirect to profile page if not completed, otherwise to games.
      if (!profile.profile_completed) {
        return NextResponse.redirect(`${origin}/profile`);
      }

      return NextResponse.redirect(`${origin}/games`);
    }
  }

  // Return to login if something went wrong.
  return NextResponse.redirect(`${origin}/login`);
}
