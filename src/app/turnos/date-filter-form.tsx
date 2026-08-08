"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  selectedDateISO: string;
  todayISO: string;
  rescheduleId?: string;
};

export function DateFilterForm({ selectedDateISO, todayISO, rescheduleId }: Props) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="date">Fecha</Label>
        <Input
          type="date"
          id="date"
          name="date"
          defaultValue={selectedDateISO}
          min={todayISO}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        />
      </div>
      {rescheduleId && <input type="hidden" name="reschedule" value={rescheduleId} />}
      <Button type="submit" variant="outline">
        Ver horarios
      </Button>
    </form>
  );
}
