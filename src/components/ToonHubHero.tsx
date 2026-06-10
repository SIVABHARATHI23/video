"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const IMAGES = [
  {
    name: "YOUTUBE",
    src: "/youtube-logo.png",
    bg: "#B71C1C", // Deep premium red
    panel: "#EF4444",
    title: "YOUTUBE DOWNLOADER",
    desc: "Download high-quality YouTube videos, Shorts, and convert to MP3 or MP4 format in seconds with no speed limits.",
  },
  {
    name: "INSTAGRAM",
    src: "/instagram-logo.png",
    bg: "#6B21A8", // Deep premium purple/pink
    panel: "#C13584",
    title: "INSTAGRAM DOWNLOADER",
    desc: "Save Instagram Reels, photos, stories, and IGTV videos directly to your device with original quality and no watermark.",
  },
  {
    name: "FACEBOOK",
    src: "/facebook-logo.png",
    bg: "#1E3A8A", // Deep premium blue
    panel: "#1877F2",
    title: "FACEBOOK DOWNLOADER",
    desc: "Extract and save public Facebook videos, stories, and live streams in crystal-clear HD resolution.",
  },
  {
    name: "PINTEREST",
    src: "/pinterest-logo.png",
    bg: "#881337", // Deep premium rose red
    panel: "#BD081C",
    title: "PINTEREST DOWNLOADER",
    desc: "Download Pinterest videos, ideas, and pins quickly and easily with our optimized media harvester.",
  },
];

interface ToonHubHeroProps {
  onDiscover: () => void;
}

