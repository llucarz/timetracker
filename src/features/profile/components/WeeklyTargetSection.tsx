/**
 * WeeklyTargetSection Component
 * 
 * Section pour objectifs hebdomadaires.
 * Extrait de ProfileModal.tsx (lignes 404-430).
 */

import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

interface WeeklyTargetSectionProps {
    weeklyTarget: string;
    workdaysPerWeek: string;
    onWeeklyTargetChange: (value: string) => void;
    onWorkdaysPerWeekChange: (value: string) => void;
}

export function WeeklyTargetSection({
    weeklyTarget,
    workdaysPerWeek,
    onWeeklyTargetChange,
    onWorkdaysPerWeekChange
}: WeeklyTargetSectionProps) {
    return (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <h4 className="font-semibold text-gray-900 mb-4">Objectifs hebdomadaires</h4>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm text-gray-700">Heures cibles hebdomadaires</Label>
                    <Input
                        type="number"
                        value={weeklyTarget}
                        onChange={(e) => onWeeklyTargetChange(e.target.value)}
                        className="h-11 rounded-xl border-gray-200"
                        step="0.5"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm text-gray-700">Jours travaillés par semaine</Label>
                    <Input
                        type="number"
                        value={workdaysPerWeek}
                        onChange={(e) => onWorkdaysPerWeekChange(e.target.value)}
                        className="h-11 rounded-xl border-gray-200"
                        min="1"
                        max="7"
                    />
                </div>
            </div>
        </div>
    );
}
