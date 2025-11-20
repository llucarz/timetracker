import { useState } from "react";
import { User, Clock, Calendar, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner@2.0.3";

const daysOfWeek = [
  { id: "monday", label: "Lundi", short: "Lun" },
  { id: "tuesday", label: "Mardi", short: "Mar" },
  { id: "wednesday", label: "Mercredi", short: "Mer" },
  { id: "thursday", label: "Jeudi", short: "Jeu" },
  { id: "friday", label: "Vendredi", short: "Ven" },
  { id: "saturday", label: "Samedi", short: "Sam" },
  { id: "sunday", label: "Dimanche", short: "Dim" },
];

export function WorkProfile() {
  const [scheduleMode, setScheduleMode] = useState<"uniform" | "custom">("uniform");
  const [weeklyTarget, setWeeklyTarget] = useState(35);
  const [workDays, setWorkDays] = useState(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  
  // Uniform schedule
  const [uniformArrival, setUniformArrival] = useState("09:00");
  const [uniformPauseStart, setUniformPauseStart] = useState("12:30");
  const [uniformPauseEnd, setUniformPauseEnd] = useState("13:30");
  const [uniformDeparture, setUniformDeparture] = useState("18:00");

  // Custom schedules per day
  const [customSchedules, setCustomSchedules] = useState<{[key: string]: any}>({
    monday: { arrival: "09:00", pauseStart: "12:30", pauseEnd: "13:30", departure: "18:00" },
    tuesday: { arrival: "09:00", pauseStart: "12:30", pauseEnd: "13:30", departure: "18:00" },
    wednesday: { arrival: "09:00", pauseStart: "12:30", pauseEnd: "13:30", departure: "18:00" },
    thursday: { arrival: "09:00", pauseStart: "12:30", pauseEnd: "13:30", departure: "18:00" },
    friday: { arrival: "09:00", pauseStart: "12:30", pauseEnd: "13:30", departure: "18:00" },
    saturday: { arrival: "", pauseStart: "", pauseEnd: "", departure: "" },
    sunday: { arrival: "", pauseStart: "", pauseEnd: "", departure: "" },
  });

  const toggleWorkDay = (dayId: string) => {
    setWorkDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const handleSave = () => {
    toast.success("Profil de travail enregistré", {
      description: `${workDays.length} jours · Objectif: ${weeklyTarget}h/semaine`
    });
  };

  const dailyTarget = workDays.length > 0 ? (weeklyTarget / workDays.length).toFixed(2) : 0;

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="mb-2">Profil de travail</h1>
        <p className="text-[var(--color-text-secondary)]">
          Configurez vos horaires habituels et jours travaillés
        </p>
      </div>

      {/* Weekly Target */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-[var(--color-primary)]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3>Objectif hebdomadaire</h3>
            <p className="text-sm text-[var(--color-text-tertiary)]">Nombre d'heures à travailler par semaine</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weeklyTarget">Heures / semaine</Label>
            <Input
              id="weeklyTarget"
              type="number"
              min="0"
              max="168"
              step="0.5"
              value={weeklyTarget}
              onChange={(e) => setWeeklyTarget(Number(e.target.value))}
              className="bg-[var(--color-background)] border-[var(--color-border)]"
            />
          </div>
          
          <div className="bg-[var(--color-background)] rounded-lg p-4">
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">Jours travaillés</p>
            <p className="text-2xl">{workDays.length}</p>
          </div>
          
          <div className="bg-[var(--color-background)] rounded-lg p-4">
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">Heures / jour</p>
            <p className="text-2xl">{dailyTarget}h</p>
          </div>
        </div>
      </div>

      {/* Work Days Selection */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-[var(--color-primary)]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3>Jours travaillés</h3>
            <p className="text-sm text-[var(--color-text-tertiary)]">Sélectionnez vos jours de travail habituels</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          {daysOfWeek.map((day) => {
            const isSelected = workDays.includes(day.id);
            return (
              <button
                key={day.id}
                onClick={() => toggleWorkDay(day.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isSelected 
                    ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" 
                    : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/30"
                  }
                `}
              >
                <p className="text-xs mb-1 opacity-70">{day.short}</p>
                <p className="text-sm">{day.label.slice(0, 3)}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule Configuration */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-[var(--color-primary)]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3>Horaires de travail</h3>
            <p className="text-sm text-[var(--color-text-tertiary)]">Définissez vos horaires par défaut</p>
          </div>
        </div>

        <Tabs value={scheduleMode} onValueChange={(v) => setScheduleMode(v as "uniform" | "custom")} className="w-full">
          <TabsList className="mb-6 bg-[var(--color-background)] border border-[var(--color-border)]">
            <TabsTrigger value="uniform">Horaires identiques</TabsTrigger>
            <TabsTrigger value="custom">Horaires par jour</TabsTrigger>
          </TabsList>

          <TabsContent value="uniform">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="uniformArrival">Arrivée</Label>
                <Input
                  id="uniformArrival"
                  type="time"
                  value={uniformArrival}
                  onChange={(e) => setUniformArrival(e.target.value)}
                  className="bg-[var(--color-background)] border-[var(--color-border)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uniformPauseStart">Début pause</Label>
                <Input
                  id="uniformPauseStart"
                  type="time"
                  value={uniformPauseStart}
                  onChange={(e) => setUniformPauseStart(e.target.value)}
                  className="bg-[var(--color-background)] border-[var(--color-border)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uniformPauseEnd">Fin pause</Label>
                <Input
                  id="uniformPauseEnd"
                  type="time"
                  value={uniformPauseEnd}
                  onChange={(e) => setUniformPauseEnd(e.target.value)}
                  className="bg-[var(--color-background)] border-[var(--color-border)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uniformDeparture">Départ</Label>
                <Input
                  id="uniformDeparture"
                  type="time"
                  value={uniformDeparture}
                  onChange={(e) => setUniformDeparture(e.target.value)}
                  className="bg-[var(--color-background)] border-[var(--color-border)]"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            {daysOfWeek.filter(day => workDays.includes(day.id)).map((day) => (
              <div key={day.id} className="bg-[var(--color-background)] rounded-lg p-4">
                <h4 className="mb-3">{day.label}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Arrivée</Label>
                    <Input
                      type="time"
                      value={customSchedules[day.id]?.arrival || ""}
                      onChange={(e) => setCustomSchedules(prev => ({
                        ...prev,
                        [day.id]: { ...prev[day.id], arrival: e.target.value }
                      }))}
                      className="bg-[var(--color-surface)] border-[var(--color-border)] text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Début pause</Label>
                    <Input
                      type="time"
                      value={customSchedules[day.id]?.pauseStart || ""}
                      onChange={(e) => setCustomSchedules(prev => ({
                        ...prev,
                        [day.id]: { ...prev[day.id], pauseStart: e.target.value }
                      }))}
                      className="bg-[var(--color-surface)] border-[var(--color-border)] text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Fin pause</Label>
                    <Input
                      type="time"
                      value={customSchedules[day.id]?.pauseEnd || ""}
                      onChange={(e) => setCustomSchedules(prev => ({
                        ...prev,
                        [day.id]: { ...prev[day.id], pauseEnd: e.target.value }
                      }))}
                      className="bg-[var(--color-surface)] border-[var(--color-border)] text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Départ</Label>
                    <Input
                      type="time"
                      value={customSchedules[day.id]?.departure || ""}
                      onChange={(e) => setCustomSchedules(prev => ({
                        ...prev,
                        [day.id]: { ...prev[day.id], departure: e.target.value }
                      }))}
                      className="bg-[var(--color-surface)] border-[var(--color-border)] text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" className="bg-[var(--color-success)] hover:bg-[var(--color-success-light)]">
          <Save className="w-4 h-4 mr-2" />
          Enregistrer le profil
        </Button>
      </div>
    </div>
  );
}
