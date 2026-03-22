"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODELS, type ModelProvider } from "@/types";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ModelSelector({ value, onChange, className }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select model…" />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(MODELS) as ModelProvider[]).map((provider) => (
          <SelectGroup key={provider}>
            <SelectLabel>{MODELS[provider].label}</SelectLabel>
            {MODELS[provider].models.map((model) => (
              <SelectItem key={model.id} value={`${provider}:${model.id}`}>
                {model.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
