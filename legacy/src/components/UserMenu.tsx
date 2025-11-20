import { useState } from "react";
import { Button } from "./ui/button";
import { Download, Upload, LogOut, Settings, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UserMenuProps {
  userName: string;
  company: string;
  onOpenProfile: () => void;
}

export function UserMenu({ userName, company, onOpenProfile }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
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
                  <p className="text-xl font-bold text-gray-900">1,465h</p>
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