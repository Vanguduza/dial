

// import Image from "next/image";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Clock, Star } from "lucide-react";

// import { Service } from "@/types/types.service";

// interface ServiceCardProps {
//   service: Service;
// }

// export default function ServiceCard({ service }: ServiceCardProps) {
//   return (
//     <Card className="overflow-hidden transition-all hover:shadow-lg">
//       <div className="relative h-52 w-full">
//         <Image
//           src={service.thumbnail}
//           alt={service.title}
//           fill
//           className="object-cover"
//         />
//       </div>

//       <CardContent className="space-y-4 p-5">
//         <div className="flex items-center justify-between">
//           <Badge variant={service.isAvailable ? "default" : "secondary"}>
//             {service.isAvailable ? "Available" : "Unavailable"}
//           </Badge>

//           <div className="flex items-center gap-1 text-sm">
//             <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
//             <span>{service.averageRating}</span>
//             <span className="text-muted-foreground">
//               ({service.totalReviews})
//             </span>
//           </div>
//         </div>

//         <h3 className="text-xl font-semibold">{service.title}</h3>

//         <p className="line-clamp-2 text-sm text-muted-foreground">
//           {service.description}
//         </p>

//         <div className="flex items-center gap-2 text-sm text-muted-foreground">
//           <Clock className="h-4 w-4" />
//           {service.estimatedDuration} min
//         </div>

//         <div className="flex items-center justify-between">
//           <div>
//             <p className="text-2xl font-bold">
//               ${service.price}
//             </p>
//             <p className="text-xs text-muted-foreground">
//               {service.priceType === "FIXED"
//                 ? "Fixed Price"
//                 : "Per Hour"}
//             </p>
//           </div>

//           <Button>Book Now</Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

















import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock3, Star } from "lucide-react";
import { IService } from "@/types/types.service";

interface ServiceCardProps {
  service: IService;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className="group overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Thumbnail */}
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={service.thumbnail}
          alt={service.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <Badge
          className="absolute left-3 top-3"
          variant={service.isAvailable ? "default" : "secondary"}
        >
          {service.isAvailable ? "Available" : "Unavailable"}
        </Badge>
      </div>

      <CardContent className="space-y-4 p-5">
        {/* Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">
              {service.averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({service.totalReviews} reviews)
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="line-clamp-1 text-xl font-semibold">
          {service.title}
        </h3>

        {/* Description */}
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {service.description}
        </p>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock3 className="h-4 w-4" />
          <span>{service.estimatedDuration} min</span>
        </div>

        {/* Price & Button */}
        <div className="flex items-end justify-between pt-2">
          <div>
            <h4 className="text-2xl font-bold">
              ${service.price}
            </h4>

            <p className="text-xs text-muted-foreground">
              {service.priceType === "FIXED"
                ? "Fixed Price"
                : "Per Hour"}
            </p>
          </div>

          <Button asChild disabled={!service.isAvailable}>
            <Link href={`/tech/services/${service.id}`}>
              {service.isAvailable ? "Book Now" : "Unavailable"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}