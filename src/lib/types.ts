export interface Entry {
  id: string;
  date: string;
  start: string;
  lunchStart: string;
  lunchEnd: string;
  end: string;
  notes: string;
  status: "work" | "school" | "vacation" | "sick" | "holiday";
  updatedAt?: number;
}

export interface Settings {
  isOnboarded?: boolean;
  weeklyTarget: number;
  workDays: number;
  cloudKey?: string;
  account?: {
    name: string;
    company: string;
    key: string;
  } | null;
  baseHours?: {
    mode: "same" | "per-day";
    same: {
      start: string;
      lunchStart: string;
      lunchEnd: string;
      end: string;
    };
    days: Record<string, {
      enabled: boolean;
      start: string;
      lunchStart: string;
      lunchEnd: string;
      end: string;
    }>;
  };
}

export interface OvertimeEvent {
  id: string;
  date: string;
  minutes: number;
  start?: string;
  end?: string;
  note: string;
}

export interface OvertimeState {
  balanceMinutes: number;
  earnedMinutes: number;
  usedMinutes: number;
  events: OvertimeEvent[];
}
