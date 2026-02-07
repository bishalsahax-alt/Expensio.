import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Skeleton className="h-48 w-full" />
      <div className="md:col-span-2 lg:col-span-2 xl:col-span-3">
        <Skeleton className="h-96 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-96 w-full md:col-span-2" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
