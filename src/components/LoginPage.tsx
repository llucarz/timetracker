import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

interface LoginPageProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export function LoginPage({ onLoginSuccess, onCancel }: LoginPageProps) {
  const { updateSettings } = useTimeTracker();
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
      const res = await fetch(`/api/data?key=${loginKey}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      if (data.settings?.account) {
        updateSettings(data.settings);
        toast.success("Connexion réussie !");
        onLoginSuccess();
      } else {
        toast.error("Aucune donnée trouvée pour cette clé.");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
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
        isOnboarded: true 
      });
      
      // The auto-sync effect in TimeTrackerContext will handle saving to cloud
      
      toast.success("Compte créé !");
      onLoginSuccess();
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Button 
          variant="ghost" 
          onClick={onCancel} 
          className="mb-4 text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Button>

        <Card className="border-gray-200 shadow-xl shadow-purple-500/5">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Bienvenue</CardTitle>
            <CardDescription className="text-center">
              Connectez-vous pour synchroniser vos données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Clé de sauvegarde</Label>
                  <Input 
                    id="key" 
                    placeholder="Entrez votre clé..." 
                    value={loginKey}
                    onChange={(e) => setLoginKey(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Utilisez la clé fournie lors de votre inscription.
                  </p>
                </div>
                <Button 
                  onClick={handleLogin} 
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Se connecter
                </Button>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input 
                    id="name" 
                    placeholder="Votre nom" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Entreprise (optionnel)</Label>
                  <Input 
                    id="company" 
                    placeholder="Votre entreprise" 
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Button 
                  onClick={handleSignup} 
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer un compte
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4 bg-gray-50/50 rounded-b-xl">
            <p className="text-xs text-center text-gray-500">
              Vos données sont stockées localement par défaut. La connexion active la synchronisation cloud.
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
