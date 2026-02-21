import { Skeleton } from "@/components/ui/skeleton";

const SkeletonCard = () => (
  <div className="flex items-center gap-6 px-5 py-4 rounded-xl border bg-card">
    <Skeleton className="size-9 rounded-full shrink-0" />
    <div className="flex flex-col gap-1 shrink-0 w-20">
      <Skeleton className="h-4 w-14" />
      <Skeleton className="h-3 w-10" />
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <Skeleton className="size-5 rounded-full" />
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="flex items-center gap-2 shrink-0 w-24">
      <Skeleton className="size-5 rounded-full" />
      <Skeleton className="h-4 w-12" />
    </div>
    <Skeleton className="hidden md:block h-4 flex-1" />
    <div className="ml-auto text-right shrink-0 flex flex-col gap-1">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-16 ml-auto" />
    </div>
  </div>
);

const SkeletonCards = () => (
  <div className="flex flex-col gap-5">
    {[0, 1, 2, 3, 4].map((i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default SkeletonCards;
