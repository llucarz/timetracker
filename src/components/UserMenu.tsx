import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { Download, Upload, LogOut, Settings, User, LogIn, Loader2, CloudOff, CheckCircle2, AlertTriangle, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { computeMinutes, minToHM } from "../lib/utils";
import { useNotification } from "../context/NotificationContext";
import { ExportModal } from "./ExportModal";
import { GRADIENTS } from "../ui/design-system/tokens";
import { Entry } from "../lib/types";

interface UserMenuProps {
  userName: string;
  company: string;
  onOpenProfile: () => void;
  onLogin: () => void;
}

export function UserMenu({ userName, company, onOpenProfile, onLogin }: UserMenuProps) {
  const { entries, importEntries, updateSettings, settings, logout, isSyncing, lastSyncError } = useTimeTracker();
  const { showNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Import conflict state
  const [importConflictOpen, setImportConflictOpen] = useState(false);
  const [pendingImportEntries, setPendingImportEntries] = useState<Omit<Entry, 'id'>[]>([]);
  const [conflictingDates, setConflictingDates] = useState<string[]>([]);

  const isLoggedIn = !!settings.account?.key;
  const isOffline = settings.account?.isOffline;
  const rawUserName = isLoggedIn ? settings.account?.name : "Invité";
  const rawCompany = isLoggedIn ? settings.account?.company : "Mode local";

  // Formatage pour l'affichage
  const displayUserName = rawUserName ? rawUserName.charAt(0).toUpperCase() + rawUserName.slice(1) : "";
  const displayCompany = rawCompany ? rawCompany.toUpperCase() : "";

  const totalMinutes = entries.reduce((acc, entry) => {
    return acc + computeMinutes(entry);
  }, 0);
  const totalHours = minToHM(totalMinutes);

  const handleLogout = () => {
    logout();
    showNotification({
      type: "success",
      title: "Succès",
      message: "Déconnexion réussie"
    });
  };

  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n");
        const newEntries: any[] = [];

        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(",");
          if (parts.length >= 5) {
            const dateStr = parts[0].trim();

            // Validate date format (YYYY-MM-DD)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(new Date(dateStr).getTime())) {
              console.warn(`Skipping invalid date at line ${i + 1}: ${dateStr}`);
              continue; // Skip invalid lines instead of crashing
            }

            // Basic validation for time fields (optional, but good practice)
            // We allow empty strings explicitly for pauses

            const rawStatus = parts[5] ? parts[5].trim() : "work";
            const validStatuses = ["work", "school", "vacation", "sick", "holiday", "recovery"];
            const status = validStatuses.includes(rawStatus) ? rawStatus : "work";

            newEntries.push({
              date: dateStr,
              start: parts[1]?.trim() || "",
              lunchStart: parts[2]?.trim() || "",
              lunchEnd: parts[3]?.trim() || "",
              end: parts[4]?.trim() || "",
              status: status as any,
              notes: parts[6] ? parts[6].replace(/^"|"$/g, '').trim() : ""
            });
          }
        }

        if (newEntries.length === 0) {
          showNotification({
            type: "error",
            title: "Erreur d'import",
            message: "Aucune entrée valide trouvée dans le fichier CSV."
          });
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        // Check for existing entries to warn about overwrite
        const conflicts = newEntries
          .filter(newEntry => entries.some(existing => existing.date === newEntry.date))
          .map(e => e.date);

        if (conflicts.length > 0) {
          setConflictingDates(conflicts);
          setPendingImportEntries(newEntries);
          setImportConflictOpen(true);
          return;
        }

        importEntries(newEntries);
        showNotification({
          type: "success",
          title: "Succès",
          message: `${newEntries.length} entrées importées`
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error) {
        showNotification({
          type: "error",
          title: "Erreur",
          message: "Erreur lors de l'import"
        });
        console.error(error);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    importEntries(pendingImportEntries);
    showNotification({
      type: "success",
      title: "Succès",
      message: `${pendingImportEntries.length} entrées importées (dont ${conflictingDates.length} écrasées)`
    });
    setImportConflictOpen(false);
    setPendingImportEntries([]);
    setConflictingDates([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelImport = () => {
    showNotification({
      type: "info",
      title: "Information",
      message: "Import annulé"
    });
    setImportConflictOpen(false);
    setPendingImportEntries([]);
    setConflictingDates([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <DropdownMenu>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".csv"
          className="hidden"
        />

        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 px-4 py-1 rounded-xl transition-colors duration-200 hover:bg-gray-200 cursor-pointer outline-none focus:outline-none focus-visible:ring-0">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-2">
                <p className="text-sm font-semibold text-gray-900 leading-[28px]">{displayUserName}</p>
                {isLoggedIn ? (
                  <>
                    {isOffline ? (
                      <CloudOff className="w-3 h-3 text-gray-400" />
                    ) : isSyncing ? (
                      <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />
                    ) : lastSyncError ? (
                      <CloudOff className="w-3 h-3 text-red-500" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    )}
                  </>
                ) : (
                  <CloudOff className="w-3 h-3 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-500 leading-[28px]">{displayCompany}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS.primaryDouble} flex items-center justify-center text-white font-semibold shadow-lg shadow-purple-200`}>
              {displayUserName.charAt(0)}
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-72 rounded-2xl p-0 border-gray-100" align="end" sideOffset={8}>
          {/* User Info */}
          <div className={`px-4 py-4 bg-gradient-to-br ${GRADIENTS.primaryLight} border-b border-purple-100`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">
                {isLoggedIn ? "Connecté en tant que" : "Mode Invité"}
              </p>
              {isLoggedIn ? (
                <div className="flex items-center gap-1.5">
                  {isOffline ? (
                    <>
                      <CloudOff className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">Hors ligne</span>
                    </>
                  ) : isSyncing ? (
                    <>
                      <Loader2 className="w-3 h-3 text-purple-600 animate-spin" />
                      <span className="text-xs text-purple-600">Sync...</span>
                    </>
                  ) : lastSyncError ? (
                    <>
                      <CloudOff className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-500">Erreur</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span className="text-xs text-emerald-600">Sync</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <CloudOff className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Local</span>
                </div>
              )}
            </div>
            <p className={`text-lg font-bold bg-gradient-to-r ${GRADIENTS.primaryButton} bg-clip-text text-transparent`}>
              {displayUserName}
            </p>
            <p className="text-sm text-gray-600">{displayCompany}</p>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <DropdownMenuItem
              onClick={onOpenProfile}
              className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Settings className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Modifier le profil</p>
                <p className="text-xs text-gray-500">Configurez vos horaires</p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleExport}
              className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                <Download className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Exporter les heures</p>
                <p className="text-xs text-gray-500">Télécharger en CSV</p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Upload className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Importer les heures</p>
                <p className="text-xs text-gray-500">Charger un fichier CSV</p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            {isLoggedIn ? (
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-600">Se déconnecter</p>
                  <p className="text-xs text-red-400">Quitter votre compte</p>
                </div>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={onLogin}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-green-50 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <LogIn className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600">Connexion / Inscription</p>
                  <p className="text-xs text-green-400">Sauvegarder vos données</p>
                </div>
              </DropdownMenuItem>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Import Warning Dialog - Custom Design */}
      <AnimatePresence>
        {importConflictOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelImport}
              className="fixed inset-0 w-full h-full bg-black/20 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200"
              >
                {/* Header with close button */}
                <div className="flex items-start justify-between p-6 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-rose-600" strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Conflit détecté
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Des données existent déjà pour certaines dates
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={cancelImport}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 space-y-5">
                  {/* Message */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Le fichier CSV contient <span className="font-semibold text-gray-900">{conflictingDates.length} date{conflictingDates.length > 1 ? "s" : ""}</span> qui exist{conflictingDates.length > 1 ? "ent" : "e"} déjà dans votre historique. Souhaitez-vous remplacer les données existantes ?
                  </p>

                  {/* Conflict Dates List */}
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Dates en conflit
                      </h3>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded-lg">
                        {conflictingDates.length}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
                      {conflictingDates.map((date, index) => (
                        <motion.div
                          key={date}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                          <p className="text-sm text-gray-900 font-medium">
                            {new Date(date).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Warning Banner */}
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-rose-900 mb-1">
                        Action irréversible
                      </p>
                      <p className="text-xs text-rose-700 leading-relaxed">
                        Les données existantes pour ces dates seront définitivement supprimées et remplacées par les nouvelles données du fichier CSV.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <Button
                      onClick={cancelImport}
                      variant="outline"
                      className="flex-1 h-12 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={confirmImport}
                      className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 transition-all"
                    >
                      Remplacer les données
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}