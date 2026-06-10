import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Platforms from "@/components/Platforms";
import Features from "@/components/Features";
import HowToSteps from "@/components/HowToSteps";
import PlatformDetails from "@/components/PlatformDetails";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Platforms />
        <Features />
        <HowToSteps />
        <PlatformDetails />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
