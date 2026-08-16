import { LucideIcon } from "lucide-react";

export interface IFeaturedService {
  title: string;
  price: string;
  rating: number;
  reviews: number;
  icon: LucideIcon;
  image: string;
  description: string;
}




import {
  Wrench,
  Zap,
  Paintbrush,
  Sparkles,
  Fan,
  Hammer,
} from "lucide-react";

export const featuredServices: IFeaturedService[] = [
  {
    title: "Plumbing",
    price: "$45",
    rating: 4.9,
    reviews: 324,
    icon: Wrench,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900",
    description:
      "Leak repairs, pipe installation and emergency plumbing services.",
  },
  {
    title: "Electrical",
    price: "$45",
    rating: 4.8,
    reviews: 241,
    icon: Zap,
    image:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900",
    description:
      "Safe electrical repairs, wiring, lighting and maintenance.",
  },
  {
    title: "Cleaning",
    price: "$45",
    rating: 5,
    reviews: 502,
    icon: Sparkles,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900",
    description:
      "Professional home and office cleaning with eco-friendly products.",
  },
  {
    title: "Painting",
    price: "$45",
    rating: 4.9,
    reviews: 168,
    icon: Paintbrush,
    image:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=900",
    description:
      "Interior and exterior painting with premium finishes.",
  },
  {
    title: "AC Repair",
    price: "$45",
    rating: 4.8,
    reviews: 212,
    icon: Fan,
    image:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900",
    description:
      "Fast AC servicing, installation and maintenance.",
  },
  {
    title: "Carpentry",
    price: "$45",
    rating: 4.9,
    reviews: 196,
    icon: Hammer,
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900",
    description:
      "Furniture repair, custom woodwork and installations.",
  },
];