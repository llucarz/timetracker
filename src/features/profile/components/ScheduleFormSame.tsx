/**
 * ScheduleFormSame Component
 * 
 * Formulaire pour horaire identique chaque jour.
 * Extrait de ProfileModal.tsx (lignes 247-295).
 */

import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { motion } from 'motion/react';

interface ScheduleFormSameProps {
    arrival: string;
    pauseStart: string;
    pauseEnd: string;
    departure: string;
    onArrivalChange: (value: string) => void;
    onPauseStartChange: (value: string) => void;
    onPauseEndChange: (value: string) => void;
    onDepartureChange: (value: string) => void;
}

export function ScheduleFormSame({
    arrival,
    pauseStart,
    pauseEnd,
    departure,
    onArrivalChange,
    onPauseStartChange,
    onPauseEndChange,
    onDepartureChange
}: ScheduleFormSameProps) {
    return (
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
                            value={arrival}
                            onChange={(e) => onArrivalChange(e.target.value)}
                            className="h-11 rounded-xl border-gray-200 font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-gray-700">Début pause</Label>
                        <Input
                            type="time"
                            value={pauseStart}
                            onChange={(e) => onPauseStartChange(e.target.value)}
                            className="h-11 rounded-xl border-gray-200 font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-gray-700">Fin pause</Label>
                        <Input
                            type="time"
                            value={pauseEnd}
                            onChange={(e) => onPauseEndChange(e.target.value)}
                            className="h-11 rounded-xl border-gray-200 font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm text-gray-700">Heure de départ</Label>
                        <Input
                            type="time"
                            value={departure}
                            onChange={(e) => onDepartureChange(e.target.value)}
                            className="h-11 rounded-xl border-gray-200 font-mono"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
