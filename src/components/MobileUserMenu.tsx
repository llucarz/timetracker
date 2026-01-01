import { useRef, useState, useEffect } from "react";
import { Download, Upload, LogOut, Settings, LogIn, Loader2, CloudOff, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { useNotification } from "../context/NotificationContext";
import { ExportModal } from "./ExportModal";
import { GRADIENTS } from "../ui/design-system/tokens";

interface MobileUserMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenProfile: () => void;
    onLogin: () => void;
}

export function MobileUserMenu({ isOpen, onClose, onOpenProfile, onLogin }: MobileUserMenuProps) {
    const { entries, importEntries, settings, logout, isSyncing, lastSyncError } = useTimeTracker();
    const { showNotification } = useNotification();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const isLoggedIn = !!settings.account?.key;
    const isOffline = settings.account?.isOffline;
    const rawUserName = isLoggedIn ? settings.account?.name : "Invité";
    const rawCompany = isLoggedIn ? settings.account?.company : "Mode local";

    // Formatage pour l'affichage
    const displayUserName = rawUserName ? rawUserName.charAt(0).toUpperCase() + rawUserName.slice(1) : "";
    const displayCompany = rawCompany ? rawCompany.toUpperCase() : "";

    const handleLogout = () => {
        logout();
        showNotification({
            type: "success",
            title: "Succès",
            message: "Déconnexion réussie"
        });
        onClose();
    };

    const handleExport = () => {
        setIsExportModalOpen(true);
        onClose();
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
                            continue;
                        }

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
                    return;
                }

                importEntries(newEntries);
                showNotification({
                    type: "success",
                    title: "Succès",
                    message: `${newEntries.length} entrées importées`
                });
                onClose();
            } catch (error) {
                showNotification({
                    type: "error",
                    title: "Erreur",
                    message: "Erreur lors de l'import"
                });
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    const handleOpenProfile = () => {
        onOpenProfile();
        onClose();
    };

    const handleLogin = () => {
        onLogin();
        onClose();
    };

    // Block body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".csv"
                className="hidden"
            />

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/50 z-50 md:hidden"
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl md:hidden max-h-[85vh] overflow-y-auto"
                        >
                            {/* Header avec gradient */}
                            <div className={`relative px-6 py-6 bg-gradient-to-br ${GRADIENTS.primaryLight} border-b border-purple-100 rounded-t-3xl`}>
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-600" />
                                </button>

                                <div className="flex items-center justify-between mb-2 pr-10">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {isLoggedIn ? "Connecté en tant que" : "Mode Invité"}
                                    </p>
                                    {isLoggedIn ? (
                                        <div className="flex items-center gap-1.5">
                                            {isOffline ? (
                                                <>
                                                    <CloudOff className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-400">Hors ligne</span>
                                                </>
                                            ) : isSyncing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                                                    <span className="text-sm text-purple-600">Sync...</span>
                                                </>
                                            ) : lastSyncError ? (
                                                <>
                                                    <CloudOff className="w-4 h-4 text-red-500" />
                                                    <span className="text-sm text-red-500">Erreur</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                    <span className="text-sm text-emerald-600">Sync</span>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <CloudOff className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-400">Local</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 pr-14">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${GRADIENTS.primaryDouble} flex items-center justify-center text-white font-semibold text-xl shadow-lg shadow-purple-200`}>
                                        {displayUserName.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-lg font-bold bg-gradient-to-r ${GRADIENTS.primaryButton} bg-clip-text text-transparent`}>
                                            {displayUserName}
                                        </p>
                                        <p className="text-sm text-gray-600">{displayCompany}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="p-4 space-y-2">
                                <button
                                    onClick={handleOpenProfile}
                                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-purple-50 active:bg-purple-100 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <Settings className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-base font-semibold text-gray-900">Modifier le profil</p>
                                        <p className="text-sm text-gray-500">Configurez vos horaires</p>
                                    </div>
                                </button>

                                <button
                                    onClick={handleExport}
                                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-teal-50 active:bg-teal-100 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                                        <Download className="w-5 h-5 text-teal-600" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-base font-semibold text-gray-900">Exporter les heures</p>
                                        <p className="text-sm text-gray-500">Télécharger en CSV</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-blue-50 active:bg-blue-100 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Upload className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-base font-semibold text-gray-900">Importer les heures</p>
                                        <p className="text-sm text-gray-500">Charger un fichier CSV</p>
                                    </div>
                                </button>

                                <div className="h-px bg-gray-200 my-4" />

                                {isLoggedIn ? (
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-red-50 active:bg-red-100 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                                            <LogOut className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="text-base font-semibold text-red-600">Se déconnecter</p>
                                            <p className="text-sm text-red-400">Quitter votre compte</p>
                                        </div>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleLogin}
                                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-green-50 active:bg-green-100 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <LogIn className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="text-base font-semibold text-green-600">Connexion / Inscription</p>
                                            <p className="text-sm text-green-400">Sauvegarder vos données</p>
                                        </div>
                                    </button>
                                )}
                            </div>

                            {/* Safe area padding */}
                            <div className="h-8" />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Export Modal */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />
        </>
    );
}
