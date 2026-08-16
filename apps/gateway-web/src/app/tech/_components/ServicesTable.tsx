// ServicesTable.tsx
"use client";

import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Star,
  Clock,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
};

type Technician = {
  id: string;
  userId: string;
  bio?: string;
  profilePhoto?: string;
  description?: string;
};

export type Service = {
  id: string;
  title: string;
  description: string;
  price: string | number;
  priceType: string;
  estimatedDuration: number;
  isAvailable: boolean;
  averageRating: number;
  totalReviews: number;
  thumbnail: string;
  category: Category;
  categoryId: string;
  technician?: Technician;
  technicianId?: string;
  createdAt?: string;
  updatedAt?: string;
};

interface ServicesTableProps {
  data: Service[];
}

export function ServicesTable({ data }: ServicesTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No services found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((service) => (
            <TableRow key={service.id}>
              {/* Thumbnail */}
              <TableCell>
                <div className="relative h-12 w-12 overflow-hidden rounded-md">
                  <Image
                    src={service.thumbnail}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              </TableCell>

              {/* Title + Description */}
              <TableCell>
                <div className="space-y-1 max-w-[220px]">
                  <p className="font-medium leading-none truncate">
                    {service.title}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {service.description}
                  </p>
                </div>
              </TableCell>

              {/* Category */}
              <TableCell>
                <Badge variant="outline">{service.category?.name}</Badge>
              </TableCell>

              {/* Price */}
              <TableCell>
                <div className="font-medium">
                  ${service.price}
                  <span className="ml-1 text-xs text-muted-foreground">
                    / {service.priceType.toLowerCase()}
                  </span>
                </div>
              </TableCell>

              {/* Duration */}
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {service.estimatedDuration} min
                </div>
              </TableCell>

              {/* Rating */}
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {service.averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({service.totalReviews})
                  </span>
                </div>
              </TableCell>

              {/* Availability */}
              <TableCell>
                <Badge
                  variant={service.isAvailable ? "default" : "secondary"}
                >
                  {service.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </TableCell>

              {/* Updated At */}
              <TableCell className="text-sm text-muted-foreground">
                {service.updatedAt
                  ? format(new Date(service.updatedAt), "MMM dd, yyyy")
                  : "—"}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}