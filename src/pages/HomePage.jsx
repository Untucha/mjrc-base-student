import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HeroBanner } from '../components/HeroBanner';
import { CategoryShowcase } from '../components/CategoryShowcase';
import { BrandGrid } from '../components/BrandGrid';
import { ProductGrid } from '../components/ProductGrid';
import { HubBanner } from '../components/HubBanner';
import { RunningTicker, TrustCards } from '../components/TrustBadges';
import { StoreMilestones } from '../components/StoreMilestones';
import { ReviewShowcase } from '../components/ReviewShowcase';

export const HomePage = () => {
  const location = useLocation();

  useEffect(() => {
    const returnSection = location.state?.returnSection ||
                          window.history.state?.usr?.returnSection ||
                          (location.hash ? location.hash.replace('#', '') : null) ||
                          (typeof window !== 'undefined' ? sessionStorage.getItem('returnSection') : null);

    if (returnSection) {
      const timer = setTimeout(() => {
        const element = document.getElementById(returnSection);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('returnSection');
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <div className="space-y-3 sm:space-y-6 pb-20">
      {/* 1. Hero Header */}
      <HeroBanner />

      {/* 2. Black Running Ticker (Continuous moving marquee) */}
      <RunningTicker />

      {/* 3. Shop by Category */}
      <div id="shop-by-category" className="scroll-mt-20">
        <div id="shop-categories">
          <CategoryShowcase />
        </div>
      </div>

      {/* 4. Shop by Brands */}
      <div id="shop-by-brand" className="scroll-mt-20">
        <div id="brands-section">
          <BrandGrid />
        </div>
      </div>

      {/* 6. Latest RC Cars Showcase (STRICT CAP: EXACTLY 10 FLAGSHIP VEHICLES) */}
      <div id="latest-rc-cars" className="scroll-mt-20">
        <div id="latest-cars">
          <ProductGrid limit={10} useLatestRcOnly={true} />
        </div>
      </div>

      {/* 7. Visit Our Mysore Dispatch Hub */}
      <HubBanner />

      {/* 8. Verified Trust Grid (Interactive Glowing 3D Glassmorphism Cards) */}
      <TrustCards />

      {/* 9. Store Milestones */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <StoreMilestones />
      </div>

      {/* 10. Customer Reviews */}
      <ReviewShowcase />
    </div>
  );
};

export default HomePage;
