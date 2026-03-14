"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import SmartSimpleBrilliant from "../components/smart-simple-brilliant";
import YourWorkInSync from "../components/your-work-in-sync";
import EffortlessIntegration from "../components/effortless-integration-updated";
import NumbersThatSpeak from "../components/numbers-that-speak";
import DocumentationSection from "../components/documentation-section";
import TestimonialsSection from "../components/testimonials-section";
import FAQSection from "../components/faq-section";
import PricingSection from "../components/pricing-section";
import CTASection from "../components/cta-section";
import FooterSection from "../components/footer-section";

// Reusable Badge Component
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="group px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(2,6,23,0.08)] shadow-xs transition-all duration-300 hover:shadow-[0px_0px_0px_4px_rgba(55,50,47,0.08),0px_2px_8px_rgba(0,0,0,0.08)] hover:scale-105 cursor-default">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <div className="text-center flex justify-center flex-col text-[#37322F] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [activeCard, setActiveCard] = useState(0);
  const [progress, setProgress] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (!mountedRef.current) return;

      setProgress((prev) => {
        if (prev >= 100) {
          if (mountedRef.current) {
            setActiveCard((current) => (current + 1) % 3);
          }
          return 0;
        }
        return prev + 2; // 2% every 100ms = 5 seconds total
      });
    }, 100);

    return () => {
      clearInterval(progressInterval);
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleCardClick = (index: number) => {
    if (!mountedRef.current) return;
    setActiveCard(index);
    setProgress(0);
  };

  const getDashboardContent = () => {
    switch (activeCard) {
      case 0:
        return (
          <div className="text-[#828387] text-sm">
            Customer Subscription Status and Details
          </div>
        );
      case 1:
        return (
          <div className="text-[#828387] text-sm">
            Analytics Dashboard - Real-time Insights
          </div>
        );
      case 2:
        return (
          <div className="text-[#828387] text-sm">
            Data Visualization - Charts and Metrics
          </div>
        );
      default:
        return (
          <div className="text-[#828387] text-sm">
            Customer Subscription Status and Details
          </div>
        );
    }
  };

  return (
    <div className="w-full min-h-screen relative bg-gradient-to-br from-[#F7F5F3] via-[#F7F5F3] to-[#F0EBE6] overflow-x-hidden flex flex-col justify-start items-center">
      <div className="relative flex flex-col justify-start items-center w-full">
        {/* Main container with proper margins */}
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] relative flex flex-col justify-start items-start min-h-screen">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          <div className="self-stretch pt-[9px] overflow-hidden border-b border-[rgba(55,50,47,0.06)] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
            {/* Fixed Navbar */}
            <Navbar />

            {/* Hero Section */}
            <div className="pt-[100px] sm:pt-[120px] md:pt-[140px] lg:pt-[216px] pb-8 sm:pb-12 md:pb-16 flex flex-col justify-start items-center px-2 sm:px-4 md:px-8 lg:px-0 w-full sm:pl-0 sm:pr-0 pl-0 pr-0">
              <div className="w-full max-w-[937px] lg:w-[937px] flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 animate-fade-in-up">
                <div className="self-stretch rounded-[3px] flex flex-col justify-center items-center gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                  <div
                    className="w-full max-w-[748.71px] lg:w-[748.71px] text-center flex justify-center flex-col text-[#37322F] text-[24px] xs:text-[28px] sm:text-[36px] md:text-[52px] lg:text-[80px] font-normal leading-[1.1] sm:leading-[1.15] md:leading-[1.2] lg:leading-24 font-serif px-2 sm:px-4 md:px-0 animate-fade-in-up"
                    style={{ animationDelay: "0.1s" }}
                  >
                    AI mock interviews
                    <br />
                    tailored by Bodhi
                  </div>
                  <div
                    className="w-full max-w-[506.08px] lg:w-[506.08px] text-center flex justify-center flex-col text-[rgba(55,50,47,0.80)] sm:text-lg md:text-xl leading-[1.4] sm:leading-[1.45] md:leading-normal lg:leading-7 px-2 sm:px-4 md:px-0 lg:text-lg font-medium text-sm font-serif animate-fade-in-up"
                    style={{ animationDelay: "0.2s" }}
                  >
                    Practice real interview flows with resume-aware guidance
                    <br className="hidden sm:block" />
                    and actionable feedback powered by Bodhi.
                  </div>
                </div>
              </div>

              <div
                className="w-full max-w-[497px] lg:w-[497px] flex flex-col justify-center items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 relative z-10 mt-6 sm:mt-8 md:mt-10 lg:mt-12 animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="backdrop-blur-[8.25px] flex justify-start items-center gap-4">
                  <div className="group relative h-10 sm:h-11 md:h-12 px-6 sm:px-8 md:px-10 lg:px-12 py-2 sm:py-[6px] bg-gradient-to-br from-[#37322F] to-[#2A2624] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset,0px_4px_12px_rgba(0,0,0,0.15)] overflow-hidden rounded-full flex justify-center items-center cursor-pointer transition-all duration-300 hover:shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset,0px_6px_20px_rgba(0,0,0,0.25),0_0_15px_rgba(55,50,47,0.5)] hover:scale-105">
                    <div className="w-20 sm:w-24 md:w-28 lg:w-44 h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
                    <div className="flex flex-col justify-center text-white text-sm sm:text-base md:text-[15px] font-medium leading-5 font-sans transition-transform duration-300 group-hover:scale-105">
                      Start for free
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-[232px] sm:top-[248px] md:top-[264px] lg:top-[320px] left-1/2 transform -translate-x-1/2 z-0 pointer-events-none">
                <img
                  src="/mask-group-pattern.svg"
                  alt=""
                  className="w-[936px] sm:w-[1404px] md:w-[2106px] lg:w-[2808px] h-auto opacity-30 sm:opacity-40 md:opacity-50 mix-blend-multiply"
                  style={{
                    filter: "hue-rotate(15deg) saturate(0.7) brightness(1.2)",
                  }}
                />
              </div>

              <div
                className="w-full max-w-[960px] lg:w-[960px] pt-2 sm:pt-4 pb-6 sm:pb-8 md:pb-10 px-2 sm:px-4 md:px-6 lg:px-11 flex flex-col justify-center items-center gap-2 relative z-5 my-8 sm:my-12 md:my-16 lg:my-16 mb-0 lg:pb-0 animate-scale-in"
                style={{ animationDelay: "0.4s" }}
              >
                <div className="glass w-full max-w-[960px] lg:w-[960px] h-[200px] sm:h-[280px] md:h-[450px] lg:h-[695.55px] shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08),0px_8px_24px_rgba(0,0,0,0.08)] overflow-hidden rounded-[6px] sm:rounded-[8px] lg:rounded-[9.06px] flex flex-col justify-start items-start transition-all duration-500 hover:shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08),0px_12px_32px_rgba(0,0,0,0.12)]">
                  {/* Dashboard Content */}
                  <div className="self-stretch flex-1 flex justify-start items-start">
                    {/* Main Content */}
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="relative w-full h-full overflow-hidden">
                        {/* Product Image 1 - Plan your schedules */}
                        <div
                          className={`absolute inset-0 transition-all duration-700 ease-in-out ${activeCard === 0
                              ? "opacity-100 scale-100 blur-0"
                              : "opacity-0 scale-95 blur-sm"
                            }`}
                        >
                          <img
                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dsadsadsa.jpg-xTHS4hGwCWp2H5bTj8np6DXZUyrxX7.jpeg"
                            alt="Schedules Dashboard - Customer Subscription Management"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Product Image 2 - Data to insights */}
                        <div
                          className={`absolute inset-0 transition-all duration-700 ease-in-out ${activeCard === 1
                              ? "opacity-100 scale-100 blur-0"
                              : "opacity-0 scale-95 blur-sm"
                            }`}
                        >
                          <img
                            src="/analytics-dashboard-with-charts-graphs-and-data-vi.jpg"
                            alt="Analytics Dashboard"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Product Image 3 - Data visualization */}
                        <div
                          className={`absolute inset-0 transition-all duration-700 ease-in-out ${activeCard === 2
                              ? "opacity-100 scale-100 blur-0"
                              : "opacity-0 scale-95 blur-sm"
                            }`}
                        >
                          <img
                            src="/data-visualization-dashboard-with-interactive-char.jpg"
                            alt="Data Visualization Dashboard"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text Overlay with Card Navigation */}
                  <div className="absolute left-0 right-0 bottom-0 px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-6 md:pb-8">
                    <div className="glass-dark w-full max-w-[900px] mx-auto flex flex-col gap-3 sm:gap-4 rounded-xl p-4 sm:p-5 shadow-[0px_8px_24px_rgba(0,0,0,0.2)]">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex-1 text-white/90 text-sm font-medium">
                          {getDashboardContent()}
                        </div>
                        <div className="flex items-center gap-2">
                          {[0, 1, 2].map((index) => (
                            <button
                              key={index}
                              onClick={() => handleCardClick(index)}
                              className={`w-8 h-1.5 rounded-full transition-all duration-300 ${activeCard === index
                                  ? "bg-white w-12"
                                  : "bg-white/30 hover:bg-white/50"
                                }`}
                              aria-label={`View dashboard ${index + 1}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="w-full max-w-[1060px] lg:w-[1060px] px-6 sm:px-8 md:px-12 lg:px-0 pb-12 sm:pb-16 md:pb-20 flex flex-col justify-start items-center gap-6 sm:gap-8 animate-fade-in-up"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="self-stretch flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8">
                  {[
                    {
                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5.5 13H8.5M3 10.5H11C12.1046 10.5 13 9.60457 13 8.5V3.5C13 2.39543 12.1046 1.5 11 1.5H3C1.89543 1.5 1 2.39543 1 3.5V8.5C1 9.60457 1.89543 10.5 3 10.5Z"
                            stroke="#37322F"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ),
                      text: "Trusted by 1,000+ teams",
                    },
                    {
                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7 1.5V12.5M2.5 4H11.5M3 9.5H11"
                            stroke="#37322F"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ),
                      text: "99.9% uptime SLA",
                    },
                    {
                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7 1.5L8.5 5.5H12.5L9.5 8L11 12.5L7 10L3 12.5L4.5 8L1.5 5.5H5.5L7 1.5Z"
                            stroke="#37322F"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ),
                      text: "4.9/5 customer rating",
                    },
                  ].map((badge, index) => (
                    <div
                      key={index}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                    >
                      <Badge icon={badge.icon} text={badge.text} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl flex flex-col justify-start items-center relative">
        <SmartSimpleBrilliant />
        {<YourWorkInSync />}
        <EffortlessIntegration />
        {/* <NumbersThatSpeak /> */}
        {/* <DocumentationSection /> */}
        <TestimonialsSection />
        <FAQSection />
        <PricingSection />
        <CTASection />
        <FooterSection />
      </div>
    </div>
  );
}
