export interface HistoryItem {
    id: string;
    date: string;
    type: "earned" | "recovered";
    minutes: number;
    comment?: string;
    isManual: boolean;
    start?: string;
    end?: string;
}
