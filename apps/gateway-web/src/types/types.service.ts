export interface IService {
  id: string;
  title: string;
  description: string;
  price: number;
  priceType: "FIXED" | "HOURLY";
  estimatedDuration: number;
  thumbnail: string;
  isAvailable: boolean;
  averageRating: number;
  totalReviews: number;
}



export interface IBookingSlot {
  id: string;
  serviceId: string;
  date: string;
  startsAt: string;
  endsAt: string;
  isAvailable: boolean;
  isBooked: boolean;
  bookingId: string | null;
  note: string;
  bookingDeadline: string;
  maxBookings: number;
  bookedCount: number;
  createdAt: string;
  updatedAt: string;
}



export interface BookingDetailsProps {
  id: string;
  note: string;
  status: string;
  createdAt: string;
  customerId: string;
  paymentStatus: string;
  bookingDate: string;
  // paymentStatus: REQUESTED | ACCEPTED |DECLINED| PAID| IN_PROGRESS | COMPLETED | CANCELLED;
  service: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    price: number;
    estimatedDuration: number;
  };
}