import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportEditor } from "@/components/admin/ReportEditor";
import { Badge } from "@/components/ui/badge";
import {
  CURRENCY_FORMATTER,
  PERCENTAGE_FORMATTER,
  FRANCHISEE_STATUS_LABELS,
} from "@/lib/constants";

export default async function OfficeDetailPage({
  params,
}: {
  params: Promise<{ officeId: string }>;
}) {
  const { officeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: office } = await admin
    .from("offices")
    .select("*")
    .eq("id", officeId)
    .single();

  if (!office) notFound();

  const { data: reports } = await admin
    .from("monthly_reports")
    .select("*")
    .eq("office_id", officeId)
    .order("report_month", { ascending: false })
    .limit(24);

  const { data: auditEntries } = await admin
    .from("audit_log")
    .select("*")
    .eq("entity_type", "monthly_report")
    .order("created_at", { ascending: false })
    .limit(20);

  // Filter audit entries related to this office's reports
  const reportIds = new Set((reports ?? []).map((r) => r.id));
  const relevantAudit = (auditEntries ?? []).filter((a) =>
    reportIds.has(a.entity_id)
  );

  return (
    <>
      <PageHeader
        title={office.name}
        subtitle={`Franchisee #${office.office_number}`}
      />
      <div className="px-4 md:px-10 py-6 md:py-10 space-y-8">
        {/* Franchisee Info Card */}
        <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
              <Badge variant="outline">
                {FRANCHISEE_STATUS_LABELS[office.status] ?? office.status}
              </Badge>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Royalty Rate</p>
              <p className="font-bold">
                {PERCENTAGE_FORMATTER(Number(office.royalty_percentage))}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Advertising Rate</p>
              <p className="font-bold">
                {PERCENTAGE_FORMATTER(Number(office.advertising_percentage))}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Email</p>
              <p className="text-sm">{office.email}</p>
            </div>
          </div>
        </div>

        {/* Reports */}
        <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-sm font-bold text-navy-900 uppercase tracking-widest">
              Monthly Reports
            </h2>
          </div>
          <ReportEditor reports={reports ?? []} auditLog={relevantAudit} />
        </div>
      </div>
    </>
  );
}
