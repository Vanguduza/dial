// export function ServicesSkeleton() {
//   return (
//     <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//       {Array.from({ length: 6 }).map((_, i) => (
//         <div key={i} className="h-84 animate-pulse rounded-2xl bg-muted" />
//       ))}
//     </div>
//   );
// }




import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";



export function ServicesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        // <div key={i} className="h-84 animate-pulse rounded-2xl bg-muted" />
        <Card key={i} className="overflow-hidden">
          {/* Thumbnail */}
          <div className="relative aspect-video w-full overflow-hidden">
            <Skeleton className="h-full w-full rounded-none" />

            {/* Availability Badge */}
            <Skeleton className="absolute left-3 top-3 h-6 w-20 rounded-full" />
          </div>

          <CardContent className="space-y-4 p-5">
            {/* Rating */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            {/* Title */}
            <Skeleton className="h-6 w-3/4" />

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Price & Button */}
            <div className="flex items-end justify-between pt-2">
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>

              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </CardContent>
        </Card>

      ))}
    </div>
  );
}


