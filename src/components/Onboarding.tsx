import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Clock, User, Calendar, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./ui/utils";
import { GRADIENTS } from "../ui/design-system/tokens";

interface OnboardingProps {
  onComplete: (data: {
    name: string;
    company: string;
    weeklyTarget: number;
    workDays: string[];
    arrival: string;
    pauseStart: string;
    pauseEnd: string;
    departure: string;
  }) => void;
}

const daysOfWeek = [
  { id: "monday", label: "Lun", full: "Lundi" },
  { id: "tuesday", label: "Mar", full: "Mardi" },
  { id: "wednesday", label: "Mer", full: "Mercredi" },
  { id: "thursday", label: "Jeu", full: "Jeudi" },
  { id: "friday", label: "Ven", full: "Vendredi" },
  { id: "saturday", label: "Sam", full: "Samedi" },
  { id: "sunday", label: "Dim", full: "Dimanche" },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [weeklyTarget, setWeeklyTarget] = useState(35);
  const [workDays, setWorkDays] = useState(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  const [arrival, setArrival] = useState("09:00");
  const [pauseStart, setPauseStart] = useState("12:30");
  const [pauseEnd, setPauseEnd] = useState("13:30");
  const [departure, setDeparture] = useState("18:00");

  const toggleWorkDay = (dayId: string) => {
    setWorkDays(prev =>
      prev.includes(dayId)
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const handleComplete = () => {
    onComplete({
      name,
      company,
      weeklyTarget,
      workDays,
      arrival,
      pauseStart,
      pauseEnd,
      departure,
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return name.length > 0;
      case 2:
        return workDays.length > 0;
      case 3:
        return arrival && departure;
      default:
        return true;
    }
  };

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const steps = [
    {
      title: "Bienvenue sur TimeTracker",
      description: "Configurons votre espace en quelques étapes",
      icon: Clock,
      content: (
        <div className="text-center py-8 space-y-8">
          <div className={`size-24 bg-gradient-to-br ${GRADIENTS.primaryDouble} rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/20`}>
            <Clock className="size-12 text-white" />
          </div>
          <div>
            <h2 className="mb-3">Commençons la configuration</h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              En 2 minutes, personnalisez votre profil pour un suivi optimal de votre temps de travail
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { icon: User, label: "Profil" },
              { icon: Calendar, label: "Horaires" },
              { icon: CheckCircle2, label: "Prêt" }
            ].map((item, i) => (
              <Card key={i} className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <item.icon className="size-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Vos informations",
      description: "Personnalisez votre profil",
      icon: User,
      content: (
        <div className="space-y-6 max-w-md mx-auto">
          <div className="space-y-3">
            <Label htmlFor="name">Votre nom *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Jean Dupont"
              autoFocus
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="company">Entreprise (optionnel)</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Ex : Acme Corp"
              className="h-12 text-base"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Jours et objectif",
      description: "Configurez votre semaine de travail",
      icon: Calendar,
      content: (
        <div className="space-y-8 max-w-2xl mx-auto">
          <div className="space-y-3">
            <Label>Objectif hebdomadaire</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min="0"
                max="168"
                step="0.5"
                value={weeklyTarget}
                onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                className="h-12 text-base max-w-32"
              />
              <span className="text-muted-foreground">heures par semaine</span>
            </div>
          </div>
          <div className="space-y-4">
            <Label>Jours travaillés ({workDays.length} sélectionné{workDays.length > 1 ? 's' : ''})</Label>
            <div className="grid grid-cols-7 gap-3">
              {daysOfWeek.map((day) => {
                const isSelected = workDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleWorkDay(day.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-sm font-medium",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-muted/50 border-border hover:border-primary/50"
                    )}
                  >
                    <div className="text-xs opacity-70 mb-1">{day.label}</div>
                    <div>{day.full.slice(0, 3)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Horaires types",
      description: "Définissez vos horaires par défaut",
      icon: Clock,
      content: (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="arrival">Arrivée *</Label>
              <Input
                id="arrival"
                type="time"
                value={arrival}
                onChange={(e) => setArrival(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="departure">Départ *</Label>
              <Input
                id="departure"
                type="time"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className="h-12 text-base"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="pauseStart">Début pause</Label>
              <Input
                id="pauseStart"
                type="time"
                value={pauseStart}
                onChange={(e) => setPauseStart(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="pauseEnd">Fin pause</Label>
              <Input
                id="pauseEnd"
                type="time"
                value={pauseEnd}
                onChange={(e) => setPauseEnd(e.target.value)}
                className="h-12 text-base"
              />
            </div>
          </div>
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <p className="text-sm text-blue-400">
                💡 Ces horaires seront utilisés par défaut lors de la saisie quotidienne
              </p>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-4xl space-y-8">
        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Étape {step + 1} sur {totalSteps}</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content Card */}
        <Card className="border-2">
          <CardContent className="p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="size-14 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Icon className="size-7 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl">{currentStep.title}</h2>
                      <p className="text-muted-foreground">{currentStep.description}</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="py-8">
                  {currentStep.content}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-8 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setStep(s => Math.max(0, s - 1))}
                    disabled={step === 0}
                    size="lg"
                  >
                    <ArrowLeft className="size-4" />
                    Retour
                  </Button>

                  {step < totalSteps - 1 ? (
                    <Button
                      onClick={() => setStep(s => s + 1)}
                      disabled={!canProceed()}
                      size="lg"
                    >
                      Continuer
                      <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleComplete}
                      disabled={!canProceed()}
                      size="lg"
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      <CheckCircle2 className="size-4" />
                      Terminer
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
