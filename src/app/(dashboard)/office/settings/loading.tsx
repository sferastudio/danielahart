import { Skeleton } from "@/components/ui/skeleton";

export default function OfficeSettingsLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-4 md:px-10 sticky top-0 z-10 shadow-sm">
        <div>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
      </header>

      <div className="p-4 md:p-10 space-y-6">
        {/* 3 form fields + button */}
        <div className="bg-white rounded-[4px] border border-slate-200 p-6 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
