export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export const faqs: FAQ[] = [
  {
    id: "1",
    question: "How do I book a home service?",
    answer:
      "Optionally Diagnose the symptom, pick a service and technician, choose a slot, confirm the rate-card USD draft, then hold Job Reserve with EcoCash or COD on the job page.",
  },
  {
    id: "2",
    question: "Are all technicians verified?",
    answer:
      "Yes. Every technician goes through a verification process before joining Dial a Tech. Customer ratings and reviews are also displayed to help you choose with confidence.",
  },
  {
    id: "3",
    question: "When do I pay for my booking?",
    answer:
      "After you confirm the rate-card draft, pay on the job with EcoCash or cash on delivery (COD). Browse stays USD; ZiG appears only at pay from the ops daily rate. IMTT is not a checkout line.",
  },
  {
    id: "4",
    question: "Can I cancel a booking?",
    answer:
      "Yes. Bookings can be cancelled before the service status changes to In Progress. After work has started, cancellation is no longer available.",
  },
  {
    id: "5",
    question: "How do I become a technician?",
    answer:
      "Create an account as a Technician, complete your profile, add your services, upload verification details, and set your availability. After approval, you'll start receiving booking requests.",
  },
  {
    id: "6",
    question: "Can I leave a review after the service?",
    answer:
      "Absolutely. After a booking is marked as Completed, you'll be able to submit a rating and review to help other customers choose the right technician.",
  },
];