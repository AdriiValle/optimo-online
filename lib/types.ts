export type UserRole = "admin" | "athlete";
export type Sport = "football" | "running" | "other";
export type MatchVenue = "casa" | "fuera";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  athleteId: string | null;
};

export type HtmlMatch = {
  date: string;
  time: string | null;
  home: string;
  away: string;
  venue: MatchVenue;
  comp: string;
  note?: string;
  window?: boolean;
};

export type Protocol = {
  label: string;
  qty?: string;
  info?: string;
  video?: string;
};

export type SessionRow =
  | { kind: "match"; text: string }
  | { kind: "note"; text: string }
  | { kind: "section"; title: string }
  | {
      kind: "protocol";
      protocolId: string;
      label: string;
      qty: string | null;
      info: string | null;
      video: string | null;
    };

export type DayPlanBlock = SessionRow;

export type DayPlan = {
  date: string;
  mdTag: string | null;
  title: string | null;
  minutes: number | null;
  blocks: DayPlanBlock[];
  matchOpponent: string | null;
  matchVenue: MatchVenue | null;
  matchTime: string | null;
  matchCompetition: string | null;
};

export type Diary = {
  athleteId: string;
  date: string;
  sleepHours: number | null;
  sleepQuality: number | null;
  recovery: number | null;
  hrv: number | null;
  restingHr: number | null;
  rpe: number | null;
  feeling: number | null;
  km: number | null;
  avgHr: number | null;
  /** Texto libre de molestias/dolor del día; persiste en columna `diaries.diet_note`. */
  dietNote: string | null;
  freeNote: string | null;
};

export type Injury = {
  id: string;
  zone: string;
  status: "open" | "closed";
  note: string | null;
  startedOn: string;
  closedOn: string | null;
};

export type Athlete = {
  id: string;
  accountId: string;
  name: string;
  sport: Sport;
  hasPhoto: boolean;
  team: string | null;
  shirtNumber: string | null;
  dietNotes: string | null;
  sleepRoutine: string | null;
};
