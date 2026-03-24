"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Mail,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Gavel,
  User,
  Calendar,
  Building2,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { BillProgress } from "@/components/bill/BillProgress";
import { BillSummary } from "@/components/bill/BillSummary";
import { ForAgainstPanel } from "@/components/bill/ForAgainstPanel";
import { LobbyWatch } from "@/components/bill/LobbyWatch";
import { useCivicStream } from "@/context/CivicStreamContext";
import { useDemoData } from "@/lib/hooks/useDemoData";
import { formatFullDate } from "@/lib/utils/formatDate";
import type { LiveBillDetail } from "@/types";

export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const billId = decodeURIComponent(params.id as string);
  const { bills, reps } = useDemoData();
  const { dispatch } = useCivicStream();

  const [liveBill, setLiveBill] = useState<LiveBillDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [textExpanded, setTextExpanded] = useState(true);

  const fixtureBill = bills.find((b) => b.id === billId);

  useEffect(() => {
    if (fixtureBill) {
      dispatch({ type: "MARK_BILL_READ", payload: fixtureBill.id });
      return;
    }
    // Not a fixture bill — fetch from API
    const level = searchParams.get("level");
    if (!level || level === "Municipal") return;

    setLoading(true);
    const sourceUrl = searchParams.get("sourceUrl");
    const query = new URLSearchParams({ level, ...(sourceUrl ? { sourceUrl } : {}) });

    fetch(`/api/bill/${encodeURIComponent(billId)}?${query}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: LiveBillDetail) => setLiveBill(data))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [billId, fixtureBill, dispatch, searchParams]);

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Federal: "bg-red-50 text-red-600 border-red-100",
      Provincial: "bg-blue-50 text-blue-600 border-blue-100",
      Municipal: "bg-green-50 text-green-600 border-green-100",
    };
    return colors[level] || "bg-gray-100 text-gray-600 border-gray-200";
  };

  // ── Fixture bill (full rich render) ───────────────────────────────────────
  if (fixtureBill) {
    const federalRep = reps.reps.find((r) => r.level === "Federal");
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto">
          <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-10 px-5 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-semibold text-gray-900 flex-1">Bill Details</h1>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="px-5 py-6 space-y-6 pb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getLevelColor(fixtureBill.level)}`}>
                  {fixtureBill.level}
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {fixtureBill.status}
                </span>
                {fixtureBill.affectsMilton && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-900 text-white">
                    Affects Milton
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">{fixtureBill.billNumber}</p>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-3">{fixtureBill.shortTitle}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{fixtureBill.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Sponsor</p>
                  <p className="text-sm font-medium text-gray-900">{fixtureBill.sponsor}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Published</p>
                  <p className="text-sm font-medium text-gray-900">{formatFullDate(fixtureBill.publishedDate)}</p>
                </div>
              </div>
              {fixtureBill.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {fixtureBill.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <BillProgress bill={fixtureBill} />
            <BillSummary bill={fixtureBill} />
            <ForAgainstPanel bill={fixtureBill} />
            <LobbyWatch bill={fixtureBill} />
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Source Documents</h3>
              <div className="space-y-2">
                {fixtureBill.citedSources.map((source, idx) => (
                  <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors group">
                    <span className="text-sm font-medium text-gray-900">{source.label}</span>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                Share
              </button>
              {federalRep && fixtureBill.level === "Federal" && (
                <a href={`mailto:${federalRep.email}?subject=Regarding ${fixtureBill.billNumber}`} className="flex-1">
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

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto">
          <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-10 px-5 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-semibold text-gray-900 flex-1">Bill Details</h1>
            </div>
          </div>
          <div className="px-5 py-6 space-y-4 animate-pulse">
            <div className="flex gap-2">
              <div className="h-7 w-20 bg-gray-100 rounded-full" />
              <div className="h-7 w-28 bg-gray-100 rounded-full" />
            </div>
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-8 w-3/4 bg-gray-100 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-5/6 bg-gray-100 rounded" />
            <div className="mt-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-50 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Fallback error / not found ─────────────────────────────────────────────
  const fallbackTitle = searchParams.get("title");
  if (fetchError || (!liveBill && !loading)) {
    if (!fallbackTitle) {
      return (
        <div className="max-w-md mx-auto px-5 py-12 text-center">
          <p className="text-sm text-gray-500">Bill not found</p>
          <button onClick={() => router.push("/feed")}
            className="mt-4 px-6 py-2 bg-gray-900 text-white text-sm rounded-full">
            Back to Feed
          </button>
        </div>
      );
    }
    // Fallback: render what we have from query params
    const titleMatch = fallbackTitle.match(/^Bill\s+([^:]+):\s+(.+)$/);
    const level = searchParams.get("level") || "";
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto">
          <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-10 px-5 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-semibold text-gray-900 flex-1">Bill Details</h1>
            </div>
          </div>
          <div className="px-5 py-6 space-y-6 pb-12">
            <div className="flex gap-2">
              {level && <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getLevelColor(level)}`}>{level}</span>}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">{titleMatch ? `Bill ${titleMatch[1].trim()}` : billId}</p>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{titleMatch ? titleMatch[2].trim() : fallbackTitle}</h2>
            </div>
            {searchParams.get("summary") && (
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Overview</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{searchParams.get("summary")}</p>
              </div>
            )}
            {searchParams.get("sourceUrl") && (
              <a href={searchParams.get("sourceUrl")!} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                <span className="text-sm font-medium text-gray-900">View Full Bill</span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Live API bill (full rich render) ──────────────────────────────────────
  const bill = liveBill!;
  const federalRep = reps.reps.find((r) => r.level === "Federal");

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-10 px-5 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-gray-900 flex-1">Bill Details</h1>
          </div>
        </div>

        <div className="px-5 py-6 space-y-5 pb-12">

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getLevelColor(bill.level)}`}>
              {bill.level}
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {bill.status}
            </span>
            {bill.isLaw && (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-600 text-white flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Now Law
              </span>
            )}
            {bill.isPrivateMember && (
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                Private Member
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2">{bill.billNumber}</p>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
              {bill.shortTitle || bill.title}
            </h2>
            {bill.shortTitle && (
              <p className="text-sm text-gray-500 leading-relaxed">{bill.title}</p>
            )}
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            {bill.chamber && (
              <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Chamber</p>
                  <p className="text-sm font-medium text-gray-900">{bill.chamber}</p>
                </div>
              </div>
            )}
            {bill.introducedDate && (
              <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Introduced</p>
                  <p className="text-sm font-medium text-gray-900">{formatFullDate(bill.introducedDate)}</p>
                </div>
              </div>
            )}
            {bill.sponsor && (
              <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3 col-span-2">
                <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Sponsor</p>
                  {bill.sponsorUrl ? (
                    <a href={bill.sponsorUrl} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-900 hover:underline flex items-center gap-1">
                      {bill.sponsor}
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{bill.sponsor}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Votes */}
          {bill.votes.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Gavel className="w-4 h-4 text-gray-500" />
                Recorded Votes
              </h3>
              <div className="space-y-3">
                {bill.votes.map((vote, idx) => {
                  const total = vote.yeas + vote.nays;
                  const yeaPct = total > 0 ? (vote.yeas / total) * 100 : 50;
                  const passed = vote.result.toLowerCase().includes("pass") ||
                    vote.result.toLowerCase().includes("agreed") ||
                    vote.yeas > vote.nays;
                  return (
                    <div key={idx} className="bg-white rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-gray-800 leading-snug flex-1">
                          {vote.description}
                        </p>
                        <span className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}>
                          {passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {vote.result}
                        </span>
                      </div>
                      {/* Vote bar */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="text-green-600 font-medium w-12">✓ {vote.yeas}</span>
                        <div className="flex-1 h-1.5 bg-red-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${yeaPct}%` }} />
                        </div>
                        <span className="text-red-600 font-medium w-12 text-right">✗ {vote.nays}</span>
                      </div>
                      <p className="text-xs text-gray-400">{vote.date}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Summary placeholder — ready for Anthropic SDK */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              AI Summary
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              AI-powered plain-language summary coming soon. Full bill text has been retrieved and is ready for analysis.
            </p>
          </div>

          {/* Full bill text (collapsible) */}
          {bill.rawText && (
            <div className="bg-gray-50 rounded-xl p-5">
              <button
                onClick={() => setTextExpanded((v) => !v)}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-900"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Bill Description
                </span>
                {textExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {textExpanded && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {bill.rawText}
                </p>
              )}
            </div>
          )}

          {/* Source links */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Source Documents</h3>
            <div className="space-y-2">
              {bill.sourceUrl && (
                <a href={bill.sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors group">
                  <span className="text-sm font-medium text-gray-900">
                    {bill.level === "Federal" ? "OpenParliament" : "Ontario Legislature"}
                  </span>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </a>
              )}
              {bill.fullTextUrl && bill.fullTextUrl !== bill.sourceUrl && (
                <a href={bill.fullTextUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors group">
                  <span className="text-sm font-medium text-gray-900">Full Bill Text (LEGISinfo)</span>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </a>
              )}
            </div>
          </div>

          {/* CTA */}
          {federalRep && bill.level === "Federal" && (
            <a href={`mailto:${federalRep.email}?subject=Regarding Bill ${bill.billNumber}`} className="block">
              <button className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                Email Your MP
              </button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
