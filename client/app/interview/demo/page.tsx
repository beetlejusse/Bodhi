"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

const DEMO_PHASES = [
  {
    phase: "intro",
    title: "Introduction Phase",
    description: "Practice self-introduction and background discussion",
    icon: "👋",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  {
    phase: "technical",
    title: "Technical Phase",
    description: "Domain concepts, language internals, system design",
    icon: "💻",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  },
  {
    phase: "behavioral",
    title: "Behavioral Phase",
    description: "STAR-method questions, leadership, teamwork",
    icon: "🤝",
    color: "bg-green-50 border-green-200 hover:bg-green-100",
  },
  {
    phase: "dsa",
    title: "DSA/Coding Phase",
    description: "Algorithms, data structures, complexity analysis",
    icon: "🧮",
    color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
  },
  {
    phase: "project",
    title: "Project Discussion",
    description: "Past projects, architecture, trade-offs",
    icon: "🚀",
    color: "bg-pink-50 border-pink-200 hover:bg-pink-100",
  },
];

export default function DemoIndexPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 pt-28 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#37322F] mb-4">
            Interview Phase Demos
          </h1>
          <p className="text-lg text-[#6B6662]">
            Test individual interview phases with GrowthX context
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Demo Mode Active
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {DEMO_PHASES.map((demo) => (
            <Link
              key={demo.phase}
              href={`/interview/demo/${demo.phase}`}
              className={`block rounded-2xl border-2 p-6 transition-all ${demo.color}`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{demo.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#37322F] mb-2">
                    {demo.title}
                  </h3>
                  <p className="text-sm text-[#6B6662]">{demo.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-[#8A8580]">
                    <span>3-5 questions</span>
                    <span>•</span>
                    <span>~5-8 minutes</span>
                    <span>•</span>
                    <span>GrowthX context</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-[rgba(55,50,47,0.10)] bg-white p-6 shadow-[0px_2px_8px_rgba(55,50,47,0.06)]">
          <h3 className="text-lg font-semibold text-[#37322F] mb-3">
            About Demo Mode
          </h3>
          <ul className="space-y-2 text-sm text-[#6B6662]">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Each demo is locked to a specific phase (no transitions)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Uses GrowthX company profile for realistic context</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Shorter sessions (3-5 questions) for quick testing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Full proctoring and sentiment analysis enabled</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Same scoring and feedback as full interviews</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/interview"
            className="inline-flex items-center gap-2 text-sm text-[#6B6662] hover:text-[#37322F] transition-colors"
          >
            ← Back to Full Interview
          </Link>
        </div>
      </div>
    </div>
  );
}
