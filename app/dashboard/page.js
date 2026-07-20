import { createServerComponentClient } from "@/lib/supabaseServerComponent";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <DashboardClient userEmail={user?.email ?? ""} />;
}
