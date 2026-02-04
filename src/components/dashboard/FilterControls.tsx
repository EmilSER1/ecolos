import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { UI_TEXTS } from "@/lib/messages";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";

interface FilterControlsProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onReset: () => void;
  onExport: () => void;
}

/**
 * Компонент для контролов фильтрации и экспорта
 */
export function FilterControls({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
  onExport
}: FilterControlsProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-sm font-medium">{UI_TEXTS.DASHBOARD.PERIOD_LABEL}</span>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "dd.MM.yyyy") : <span>{UI_TEXTS.DASHBOARD.DATE_FROM_PLACEHOLDER}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "dd.MM.yyyy") : <span>{UI_TEXTS.DASHBOARD.DATE_TO_PLACEHOLDER}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {(startDate || endDate) && (
          <Button variant="ghost" onClick={onReset}>
            {UI_TEXTS.DASHBOARD.RESET_BUTTON}
          </Button>
        )}
      </div>

      <Button onClick={onExport} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        {UI_TEXTS.DASHBOARD.EXPORT_PDF_BUTTON}
      </Button>
    </div>
  );
}