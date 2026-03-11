import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!serviceRoleKey) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is required. Set it in .env.local or as an environment variable."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface LocationRow {
  locationName: string;
  email: string;
  phone: string;
  fax: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  firstName: string;
  lastName: string;
  username: string;
  isAdmin: boolean;
  royaltyPct: number;
  advertisingPct: number;
  status: "active" | "non_reporting" | "corporate";
}

const locations: LocationRow[] = [
  { locationName: "Alpharetta", email: "kathy.jimenez@danielahart.com", phone: "6786240562", fax: "6786094364", address: "5670 Atlanta Highway, Suite A", city: "Alpharetta", state: "GA", zip: "30004", firstName: "Kathy", lastName: "Jiminez", username: "kathyalpharetta", isAdmin: false, royaltyPct: 6, advertisingPct: 2, status: "active" },
  { locationName: "Athens", email: "carolina.restrepo@danielahart.com", phone: "6786610555", fax: "6786610555", address: "3701 Atlanta Highway Suite 21", city: "Bogart", state: "GA", zip: "30622", firstName: "Carolina", lastName: "Restrepo", username: "carolinaathens", isAdmin: false, royaltyPct: 10, advertisingPct: 2, status: "active" },
  { locationName: "Atlanta", email: "service@danielahart.com", phone: "8889631040", fax: "", address: "2302 Parklake Drive, Suite 390", city: "Atlanta", state: "GA", zip: "30345", firstName: "Service", lastName: "Ahart", username: "serviceatlanta", isAdmin: false, royaltyPct: 0, advertisingPct: 0, status: "corporate" },
  { locationName: "Buford", email: "alba.keener@danielahart.com", phone: "4049676572", fax: "", address: "2363 Thompson Mill Road, Suite C", city: "Buford", state: "GA", zip: "30519", firstName: "Alba", lastName: "Keener", username: "buford", isAdmin: false, royaltyPct: 6, advertisingPct: 1, status: "active" },
  { locationName: "Cartersville", email: "kelidy.flores@danielahart.com", phone: "7703825996", fax: "", address: "236 S Tennessee Street", city: "Cartersville", state: "GA", zip: "30120", firstName: "Kelidy", lastName: "Flores", username: "kelidycartersville", isAdmin: false, royaltyPct: 10, advertisingPct: 2, status: "active" },
  { locationName: "Conyers", email: "laura.larios@danielahart.com", phone: "7707617876", fax: "", address: "1369 Iris Drive NW", city: "Conyers", state: "GA", zip: "30013", firstName: "Laura", lastName: "Larios", username: "lauraconyers", isAdmin: false, royaltyPct: 12, advertisingPct: 2, status: "active" },
  { locationName: "Covington", email: "laura.larios@danielahart.com", phone: "7067492029", fax: "7709834131", address: "2124 Clark Street SW", city: "Covington", state: "GA", zip: "30014", firstName: "Laura", lastName: "Larios", username: "lauracovington", isAdmin: false, royaltyPct: 12, advertisingPct: 2, status: "active" },
  { locationName: "Cumming", email: "leo.polanco@danielahart.com", phone: "6784568487", fax: "", address: "113 Merchants Square", city: "Cumming", state: "GA", zip: "30040", firstName: "Leo", lastName: "Polanco", username: "leopolanco", isAdmin: false, royaltyPct: 5, advertisingPct: 2, status: "active" },
  { locationName: "DATS Doraville", email: "isboset.sanchez@danielahart.com", phone: "7704581040", fax: "7704581070", address: "3820 Pleasantdale Road Suite A2", city: "Doraville", state: "GA", zip: "30340", firstName: "Isboset", lastName: "Sanchez", username: "doraisbo", isAdmin: false, royaltyPct: 6, advertisingPct: 2, status: "active" },
  { locationName: "Duluth", email: "lizeth.garcia@danielahart.com", phone: "6789579346", fax: "6789578766", address: "", city: "Duluth", state: "GA", zip: "30096", firstName: "Lizeth", lastName: "Garcia", username: "lizethduluth", isAdmin: false, royaltyPct: 6, advertisingPct: 1, status: "active" },
  { locationName: "Forest Park", email: "jesus.araujo@danielahart.com", phone: "4048352597", fax: "", address: "5991 Old Dixie Highway", city: "Forest Park", state: "GA", zip: "30297", firstName: "Jesus", lastName: "Araujo", username: "jesusfp", isAdmin: false, royaltyPct: 6, advertisingPct: 1, status: "active" },
  { locationName: "Lawrenceville", email: "danieliz.vasquez@danielahart.com", phone: "6785027246", fax: "6788237207", address: "1098 Herrington Road, Suite 20", city: "Lawrenceville", state: "GA", zip: "30044", firstName: "Danieliz", lastName: "Vasquez", username: "danielizlawrenceville", isAdmin: false, royaltyPct: 12, advertisingPct: 2, status: "active" },
  { locationName: "Lilburn", email: "fabiola.white@danielahart.com", phone: "6783805200", fax: "", address: "660 Indian Trail Road, Suite 300", city: "Lilburn", state: "GA", zip: "30047", firstName: "Fabiola", lastName: "White", username: "fabiolalilburn", isAdmin: false, royaltyPct: 6, advertisingPct: 1, status: "active" },
  { locationName: "Mableton", email: "pamela.daniel@danielahart.com", phone: "7709486916", fax: "", address: "780 Veterans Memorial Parkway", city: "Mableton", state: "GA", zip: "30126", firstName: "Pamela", lastName: "Daniel", username: "pammableton", isAdmin: false, royaltyPct: 0, advertisingPct: 0, status: "active" },
  { locationName: "Norcross", email: "sara.garcia@danielahart.com", phone: "6782617972", fax: "", address: "4771 Britt Road, Suite 107", city: "Norcross", state: "GA", zip: "30093", firstName: "Sara", lastName: "Garcia", username: "saranorcross", isAdmin: false, royaltyPct: 6, advertisingPct: 1, status: "active" },
  { locationName: "Riverdale", email: "janeth.molano@danielahart.com", phone: "7704727191", fax: "7704277930", address: "7582 Highway 85", city: "Riverdale", state: "GA", zip: "30274", firstName: "Janeth", lastName: "Molano", username: "janethriverdale", isAdmin: false, royaltyPct: 8, advertisingPct: 2, status: "active" },
  { locationName: "Rome", email: "kelidy.flores@danielahart.com", phone: "7703825996", fax: "", address: "610 Shorter Ave NW #4", city: "Rome", state: "GA", zip: "30165", firstName: "Kelidy", lastName: "Flores", username: "kelidyrome", isAdmin: false, royaltyPct: 10, advertisingPct: 2, status: "active" },
  { locationName: "Roswell", email: "kathy.jimenez@danielahart.com", phone: "7706409050", fax: "7706409055", address: "10684 Alpharetta Highway, #300", city: "Roswell", state: "GA", zip: "30076", firstName: "Kathy", lastName: "Jiminez", username: "kathyroswell", isAdmin: false, royaltyPct: 6, advertisingPct: 2, status: "active" },
  { locationName: "Snellville", email: "brigida.restor@danielahart.com", phone: "7708640595", fax: "", address: "1467 Scenic Highway N", city: "Snellville", state: "GA", zip: "30078", firstName: "Brigida", lastName: "Restor", username: "brigidasnellville", isAdmin: false, royaltyPct: 8, advertisingPct: 2, status: "active" },
  { locationName: "Stockbridge", email: "ana.payan@danielahart.com", phone: "7705061816", fax: "", address: "5627 North Henry Blvd, Suite B", city: "Stockbridge", state: "GA", zip: "30281", firstName: "Ana", lastName: "Payan", username: "anapayan", isAdmin: false, royaltyPct: 10, advertisingPct: 2, status: "active" },
  { locationName: "Winder", email: "baneza.hale@danielahart.com", phone: "6789630691", fax: "", address: "122 West May Street, Suite B", city: "Winder", state: "GA", zip: "30680", firstName: "Baneza", lastName: "Hale", username: "baneza", isAdmin: false, royaltyPct: 10, advertisingPct: 2, status: "active" },
  { locationName: "Woodstock", email: "sandra.bacciarini@danielahart.com", phone: "4049028020", fax: "", address: "409 Colemans Run", city: "Woodstock", state: "GA", zip: "30188", firstName: "Sandra", lastName: "Bacciarini", username: "sandrab", isAdmin: false, royaltyPct: 12, advertisingPct: 2, status: "active" },
  { locationName: "Non Reporting (Dana)", email: "dana.godawa@danielahart.com", phone: "8889631040", fax: "", address: "2302 Parklake Drive, Suite 390", city: "Atlanta", state: "GA", zip: "30345", firstName: "Dana", lastName: "Godawa", username: "danagodawa", isAdmin: true, royaltyPct: 0, advertisingPct: 0, status: "non_reporting" },
  { locationName: "Non Reporting (Dan)", email: "dan.ahart@danielahart.com", phone: "4044253435", fax: "", address: "2302 Parklake Drive, Suite 390", city: "Atlanta", state: "GA", zip: "30345", firstName: "Dan", lastName: "Ahart", username: "dan", isAdmin: true, royaltyPct: 0, advertisingPct: 0, status: "non_reporting" },
];

