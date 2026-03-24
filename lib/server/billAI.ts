import OpenAI from "openai";
import { supabase } from "@/lib/server/supabase";
import type { BillVote } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AISummary {
  gist: string;
  aiSummary: string;
  keyPoints: string[];
  forArguments: string[];
  againstArguments: string[];
}

export interface BillContext {
  billNumber: string;
  session: string;
  level: string;
  title: string;
  shortTitle: string | null;
  status: string;
  isLaw: boolean;
  isPrivateMember: boolean;
  chamber: string | null;
  introducedDate: string;
  sponsor: string | null;
  votes: BillVote[];
  rawText: string;
}

export async function getOrGenerateAISummary(ctx: BillContext): Promise<AISummary | null> {
  const { billNumber, session, level } = ctx;

  // 1. Check Supabase cache
  const { data: cached } = await supabase
    .from("bill_ai_summaries")
    .select("gist, ai_summary, key_points, for_arguments, against_arguments")
    .eq("bill_number", billNumber)
    .eq("session", session)
    .eq("level", level)
    .maybeSingle();

  if (cached) {
    console.log(`Cache hit for ${level} bill ${billNumber} (${session})`);
    return {
      gist: cached.gist,
      aiSummary: cached.ai_summary,
      keyPoints: cached.key_points,
      forArguments: cached.for_arguments,
      againstArguments: cached.against_arguments,
    };
  }

  // 2. Cache miss — call OpenAI
  console.log(`Cache miss for ${level} bill ${billNumber} — generating...`);
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a civic education assistant. Given a Canadian parliamentary bill, return a JSON object with these exact keys:
- "gist": one plain sentence (max 25 words) explaining what the bill does
- "aiSummary": 2–3 short paragraphs in plain English, no jargon, written for a regular citizen
- "keyPoints": array of 4–6 concise bullet points about what changes if this passes
- "forArguments": array of 3–4 arguments supporters make
- "againstArguments": array of 3–4 arguments critics make

Be neutral, factual, and accessible. Avoid legal language.`,
        },
        {
          role: "user",
          content: [
            `=== BILL METADATA ===`,
            `Bill Number: ${ctx.billNumber}`,
            `Parliament Session: ${ctx.session}`,
            `Level: ${ctx.level}`,
            `Full Title: ${ctx.title}`,
            ctx.shortTitle ? `Short Title: ${ctx.shortTitle}` : null,
            `Current Status: ${ctx.status}`,
            `Is Now Law: ${ctx.isLaw ? "Yes" : "No"}`,
            `Type: ${ctx.isPrivateMember ? "Private Member's Bill" : "Government Bill"}`,
            ctx.chamber ? `Introduced In: ${ctx.chamber}` : null,
            ctx.introducedDate ? `Date Introduced: ${ctx.introducedDate}` : null,
            ctx.sponsor ? `Sponsor: ${ctx.sponsor}` : null,
            ctx.votes.length > 0
              ? `\n=== RECORDED VOTES ===\n` +
                ctx.votes
                  .map((v) => `${v.date} — ${v.description}: ${v.yeas} Yea / ${v.nays} Nay — ${v.result}`)
                  .join("\n")
              : null,
            `\n=== BILL TEXT ===`,
            ctx.rawText,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    const ai = JSON.parse(content) as AISummary;

    // 3. Store in Supabase (upsert handles race conditions)
    await supabase.from("bill_ai_summaries").upsert(
      {
        bill_number: billNumber,
        session,
        level,
        gist: ai.gist,
        ai_summary: ai.aiSummary,
        key_points: ai.keyPoints,
        for_arguments: ai.forArguments,
        against_arguments: ai.againstArguments,
      },
      { onConflict: "bill_number,session,level" }
    );

    return ai;
  } catch (err) {
    console.error("OpenAI error:", err);
    return null;
  }
}
