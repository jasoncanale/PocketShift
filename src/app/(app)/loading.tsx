import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}
