import { useState } from "react";
import { TrendingUp, Plus, History, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { toast } from "sonner";

interface OvertimeEntry {
  id: string;
  date: string;
  type: "earned" | "recovered";
  hours: number;
  notes: string;
}

const mockHistory: OvertimeEntry[] = [
  { id: "1", date: "2025-11-14", type: "earned", hours: 1.25, notes: "Semaine 46" },
  { id: "2", date: "2025-11-07", type: "earned", hours: 2.5, notes: "Semaine 45" },
  { id: "3", date: "2025-10-25", type: "recovered", hours: -3.5, notes: "RTT récupéré" },
  { id: "4", date: "2025-10-18", type: "earned", hours: 4.75, notes: "Semaine chargée" },
];

export function OvertimeModule() {
  const [isRecoveryDialogOpen, setIsRecoveryDialogOpen] = useState(false);
  const [recoveryDays, setRecoveryDays] = useState(0);
  const [recoveryHours, setRecoveryHours] = useState(0);
  const [recoveryDate, setRecoveryDate] = useState("");
  const [recoveryNotes, setRecoveryNotes] = useState("");

  const currentBalance = 5.25; // 5h15
  const totalEarned = 8.5;
  const totalRecovered = 3.5;

  const handleRecovery = () => {
    const totalHours = recoveryDays + recoveryHours;
    if (totalHours <= 0) {
      toast.error("Veuillez indiquer un nombre d'heures valide");
      return;
    }
    if (!recoveryDate) {
      toast.error("Veuillez sélectionner une date");
      return;
    }
    
    toast.success(`${totalHours}h récupérées avec succès`);
    setIsRecoveryDialogOpen(false);
    setRecoveryDays(0);
    setRecoveryHours(0);
    setRecoveryDate("");
    setRecoveryNotes("");
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="mb-2">Heures supplémentaires</h1>
        <p className="text-[var(--color-text-secondary)]">
          Gérez votre solde d'heures et vos récupérations
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-sm text-purple-100">Solde actuel</p>
          </div>
          <p className="text-4xl mb-1">{currentBalance}h</p>
          <p className="text-sm text-purple-100">
            {Math.floor(currentBalance / 7)} jour{Math.floor(currentBalance / 7) > 1 ? 's' : ''} · {(currentBalance % 7).toFixed(2)}h
          </p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-[var(--color-success)]">
              <Plus className="w-5 h-5" />
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">Heures sup gagnées</p>
          </div>
          <p className="text-3xl mb-1">{totalEarned}h</p>
          <p className="text-sm text-[var(--color-text-tertiary)]">Total cumulé</p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-[var(--color-warning)]">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">Déjà récupéré</p>
          </div>
          <p className="text-3xl mb-1">{totalRecovered}h</p>
          <p className="text-sm text-[var(--color-text-tertiary)]">Heures prises</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8">
        <h4 className="mb-2 text-blue-400">Comment ça fonctionne ?</h4>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Le solde cumulé correspond aux jours de travail se basant sur « l'objectif hebdo / jours travaillés ».
          Les heures sup se basent uniquement sur cet objectif. Par exemple, si vous travaillez 5 jours et que votre objectif est 35h,
          chaque jour non « Travail » retire 7h de l'objectif de la semaine.
        </p>
      </div>

      {/* Actions */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-8">
        <h3 className="mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Dialog open={isRecoveryDialogOpen} onOpenChange={setIsRecoveryDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]">
                <Plus className="w-4 h-4 mr-2" />
                Enregistrer une récupération
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[var(--color-surface)] border-[var(--color-border)] max-w-lg">
              <DialogHeader>
                <DialogTitle>Récupération d'heures</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recoveryDays">Jours récupérés</Label>
                    <Input
                      id="recoveryDays"
                      type="number"
                      min="0"
                      value={recoveryDays}
                      onChange={(e) => setRecoveryDays(Number(e.target.value))}
                      className="bg-[var(--color-background)] border-[var(--color-border)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recoveryHours">Heures récupérées</Label>
                    <Input
                      id="recoveryHours"
                      type="number"
                      min="0"
                      step="0.25"
                      value={recoveryHours}
                      onChange={(e) => setRecoveryHours(Number(e.target.value))}
                      className="bg-[var(--color-background)] border-[var(--color-border)]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recoveryDate">Date de récupération</Label>
                  <Input
                    id="recoveryDate"
                    type="date"
                    value={recoveryDate}
                    onChange={(e) => setRecoveryDate(e.target.value)}
                    className="bg-[var(--color-background)] border-[var(--color-border)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recoveryNotes">Commentaires (optionnel)</Label>
                  <Textarea
                    id="recoveryNotes"
                    placeholder="Ex : RTT, récup samedi..."
                    value={recoveryNotes}
                    onChange={(e) => setRecoveryNotes(e.target.value)}
                    className="bg-[var(--color-background)] border-[var(--color-border)]"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <Button onClick={handleRecovery} className="flex-1 bg-[var(--color-success)] hover:bg-[var(--color-success-light)]">
                    Enregistrer la récup
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsRecoveryDialogOpen(false)}
                    className="border-[var(--color-border)]"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* History */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <History className="w-5 h-5 text-[var(--color-primary)]" />
          <h3>Historique</h3>
        </div>

        <div className="space-y-3">
          {mockHistory.map((entry) => (
            <div 
              key={entry.id}
              className="flex items-center justify-between p-4 bg-[var(--color-background)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${entry.type === "earned" 
                    ? "bg-green-500/10 text-[var(--color-success)]" 
                    : "bg-amber-500/10 text-[var(--color-warning)]"
                  }
                `}>
                  {entry.type === "earned" ? <Plus className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm">
                    {new Date(entry.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">{entry.notes}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg ${entry.type === "earned" ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}`}>
                  {entry.type === "earned" ? "+" : ""}{entry.hours}h
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {entry.type === "earned" ? "Gagné" : "Récupéré"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
