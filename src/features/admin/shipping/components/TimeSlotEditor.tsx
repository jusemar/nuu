"use client";

import { Plus, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const weekDays = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

interface TimeSlotEditorProps {
  slots: TimeSlot[];
  onUpdateSlot: (index: number, field: keyof TimeSlot, value: any) => void;
  onRemoveSlot: (index: number) => void;
}

export function TimeSlotEditor({
  slots,
  onUpdateSlot,
  onRemoveSlot,
}: TimeSlotEditorProps) {
  return (
    <div className="space-y-2">
      {slots.map((slot, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-32">
            <select
              value={slot.dayOfWeek}
              onChange={(e) =>
                onUpdateSlot(index, "dayOfWeek", parseInt(e.target.value))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {weekDays.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-gray-400" />
            <Input
              type="time"
              value={slot.startTime}
              onChange={(e) => onUpdateSlot(index, "startTime", e.target.value)}
              className="w-32"
            />
            <span className="text-gray-500">até</span>
            <Input
              type="time"
              value={slot.endTime}
              onChange={(e) => onUpdateSlot(index, "endTime", e.target.value)}
              className="w-32"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemoveSlot(index)}
          >
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      {slots.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          Nenhum horário cadastrado
        </p>
      )}
    </div>
  );
}
