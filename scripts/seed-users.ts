import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!serviceRoleKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required. Set it in .env.local or as an environment variable.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
  // Look up the test office
  const { data: office, error: officeError } = await supabase
    .from("offices")
    .select("id")
    .eq("office_number", "204")
    .single();

  if (officeError || !office) {
    console.error("Could not find office 204. Run migrations first.", officeError);
    process.exit(1);
  }

  console.log(`Found office 204 with ID: ${office.id}`);

  // Create admin user
  const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
    email: "admin@danielahart.com",
    password: "admin123!",
    email_confirm: true,
    user_metadata: {
      role: "admin",
      full_name: "Admin User",
    },
  });

  if (adminError) {
    console.error("Error creating admin user:", adminError.message);
  } else {
    console.log("Created admin user:", adminUser.user.email);
  }

  // Create sub_office user
  const { data: officeUser, error: officeUserError } = await supabase.auth.admin.createUser({
    email: "kudat204@danielahart.com",
    password: "office123!",
    email_confirm: true,
    user_metadata: {
      role: "sub_office",
      full_name: "Kudat Office #204",
      office_id: office.id,
    },
  });

  if (officeUserError) {
    console.error("Error creating office user:", officeUserError.message);
  } else {
    console.log("Created office user:", officeUser.user.email);
  }
}

seed().catch(console.error);
