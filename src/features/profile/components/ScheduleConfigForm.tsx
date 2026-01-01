import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Checkbox } from "../../../components/ui/checkbox";
import { motion } from "motion/react";

interface DaySchedule {
    day: string;
    key: string;
    isWorkday: boolean;
    arrival: string;
    pauseStart: string;
    pauseEnd: string;
    departure: string;
}

interface ScheduleConfigFormProps {
    mode: "same" | "different";
    setMode: (mode: "same" | "different") => void;
    sameSchedule: {
        arrival: string;
        pauseStart: string;
        pauseEnd: string;
        departure: string;
    };
    setSameSchedule: (schedule: { arrival: string; pauseStart: string; pauseEnd: string; departure: string }) => void;
    daySchedules: DaySchedule[];
    setDaySchedules: (schedules: DaySchedule[]) => void;
    selectedDay: string;
    setSelectedDay: (day: string) => void;
}

export function ScheduleConfigForm({
    mode,
    setMode,
    sameSchedule,
    setSameSchedule,
    daySchedules,
    setDaySchedules,
    selectedDay,
    setSelectedDay
}: ScheduleConfigFormProps) {
    const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

    const handleSameScheduleChange = (field: keyof typeof sameSchedule, value: string) => {
        setSameSchedule({ ...sameSchedule, [field]: value });
    };

    return (
        <div className="space-y-8">
            {/* Schedule Mode */}
            <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Type d'horaire
                </Label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setMode("same")}
                        className={`p-4 rounded-xl border-2 transition-all ${mode === "same"
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                    >
                        <p className="font-semibold text-gray-900 mb-1">Identique chaque jour</p>
                        <p className="text-sm text-gray-600">Utiliser les mêmes horaires pour tous les jours travaillés</p>
                    </button>
                    <button
                        onClick={() => setMode("different")}
                        className={`p-4 rounded-xl border-2 transition-all ${mode === "different"
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                    >
                        <p className="font-semibold text-gray-900 mb-1">Différent par jour</p>
                        <p className="text-sm text-gray-600">Définir des horaires personnalisés pour chaque jour</p>
                    </button>
                </div>
            </div>

            {/* Mode A: Same Schedule */}
            {mode === "same" && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="bg-gray-50 rounded-xl p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Horaires de travail par défaut</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-700">Heure d'arrivée</Label>
                                <Input
                                    type="time"
                                    value={sameSchedule.arrival}
                                    onChange={(e) => handleSameScheduleChange('arrival', e.target.value)}
                                    className="h-11 rounded-xl border-gray-200 font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-700">Début pause</Label>
                                <Input
                                    type="time"
                                    value={sameSchedule.pauseStart}
                                    onChange={(e) => handleSameScheduleChange('pauseStart', e.target.value)}
                                    className="h-11 rounded-xl border-gray-200 font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-700">Fin pause</Label>
                                <Input
                                    type="time"
                                    value={sameSchedule.pauseEnd}
                                    onChange={(e) => handleSameScheduleChange('pauseEnd', e.target.value)}
                                    className="h-11 rounded-xl border-gray-200 font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-700">Heure de départ</Label>
                                <Input
                                    type="time"
                                    value={sameSchedule.departure}
                                    onChange={(e) => handleSameScheduleChange('departure', e.target.value)}
                                    className="h-11 rounded-xl border-gray-200 font-mono"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Mode B: Different Schedule Per Day */}
            {mode === "different" && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
                        <TabsList className="w-full grid grid-cols-7 bg-gray-100 p-1 rounded-xl gap-1 h-9 items-center">
                            {daysOfWeek.map((day) => {
                                const isSelected = selectedDay === day;
                                return (
                                    <TabsTrigger
                                        key={day}
                                        value={day}
                                        className={`
                                            relative z-10 text-xs py-1.5 rounded-lg transition-colors duration-200 flex items-center justify-center
                                            data-[state=active]:bg-transparent data-[state=active]:shadow-none
                                            ${isSelected ? "text-gray-900 font-medium" : "text-gray-500 font-medium hover:text-gray-900"}
                                        `}
                                    >
                                        {isSelected && (
                                            <motion.div
                                                layoutId="activeDayTab"
                                                className="absolute inset-0 bg-white rounded-lg shadow-sm z-[-1]"
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-10 leading-none">
                                            {day.slice(0, 3)}
                                        </span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>

                        {daySchedules.map((schedule, index) => (
                            <TabsContent key={schedule.day} value={schedule.day} className="space-y-4 mt-4">
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Checkbox
                                            checked={schedule.isWorkday}
                                            onCheckedChange={(checked) => {
                                                const newSchedules = [...daySchedules];
                                                newSchedules[index].isWorkday = checked as boolean;
                                                setDaySchedules(newSchedules);
                                            }}
                                            id={`workday-${schedule.day}`}
                                        />
                                        <Label htmlFor={`workday-${schedule.day}`} className="font-semibold text-gray-900">
                                            Ceci est un jour travaillé
                                        </Label>
                                    </div>

                                    {schedule.isWorkday && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm text-gray-700">Heure d'arrivée</Label>
                                                <Input
                                                    type="time"
                                                    value={schedule.arrival}
                                                    onChange={(e) => {
                                                        const newSchedules = [...daySchedules];
                                                        newSchedules[index].arrival = e.target.value;
                                                        setDaySchedules(newSchedules);
                                                    }}
                                                    className="h-11 rounded-xl border-gray-200 font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm text-gray-700">Début pause</Label>
                                                <Input
                                                    type="time"
                                                    value={schedule.pauseStart}
                                                    onChange={(e) => {
                                                        const newSchedules = [...daySchedules];
                                                        newSchedules[index].pauseStart = e.target.value;
                                                        setDaySchedules(newSchedules);
                                                    }}
                                                    className="h-11 rounded-xl border-gray-200 font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm text-gray-700">Fin pause</Label>
                                                <Input
                                                    type="time"
                                                    value={schedule.pauseEnd}
                                                    onChange={(e) => {
                                                        const newSchedules = [...daySchedules];
                                                        newSchedules[index].pauseEnd = e.target.value;
                                                        setDaySchedules(newSchedules);
                                                    }}
                                                    className="h-11 rounded-xl border-gray-200 font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm text-gray-700">Heure de départ</Label>
                                                <Input
                                                    type="time"
                                                    value={schedule.departure}
                                                    onChange={(e) => {
                                                        const newSchedules = [...daySchedules];
                                                        newSchedules[index].departure = e.target.value;
                                                        setDaySchedules(newSchedules);
                                                    }}
                                                    className="h-11 rounded-xl border-gray-200 font-mono"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {!schedule.isWorkday && (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>Ce jour est marqué comme non travaillé</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </motion.div>
            )}
        </div>
    );
}
