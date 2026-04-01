import { Skeleton } from "@/components/ui/skeleton";

export default function AdminReportsLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-4 md:px-10 sticky top-0 z-10 shadow-sm">
        <div>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
      </header>

      <div className="p-4 md:p-10 space-y-6">
        {/* Filter bar */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-9 w-full sm:w-56" />
          <Skeleton className="h-9 w-full sm:w-44" />
          <Skeleton className="h-9 w-full sm:w-44" />
        </div>

        {/* Table placeholder */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-6">
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
