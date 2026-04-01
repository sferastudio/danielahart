import { Skeleton } from "@/components/ui/skeleton";

export default function OfficeDashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-4 md:px-10 sticky top-0 z-10 shadow-sm">
        <div>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-9 w-32" />
      </header>

      <div className="p-4 md:p-10 space-y-6">
        {/* 6 form fields */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Dark summary section */}
        <div className="bg-[#0F2B46] rounded-[4px] p-6">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full bg-white/10" />
            ))}
          </div>
        </div>

        {/* Submission status timeline */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-6">
          <Skeleton className="h-5 w-44 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
