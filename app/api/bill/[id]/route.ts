import { NextRequest, NextResponse } from "next/server";
import { fetchJson, fetchText, stripHtml } from "@/lib/server/municipalLive";
import type { LiveBillDetail, BillVote } from "@/types";

const FEDERAL_SESSION = "45-1";
const OPENPARL = "https://openparliament.ca";

// Map OpenParliament status_code to a stage number (1–6)
function statusCodeToStage(statusCode: string): { stage: number; total: number } {
  const map: Record<string, number> = {
    HouseFirstReading: 1,
    HouseSecondReading: 2,
    HouseCommittee: 3,
    HouseReportStage: 3,
    HouseThirdReading: 4,
    SenateFirstReading: 5,
    SenateSecondReading: 5,
    SenateCommittee: 5,
    SenateThirdReading: 5,
    RoyalAssentGiven: 6,
  };
  return { stage: map[statusCode] ?? 1, total: 6 };
}

async function fetchFederalBill(billNumber: string): Promise<LiveBillDetail | null> {
  try {
    const [detail, votesData] = await Promise.all([
      fetchJson<any>(`${OPENPARL}/bills/${FEDERAL_SESSION}/${billNumber}/?format=json`),
      fetchJson<any>(
        `${OPENPARL}/votes/?bill=${FEDERAL_SESSION}/${billNumber}&format=json`,
      ).catch(() => ({ objects: [] })),
    ]);

    // Resolve sponsor name
    let sponsorName: string | null = null;
    let sponsorUrl: string | null = null;
    const rawSponsorUrl = detail.sponsor_politician_url || detail.sponsor_url;
    if (rawSponsorUrl) {
      const sponsorDetail = await fetchJson<any>(
        `${OPENPARL}${rawSponsorUrl}?format=json`,
      ).catch(() => null);
      sponsorName = sponsorDetail?.name || null;
      sponsorUrl = `${OPENPARL}${rawSponsorUrl}`;
    }

    const votes: BillVote[] = (votesData?.objects || [])
      .slice(0, 8)
      .map((v: any) => ({
        date: v.date || "",
        description: v.description?.en || "Vote",
        yeas: v.yea_total ?? 0,
        nays: v.nay_total ?? 0,
        result: v.result || "Unknown",
      }));

    const fullTextUrl =
      detail.legisinfo_url ??
      `https://www.parl.ca/legisinfo/en/bill/${FEDERAL_SESSION}/${billNumber.toLowerCase()}`;
    const documentViewerUrl: string | null = detail.text_url ?? null;

    // Get bill text — document viewer first, fall back to debates
    let rawText: string | null = null;

    if (documentViewerUrl) {
      try {
        const docHtml = await fetchText(documentViewerUrl);
        const mainMatch = docHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        let content = mainMatch ? mainMatch[1] : docHtml;
        content = content.replace(/<(script|style|nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, "");
        const plain = stripHtml(content).replace(/\s{3,}/g, "\n\n").trim();
        if (plain.length > 200) rawText = plain;
      } catch {
        // fall through to debates
      }
    }

    if (!rawText) {
      try {
        const debatesData = await fetchJson<any>(
          `${OPENPARL}/bills/${FEDERAL_SESSION}/${billNumber}/debates/?format=json`,
        ).catch(() => null);
        const speeches: string[] = (debatesData?.objects || [])
          .slice(0, 12)
          .map((s: any) => {
            const who = s.politician_name || s.politician || "MP";
            const text = stripHtml(s.content || s.text || "").trim();
            return text ? `[${who}]: ${text}` : null;
          })
          .filter(Boolean);
        if (speeches.length > 0) rawText = speeches.join("\n\n");
      } catch {
        // no text available
      }
    }

    const { stage, total } = statusCodeToStage(detail.status_code ?? "");
    const title = detail.name?.en ?? "Legislative Measure";

    return {
      billNumber: detail.number ?? billNumber,
      title,
      shortTitle: detail.short_title?.en ?? null,
      level: "Federal",
      status: detail.status?.en ?? "Under Consideration",
      statusStage: stage,
      totalStages: total,
      chamber: detail.home_chamber?.toLowerCase().includes("house") ? "House of Commons" : "Senate",
      isPrivateMember: detail.private_member_bill === true,
      isLaw: detail.law === true,
      introducedDate: detail.introduced ?? "",
      sponsor: sponsorName,
      sponsorUrl,
      sourceUrl: `${OPENPARL}${detail.url}`,
      fullTextUrl: documentViewerUrl ?? fullTextUrl,
      votes,
      rawText,
      gist: null,
      aiSummary: null,
      keyPoints: [],
      forArguments: [],
      againstArguments: [],
    };
  } catch (err) {
    console.error("fetchFederalBill error:", err);
    return null;
  }
}

async function fetchProvincialBill(
  billNumber: string,
  sourceUrl: string | null,
): Promise<LiveBillDetail | null> {
  const url =
    sourceUrl ||
    `https://www.ola.org/en/legislative-business/bills/parliament-43/session-1/bill-${billNumber}`;

  try {
    const html = await fetchText(url);

    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = titleMatch ? stripHtml(titleMatch[1]).trim() : `Bill ${billNumber}`;

    const sponsorMatch =
      html.match(/(?:Sponsor|Introduced by|MPP)[^<]*<\/[^>]+>\s*(?:<[^>]+>)?\s*([A-Z][^<\n]{3,60})/i) ||
      html.match(/member[^<]*<\/[^>]+>\s*(?:<[^>]+>)?\s*([A-Z][a-z]+ [A-Z][a-z]+)/i);
    const sponsor = sponsorMatch ? stripHtml(sponsorMatch[1]).trim() : null;

    const statusMatch = html.match(
      /(?:Royal Assent|Third Reading|Second Reading|First Reading|Committee|Passed|Withdrawn)[^<\n]*/i,
    );
    const status = statusMatch ? statusMatch[0].trim().slice(0, 60) : "Active";

    const summaryMatch = html.match(
      /(?:summary|description|purpose)[^<]*<\/[^>]+>\s*<[^>]+>([\s\S]{80,1000}?)<\/[^>]+>/i,
    );
    const rawText = summaryMatch ? stripHtml(summaryMatch[1]).trim().slice(0, 4000) : null;

    const isLaw = status.toLowerCase().includes("royal assent");
    const stageMap: Record<string, number> = {
      "first reading": 1, "second reading": 2, "committee": 3,
      "third reading": 4, "royal assent": 5,
    };
    const stageKey = Object.keys(stageMap).find((k) => status.toLowerCase().includes(k));
    const stage = stageKey ? stageMap[stageKey] : 1;

    return {
      billNumber,
      title,
      shortTitle: null,
      level: "Provincial",
      status,
      statusStage: stage,
      totalStages: 5,
      chamber: "Ontario Legislative Assembly",
      isPrivateMember: false,
      isLaw,
      introducedDate: "",
      sponsor,
      sponsorUrl: null,
      sourceUrl: url,
      fullTextUrl: url,
      votes: [],
      rawText,
      gist: null,
      aiSummary: null,
      keyPoints: [],
      forArguments: [],
      againstArguments: [],
    };
  } catch (err) {
    console.error("fetchProvincialBill error:", err);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const billId = decodeURIComponent(id);
  const level = request.nextUrl.searchParams.get("level");
  const sourceUrl = request.nextUrl.searchParams.get("sourceUrl");

  let detail: LiveBillDetail | null = null;

  if (level === "Federal") {
    detail = await fetchFederalBill(billId);
  } else if (level === "Provincial") {
    detail = await fetchProvincialBill(billId, sourceUrl);
  }

  if (!detail) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
