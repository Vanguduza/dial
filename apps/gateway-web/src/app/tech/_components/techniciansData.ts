import {
  Wrench,
  Zap,
  Fan,
  Paintbrush,
  Hammer,
  Sparkles,
} from "lucide-react";


import { LucideIcon } from "lucide-react";

export interface Technician {
  id: string;
  name: string;
  profession: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  completedJobs: number;
  experience: string;
  hourlyRate: number;
  verified: boolean;
  skills: string[];
  icon: LucideIcon;
}





export const topTechnicians: Technician[] = [
  {
    id: "1",
    name: "John Carter",
    profession: "Master Plumber",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600",
    location: "New York",
    rating: 4.9,
    reviews: 324,
    completedJobs: 582,
    experience: "8 Years",
    hourlyRate: 30,
    verified: true,
    skills: ["Pipes", "Leak Repair", "Installation"],
    icon: Wrench,
  },
  {
    id: "2",
    name: "David Smith",
    profession: "Electrician",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600",
    location: "Chicago",
    rating: 4.8,
    reviews: 281,
    completedJobs: 430,
    experience: "6 Years",
    hourlyRate: 35,
    verified: true,
    skills: ["Wiring", "Lighting", "Maintenance"],
    icon: Zap,
  },
  {
    id: "3",
    name: "Michael Lee",
    profession: "AC Technician",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600",
    location: "Los Angeles",
    rating: 5,
    reviews: 198,
    completedJobs: 311,
    experience: "7 Years",
    hourlyRate: 40,
    verified: true,
    skills: ["AC Repair", "Installation", "Maintenance"],
    icon: Fan,
  },
  {
    id: "4",
    name: "Robert James",
    profession: "Painter",
    image: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=600",
    location: "Houston",
    rating: 4.9,
    reviews: 210,
    completedJobs: 360,
    experience: "9 Years",
    hourlyRate: 28,
    verified: true,
    skills: ["Interior", "Exterior", "Texture"],
    icon: Paintbrush,
  },
  {
    id: "5",
    name: "Daniel Brown",
    profession: "Carpenter",
    image: "https://images.unsplash.com/photo-1633625576932-348e73c45e82?q=80&w=571&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D0",
    location: "Dallas",
    rating: 4.8,
    reviews: 166,
    completedJobs: 275,
    experience: "5 Years",
    hourlyRate: 32,
    verified: true,
    skills: ["Furniture", "Cabinets", "Woodwork"],
    icon: Hammer,
  },
  {
    id: "6",
    name: "Emma Wilson",
    profession: "Cleaning Specialist",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600",
    location: "Miami",
    rating: 5,
    reviews: 410,
    completedJobs: 740,
    experience: "10 Years",
    hourlyRate: 24,
    verified: true,
    skills: ["Deep Clean", "Office", "Home"],
    icon: Sparkles,
  },
];