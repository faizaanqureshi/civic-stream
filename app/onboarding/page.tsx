"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Loader2,
  MapPin,
  Users,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCivicStream } from "@/context/CivicStreamContext";
import { useRiding } from "@/lib/hooks/useRiding";
import { normalizePostalCode } from "@/lib/utils/postalCode";
import { useAuth } from "@/lib/hooks/useAuth"; // Adjust path if necessary
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation"; // Add this import

export default function OnboardingPage() {
  const router = useRouter();
  const { dispatch, state } = useCivicStream();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  // Auth States
  const [step, setStep] = useState<"auth" | "postal">("auth");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const searchParams = useSearchParams();
  const isEditing = searchParams.get("edit") === "true";

  // Postal States
  const [postalCode, setPostalCode] = useState("");
  const normalizedPostalCode = normalizePostalCode(postalCode);
  const {
    data: ridingData,
    loading: ridingLoading,
    error: ridingError,
  } = useRiding(normalizedPostalCode);
  const detected = Boolean(ridingData);

  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata;
      const hasMetadata = metadata?.postal_code && metadata?.riding;

      // ONLY redirect if they have metadata AND we are NOT in edit mode
      if (hasMetadata && !isEditing) {
        dispatch({
          type: "COMPLETE_ONBOARDING",
          payload: {
            postalCode: metadata.postal_code,
            riding: metadata.riding,
          },
        });
        router.push("/feed");
      } else {
        // If we ARE editing, or they have no data, stay on the postal step
        setStep("postal");
      }
    }
  }, [user, isEditing, dispatch, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);

    try {
      const { data, error } = isSignUp
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: email.split("@")[0] },
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setAuthError(error.message);
        return;
      }

      if (data.user) {
        const metadata = data.user.user_metadata;

        // If logging in and we already have the data, skip the postal step
        if (metadata?.postal_code && metadata?.riding) {
          dispatch({
            type: "COMPLETE_ONBOARDING",
            payload: {
              postalCode: metadata.postal_code,
              riding: metadata.riding,
            },
          });
          router.push("/feed");
        } else {
          setStep("postal");
        }
      }
    } catch (err) {
      setAuthError("An unexpected error occurred.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePostalCodeChange = (value: string) => {
    setPostalCode(value.toUpperCase());
  };

  // Inside OnboardingPage.tsx
  const handleStartFeed = async () => {
    if (!ridingData) return;

    setIsCompleting(true);
    try {
      // 1. Update the Supabase User Metadata
      // This is the permanent database update
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          postal_code: ridingData.postal,
          riding: ridingData.riding,
        },
      });

      if (updateError) throw updateError;

      // 2. Update the Local Context
      // This makes the change immediate in the UI (TopBar, Feed, etc.)
      dispatch({
        type: "COMPLETE_ONBOARDING",
        payload: {
          postalCode: ridingData.postal,
          riding: ridingData.riding,
        },
      });

      // 3. Navigate home
      router.push("/feed");
    } catch (err: any) {
      setAuthError(err.message || "Failed to save your new location.");
    } finally {
      setIsCompleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F9B7A]" />
      </div>
    );
  }

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

        <AnimatePresence mode="wait">
          {step === "auth" ? (
            <motion.div
              key="auth-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}>
              <Card className="p-5 sm:p-6 md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  {isSignUp ? (
                    <UserPlus className="h-6 w-6 text-[#0F9B7A]" />
                  ) : (
                    <LogIn className="h-6 w-6 text-[#0F9B7A]" />
                  )}
                  <h2 className="text-xl font-bold text-gray-900">
                    {isSignUp ? "Create an Account" : "Welcome Back"}
                  </h2>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0F9B7A] focus:outline-none focus:ring-1 focus:ring-[#0F9B7A]"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0F9B7A] focus:outline-none focus:ring-1 focus:ring-[#0F9B7A]"
                      placeholder="••••••••"
                    />
                  </div>

                  {authError && (
                    <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p>{authError}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full py-3 text-base"
                    disabled={isAuthenticating}>
                    {isAuthenticating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isSignUp ? (
                      "Sign Up"
                    ) : (
                      "Log In"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setAuthError("");
                    }}
                    className="text-sm text-gray-600 hover:text-[#0F9B7A] hover:underline">
                    {isSignUp
                      ? "Already have an account? Log in"
                      : "Don't have an account? Sign up"}
                  </button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="postal-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}>
              <Card className="p-5 sm:p-6 md:p-8 overflow-visible">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="postal"
                      className="block text-sm font-semibold text-gray-700">
                      Enter your postal code
                    </label>
                    <span className="text-xs font-medium text-[#0F9B7A]">
                      {user?.email}
                    </span>
                  </div>

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
                  {ridingLoading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-center gap-2 py-4 text-[#0F9B7A]">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="font-medium">
                        Detecting your riding...
                      </span>
                    </motion.div>
                  )}

                  {!ridingLoading &&
                    ridingError &&
                    normalizedPostalCode.length >= 6 && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900">
                            Lookup unavailable
                          </p>
                          <p className="text-sm text-amber-800">
                            {ridingError}
                          </p>
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
                          Provincial:{" "}
                          {ridingData.provincialDistrict || "Unknown"}
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
                                <p className="text-xs text-gray-500">
                                  {rep.title}
                                </p>
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
          )}
        </AnimatePresence>

        <div className="h-8" />
      </div>
    </main>
  );
}
