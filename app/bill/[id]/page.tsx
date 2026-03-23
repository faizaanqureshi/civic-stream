"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Share2, Mail, ExternalLink } from "lucide-react";
import { BillProgress } from "@/components/bill/BillProgress";
import { BillSummary } from "@/components/bill/BillSummary";
import { ForAgainstPanel } from "@/components/bill/ForAgainstPanel";
import { LobbyWatch } from "@/components/bill/LobbyWatch";
import { useCivicStream } from "@/context/CivicStreamContext";
import { useDemoData } from "@/lib/hooks/useDemoData";
import { formatFullDate } from "@/lib/utils/formatDate";

export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.id as string;
  const { bills, reps } = useDemoData();
  const { dispatch } = useCivicStream();

  const bill = bills.find((b) => b.id === billId);

  useEffect(() => {
    if (bill) {
      dispatch({ type: "MARK_BILL_READ", payload: bill.id });
    }
  }, [bill, dispatch]);

  if (!bill) {
    return (
      <div className="max-w-md mx-auto px-5 py-12 text-center">
        <p className="text-sm text-gray-500">Bill not found</p>
        <button
          onClick={() => router.push("/feed")}
          className="mt-4 px-6 py-2 bg-gray-900 text-white text-sm rounded-full"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  const federalRep = reps.reps.find((r) => r.level === "Federal");

  const getLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      Federal: "bg-red-50 text-red-600 border-red-100",
      Provincial: "bg-blue-50 text-blue-600 border-blue-100",
      Municipal: "bg-green-50 text-green-600 border-green-100",
    };
    return colors[level] || "bg-gray-100 text-gray-600 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-10 px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-gray-900 flex-1">
              Bill Details
            </h1>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="px-5 py-6 space-y-6 pb-12">
          {/* Bill Header Card */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getLevelColor(bill.level)}`}>
                {bill.level}
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {bill.status}
              </span>
              {bill.affectsMilton && (
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-900 text-white">
                  Affects Milton
                </span>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">
                {bill.billNumber}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-3">
                {bill.shortTitle}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {bill.title}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">Sponsor</p>
                <p className="text-sm font-medium text-gray-900">
                  {bill.sponsor}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Published</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatFullDate(bill.publishedDate)}
                </p>
              </div>
            </div>

            {/* Tags */}
            {bill.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bill.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Progress Tracker */}
          <BillProgress bill={bill} />

          {/* AI Summary */}
          <BillSummary bill={bill} />

          {/* For vs Against */}
          <ForAgainstPanel bill={bill} />

          {/* Lobby Watch */}
          <LobbyWatch bill={bill} />

          {/* Sources */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Source Documents
            </h3>
            <div className="space-y-2">
              {bill.citedSources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {source.label}
                  </span>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-3 pt-2">
            <button className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
              Share
            </button>
            {federalRep && bill.level === "Federal" && (
              <a
                href={`mailto:${federalRep.email}?subject=Regarding ${bill.billNumber}`}
                className="flex-1"
              >
                <button className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email MP
                </button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
