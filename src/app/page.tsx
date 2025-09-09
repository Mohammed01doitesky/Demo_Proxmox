// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

import BookingHero from "@/components/booking-hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <BookingHero />
    </div>
  );
}
