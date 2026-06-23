import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  city: string;
  onChange: (city: string) => void;
  defaultCity?: string;
};

export const CitySwitcher = ({ city, onChange, defaultCity }: Props) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(city);

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setDraft(city); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MapPin className="h-3.5 w-3.5" />
          {city || "Set city"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="city-switch">Browse a different city</Label>
          <Input
            id="city-switch"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Brooklyn"
            maxLength={80}
          />
        </div>
        <div className="flex justify-between gap-2">
          {defaultCity && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onChange(defaultCity); setOpen(false); }}
            >
              Reset to {defaultCity}
            </Button>
          )}
          <Button
            variant="hero"
            size="sm"
            className="ml-auto"
            disabled={!draft.trim()}
            onClick={() => { onChange(draft.trim()); setOpen(false); }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
