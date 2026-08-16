export interface Review {
  id: number;
  name: string;
  role: string;
  image: string;
  rating: number;
  service: string;
  review: string;
}

export const reviews: Review[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Homeowner",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
    rating: 5,
    service: "Plumbing",
    review:
      "Excellent service! The plumber arrived on time, fixed the leak quickly, and the booking process was incredibly smooth.",
  },
  {
    id: 2,
    name: "Michael Brown",
    role: "Apartment Owner",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
    rating: 5,
    service: "Electrical",
    review:
      "Very professional electrician. Everything was completed safely and the pricing was transparent.",
  },
  {
    id: 3,
    name: "Emily Davis",
    role: "Customer",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
    rating: 5,
    service: "Cleaning",
    review:
      "My home has never looked better. Booking took less than five minutes and the cleaner exceeded expectations.",
  },
  {
    id: 4,
    name: "David Wilson",
    role: "Business Owner",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
    rating: 5,
    service: "AC Repair",
    review:
      "Fast response and excellent technician. Highly recommended for emergency AC repairs.",
  },
];