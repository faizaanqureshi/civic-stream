"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCivicStream } from "@/context/CivicStreamContext";
import { useRiding } from "@/lib/hooks/useRiding";
import { normalizePostalCode } from "@/lib/utils/postalCode";

export default function OnboardingPage() {
  const [postalCode, setPostalCode] = useState("");
  const router = useRouter();
  const { dispatch } = useCivicStream();

  const normalizedPostalCode = normalizePostalCode(postalCode);
  const { data: ridingData, loading, error } = useRiding(normalizedPostalCode);
  const detected = Boolean(ridingData);

  const handlePostalCodeChange = (value: string) => {
    setPostalCode(value.toUpperCase());
  };

  const handleStartFeed = () => {
    if (ridingData) {
      dispatch({
        type: "COMPLETE_ONBOARDING",
        payload: {
          postalCode: ridingData.postal,
          riding: ridingData.riding,
        },
      });
      router.push("/feed");
    }
  };

  return (
    <main className="min-h-dvh w-full flex flex-col bg-gradient-to-br from-teal-50 to-blue-50 overflow-y-auto">
      <div className="flex-1 mx-auto w-full max-w-md px-4 py-8 sm:py-10 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center sm:mb-8">
          <h1 className="mb-3 text-4xl font-bold text-[#0F9B7A] sm:text-5xl">
            CivicStream
          </h1>

          <p className="mx-auto max-w-sm text-base leading-relaxed text-gray-700 sm:text-lg">
            From the House of Commons to City Hall — In Your Pocket
          </p>

          <p className="mt-3 text-sm text-gray-500 sm:text-base">
            MVP postal support: Milton and Waterloo, Ontario
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}>
          <Card className="p-5 sm:p-6 md:p-8 overflow-visible">
            <div className="mb-6">
              <label
                htmlFor="postal"
                className="mb-2 block text-sm font-semibold text-gray-700">
                Enter your postal code
              </label>

              <input
                id="postal"
                type="text"
                value={postalCode}
                onChange={(e) => handlePostalCodeChange(e.target.value)}
                placeholder="L9T 1A1 or N2L 3G1"
                maxLength={7}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-center text-xl font-bold text-gray-900 transition-colors focus:border-[#0F9B7A] focus:outline-none sm:text-2xl"
                autoFocus
              />
            </div>

            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-center gap-2 py-4 text-[#0F9B7A]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-medium">Detecting your riding...</span>
                </motion.div>
              )}

              {!loading && error && normalizedPostalCode.length >= 6 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Lookup unavailable
                    </p>
                    <p className="text-sm text-amber-800">{error}</p>
                  </div>
                </motion.div>
              )}

              {detected && ridingData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4 pb-2">
                  <div className="rounded-lg border-2 border-[#0F9B7A] bg-teal-50 p-4 text-center">
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <MapPin className="h-5 w-5 text-[#0F9B7A]" />
                      <span className="text-lg font-bold text-gray-900">
                        {ridingData.riding} detected
                      </span>
                    </div>

                    <p className="text-sm text-gray-600">
                      Federal: {ridingData.federalDistrict || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Provincial: {ridingData.provincialDistrict || "Unknown"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">
                        Your Representatives
                      </h3>
                    </div>

                    <ul className="space-y-2">
                      {ridingData.reps.slice(0, 4).map((rep) => (
                        <li
                          key={rep.id}
                          className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {rep.name}
                            </p>
                            <p className="text-xs text-gray-500">{rep.title}</p>
                          </div>

                          <span
                            className="shrink-0 rounded px-2 py-1 text-xs font-semibold text-white"
                            style={{ backgroundColor: rep.partyColor }}>
                            {rep.level}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={handleStartFeed}
                    className="w-full py-4 text-lg">
                    Start My Civic Feed
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        <div className="h-8" />
      </div>
    </main>
  );
}
