import "./landing.css";
import { Navigation } from "./Navigation";
import { Hero } from "./Hero";
import { UnlockTypesSection } from "./UnlockTypesSection";
import { EditorialBreak } from "./EditorialBreak";
import { AboutSection } from "./AboutSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { FaqSection } from "./FaqSection";
import { GetStartedSection } from "./GetStartedSection";
import { Footer } from "./Footer";

export function LandingPage() {
  return (
    <div className="landing-theme font-sans antialiased">
      <Navigation />
      <Hero />
      <UnlockTypesSection />
      <EditorialBreak />
      <AboutSection />
      <HowItWorksSection />
      <FaqSection />
      <GetStartedSection />
      <Footer />
    </div>
  );
}
