/**
 * Dial a Tech landing — copied FixItNow public home (D-38).
 * CTAs browse /tech/services; book posts POST /api/tech/services.
 */
import HeroCarousel from "./_components/HeroCarousel";
import PopularIndustries from "./_components/PopularIndustries";
import HowItWorks from "./_components/HowItWorks";
import FeaturedServices from "./_components/FeaturedServices";
import TopRatedTechnicians from "./_components/TopRatedTechnicians";
import WhyChooseFixItNow from "./_components/WhyChooseFixItNow";
import BookingProcessTimeline from "./_components/BookingProcessTimeline";
import CustomerReviews from "./_components/CustomerReviews";
import PlatformStatistics from "./_components/PlatformStatistics";
import BecomeTechnician from "./_components/BecomeTechnician";
import FAQSection from "./_components/FAQSection";
import FinalCTA from "./_components/FinalCTA";

export default function TechHomePage() {
  return (
    <div>
      <HeroCarousel />
      <PopularIndustries />
      <HowItWorks />
      <FeaturedServices />
      <TopRatedTechnicians />
      <WhyChooseFixItNow />
      <BookingProcessTimeline />
      <CustomerReviews />
      <PlatformStatistics />
      <BecomeTechnician />
      <FAQSection />
      <FinalCTA />
    </div>
  );
}
