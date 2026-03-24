import { NextRequest, NextResponse } from "next/server";
import { getOrGenerateAISummary } from "@/lib/server/billAI";
import { fetchJson, fetchText, stripHtml } from "@/lib/server/municipalLive";
import type { BillVote } from "@/types";

const FEDERAL_SESSION = "45-1";
const OPENPARL = "https://openparliament.ca";

async function getFederalBillText(billNumber: string): Promise<{
  rawText: string | null;
  title: string;
  shortTitle: string | null;
  status: string;
  isLaw: boolean;
  isPrivateMember: boolean;
  chamber: string | null;
  introducedDate: string;
  sponsor: string | null;
  votes: BillVote[];
}> {
  const detail = await fetchJson<any>(
    `${OPENPARL}/bills/${FEDERAL_SESSION}/${billNumber}/?format=json`
  );
  const votesData = await fetchJson<any>(
    `${OPENPARL}/votes/?bill=${FEDERAL_SESSION}/${billNumber}&format=json`
  ).catch(() => ({ objects: [] }));

  let sponsorName: string | null = null;
  const rawSponsorUrl = detail.sponsor_politician_url || detail.sponsor_url;
  if (rawSponsorUrl) {
    const s = await fetchJson<any>(`${OPENPARL}${rawSponsorUrl}?format=json`).catch(() => null);
    sponsorName = s?.name ?? null;
  }

  const votes: BillVote[] = (votesData?.objects || []).slice(0, 8).map((v: any) => ({
    date: v.date || "",
    description: v.description?.en || "Vote",
    yeas: v.yea_total ?? 0,
    nays: v.nay_total ?? 0,
    result: v.result || "Unknown",
  }));

  let rawText: string | null = null;

  if (detail.text_url) {
    try {
      const docHtml = await fetchText(detail.text_url);
      const mainMatch = docHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      let content = mainMatch ? mainMatch[1] : docHtml;
      content = content.replace(/<(script|style|nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, "");
      const plain = stripHtml(content).replace(/\s{3,}/g, "\n\n").trim();
      if (plain.length > 200) rawText = plain;
    } catch { /* fall through */ }
  }

  if (!rawText) {
    try {
      const debatesData = await fetchJson<any>(
        `${OPENPARL}/bills/${FEDERAL_SESSION}/${billNumber}/debates/?format=json`
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
    } catch { /* no text */ }
  }

  return {
    rawText,
    title: detail.name?.en ?? "Legislative Measure",
    shortTitle: detail.short_title?.en ?? null,
    status: detail.status?.en ?? "",
    isLaw: detail.law === true,
    isPrivateMember: detail.private_member_bill === true,
    chamber: detail.home_chamber?.toLowerCase().includes("house") ? "House of Commons" : "Senate",
    introducedDate: detail.introduced ?? "",
    sponsor: sponsorName,
    votes,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const billNumber = decodeURIComponent(id);
  const level = request.nextUrl.searchParams.get("level");
  const sourceUrl = request.nextUrl.searchParams.get("sourceUrl");

  try {
    if (level === "Federal") {
      const ctx = await getFederalBillText(billNumber);
      if (!ctx.rawText) {
        return NextResponse.json({ error: "No bill text available" }, { status: 404 });
      }
      const ai = await getOrGenerateAISummary({
        billNumber,
        session: FEDERAL_SESSION,
        level: "Federal",
        ...ctx,
        rawText: ctx.rawText,
      });
      return NextResponse.json(ai);
    }

    if (level === "Provincial") {
      const url = sourceUrl || `https://www.ola.org/en/legislative-business/bills/parliament-44/session-1/bill-${billNumber}`;
      const html = await fetchText(url);

      // Title
      const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const title = titleMatch ? stripHtml(titleMatch[1]).trim() : `Bill ${billNumber}`;

      // Sponsor — MPP link right after h1
      const sponsorMatch =
        html.match(/<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?<a[^>]*href="[^"]*\/members\/[^"]*"[^>]*>([^<]+)<\/a>/i) ||
        html.match(/(?:Sponsor|MPP|Member)[^<]*<\/[^>]+>\s*(?:<[^>]+>\s*)*([A-Z][a-zÀ-ÿ]+(?: [A-Z][a-zÀ-ÿ]+)+)/i);
      const sponsor = sponsorMatch ? stripHtml(sponsorMatch[1]).trim() : null;

      // Status — prefer "Current status:" pattern
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
          if (raw.toLowerCase().includes(key)) { stage = num; status = label; break; }
        }
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

      // Extract bill text from the main page (explanatory note + bill body are inline on OLA)
      let rawText: string | null = null;
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      let content = mainMatch ? mainMatch[1] : html;
      content = content.replace(/<(script|style|nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, "");
      const noteMatch = content.match(/(?:EXPLANATORY NOTE|Bill\s+\d+[^<]*)([\s\S]{200,})/i);
      const plain = stripHtml(noteMatch ? noteMatch[0] : content).replace(/\s{3,}/g, "\n\n").trim();
      if (plain.length > 200) rawText = plain;

      if (!rawText) {
        return NextResponse.json({ error: "No bill text available" }, { status: 404 });
      }

      const ai = await getOrGenerateAISummary({
        billNumber,
        session: "provincial",
        level: "Provincial",
        title,
        shortTitle: null,
        status,
        isLaw: stage === 5,
        isPrivateMember: false,
        chamber: "Ontario Legislative Assembly",
        introducedDate: "",
        sponsor,
        votes: [],
        rawText,
      });
      return NextResponse.json(ai);
    }

    return NextResponse.json({ error: "Unsupported level" }, { status: 400 });
  } catch (err) {
    console.error("Summary route error:", err);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
