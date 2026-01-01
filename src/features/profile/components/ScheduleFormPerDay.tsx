/**
 * ScheduleFormPerDay Component
 * 
 * Formulaire pour horaire différent par jour.
 * Extrait de ProfileModal.tsx (lignes 298-402).
 */

import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { motion } from 'motion/react';

interface DaySchedule {
    day: string;
    key: string;
    isWorkday: boolean;
    arrival: string;
    pauseStart: string;
    pauseEnd: string;
    departure: string;
}

interface ScheduleFormPerDayProps {
    selectedDay: string;
    daySchedules: DaySchedule[];
    onSelectedDayChange: (day: string) => void;
    onDaySchedulesChange: (schedules: DaySchedule[]) => void;
}

const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export function ScheduleFormPerDay({
    selectedDay,
    daySchedules,
    onSelectedDayChange,
    onDaySchedulesChange
}: ScheduleFormPerDayProps) {
    const updateSchedule = (index: number, updates: Partial<DaySchedule>) => {
        const newSchedules = [...daySchedules];
        newSchedules[index] = { ...newSchedules[index], ...updates };
        onDaySchedulesChange(newSchedules);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <Tabs value={selectedDay} onValueChange={onSelectedDayChange} className="w-full">
                <TabsList className="w-full grid grid-cols-7 bg-gray-100 p-1 rounded-xl">
                    {daysOfWeek.map((day) => (
                        <TabsTrigger
                            key={day}
                            value={day}
                            className="text-xs"
                        >
                            {day.slice(0, 3)}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {daySchedules.map((schedule, index) => (
                    <TabsContent key={schedule.day} value={schedule.day} className="space-y-4 mt-4">
                        <div className="bg-gray-50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Checkbox
                                    checked={schedule.isWorkday}
                                    onCheckedChange={(checked) => {
                                        updateSchedule(index, { isWorkday: checked as boolean });
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
                                            onChange={(e) => updateSchedule(index, { arrival: e.target.value })}
                                            className="h-11 rounded-xl border-gray-200 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-gray-700">Début pause</Label>
                                        <Input
                                            type="time"
                                            value={schedule.pauseStart}
                                            onChange={(e) => updateSchedule(index, { pauseStart: e.target.value })}
                                            className="h-11 rounded-xl border-gray-200 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-gray-700">Fin pause</Label>
                                        <Input
                                            type="time"
                                            value={schedule.pauseEnd}
                                            onChange={(e) => updateSchedule(index, { pauseEnd: e.target.value })}
                                            className="h-11 rounded-xl border-gray-200 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-gray-700">Heure de départ</Label>
                                        <Input
                                            type="time"
                                            value={schedule.departure}
                                            onChange={(e) => updateSchedule(index, { departure: e.target.value })}
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
    );
}
