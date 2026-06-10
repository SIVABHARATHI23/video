"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ToonHubHero from "@/components/ToonHubHero";
import Platforms from "@/components/Platforms";
import Features from "@/components/Features";
import HowToSteps from "@/components/HowToSteps";
import PlatformDetails from "@/components/PlatformDetails";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  const [showDownloader, setShowDownloader] = useState(false);

  return (
    <>
      {!showDownloader ? (
        <ToonHubHero onDiscover={() => setShowDownloader(true)} />
      ) : (
        <>
          <Header onHomeClick={() => setShowDownloader(false)} />
          <main>
            <div id="downloader-section">
              <Hero />
            </div>
            <Platforms />
            <Features />
            <HowToSteps />
            <PlatformDetails />
            <FAQ />
          </main>
          <Footer />
        </>
      )}
    </>
  );
}
