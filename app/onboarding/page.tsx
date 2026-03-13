"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCivicStream } from "@/context/CivicStreamContext";
import { useRiding } from "@/lib/hooks/useRiding";

export default function OnboardingPage() {
  const [postalCode, setPostalCode] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [detected, setDetected] = useState(false);
  const router = useRouter();
  const { dispatch } = useCivicStream();

  const ridingData = useRiding(postalCode);

  const handlePostalCodeChange = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setPostalCode(upper);

    if (upper.length >= 3 && !detected && !isLookingUp) {
      setIsLookingUp(true);
      // Simulate API lookup
      setTimeout(() => {
        setIsLookingUp(false);
        setDetected(true);
      }, 1500);
    }
  };

  const handleStartFeed = () => {
    if (ridingData) {
      dispatch({
        type: "COMPLETE_ONBOARDING",
        payload: {
          postalCode: postalCode,
          riding: ridingData.riding,
        },
      });
      router.push("/feed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-[#0F9B7A] mb-3">
            CivicStream
          </h1>
          <p className="text-lg text-gray-700">
            From the House of Commons to City Hall — In Your Pocket
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="p-8">
            <div className="mb-6">
              <label
                htmlFor="postal"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Enter your postal code
              </label>
              <input
                id="postal"
                type="text"
                value={postalCode}
                onChange={(e) => handlePostalCodeChange(e.target.value)}
                placeholder="L9T 1A1"
                maxLength={7}
                className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-gray-300 rounded-lg focus:border-[#0F9B7A] focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            <AnimatePresence mode="wait">
              {isLookingUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-center gap-2 text-[#0F9B7A] py-4"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Detecting your riding...</span>
                </motion.div>
              )}

              {detected && ridingData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <div className="bg-teal-50 border-2 border-[#0F9B7A] rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-[#0F9B7A]" />
                      <span className="font-bold text-lg text-gray-900">
                        {ridingData.riding}, Ontario detected
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Riding: {ridingData.riding}
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">
                        Your Representatives
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {ridingData.reps.slice(0, 3).map((rep) => (
                        <li
                          key={rep.id}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {rep.name}
                            </p>
                            <p className="text-xs text-gray-500">{rep.title}</p>
                          </div>
                          <span
                            className="text-xs px-2 py-1 rounded font-semibold text-white"
                            style={{ backgroundColor: rep.partyColor }}
                          >
                            {rep.level}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={handleStartFeed}
                    className="w-full text-lg py-4"
                  >
                    Start My Civic Feed
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
