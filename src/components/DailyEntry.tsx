import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, Save, RotateCcw, Copy, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { checkOverlap, getRecoveryMinutesForDay, formatDuration, cn } from "../lib/utils";

interface DailyEntryProps {
  defaultSchedule?: {
    arrival: string;
    pauseStart: string;
    pauseEnd: string;
    departure: string;
  };
}

export function DailyEntry({ defaultSchedule }: DailyEntryProps) {
  const { otState } = useTimeTracker();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [arrival, setArrival] = useState("");
  const [pauseStart, setPauseStart] = useState("");
  const [pauseEnd, setPauseEnd] = useState("");
  const [departure, setDeparture] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("work");

  const handleFillDefault = () => {
    if (defaultSchedule) {
      setArrival(defaultSchedule.arrival);
      setPauseStart(defaultSchedule.pauseStart);
      setPauseEnd(defaultSchedule.pauseEnd);
      setDeparture(defaultSchedule.departure);
      toast.success("Usual hours filled", {
        description: "You can now adjust if needed"
      });
    }
  };

  const handleSave = () => {
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    if (status === "work" && (!arrival || !departure)) {
      toast.error("Please enter at least arrival and departure times");
      return;
    }

    if (status === "work") {
      // Check morning session
      if (arrival && (pauseStart || departure)) {
        const end = pauseStart || departure;
        const overlap = checkOverlap(date, arrival, end, otState.events);
        if (overlap.blocked) {
          toast.error(overlap.reason);
          return;
        }
      }
      // Check afternoon session
      if (pauseEnd && departure) {
        const overlap = checkOverlap(date, pauseEnd, departure, otState.events);
        if (overlap.blocked) {
          toast.error(overlap.reason);
          return;
        }
      }
    }

    toast.success("Day saved successfully", {
      description: `${date} - ${formatDuration(creditedMinutes)} credited`,
    });
    
    handleClear();
  };

  const handleClear = () => {
    setArrival("");
    setPauseStart("");
    setPauseEnd("");
    setDeparture("");
    setNotes("");
  };

  const calculateMinutes = () => {
    if (!arrival || !departure) return 0;
    
    const [aH, aM] = arrival.split(':').map(Number);
    const [dH, dM] = departure.split(':').map(Number);
    
    let minutes = (dH * 60 + dM) - (aH * 60 + aM);
    
    if (pauseStart && pauseEnd) {
      const [psH, psM] = pauseStart.split(':').map(Number);
      const [peH, peM] = pauseEnd.split(':').map(Number);
      const pauseMinutes = (peH * 60 + peM) - (psH * 60 + psM);
      minutes -= pauseMinutes;
    }
    
    return Math.max(0, minutes);
  };

  const workMinutes = calculateMinutes();
  const recoveryMinutes = getRecoveryMinutesForDay(date, otState.events);
  const creditedMinutes = workMinutes + recoveryMinutes;
  const isWorkDay = status === "work";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-600" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Daily Entry</h3>
            <p className="text-sm text-gray-500">Record today's hours</p>
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
          />
        </div>

        {/* Warning Banner */}
        {recoveryMinutes > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 items-start"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900">Recovery Scheduled</h4>
              <p className="text-sm text-amber-700 mt-1">
                You have {formatDuration(recoveryMinutes)} of recovery scheduled for this day.
                Make sure your worked hours are consistent with this recovery.
              </p>
            </div>
          </motion.div>
        )}

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Day Type</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-11 rounded-xl border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="work">💼 Work</SelectItem>
              <SelectItem value="school">📚 School / Training</SelectItem>
              <SelectItem value="vacation">🏖️ Vacation</SelectItem>
              <SelectItem value="sick">🤒 Sick Leave</SelectItem>
              <SelectItem value="holiday">🎉 Public Holiday</SelectItem>
              <SelectItem value="off">🌙 Day Off</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Work Hours */}
        {isWorkDay && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Working Hours</Label>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleFillDefault}
                className="h-8 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Fill usual hours
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Arrival</Label>
                <Input
                  type="time"
                  value={arrival}
                  onChange={(e) => setArrival(e.target.value)}
                  className="h-11 rounded-xl border-gray-200 font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Departure</Label>
                <Input
                  type="time"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  className="h-11 rounded-xl border-gray-200 font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Lunch Start</Label>
                <Input
                  type="time"
                  value={pauseStart}
                  onChange={(e) => setPauseStart(e.target.value)}
                  className="h-11 rounded-xl border-gray-200 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Lunch End</Label>
                <Input
                  type="time"
                  value={pauseEnd}
                  onChange={(e) => setPauseEnd(e.target.value)}
                  className="h-11 rounded-xl border-gray-200 font-mono text-sm"
                />
              </div>
            </div>

            {/* Duration Display */}
            {(arrival && departure) || recoveryMinutes > 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Credited (Work + Recov.)</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {formatDuration(creditedMinutes)}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span>Work: {formatDuration(workMinutes)}</span>
                      <span>•</span>
                      <span>Recov: {formatDuration(recoveryMinutes)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 mb-1">Target</p>
                    <p className="text-lg font-semibold text-gray-700">7h00</p>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </motion.div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Notes (optional)</Label>
          <Textarea
            placeholder="Meeting, travel, remote work..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px] rounded-xl border-gray-200 resize-none text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleSave}
            className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-200"
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button 
            onClick={handleClear}
            variant="outline"
            className="h-11 px-4 rounded-xl border-gray-200 hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-gray-100">
          <Button 
            variant="ghost"
            className="w-full h-10 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl justify-start"
          >
            <Copy className="w-4 h-4" />
            Duplicate yesterday
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
