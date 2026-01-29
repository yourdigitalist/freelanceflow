import React from 'react';
import Autocomplete from 'react-google-autocomplete';
import { Input } from "@/components/ui/input";

export default function AddressAutocomplete({ value, onChange, placeholder, className }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // If no API key, fall back to regular input
  if (!apiKey) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <Autocomplete
      apiKey={apiKey}
      className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className || ''}`}
      defaultValue={value}
      onPlaceSelected={(place) => {
        if (place?.formatted_address) {
          onChange(place.formatted_address);
        }
      }}
      onChange={(e) => onChange(e.target.value)}
      options={{
        types: ['address'],
      }}
      placeholder={placeholder}
    />
  );
}