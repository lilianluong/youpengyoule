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

      // Get user metadata from OAuth provider (Google).
      const displayName = data.user.user_metadata?.full_name ||
                         data.user.user_metadata?.name ||
                         data.user.email?.split("@")[0] ||
                         "User";
      const avatarUrl = data.user.user_metadata?.avatar_url ||
                       data.user.user_metadata?.picture ||
                       null;

      // Create profile if it doesn't exist.
      if (!profile) {
        await supabase.from("user_profiles").insert({
          user_id: data.user.id,
          display_name: displayName,
          email: data.user.email || "",
          profile_picture_url: avatarUrl,
          profile_completed: avatarUrl ? true : false, // Auto-complete if Google provided avatar
        });

        // Redirect to profile page if no avatar, otherwise to games.
        if (!avatarUrl) {
          return NextResponse.redirect(`${origin}/profile`);
        }
        return NextResponse.redirect(`${origin}/games`);
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
