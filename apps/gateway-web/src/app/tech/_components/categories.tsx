import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen } from "lucide-react";
import { getAllCategories } from "../../../lib/tech/fixitnowActions";

export default async function Categories() {
  const result = await getAllCategories();

  if (!result.success) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">{result.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center gap-3">
        <FolderOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Service Categories</h1>
          <p className="text-muted-foreground">
            Browse all available service categories.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {result.data.map((category) => (
          <Card
            key={category.id}
            className="transition-shadow hover:shadow-lg"
          >
            <CardHeader className="items-center text-center">
              <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full border bg-muted">
                <Image
                  src={category.icon}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>

              <CardTitle>{category.name}</CardTitle>

              <Badge
                variant={category.isActive ? "default" : "secondary"}
              >
                {category.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-3">
              <CardDescription className="line-clamp-3">
                {category.description}
              </CardDescription>

              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Slug:</span>{" "}
                  {category.slug}
                </p>

                <p className="text-muted-foreground text-xs">
                  Created:{" "}
                  {new Date(category.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {result.data.length === 0 && (
        <Card className="mt-10">
          <CardContent className="py-10 text-center text-muted-foreground">
            No categories found.
          </CardContent>
        </Card>
      )}
    </div>
  );
}