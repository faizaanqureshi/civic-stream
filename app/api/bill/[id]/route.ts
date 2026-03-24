import { NextRequest, NextResponse } from "next/server";
import { fetchJson, fetchText, stripHtml } from "@/lib/server/municipalLive";
import type { LiveBillDetail, BillVote } from "@/types";

const FEDERAL_SESSION = "45-1";
const OPENPARL = "https://openparliament.ca";

async function fetchFederalBill(billNumber: string): Promise<LiveBillDetail | null> {
  try {
    const [detail, votesData] = await Promise.all([
      fetchJson<any>(`${OPENPARL}/bills/${FEDERAL_SESSION}/${billNumber}/?format=json`),
      fetchJson<any>(
        `${OPENPARL}/votes/?bill=${FEDERAL_SESSION}/${billNumber}&format=json`
      ).catch(() => ({ objects: [] })),
    ]);

    // Resolve sponsor name by following their member URL
    let sponsorName: string | null = null;
    let sponsorUrl: string | null = null;
    if (detail.sponsor_url) {
      const sponsorDetail = await fetchJson<any>(
        `${OPENPARL}${detail.sponsor_url}?format=json`
      ).catch(() => null);
      sponsorName = sponsorDetail?.name || null;
      sponsorUrl = `${OPENPARL}${detail.sponsor_url}`;
    }

    console.log(`\n=== OpenParliament bill detail for ${billNumber} ===`);
    console.log(JSON.stringify(detail, null, 2));
    console.log("=== end ===\n");

    const votes: BillVote[] = (votesData?.objects || [])
      .slice(0, 8)
      .map((v: any) => ({
        date: v.date || "",
        description: v.description?.en || "Vote",
        yeas: v.yea_total ?? 0,
        nays: v.nay_total ?? 0,
        result: v.result || "Unknown",
      }));

    const fullTextUrl = detail.legisinfo_url ?? `https://www.parl.ca/legisinfo/en/bill/${FEDERAL_SESSION}/${billNumber.toLowerCase()}`;
    const documentViewerUrl: string | null = detail.text_url ?? null;

    let rawText: string | null = null;

    // Strategy 1: fetch the actual bill document from Parliament's DocumentViewer
    if (documentViewerUrl) {
      try {
        const docHtml = await fetchText(documentViewerUrl);
        const mainMatch = docHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        let content = mainMatch ? mainMatch[1] : docHtml;
        content = content.replace(/<(script|style|nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, "");
        const plain = stripHtml(content).replace(/\s{3,}/g, "\n\n").trim();
        if (plain.length > 200) rawText = plain.slice(0, 8000);
        console.log(`\n=== DocumentViewer text for ${billNumber} (${plain.length} chars) ===`);
        console.log(plain.slice(0, 2000));
        console.log("=== end ===\n");
      } catch (err) {
        console.error(`DocumentViewer fetch failed for ${billNumber}:`, err);
      }
    }

    // Strategy 2: fall back to debates from OpenParliament
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

        if (speeches.length > 0) {
          rawText = speeches.join("\n\n").slice(0, 8000);
        }

        console.log(`\n=== Debates fallback for ${billNumber} (${rawText?.length ?? 0} chars) ===`);
        console.log(rawText?.slice(0, 2000));
        console.log("=== end ===\n");
      } catch (err) {
        console.error(`Debates fetch failed for ${billNumber}:`, err);
      }
    }

    return {
      billNumber: detail.number ?? billNumber,
      title: detail.name?.en ?? "Legislative Measure",
      shortTitle: detail.short_title?.en ?? null,
      level: "Federal",
      status: detail.status?.en ?? "Under Consideration",
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
    };
  } catch (err) {
    console.error("fetchFederalBill error:", err);
    return null;
  }
}

async function fetchProvincialBill(
  billNumber: string,
  sourceUrl: string | null
): Promise<LiveBillDetail | null> {
  const url =
    sourceUrl ||
    `https://www.ola.org/en/legislative-business/bills/parliament-43/session-1/bill-${billNumber}`;

  try {
    const html = await fetchText(url);

    // Title — usually in <h1>
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = titleMatch
      ? stripHtml(titleMatch[1]).trim()
      : `Bill ${billNumber}`;

    // Sponsor / MPP
    const sponsorMatch =
      html.match(/(?:Sponsor|Introduced by|MPP)[^<]*<\/[^>]+>\s*(?:<[^>]+>)?\s*([A-Z][^<\n]{3,60})/i) ||
      html.match(/member[^<]*<\/[^>]+>\s*(?:<[^>]+>)?\s*([A-Z][a-z]+ [A-Z][a-z]+)/i);
    const sponsor = sponsorMatch ? stripHtml(sponsorMatch[1]).trim() : null;

    // Status / current reading
    const statusMatch = html.match(
      /(?:Royal Assent|Third Reading|Second Reading|First Reading|Committee|Passed|Withdrawn)[^<\n]*/i
    );
    const status = statusMatch ? statusMatch[0].trim().slice(0, 60) : "Active";

    // Try to extract a brief description
    const summaryMatch = html.match(
      /(?:summary|description|purpose)[^<]*<\/[^>]+>\s*<[^>]+>([\s\S]{80,1000}?)<\/[^>]+>/i
    );
    const rawText = summaryMatch ? stripHtml(summaryMatch[1]).trim().slice(0, 1200) : null;

    return {
      billNumber,
      title,
      shortTitle: null,
      level: "Provincial",
      status,
      chamber: "Ontario Legislative Assembly",
      isPrivateMember: false,
      isLaw: status.toLowerCase().includes("royal assent"),
      introducedDate: "",
      sponsor,
      sponsorUrl: null,
      sourceUrl: url,
      fullTextUrl: url,
      votes: [],
      rawText,
    };
  } catch (err) {
    console.error("fetchProvincialBill error:", err);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
