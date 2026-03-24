// CivicStream TypeScript Interfaces

export type JurisdictionLevel = "Federal" | "Provincial" | "Municipal";
export type SupportedMunicipality = "Milton" | "Waterloo";

export type FeedItemType =
  | "bill"
  | "meeting"
  | "petition"
  | "alert"
  | "lobbywatch"
  | "budget";

export type BillStatus =
  | "First Reading"
  | "Second Reading"
  | "Committee"
  | "Third Reading"
  | "Senate"
  | "Royal Assent"
  | "Passed";

export type LobbyPosition = "For" | "Against" | "Neutral";

export type Urgency = "low" | "medium" | "high";

export type ZoningAlertType =
  | "Rezoning"
  | "New Development"
  | "Infrastructure"
  | "Heritage"
  | "Development Application"
  | "Planning Application";

export type ZoningAlertStatus =
  | "Active"
  | "Approved"
  | "Under Review"
  | "Proposed";

export interface Rep {
  id: string;
  level: JurisdictionLevel;
  title: string;
  name: string;
  party: string;
  partyColor: string;
  riding: string;
  photo?: string;
  committee: string;
  attendance: number;
  email: string;
  lobbyMeetings: LobbyMeeting[];
}

export interface LobbyMeeting {
  date: string;
  group: string;
  position?: LobbyPosition;
}

export interface RepsData {
  postal: string;
  riding: string;
  municipality?: SupportedMunicipality;
  federalDistrict?: string;
  provincialDistrict?: string;
  reps: Rep[];
}

export interface Bill {
  id: string;
  level: JurisdictionLevel;
  billNumber: string;
  title: string;
  shortTitle: string;
  jurisdiction: string;
  publishedDate: string;
  sponsor: string;
  status: BillStatus;
  statusStage: number;
  totalStages: number;
  affectsMilton: boolean;
  tags: string[];
  gist: string;
  aiSummary: string;
  keyPoints: string[];
  forArguments: string[];
  againstArguments: string[];
  lobbyMeetings: LobbyMeeting[];
  citedSources: CitedSource[];
}

export interface CitedSource {
  label: string;
  url: string;
}

export interface FeedItem {
  id: string;
  level: JurisdictionLevel;
  type: FeedItemType;
  title: string;
  url?: string;
  summary: string;
  date: string;
  isNew: boolean;
  urgency: Urgency;
  linkedBillId: string | null;
  icon: string;
  status?: string;
}

export interface BillVote {
  date: string;
  description: string;
  yeas: number;
  nays: number;
  result: string;
}

export interface LiveBillDetail {
  billNumber: string;
  title: string;
  shortTitle: string | null;
  level: JurisdictionLevel;
  status: string;
  chamber: string | null;
  isPrivateMember: boolean;
  isLaw: boolean;
  introducedDate: string;
  sponsor: string | null;
  sponsorUrl: string | null;
  sourceUrl: string | null;
  fullTextUrl: string | null;
  votes: BillVote[];
  rawText: string | null;
}

export interface ZoningAlert {
  id: string;
  title: string;
  type: ZoningAlertType;
  status: ZoningAlertStatus;
  urgency: Urgency;
  lat: number;
  lng: number;
  radius: number;
  summary: string;
  date: string;
  linkedBillId: string | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate: string | null;
}

export interface CivicStreamState {
  postalCode: string | null;
  riding: string | null;
  onboardingComplete: boolean;
  streakDays: number;
  lastActiveDate: string;
  readBillIds: string[];
  earnedBadgeIds: string[];
  activeFilter: "all" | "Federal" | "Provincial" | "Municipal";
}

export type CivicStreamAction =
  | { type: "SET_POSTAL_CODE"; payload: string }
  | {
      type: "COMPLETE_ONBOARDING";
      payload: { postalCode: string; riding: string };
    }
  | { type: "MARK_BILL_READ"; payload: string }
  | {
      type: "SET_FILTER";
      payload: "all" | "Federal" | "Provincial" | "Municipal";
    }
  | { type: "INCREMENT_STREAK" }
  | { type: "RESET_DEMO" };

export interface Activity {
  id: string;
  action: string;
  time: string;
}
