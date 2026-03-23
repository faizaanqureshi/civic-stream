"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCivicStream } from "@/context/CivicStreamContext";

export default function Home() {
  const router = useRouter();
  const { state } = useCivicStream();

  useEffect(() => {
    if (state.onboardingComplete) {
      router.push("/feed");
    } else {
      router.push("/onboarding");
    }
  }, [state.onboardingComplete, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-4xl font-bold text-[#0F9B7A] mb-2">
          CivicStream
        </div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
