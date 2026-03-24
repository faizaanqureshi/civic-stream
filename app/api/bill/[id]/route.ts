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

function parseProvincialPage(html: string, billNumber: string) {
  // Title from h1
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? stripHtml(titleMatch[1]).trim() : `Bill ${billNumber}`;

  // Sponsor: OLA puts MPP name as an <a> link right after the bill title h1
  // e.g. <a href="/en/members/...">Firstname Lastname</a>
  const sponsorMatch = html.match(/<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?<a[^>]*href="[^"]*\/members\/[^"]*"[^>]*>([^<]+)<\/a>/i)
    || html.match(/(?:Sponsor|MPP|Member)[^<]*<\/[^>]+>\s*(?:<[^>]+>\s*)*([A-Z][a-zÀ-ÿ]+(?: [A-Z][a-zÀ-ÿ]+)+)/i);
  const sponsor = sponsorMatch ? stripHtml(sponsorMatch[1]).trim() : null;

  // Date from first reading
  const firstReadingMatch = html.match(/First Reading[\s\S]*?(\d{4}-\d{2}-\d{2}|[A-Z][a-z]+ \d+, \d{4})/i);
  const introducedDate = firstReadingMatch ? firstReadingMatch[1] : "";

  // Status: prefer "Current status: ..." pattern from OLA pages
  const currentStatusMatch = html.match(/[Cc]urrent\s+status[:\s]+([^<\n]{5,80})/i);
  let status = "First Reading";
  let stage = 1;

  if (currentStatusMatch) {
    const raw = currentStatusMatch[1].trim();
    const stageMap: [string, number, string][] = [
      ["royal assent", 5, "Royal Assent"],
      ["third reading", 4, "Third Reading"],
      ["committee", 3, "Committee"],
      ["second reading", 2, "Second Reading"],
      ["first reading", 1, "First Reading"],
    ];
    for (const [key, num, label] of stageMap) {
      if (raw.toLowerCase().includes(key)) {
        stage = num;
        status = label;
        break;
      }
    }
    if (stage === 1 && raw.length < 80) status = raw;
  } else {
    const stageMap: Record<string, number> = {
      "royal assent": 5, "third reading": 4, "committee": 3,
      "second reading": 2, "first reading": 1,
    };
    for (const [label, num] of Object.entries(stageMap)) {
      if (html.toLowerCase().includes(label) && num >= stage) {
        status = label.replace(/\b\w/g, (c) => c.toUpperCase());
        stage = num;
      }
    }
  }

  // Extract bill text from main page — explanatory note + bill body are inline on OLA pages
  let rawText: string | null = null;
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  let content = mainMatch ? mainMatch[1] : html;
  // Strip scripts, styles, nav, header, footer, and the sidebar/navigation tabs
  content = content.replace(/<(script|style|nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, "");
  // Focus on the substantive bill content sections if present
  const noteMatch = content.match(/(?:EXPLANATORY NOTE|Bill\s+\d+[^<]*)([\s\S]{200,})/i);
  const plain = stripHtml(noteMatch ? noteMatch[0] : content).replace(/\s{3,}/g, "\n\n").trim();
  if (plain.length > 200) rawText = plain;

  return { title, sponsor, introducedDate, status, stage, isLaw: stage === 5, rawText };
}

async function fetchProvincialBill(
  billNumber: string,
  sourceUrl: string | null,
): Promise<LiveBillDetail | null> {
  const url =
    sourceUrl ||
    `https://www.ola.org/en/legislative-business/bills/parliament-44/session-1/bill-${billNumber}`;

  try {
    const html = await fetchText(url);
    const { title, sponsor, introducedDate, status, stage, isLaw, rawText } =
      parseProvincialPage(html, billNumber);

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
      introducedDate,
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
