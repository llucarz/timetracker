import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { LogIn, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { generateAccountKey } from "../lib/utils";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { updateSettings, login } = useTimeTracker();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!name.trim() || !company.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    try {
      const key = generateAccountKey(company, name);
      
      // Try to fetch existing data
      const res = await fetch(`/api/data?key=${key}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      if (data.settings?.account) {
        // Account exists - Login
        login({
          entries: data.entries,
          settings: data.settings,
          overtime: data.overtime
        });
        toast.success("Connexion réussie !", {
          description: `Bon retour, ${data.settings.account.name}`
        });
      } else {
        // Account doesn't exist - Create new
        const newAccount = { 
          name: name.trim(), 
          company: company.trim(), 
          key 
        };
        
        updateSettings({ 
          account: newAccount,
          isOnboarded: true 
        });
        
        toast.success("Compte créé !", {
          description: "Vos données seront maintenant synchronisées"
        });
      }
      
      onClose();
      setName("");
      setCompany("");
    } catch (error) {
      console.error(error);
      // Fallback to local mode if API is unreachable
      const key = generateAccountKey(company, name);
      const newAccount = { 
        name: name.trim(), 
        company: company.trim(), 
        key 
      };
      
      updateSettings({ 
        account: newAccount,
        isOnboarded: true 
      });

      toast.success("Mode hors ligne activé", {
        description: "Vos données sont sauvegardées localement"
      });
      
      onClose();
      setName("");
      setCompany("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl card-shadow max-w-sm w-full overflow-hidden"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-200">
                      <LogIn className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
                      <p className="text-sm text-gray-600 mt-1">Synchronisez vos données</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl hover:bg-white/50 transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Votre nom</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Jean Dupont"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 rounded-xl border-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium text-gray-700">Entreprise</Label>
                    <Input
                      id="company"
                      placeholder="Ex: Acme Corp"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="h-11 rounded-xl border-gray-200"
                    />
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-xs text-blue-600 leading-relaxed">
                      💡 Utilisez votre nom et entreprise pour vous identifier. Si le compte n'existe pas, il sera créé automatiquement. Pas de mot de passe requis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                <Button 
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    "Continuer"
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
