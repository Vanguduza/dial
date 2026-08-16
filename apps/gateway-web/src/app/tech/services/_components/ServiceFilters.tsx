
"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  RotateCcw,
  SlidersHorizontal,
  Tags,
  MapPin,
  Building2,
  MapPinned,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IServiceCategory {
  id: string;
  name: string;
}

interface ServiceFilterProps {
  categories: IServiceCategory[];
}

export default function ServiceFilter({
  categories,
}: ServiceFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // -----------------------------------------
  // Get current filter value
  // -----------------------------------------

  const getValue = (key: string) => {
    return searchParams.get(key) || "";
  };

  // -----------------------------------------
  // Update URL
  // -----------------------------------------

  const updateFilter = (
    key: string,
    value: string
  ) => {
    const params = new URLSearchParams(
      searchParams.toString()
    );

    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(
      `${pathname}?${params.toString()}`
    );
  };

  // -----------------------------------------
  // Reset filters
  // -----------------------------------------

  const resetFilters = () => {
    router.push(pathname);
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {/* =========================
          HEADER
      ========================== */}

      <CardHeader className="border-b bg-muted/30 px-5 py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="h-4 w-4" />
          Filter Services
        </CardTitle>
      </CardHeader>

      {/* =========================
          CONTENT
      ========================== */}

      <CardContent className="h-full p-5">
        <div className="flex h-full flex-col gap-5">

          {/* =========================
              CATEGORY
          ========================== */}

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Tags className="h-4 w-4 text-muted-foreground" />
              Category
            </label>

            <Select
              value={
                getValue("categoryId") || "all"
              }
              onValueChange={(value) =>
                updateFilter(
                  "categoryId",
                  value
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  All Categories
                </SelectItem>

                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* =========================
              CITY
          ========================== */}

          <div className="space-y-2">
            <label
              htmlFor="city"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <MapPin className="h-4 w-4 text-muted-foreground" />
              City
            </label>

            <Input
              id="city"
              defaultValue={getValue("city")}
              placeholder="e.g. Dhaka"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  updateFilter(
                    "city",
                    event.currentTarget.value
                  );
                }
              }}
            />
          </div>

          {/* =========================
              DISTRICT
          ========================== */}

          <div className="space-y-2">
            <label
              htmlFor="district"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Building2 className="h-4 w-4 text-muted-foreground" />
              District
            </label>

            <Input
              id="district"
              defaultValue={getValue("district")}
              placeholder="e.g. Chattogram"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  updateFilter(
                    "district",
                    event.currentTarget.value
                  );
                }
              }}
            />
          </div>

          {/* =========================
              ADDRESS
          ========================== */}

          <div className="space-y-2">
            <label
              htmlFor="address"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <MapPinned className="h-4 w-4 text-muted-foreground" />
              Address
            </label>

            <Input
              id="address"
              defaultValue={getValue("address")}
              placeholder="e.g. Uttara"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  updateFilter(
                    "address",
                    event.currentTarget.value
                  );
                }
              }}
            />
          </div>

          {/* =========================
              MINIMUM RATING
          ========================== */}

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Star className="h-4 w-4 text-muted-foreground" />
              Minimum Rating
            </label>

            <Select
              value={
                getValue("minRating") || "all"
              }
              onValueChange={(value) =>
                updateFilter(
                  "minRating",
                  value
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Any Rating
                </SelectItem>

                <SelectItem value="1">
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-current" />
                    1+ Stars
                  </span>
                </SelectItem>

                <SelectItem value="2">
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-current" />
                    2+ Stars
                  </span>
                </SelectItem>

                <SelectItem value="3">
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-current" />
                    3+ Stars
                  </span>
                </SelectItem>

                <SelectItem value="4">
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-current" />
                    4+ Stars
                  </span>
                </SelectItem>

                <SelectItem value="5">
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-current" />
                    5 Stars
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* =========================
              RESET
          ========================== */}

          <div className="mt-auto border-t pt-5">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={resetFilters}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