const DEFAULT_PASSWORD = "Ahart2026!";

async function seed() {
  console.log(`Seeding ${locations.length} locations and users...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const loc of locations) {
    const officeNumber = String(successCount + 1).padStart(3, "0");

    // 1. Create the office
    const { data: office, error: officeError } = await supabase
      .from("offices")
      .insert({
        name: loc.locationName,
        office_number: officeNumber,
        address: loc.address || null,
        phone: loc.phone || null,
        fax: loc.fax || null,
        email: loc.email,
        city: loc.city,
        state: loc.state,
        zip: loc.zip,
        royalty_percentage: loc.royaltyPct / 100,
        advertising_percentage: loc.advertisingPct / 100,
        status: loc.status,
        is_active: loc.status === "active",
      })
      .select("id")
      .single();

    if (officeError) {
      console.error(`  [OFFICE ERROR] ${loc.locationName}: ${officeError.message}`);
      errorCount++;
      continue;
    }

    console.log(`  [OFFICE] ${loc.locationName} (${officeNumber}) → ${office.id}`);

    // 2. Create the auth user — the handle_new_user trigger will create the profile
    const role = loc.isAdmin ? "admin" : "sub_office";
    const { data: authUser, error: userError } = await supabase.auth.admin.createUser({
      email: loc.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role,
        full_name: `${loc.firstName} ${loc.lastName}`,
        office_id: office.id,
      },
    });

    if (userError) {
      // Duplicate email — user already exists (e.g. Laura Larios has 2 offices).
      // Just link the existing user's profile to this office if needed.
      if (userError.message.includes("already been registered")) {
        console.log(`  [USER] ${loc.email} already exists — skipping user creation`);
      } else {
        console.error(`  [USER ERROR] ${loc.email}: ${userError.message}`);
      }
      successCount++;
      continue;
    }

    console.log(`  [USER] ${loc.email} → ${authUser.user.id} (${role})`);

    // 3. Update profile with contact name fields
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        contact_first_name: loc.firstName,
        contact_last_name: loc.lastName,
      })
      .eq("id", authUser.user.id);

    if (profileError) {
      console.error(`  [PROFILE ERROR] ${loc.email}: ${profileError.message}`);
    }

    successCount++;
  }

  console.log(`\nDone: ${successCount} locations processed, ${errorCount} errors.`);
}

seed().catch(console.error);
