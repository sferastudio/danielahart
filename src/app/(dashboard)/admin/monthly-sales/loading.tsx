import { Skeleton } from "@/components/ui/skeleton";

export default function AdminMonthlySalesLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-4 md:px-10 sticky top-0 z-10 shadow-sm">
        <div>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
      </header>

      <div className="p-4 md:p-10 space-y-6">
        {/* Office selector + month nav bar */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Skeleton className="h-9 w-48" />
          <div className="flex items-center gap-2 ml-auto">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>

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
      </div>
    </div>
  );
}
