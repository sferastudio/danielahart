import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_OFFICE_COOKIE = "active_office_id";

export async function getUserOffices(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_offices")
    .select("office_id, offices(id, name, office_number)")
    .eq("user_id", userId);

  return (data ?? []).map((row) => {
    const office = row.offices as unknown as { id: string; name: string; office_number: string };
    return {
      id: office.id,
      name: office.name,
      office_number: office.office_number,
    };
  });
}

export async function getActiveOfficeId(userId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(ACTIVE_OFFICE_COOKIE)?.value;

  // Verify the stored office belongs to this user
  if (stored) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_offices")
      .select("office_id")
      .eq("user_id", userId)
      .eq("office_id", stored)
      .maybeSingle();

    if (data) return stored;
  }

  // Fallback: use the first office from user_offices
  const offices = await getUserOffices(userId);
  return offices[0]?.id ?? null;
}
