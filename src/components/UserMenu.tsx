import { useRef } from "react";
import { Button } from "./ui/button";
import { Download, Upload, LogOut, Settings, User, LogIn, Loader2, CloudOff, CheckCircle2 } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { computeMinutes, minToHM } from "../lib/utils";
import { toast } from "sonner";

interface UserMenuProps {
  userName: string;
  company: string;
  onOpenProfile: () => void;
  onLogin: () => void;
}

export function UserMenu({ userName, company, onOpenProfile, onLogin }: UserMenuProps) {
  const { entries, importEntries, updateSettings, settings, logout, isSyncing, lastSyncError } = useTimeTracker();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = !!settings.account?.key;
  const isOffline = settings.account?.isOffline;
  const rawUserName = isLoggedIn ? settings.account?.name : "Invité";
  const rawCompany = isLoggedIn ? settings.account?.company : "Mode local";

  // Formatage pour l'affichage
  const displayUserName = rawUserName ? rawUserName.charAt(0).toUpperCase() + rawUserName.slice(1) : "";
  const displayCompany = rawCompany ? rawCompany.toUpperCase() : "";

  const totalMinutes = entries.reduce((acc, entry) => {
    return acc + computeMinutes(entry.startTime, entry.endTime, entry.breakDuration);
  }, 0);
  const totalHours = minToHM(totalMinutes);

  const handleLogout = () => {
    logout();
    toast.success("Déconnexion réussie");
  };

  const handleExport = () => {
    const headers = ["Date", "Arrivée", "Départ", "Pause (min)", "Type", "Note"];
    const csvContent = [
      headers.join(","),
      ...entries.map(e => 
        [e.date, e.startTime, e.endTime, e.breakDuration, e.type, `"${e.note || ""}"`].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `time_entries_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export réussi");
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
          
          // Simple CSV parsing (doesn't handle commas in quotes perfectly but good enough for now)
          const parts = line.split(",");
          if (parts.length >= 5) {
            newEntries.push({
              date: parts[0],
              startTime: parts[1],
              endTime: parts[2],
              breakDuration: parseInt(parts[3]) || 0,
              type: parts[4] as any,
              note: parts[5] ? parts[5].replace(/^"|"$/g, '') : ""
            });
          }
        }

        importEntries(newEntries);
        toast.success(`${newEntries.length} entrées importées`);
      } catch (error) {
        toast.error("Erreur lors de l'import");
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  return (
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
              <p className="text-sm font-semibold text-gray-900">{displayUserName}</p>
              {isLoggedIn && (
                <>
                  {isOffline ? (
                    <CloudOff className="w-3 h-3 text-gray-400" title="Mode hors ligne" />
                  ) : isSyncing ? (
                    <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />
                  ) : lastSyncError ? (
                    <CloudOff className="w-3 h-3 text-red-500" title="Erreur de synchronisation" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" title="Synchronisé" />
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-gray-500">{displayCompany}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-purple-200">
            {displayUserName.charAt(0)}
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-72 rounded-2xl p-0 border-gray-100" align="end" sideOffset={8}>
        {/* User Info */}
        <div className="px-4 py-4 bg-gradient-to-br from-purple-50 to-pink-50 border-b border-purple-100">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">
              {isLoggedIn ? "Connecté en tant que" : "Mode Invité"}
            </p>
            {isLoggedIn && (
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
            )}
          </div>
          <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
  );
}