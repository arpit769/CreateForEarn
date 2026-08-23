import { redirect } from "next/navigation";
import { getCurrentUserProfileSlim } from "@/actions/users";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardIndex() {
  const profile = await getCurrentUserProfileSlim();

  if (!profile) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/signup?error=profile_not_found");
  }


  if (profile.role === 'admin') {
    redirect("/admin/users");
  } else {
    redirect("/worker/home");
  }
}