export default function ToonHubHero({ onDiscover }: ToonHubHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Preload all 4 images on mount
  useEffect(() => {
    IMAGES.forEach((img) => {
      const newImg = new Image();
      newImg.src = img.src;
    });

    // Handle initial size and resizes
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Autoplay rotation every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      navigate("next");
    }, 4000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, isAnimating]);

  const navigate = (direction: "next" | "prev") => {
    if (isAnimating) return;
    setIsAnimating(true);

    if (direction === "next") {
      setActiveIndex((prev) => (prev + 1) % 4);
    } else {
      setActiveIndex((prev) => (prev + 3) % 4);
    }

    setTimeout(() => {
      setIsAnimating(false);
    }, 650);
  };

  // Derive roles
  const centerIndex = activeIndex;
  const leftIndex = (activeIndex + 3) % 4;
  const rightIndex = (activeIndex + 1) % 4;
  const backIndex = (activeIndex + 2) % 4;

  const getRoleStyle = (index: number): React.CSSProperties => {
    if (index === centerIndex) {
      return {
        transform: `translate(-50%, -50%) scale(${isMobile ? 1.0 : 1.35})`,
        filter: "blur(0px)",
        opacity: 1,
        zIndex: 20,
        left: "50%",
        top: "50%",
        height: isMobile ? "45%" : "60%",
      };
    }
    if (index === leftIndex) {
      return {
        transform: "translate(-50%, -50%) scale(1)",
        filter: "blur(2px)",
        opacity: 0.65,
        zIndex: 10,
        left: isMobile ? "12%" : "25%",
        top: "50%",
        height: isMobile ? "20%" : "28%",
      };
    }
    if (index === rightIndex) {
      return {
        transform: "translate(-50%, -50%) scale(1)",
        filter: "blur(2px)",
        opacity: 0.65,
        zIndex: 10,
        left: isMobile ? "88%" : "75%",
        top: "50%",
        height: isMobile ? "20%" : "28%",
      };
    }
    // back index
    return {
      transform: "translate(-50%, -50%) scale(1)",
      filter: "blur(4px)",
      opacity: 0.4,
      zIndex: 5,
      left: "50%",
      top: "50%",
      height: isMobile ? "10%" : "15%",
    };
  };

  const handleDiscoverClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onDiscover();
  };

  return (
    <div
      style={{
        backgroundColor: IMAGES[activeIndex].bg,
        transition: "background-color 650ms cubic-bezier(0.4, 0, 0.2, 1)",
        fontFamily: "'Inter', sans-serif",
      }}
      className="relative w-full overflow-hidden"
    >
      <div className="relative w-full h-[100vh] overflow-hidden">
        {/* 1. Grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-50 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
            backgroundRepeat: "repeat",
          }}
        />

        {/* 2. Giant ghost text */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none z-[2]"
          style={{
            top: "18%",
            fontFamily: "'Anton', sans-serif",
            fontSize: "clamp(90px, 28vw, 380px)",
            fontWeight: 900,
            color: "white",
            opacity: 0.15,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
            transition: "opacity 650ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {IMAGES[activeIndex].name}
        </div>

        {/* 3. Top-left brand label */}
        <div className="absolute top-6 left-4 sm:left-8 z-[60] text-xs font-semibold uppercase text-white opacity-90 tracking-[0.18em]">
          VIDEOHARVESTER
        </div>

        {/* 4. Carousel logos */}
        <div className="absolute inset-0 z-[3]">
          {IMAGES.map((img, idx) => {
            const dynamicStyle = getRoleStyle(idx);
            return (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  aspectRatio: "1 / 1",
                  transition:
                    "transform 650ms cubic-bezier(0.4, 0, 0.2, 1), filter 650ms cubic-bezier(0.4, 0, 0.2, 1), opacity 650ms cubic-bezier(0.4, 0, 0.2, 1), left 650ms cubic-bezier(0.4, 0, 0.2, 1), top 650ms cubic-bezier(0.4, 0, 0.2, 1), height 650ms cubic-bezier(0.4, 0, 0.2, 1)",
                  willChange: "transform, filter, opacity",
                  ...dynamicStyle,
                }}
                className="select-none pointer-events-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={`${img.name} 3D Logo`}
                  className="w-full h-full object-contain object-center select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            );
          })}
        </div>

        {/* 5. Bottom-left text + nav buttons */}
        <div
          className="absolute bottom-6 left-4 sm:bottom-20 sm:left-24 z-[60] flex flex-col items-start text-white"
          style={{ maxWidth: "320px" }}
        >
          <p className="font-bold uppercase tracking-widest mb-2 sm:mb-3 text-base sm:text-[22px] opacity-95 leading-none">
            {IMAGES[activeIndex].title}
          </p>
          <p className="hidden sm:block text-xs sm:text-sm text-white opacity-85 leading-[1.6] mb-4 sm:mb-5">
            {IMAGES[activeIndex].desc}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("prev")}
              className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full border-2 border-white bg-transparent text-white transition-all duration-150 hover:scale-[1.08] hover:bg-white/10 active:scale-95"
              aria-label="Previous logo"
            >
              <ArrowLeft className="w-6 h-6" strokeWidth={2.25} />
            </button>
            <button
              onClick={() => navigate("next")}
              className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full border-2 border-white bg-transparent text-white transition-all duration-150 hover:scale-[1.08] hover:bg-white/10 active:scale-95"
              aria-label="Next logo"
            >
              <ArrowRight className="w-6 h-6" strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* 6. Bottom-right link "DISCOVER IT" */}
        <div className="absolute bottom-6 right-4 sm:bottom-20 sm:right-10 z-[60]">
          <a
            href="#downloader-section"
            onClick={handleDiscoverClick}
            className="flex items-center gap-2 sm:gap-3 text-white transition-opacity duration-200 opacity-95 hover:opacity-100 uppercase"
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: "clamp(20px, 4vw, 56px)",
              fontWeight: 400,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textDecoration: "none",
            }}
          >
            DISCOVER IT
            <ArrowRight
              className="w-5 h-5 sm:w-8 sm:h-8 shrink-0 text-white"
              strokeWidth={2.25}
            />
          </a>
        </div>
      </div>
    </div>
  );
}
