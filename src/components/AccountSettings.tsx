import { useState } from "react";
import { User, Building2, Key, Upload, Download, LogOut, Trash2, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

import { useTimeTracker } from "../context/TimeTrackerContext";

export function AccountSettings() {
  const { logout, settings } = useTimeTracker();
  const [userName, setUserName] = useState(settings.account?.name || "");
  const [company, setCompany] = useState(settings.account?.company || "");
  const [cloudKey] = useState(settings.account?.key || "");
  const [keyCopied, setKeyCopied] = useState(false);

  const handleSave = () => {
    toast.success("Informations enregistrées");
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(cloudKey);
    setKeyCopied(true);
    toast.success("Clé copiée dans le presse-papier");
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleExport = () => {
    // Mock CSV export
    const csvContent = "Date,Arrivée,Pause Début,Pause Fin,Départ,Total,Statut,Notes\n" +
      "2025-11-14,08:45,13:15,13:45,17:30,8h15,Travail,\n" +
      "2025-11-13,09:00,12:30,13:30,18:00,8h00,Travail,";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetracker_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Export CSV téléchargé");
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e: any) => {
      const file = e.target?.files[0];
      if (file) {
        toast.success(`Import de ${file.name} en cours...`);
        // Import logic would go here
      }
    };
    input.click();
  };

  const handleLogout = () => {
    logout();
    toast.success("Déconnexion réussie");
  };

  const handleDeleteAccount = () => {
    toast.success("Compte supprimé. Redirection...");
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="mb-2">Paramètres du compte</h1>
        <p className="text-[var(--color-text-secondary)]">
          Gérez vos informations personnelles et vos données
        </p>
      </div>

      {/* User Information */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-[var(--color-primary)]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3>Informations personnelles</h3>
            <p className="text-sm text-[var(--color-text-tertiary)]">Nom et entreprise</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="userName">Nom</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="bg-[var(--color-background)] border-[var(--color-border)]"
              placeholder="Votre nom"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Entreprise / Organisation</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="bg-[var(--color-background)] border-[var(--color-border)]"
              placeholder="Nom de l'entreprise"
            />
          </div>
        </div>

        <Button onClick={handleSave} className="bg-[var(--color-success)] hover:bg-[var(--color-success-light)]">
          Enregistrer les modifications
        </Button>
      </div>

      {/* Cloud Sync */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3>Clé de synchronisation cloud</h3>
            <p className="text-sm text-[var(--color-text-tertiary)]">Utilisez cette clé pour synchroniser vos données sur d'autres appareils</p>
          </div>
        </div>

        <div className="bg-[var(--color-background)] rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-4">
            <code className="text-sm text-[var(--color-primary)] font-mono">{cloudKey}</code>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyKey}
              className="border-[var(--color-border)] min-w-[100px]"
            >
              {keyCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <p className="text-sm text-amber-500">
            ⚠️ <strong>Attention :</strong> Ne partagez jamais cette clé. Elle donne accès à toutes vos données.
          </p>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-[var(--color-primary)]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3>Gestion des données</h3>
            <p className="text-sm text-[var(--color-text-tertiary)]">Importez ou exportez vos heures</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleImport} className="border-[var(--color-border)]">
            <Upload className="w-4 h-4 mr-2" />
            Importer CSV
          </Button>
          <Button variant="outline" onClick={handleExport} className="border-[var(--color-border)]">
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </div>

        <div className="mt-4 text-sm text-[var(--color-text-tertiary)] bg-[var(--color-background)] rounded-lg p-4">
          <p>
            💡 <strong>Format CSV :</strong> Le fichier contient les colonnes Date, Arrivée, Pause Début, Pause Fin, Départ, Total, Statut et Notes.
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[var(--color-surface)] border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-red-500">Zone dangereuse</h3>
            <p className="text-sm text-[var(--color-text-tertiary)]">Actions irréversibles</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-[var(--color-background)] rounded-lg">
            <div>
              <p className="text-sm">Déconnexion</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">Vous devrez vous reconnecter</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--color-background)] rounded-lg">
            <div>
              <p className="text-sm text-red-500">Supprimer le compte</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">Toutes vos données seront définitivement supprimées</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[var(--color-surface)] border-[var(--color-border)]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                  <AlertDialogDescription className="text-[var(--color-text-secondary)]">
                    Cette action est irréversible. Cela supprimera définitivement votre compte
                    et toutes vos données de nos serveurs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-[var(--color-background)] border-[var(--color-border)]">
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Oui, supprimer mon compte
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 text-sm text-[var(--color-text-tertiary)] bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-lg p-4">
        <p>
          🔒 <strong>Confidentialité :</strong> Vos données sont stockées localement dans votre navigateur. 
          La synchronisation cloud utilise un chiffrement de bout en bout. TimeTracker ne collecte aucune donnée personnelle sensible.
        </p>
      </div>
    </div>
  );
}
