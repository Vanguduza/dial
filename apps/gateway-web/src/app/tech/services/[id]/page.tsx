
// const SingleServiceByIdPage = async ({ params }: { params: Promise<{ id: string }> }) => {
//   const { id } = await params;
//   return <div>ServideByIdPage {id}</div>;
// };

// export default SingleServiceByIdPage














import Image from "next/image";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Star,
  Clock,
  Calendar,
  Tag,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { IBookingSlot } from "@/types/types.service";
import BookingModal from "../_components/BookingModal";
import { getTechServiceById } from "../../../../lib/tech/fixitnowCatalogue";
import { notFound } from "next/navigation";

const SingleServiceByIdPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const data = await getTechServiceById(id);
  if (!data) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left */}
        <div className="space-y-8 lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative h-[420px] w-full">
              <Image
                src={data.thumbnail}
                alt={data.title}
                fill
                className="object-cover"
              />
            </div>
          </Card>

          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>{data.category.name}</Badge>

                {data.isAvailable ? (
                  <Badge className="bg-green-600 hover:bg-green-600">
                    Available
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    Unavailable
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl font-bold">
                {data.title}
              </h1>

              <div className="flex flex-wrap gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span>
                    {data.averageRating}.0 ({data.totalReviews} Reviews)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {data.estimatedDuration} Minutes
                </div>

                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  {data.priceType}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-xl font-semibold">
                  Description
                </h2>

                <p className="leading-7 text-muted-foreground">
                  {data.description}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6">
              <h2 className="text-2xl font-bold">
                Booking Slots
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                {data.bookingSlots.map((slot: IBookingSlot) => (
                  <div
                    key={slot.id}
                    className={`rounded-xl border p-4 ${slot.isAvailable
                      ? "border-green-300 bg-green-50"
                      : "border-red-200 bg-red-50"
                      }`}
                  >
                    <div className="mb-3 flex items-center gap-2 font-semibold">
                      <Calendar className="h-5 w-5" />

                      {new Date(slot.date).toLocaleDateString()}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {new Date(slot.startsAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}

                      {" - "}

                      {new Date(slot.endsAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    <p className="mt-2 text-sm">
                      {slot.note}
                    </p>

                    <div className="mt-3">
                      {slot.isAvailable ? (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-4 w-4" />
                          Booked
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="space-y-6 p-6">
              <div>
                <p className="text-muted-foreground">
                  Rate-card draft
                </p>

                <h2 className="text-4xl font-bold text-primary">
                  ${data.price}
                </h2>

                <p className="text-muted-foreground">
                  Draft USD — confirmed on site
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Category</span>

                  <span className="font-medium">
                    {data.category.name}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Duration</span>

                  <span>{data.estimatedDuration} min</span>
                </div>

                <div className="flex justify-between">
                  <span>Rating</span>

                  <span>{data.averageRating}/5</span>
                </div>

                <div className="flex justify-between">
                  <span>Status</span>

                  <span
                    className={
                      data.isAvailable
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {data.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>

              {/* <Button
                className="w-full"
                size="lg"
                disabled={!data.isAvailable}
              >
                Book This Service
              </Button> */}

              <BookingModal
                serviceId={data.id}
                jobClass={data.jobClass}
                emergency={data.emergency}
                draftAmountUsdMinor={data.amountUsdMinor}
                slots={data.bookingSlots.filter(
                  (slot: IBookingSlot) => slot.isAvailable
                )}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SingleServiceByIdPage;