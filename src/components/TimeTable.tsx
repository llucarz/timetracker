import { useState } from "react";
import { Search, Edit2, Trash2, Calendar } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion } from "motion/react";

interface TimeEntry {
  id: string;
  date: string;
  arrival: string;
  pauseStart: string;
  pauseEnd: string;
  departure: string;
  duration: string;
  status: string;
  notes: string;
}

const mockData: TimeEntry[] = [
  {
    id: "1",
    date: "2025-11-19",
    arrival: "08:45",
    pauseStart: "13:15",
    pauseEnd: "13:45",
    departure: "17:30",
    duration: "8h15",
    status: "Travail",
    notes: "Déplacement client"
  },
  {
    id: "2",
    date: "2025-11-18",
    arrival: "09:00",
    pauseStart: "12:30",
    pauseEnd: "13:30",
    departure: "18:00",
    duration: "8h00",
    status: "Travail",
    notes: ""
  },
  {
    id: "3",
    date: "2025-11-15",
    arrival: "09:00",
    pauseStart: "13:00",
    pauseEnd: "13:30",
    departure: "18:00",
    duration: "8h30",
    status: "Travail",
    notes: ""
  },
  {
    id: "4",
    date: "2025-11-14",
    arrival: "",
    pauseStart: "",
    pauseEnd: "",
    departure: "",
    duration: "0h00",
    status: "Vacances",
    notes: ""
  },
  {
    id: "5",
    date: "2025-11-13",
    arrival: "08:30",
    pauseStart: "12:00",
    pauseEnd: "13:00",
    departure: "17:45",
    duration: "8h15",
    status: "Travail",
    notes: "Support technique"
  },
];

export function TimeTable() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = mockData.filter(entry => 
    entry.date.includes(searchTerm) || 
    entry.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-full relative">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-8 py-16 space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="space-y-3">
            <h1>Historique</h1>
            <p className="text-white/50 text-xl tracking-tight max-w-2xl">
              Consultez et gérez toutes vos entrées passées
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-white/30" strokeWidth={2} />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 pl-12 bg-white/[0.03] border-white/10 rounded-[14px] text-[15px] placeholder:text-white/30"
            />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-light rounded-[28px] border border-white/[0.06] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-5 text-[13px] font-semibold text-white/40 tracking-tight">Date</th>
                  <th className="text-left px-6 py-5 text-[13px] font-semibold text-white/40 tracking-tight">Arrivée</th>
                  <th className="text-left px-6 py-5 text-[13px] font-semibold text-white/40 tracking-tight">Pause</th>
                  <th className="text-left px-6 py-5 text-[13px] font-semibold text-white/40 tracking-tight">Reprise</th>
                  <th className="text-left px-6 py-5 text-[13px] font-semibold text-white/40 tracking-tight">Départ</th>
                  <th className="text-left px-6 py-5 text-[13px] font-semibold text-white/40 tracking-tight">Total</th>
                  <th className="text-left px-6 py-5 text-[13px] font-semibold text-white/40 tracking-tight">Statut</th>
                  <th className="text-left px-6 py-5 text-[13px] font-semibold text-white/40 tracking-tight">Notes</th>
                  <th className="text-right px-6 py-5 text-[13px] font-semibold text-white/40 tracking-tight">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((entry, index) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center justify-center size-9 rounded-[10px] bg-indigo-500/10 shrink-0">
                          <Calendar className="size-4 text-indigo-400" strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[15px] font-medium tracking-tight">
                            {new Date(entry.date).toLocaleDateString('fr-FR', { 
                              day: '2-digit', 
                              month: 'short'
                            })}
                          </span>
                          <span className="text-[13px] text-white/30 tracking-tight">
                            {new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] text-white/60 font-mono tracking-tight">
                        {entry.arrival || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] text-white/60 font-mono tracking-tight">
                        {entry.pauseStart || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] text-white/60 font-mono tracking-tight">
                        {entry.pauseEnd || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] text-white/60 font-mono tracking-tight">
                        {entry.departure || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[15px] font-semibold tracking-tight">
                        {entry.duration}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <Badge 
                        variant={entry.status === "Travail" ? "default" : "secondary"}
                        className="rounded-full text-[12px] font-medium px-3 py-1"
                      >
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] text-white/40 truncate max-w-[200px] block tracking-tight">
                        {entry.notes || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="size-9 rounded-[10px] flex items-center justify-center hover:bg-white/[0.06] transition-colors">
                          <Edit2 className="size-4 text-indigo-400" strokeWidth={2} />
                        </button>
                        <button className="size-9 rounded-[10px] flex items-center justify-center hover:bg-white/[0.06] transition-colors">
                          <Trash2 className="size-4 text-red-400" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-[13px] text-white/40 tracking-tight">
              {filteredData.length} entrée{filteredData.length > 1 ? 's' : ''}
            </p>
            <div className="text-[13px] text-white/40">
              Dernière mise à jour : Aujourd'hui
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
