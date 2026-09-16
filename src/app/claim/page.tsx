import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClaimDemo } from "./claim-demo";

export default async function ClaimPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/claim");
  return <ClaimDemo email={user.email ?? "your account"} />;
}
