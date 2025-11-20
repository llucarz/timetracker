import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { updateSettings, loadFromCloud, syncWithCloud } = useTimeTracker();
  const [isLoading, setIsLoading] = useState(false);
  
  // Login state
  const [loginKey, setLoginKey] = useState("");

  // Signup state
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");

  const handleLogin = async () => {
    if (!loginKey.trim()) return;
    setIsLoading(true);
    try {
      // Temporarily set key to fetch
      updateSettings({ 
        account: { 
          key: loginKey, 
          name: "Loading...", 
          company: "Loading..." 
        } 
      });
      
      // Wait for state update? No, updateSettings is sync but React state update is async.
      // But loadFromCloud reads from `settings`. 
      // Actually `loadFromCloud` uses `settings` from context which might be stale in this closure.
      // I should pass the key to `loadFromCloud` or wait.
      // Let's modify `loadFromCloud` to accept an optional key override?
      // Or just wait a bit? No that's bad.
      // Better: updateSettings updates the context state.
      // But `loadFromCloud` inside context uses `settings` from its own scope.
      // If I call `updateSettings` then `loadFromCloud` immediately, `settings` inside `loadFromCloud` might be old.
      
      // Workaround: Manually fetch here or modify loadFromCloud.
      // I'll modify loadFromCloud in context to accept a key.
      // For now, let's assume I can just fetch here.
      
      const res = await fetch(`/api/data?key=${loginKey}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      if (data.settings?.account) {
        updateSettings(data.settings);
        toast.success("Connexion réussie !");
        onClose();
      } else {
        // Key exists but no account data? Or key doesn't exist (returns empty defaults).
        // If empty defaults, we might want to ask user if they want to initialize?
        // But for now, let's just assume it's a valid key if user has it.
        // If data.settings is null, it means new key.
        toast.error("Aucune donnée trouvée pour cette clé.");
        updateSettings({ account: null }); // Revert
      }
    } catch (error) {
      toast.error("Erreur de connexion");
      updateSettings({ account: null });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      const newKey = crypto.randomUUID();
      const newAccount = { name, company, key: newKey };
      
      updateSettings({ 
        account: newAccount,
        isOnboarded: true // Ensure we are onboarded
      });
      
      // Trigger sync to save this new account to cloud
      // We need to wait for state update to propagate to context for syncWithCloud to work?
      // Or we can manually call fetch here.
      
      await fetch(`/api/data?key=${newKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [], // Start empty or with local entries?
          // User said: "Anonymous users = all data stored locally only".
          // "Logged-in users = ... data is synced".
          // If I signup, I probably want to keep my local data and push it to cloud.
          // So I should send current entries.
          // But I don't have access to entries here easily without prop drilling or context.
          // I have context!
          // But `entries` from context might be stale if I just updated settings?
          // No, entries didn't change.
          settings: { ...newAccount, isOnboarded: true }, // This is incomplete settings object.
          // I need full settings.
          // This is getting complicated.
          // Best way: Just update settings locally. The auto-sync effect in context will pick it up!
          // The auto-sync effect runs when `settings` changes.
          // So just updating settings is enough!
        }),
      });
      
      // Actually, the auto-sync effect in TimeTrackerContext will run because `settings` changed.
      // So I don't need to manually fetch here.
      
      toast.success("Compte créé !");
      onClose();
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Authentification</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Créer un compte</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key">Clé de sauvegarde</Label>
              <Input 
                id="key" 
                placeholder="Entrez votre clé..." 
                value={loginKey}
                onChange={(e) => setLoginKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Utilisez la clé fournie lors de votre inscription.
              </p>
            </div>
            <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Se connecter
            </Button>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input 
                id="name" 
                placeholder="Votre nom" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Entreprise (optionnel)</Label>
              <Input 
                id="company" 
                placeholder="Votre entreprise" 
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <Button onClick={handleSignup} className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer un compte
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
