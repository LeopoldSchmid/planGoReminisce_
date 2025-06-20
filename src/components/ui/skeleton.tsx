import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted/50 animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

// Trip card skeleton
function TripCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4 bg-card">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

// Shopping list skeleton
function ShoppingListSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-2 w-full" />
        <div className="flex justify-between text-xs">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    </div>
  );
}

export { Skeleton, TripCardSkeleton, ShoppingListSkeleton }
