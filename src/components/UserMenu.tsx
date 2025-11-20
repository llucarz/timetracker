import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Download, Upload, LogOut, Settings, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { computeMinutesFromTimes, minToHM } from "../lib/utils";
import { toast } from "sonner";

interface UserMenuProps {
  userName: string;
  company: string;
  onOpenProfile: () => void;
}

export function UserMenu({ userName, company, onOpenProfile }: UserMenuProps) {
  const { entries, importEntries } = useTimeTracker();
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalMinutes = entries.reduce((acc, entry) => {
    return acc + computeMinutesFromTimes({
      start: entry.start,
      lunchStart: entry.lunchStart,
      lunchEnd: entry.lunchEnd,
      end: entry.end
    });
  }, 0);

  const handleExport = () => {
    const head = [
      "date",
      "start",
      "lunchStart",
      "lunchEnd",
      "end",
      "minutes",
      "status",
      "notes",
    ];
    const rows = entries.map(e => [
      e.date,
      e.start || "",
      e.lunchStart || "",
      e.lunchEnd || "",
      e.end || "",
      computeMinutesFromTimes({ start: e.start, lunchStart: e.lunchStart, lunchEnd: e.lunchEnd, end: e.end }),
      e.status || "work",
      (e.notes || "").replaceAll('"', '""'),
    ]);
    const csv = [
      head.join(","),
      ...rows.map(r => r.map(x => `"${x}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "timetracker_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      if (file.name.endsWith(".json")) {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          importEntries(data);
          toast.success("Import réussi !");
        }
      } else if (file.name.endsWith(".csv")) {
        const lines = text.split(/\r?\n/).filter(Boolean);
        const head = lines.shift()?.split(",").map(s => s.replaceAll('"', "").trim());
        if (!head) throw new Error("CSV invalide");
        
        const idx = (k: string) => head.indexOf(k);
        const newEntries = lines.map(line => {
          const cols = line.match(/("(?:[^"]|"")*"|[^,]+)/g)?.map(s => s.replace(/^"|"$/g, "").replaceAll('""', '"')) || [];
          return {
            date: cols[idx("date")] || "",
            start: cols[idx("start")] || "",
            lunchStart: cols[idx("lunchStart")] || "",
            lunchEnd: cols[idx("lunchEnd")] || "",
            end: cols[idx("end")] || "",
            notes: cols[idx("notes")] || "",
            status: (cols[idx("status")] || "work") as any,
          };
        }).filter(e => e.date);
        
        importEntries(newEntries);
        toast.success("Import réussi !");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'import");
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv,.json"
        onChange={handleFileChange}
      />
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-900">{userName}</p>
          <p className="text-xs text-gray-500">{company}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-purple-200">
          {userName.charAt(0)}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-72 bg-white rounded-2xl card-shadow border border-gray-100 overflow-hidden z-50"
            >
              {/* User Info */}
              <div className="px-4 py-4 bg-gradient-to-br from-purple-50 to-pink-50 border-b border-purple-100">
                <p className="text-sm font-semibold text-gray-900">Connecté en tant que</p>
                <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {userName}
                </p>
                <p className="text-sm text-gray-600">{company}</p>
                <div className="mt-3 pt-3 border-t border-purple-100">
                  <p className="text-xs text-gray-500">Total heures suivies</p>
                  <p className="text-xl font-bold text-gray-900">{minToHM(totalMinutes)}</p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <button
                  onClick={() => {
                    onOpenProfile();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Modifier le profil</p>
                    <p className="text-xs text-gray-500">Configurez vos horaires</p>
                  </div>
                </button>

                <button
                  onClick={handleExport}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Download className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Exporter les heures</p>
                    <p className="text-xs text-gray-500">Télécharger en CSV</p>
                  </div>
                </button>

                <button
                  onClick={handleImportClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Importer les heures</p>
                    <p className="text-xs text-gray-500">Charger un fichier CSV</p>
                  </div>
                </button>

                <div className="my-2 border-t border-gray-100" />

                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600">Se déconnecter</p>
                    <p className="text-xs text-red-400">Quitter votre compte</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}