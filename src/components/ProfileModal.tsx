import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { X, Save } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Checkbox } from "./ui/checkbox";
import { useTimeTracker } from "../context/TimeTrackerContext";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { settings, updateSettings } = useTimeTracker();
  const [mode, setMode] = useState<"same" | "different">("same");
  const [weeklyTarget, setWeeklyTarget] = useState("35");
  const [workdaysPerWeek, setWorkdaysPerWeek] = useState("5");

  // Same schedule mode
  const [arrival, setArrival] = useState("09:00");
  const [pauseStart, setPauseStart] = useState("12:30");
  const [pauseEnd, setPauseEnd] = useState("13:30");
  const [departure, setDeparture] = useState("18:00");

  // Different schedule mode
  const [daySchedules, setDaySchedules] = useState(
    daysOfWeek.map((day, index) => ({
      day,
      key: dayKeys[index],
      isWorkday: index < 5,
      arrival: "09:00",
      pauseStart: "12:30",
      pauseEnd: "13:30",
      departure: "18:00",
    }))
  );

  useEffect(() => {
    if (isOpen && settings) {
      setWeeklyTarget(settings.weeklyTarget.toString());
      setWorkdaysPerWeek(settings.workDays.toString());
      
      if (settings.baseHours) {
        setMode(settings.baseHours.mode);
        
        // Load same schedule
        if (settings.baseHours.same) {
          setArrival(settings.baseHours.same.start || "09:00");
          setPauseStart(settings.baseHours.same.lunchStart || "12:30");
          setPauseEnd(settings.baseHours.same.lunchEnd || "13:30");
          setDeparture(settings.baseHours.same.end || "18:00");
        }

        // Load different schedule
        if (settings.baseHours.days) {
          setDaySchedules(daysOfWeek.map((day, index) => {
            const key = dayKeys[index] as keyof typeof settings.baseHours.days;
            const daySettings = settings.baseHours.days[key];
            return {
              day,
              key,
              isWorkday: daySettings.enabled,
              arrival: daySettings.start || "09:00",
              pauseStart: daySettings.lunchStart || "12:30",
              pauseEnd: daySettings.lunchEnd || "13:30",
              departure: daySettings.end || "18:00",
            };
          }));
        }
      }
    }
  }, [isOpen, settings]);

  const handleSave = () => {
    const newBaseHours = {
      mode,
      same: {
        start: arrival,
        lunchStart: pauseStart,
        lunchEnd: pauseEnd,
        end: departure
      },
      days: daySchedules.reduce((acc, curr) => ({
        ...acc,
        [curr.key]: {
          enabled: curr.isWorkday,
          start: curr.arrival,
          lunchStart: curr.pauseStart,
          lunchEnd: curr.pauseEnd,
          end: curr.departure
        }
      }), {} as any)
    };

    updateSettings({
      weeklyTarget: parseFloat(weeklyTarget),
      workDays: parseInt(workdaysPerWeek),
      baseHours: newBaseHours
    });

    toast.success("Profile saved", {
      description: "Your work schedule has been updated",
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl card-shadow max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Work Profile Settings</h2>
                    <p className="text-sm text-gray-600 mt-1">Configure your default working hours</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl hover:bg-white/50 transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-8">
                  {/* Schedule Mode */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Schedule Type
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setMode("same")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          mode === "same"
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-semibold text-gray-900 mb-1">Same Every Day</p>
                        <p className="text-sm text-gray-600">Use identical hours for all workdays</p>
                      </button>
                      <button
                        onClick={() => setMode("different")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          mode === "different"
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-semibold text-gray-900 mb-1">Different Per Day</p>
                        <p className="text-sm text-gray-600">Set custom hours for each day</p>
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
                        <h4 className="font-semibold text-gray-900 mb-4">Default Working Hours</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-700">Arrival Time</Label>
                            <Input
                              type="time"
                              value={arrival}
                              onChange={(e) => setArrival(e.target.value)}
                              className="h-11 rounded-xl border-gray-200 font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-700">Departure Time</Label>
                            <Input
                              type="time"
                              value={departure}
                              onChange={(e) => setDeparture(e.target.value)}
                              className="h-11 rounded-xl border-gray-200 font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-700">Lunch Start</Label>
                            <Input
                              type="time"
                              value={pauseStart}
                              onChange={(e) => setPauseStart(e.target.value)}
                              className="h-11 rounded-xl border-gray-200 font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-700">Lunch End</Label>
                            <Input
                              type="time"
                              value={pauseEnd}
                              onChange={(e) => setPauseEnd(e.target.value)}
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
                      <Tabs defaultValue="Monday" className="w-full">
                        <TabsList className="w-full grid grid-cols-7 bg-gray-100 p-1 rounded-xl">
                          {daysOfWeek.map((day) => (
                            <TabsTrigger
                              key={day}
                              value={day}
                              className="rounded-lg text-xs px-2"
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
                                    const newSchedules = [...daySchedules];
                                    newSchedules[index].isWorkday = checked as boolean;
                                    setDaySchedules(newSchedules);
                                  }}
                                  id={`workday-${schedule.day}`}
                                />
                                <Label htmlFor={`workday-${schedule.day}`} className="font-semibold text-gray-900">
                                  This is a workday
                                </Label>
                              </div>

                              {schedule.isWorkday && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm text-gray-700">Arrival Time</Label>
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
                                    <Label className="text-sm text-gray-700">Departure Time</Label>
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
                                  <div className="space-y-2">
                                    <Label className="text-sm text-gray-700">Lunch Start</Label>
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
                                    <Label className="text-sm text-gray-700">Lunch End</Label>
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
                                </div>
                              )}

                              {!schedule.isWorkday && (
                                <div className="text-center py-8 text-gray-500">
                                  <p>This day is marked as non-working</p>
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </motion.div>
                  )}

                  {/* Weekly Target */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                    <h4 className="font-semibold text-gray-900 mb-4">Weekly Targets</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-700">Weekly Target Hours</Label>
                        <Input
                          type="number"
                          value={weeklyTarget}
                          onChange={(e) => setWeeklyTarget(e.target.value)}
                          className="h-11 rounded-xl border-gray-200"
                          step="0.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-700">Workdays Per Week</Label>
                        <Input
                          type="number"
                          value={workdaysPerWeek}
                          onChange={(e) => setWorkdaysPerWeek(e.target.value)}
                          className="h-11 rounded-xl border-gray-200"
                          min="1"
                          max="7"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                <Button
                  onClick={handleSave}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-200"
                >
                  <Save className="w-4 h-4" />
                  Save Profile
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="h-12 px-8 rounded-xl border-gray-200 hover:bg-white"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
