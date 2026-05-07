"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function switchOffice(officeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Verify user has access to this office
  const { data } = await supabase
    .from("user_offices")
    .select("office_id")
    .eq("user_id", user.id)
    .eq("office_id", officeId)
    .maybeSingle();

  if (!data) throw new Error("Access denied");

  const cookieStore = await cookies();
  cookieStore.set("active_office_id", officeId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  revalidatePath("/office");
}
