import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/actions/users";

export default async function DashboardIndex() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/signup");
  }

  if (profile.role === 'admin') {
    redirect("/admin/users");
  } else {
    redirect("/worker/available-tasks");
  }
}
