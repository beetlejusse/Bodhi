"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DemoPhaseRedirect() {
  const params = useParams();
  const router = useRouter();
  const phase = params.phase as string;

  useEffect(() => {
    // Redirect to main interview page with demo query params
    router.push(`/interview?demo=true&phase=${phase}`);
  }, [phase, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto" />
        <p className="text-zinc-400">Loading {phase} demo...</p>
      </div>
    </div>
  );
}
